-- Extensions and enum types shared across the schema.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================
-- Enums
-- ============================================================

create type admin_role as enum (
  'super_admin',
  'admin',
  'inventory_manager',
  'order_manager',
  'content_manager',
  'customer_support'
);

create type product_status as enum ('draft', 'active', 'archived');

create type address_type as enum ('shipping', 'billing');

create type inventory_movement_type as enum (
  'restock',
  'sale',
  'return',
  'adjustment',
  'reservation',
  'release',
  'transfer'
);

create type order_status as enum (
  'pending',
  'awaiting_payment',
  'paid',
  'processing',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded'
);

create type payment_status as enum (
  'pending',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
  'voided'
);

create type discount_kind as enum ('percentage', 'fixed_amount', 'free_shipping');

create type review_status as enum ('pending', 'approved', 'rejected');

create type content_status as enum ('draft', 'published', 'archived');

create type newsletter_subscriber_status as enum ('subscribed', 'unsubscribed');

-- ============================================================
-- Shared trigger function: keep `updated_at` current on every UPDATE.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
