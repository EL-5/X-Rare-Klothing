-- Inventory: current stock snapshot per variant, plus an append-only
-- movement ledger that is the source of truth for how the snapshot got
-- there (restocks, sales, returns, adjustments, reservations, releases).

create table inventory (
  variant_id uuid primary key references product_variants (id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  available integer generated always as (on_hand - reserved) stored,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants (id) on delete cascade,
  type inventory_movement_type not null,
  -- Signed quantity: positive adds to the relevant counter, negative subtracts.
  -- restock/return/adjustment act on `on_hand`; reservation/release act on `reserved`.
  -- `sale` is always recorded as a negative quantity against `on_hand`.
  quantity integer not null check (quantity <> 0),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_id_idx on inventory_movements (variant_id);
create index inventory_movements_reference_idx on inventory_movements (reference_type, reference_id);

-- Every variant gets an inventory row the moment it's created, defaulted to zero stock.
-- security definer: runs regardless of the caller's own grants on `inventory`,
-- since this is derived/maintenance state, not something the caller writes directly.
create or replace function create_inventory_row_for_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into inventory (variant_id) values (new.id)
  on conflict (variant_id) do nothing;
  return new;
end;
$$;

create trigger product_variants_create_inventory
  after insert on product_variants
  for each row execute function create_inventory_row_for_variant();

-- inventory_movements is the write path; this trigger applies each movement's
-- effect onto the `inventory` snapshot so the two can never drift apart.
-- security definer: callers only need INSERT on inventory_movements (granted
-- to inventory/order staff below); they don't need direct UPDATE on `inventory`.
create or replace function apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into inventory (variant_id) values (new.variant_id)
  on conflict (variant_id) do nothing;

  if new.type in ('restock', 'return', 'adjustment', 'transfer') then
    update inventory
    set on_hand = greatest(0, on_hand + new.quantity), updated_at = now()
    where variant_id = new.variant_id;
  elsif new.type = 'sale' then
    update inventory
    set on_hand = greatest(0, on_hand - abs(new.quantity)), updated_at = now()
    where variant_id = new.variant_id;
  elsif new.type = 'reservation' then
    update inventory
    set reserved = greatest(0, reserved + abs(new.quantity)), updated_at = now()
    where variant_id = new.variant_id;
  elsif new.type = 'release' then
    update inventory
    set reserved = greatest(0, reserved - abs(new.quantity)), updated_at = now()
    where variant_id = new.variant_id;
  end if;

  return new;
end;
$$;

create trigger inventory_movements_apply
  after insert on inventory_movements
  for each row execute function apply_inventory_movement();
