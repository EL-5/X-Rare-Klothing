-- Batch 24 final review: two confirmed backend findings from an independent
-- audit of every migration and the highest-risk repositories.

-- ---------------------------------------------------------------------
-- CRITICAL: process_payment had no row lock on the order it was about to
-- transition, so two concurrent calls for the same order (double-click
-- submit, a client retry racing the original request, two open tabs) could
-- both read status = 'pending' before either wrote 'payment_pending'/'paid'.
-- Both would then insert a payments row and both call finalize_paid_order,
-- double-decrementing inventory and double-charging the payments ledger for
-- one purchase. create_order already takes `for update` on the relevant
-- inventory rows (0024) to close the equivalent reservation race — this
-- closes the same class of bug on the payment step by locking the order row
-- itself, so the second concurrent call blocks until the first transaction
-- commits, then correctly sees the already-updated status and raises "This
-- order has already been processed."
create or replace function process_payment(_order_id uuid, _card_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _order orders%rowtype;
  _profile_id uuid := auth.uid();
  _payment_id uuid;
  _last4 text;
  _decline boolean;
  _checkout_ttl interval := interval '30 minutes';
  _item record;
  _available integer;
begin
  select * into _order from orders where id = _order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.profile_id is not null and _order.profile_id <> _profile_id then
    raise exception 'This order does not belong to you.';
  end if;

  if _order.status not in ('pending', 'payment_pending') then
    if _order.status = 'cancelled' then
      raise exception 'This checkout has expired. Please start over.';
    end if;
    raise exception 'This order has already been processed.';
  end if;

  if now() - _order.placed_at > _checkout_ttl then
    if _order.inventory_reserved then
      for _item in select variant_id, quantity from order_items where order_id = _order_id loop
        insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
        values (_item.variant_id, 'release', _item.quantity, 'Checkout expired', 'order', _order_id);
      end loop;
    end if;
    update orders set status = 'cancelled', inventory_reserved = false where id = _order_id;
    raise exception 'This checkout has expired. Please start over.';
  end if;

  -- Retry after a prior failed attempt: the earlier reservation was
  -- already released, so re-check and re-reserve before trying again.
  if not _order.inventory_reserved then
    for _item in
      select variant_id, quantity, product_id from order_items where order_id = _order_id
    loop
      select available into _available from inventory where variant_id = _item.variant_id for update;
      if _available is null or _available < _item.quantity then
        raise exception 'One of the items in this order is no longer available.';
      end if;
    end loop;

    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'reservation', _item.quantity, 'Checkout reservation (retry)', 'order', _order_id);
    end loop;
    update orders set inventory_reserved = true where id = _order_id;
  end if;

  _last4 := right(regexp_replace(_card_number, '\D', '', 'g'), 4);
  _decline := _last4 = '0002';

  insert into payments (order_id, provider, provider_reference, status, amount_cents, currency)
  values (_order_id, 'simulated', 'sim_' || replace(gen_random_uuid()::text, '-', ''), 'pending', _order.total_cents, _order.currency)
  returning id into _payment_id;

  update orders set status = 'payment_pending' where id = _order_id;

  if _decline then
    perform mark_payment_failed(_order_id, _payment_id, 'Your card was declined.');
    return jsonb_build_object('status', 'failed', 'orderStatus', 'pending', 'message', 'Your card was declined.');
  end if;

  perform finalize_paid_order(_order_id, _payment_id);
  return jsonb_build_object('status', 'successful', 'orderStatus', 'paid', 'message', null);
end;
$$;

grant execute on function process_payment(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- HIGH: inventory_movements is documented as "an append-only movement
-- ledger that is the source of truth" (0004), and order_items.variant_id
-- was deliberately made ON DELETE SET NULL so order history survives a
-- variant deletion — but inventory_movements kept ON DELETE CASCADE.
-- A content_manager/admin deleting a variant that has real sales history
-- silently destroys every sale/reservation/restock row for it, permanently
-- losing the audit trail and understating past sales counts. Match the
-- order_items pattern: preserve the row, null the reference.
alter table inventory_movements alter column variant_id drop not null;
alter table inventory_movements drop constraint inventory_movements_variant_id_fkey;
alter table inventory_movements
  add constraint inventory_movements_variant_id_fkey
  foreign key (variant_id) references product_variants (id) on delete set null;
