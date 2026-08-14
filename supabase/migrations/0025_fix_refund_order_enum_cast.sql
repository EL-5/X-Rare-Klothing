-- Fix: refund_order's payments.status UPDATE assigned a CASE expression of
-- literals (type text/"unknown" resolved as text inside a bare CASE) into
-- an enum column, which Postgres doesn't implicitly cast in a raw SQL
-- context (unlike a plpgsql variable assignment, which does resolve the
-- literal against the target's declared type). Caught live: refund_order
-- returned 42804 "column status is of type payment_status but expression
-- is of type text" on every call. Explicit ::payment_status cast fixes it.

create or replace function refund_order(_order_id uuid, _amount_cents integer, _restock boolean default false, _reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _order orders%rowtype;
  _payment payments%rowtype;
  _item record;
  _new_status order_status;
begin
  if not has_any_role('order_manager', 'admin', 'super_admin') then
    raise exception 'Not authorized.';
  end if;

  select * into _order from orders where id = _order_id;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.status not in ('paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'partially_refunded') then
    raise exception 'This order cannot be refunded from its current status (%).', _order.status;
  end if;
  if _amount_cents <= 0 or _amount_cents > _order.total_cents then
    raise exception 'Refund amount must be between 0 and the order total.';
  end if;

  select * into _payment from payments where order_id = _order_id and status = 'successful' order by created_at desc limit 1;
  if not found then
    raise exception 'No successful payment found for this order.';
  end if;

  update payments
  set status = (case when _amount_cents = amount_cents then 'refunded' else 'partially_refunded' end)::payment_status
  where id = _payment.id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  values (_payment.id, 'refund', _amount_cents, 'successful', _payment.provider_reference, jsonb_build_object('reason', _reason));

  _new_status := case when _amount_cents = _order.total_cents then 'refunded' else 'partially_refunded' end;
  update orders
  set status = _new_status, internal_notes = trim(both from concat_ws(E'\n', internal_notes, coalesce(_reason, 'Refund issued')))
  where id = _order_id;

  if _restock then
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'return', _item.quantity, coalesce(_reason, 'Refund — restocked'), 'order', _order_id);
    end loop;
  end if;
end;
$$;

grant execute on function refund_order(uuid, integer, boolean, text) to authenticated;
