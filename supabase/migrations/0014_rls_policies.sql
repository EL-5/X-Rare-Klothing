-- Row Level Security — every table below has RLS enabled with no implicit
-- access; every allowed path is an explicit policy.
--
-- Conventions:
--   * Customers reach their own data through `profile_id = auth.uid()`
--     (profiles.id IS auth.users.id — see 0002_roles_and_profiles.sql).
--   * Staff reach broader data through has_role()/has_any_role()/is_staff().
--   * Tables that represent money-moving state (orders, payments) are never
--     directly writable by the `authenticated`/`anon` roles — those writes
--     go through Edge Functions using the service role, which bypasses RLS
--     entirely. The policies below only cover read access + the narrow
--     staff-dashboard write paths.

-- ============================================================
-- RBAC tables
-- ============================================================

alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;

create policy "Staff can read permissions" on permissions
  for select using (is_staff());
create policy "Super admins manage permissions" on permissions
  for all using (has_role('super_admin')) with check (has_role('super_admin'));

create policy "Staff can read role_permissions" on role_permissions
  for select using (is_staff());
create policy "Super admins manage role_permissions" on role_permissions
  for all using (has_role('super_admin')) with check (has_role('super_admin'));

create policy "Users can read own roles" on user_roles
  for select using (user_id = auth.uid() or is_staff());
create policy "Super admins manage user_roles" on user_roles
  for all using (has_role('super_admin')) with check (has_role('super_admin'));

-- ============================================================
-- Profiles / addresses
-- ============================================================

alter table profiles enable row level security;
alter table addresses enable row level security;

create policy "Customers read own profile" on profiles
  for select using (id = auth.uid());
create policy "Staff read any profile" on profiles
  for select using (has_any_role('customer_support', 'order_manager', 'admin', 'super_admin'));
create policy "Customers update own profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Customers manage own addresses" on addresses
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Staff read any address" on addresses
  for select using (has_any_role('customer_support', 'order_manager', 'admin', 'super_admin'));

-- ============================================================
-- Catalog (public read of published data; content_manager+ writes)
-- ============================================================

alter table categories enable row level security;
alter table products enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table product_variant_options enable row level security;
alter table product_images enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;

create policy "Public can read categories" on categories for select using (true);
create policy "Content staff manage categories" on categories
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update categories" on categories
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete categories" on categories
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read active products" on products
  for select using (status = 'active' or has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin'));
create policy "Content staff insert products" on products
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update products" on products
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete products" on products
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read options of visible products" on product_options
  for select using (
    exists (select 1 from products p where p.id = product_options.product_id and p.status = 'active')
    or has_any_role('content_manager', 'admin', 'super_admin')
  );
create policy "Content staff manage product_options" on product_options
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update product_options" on product_options
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete product_options" on product_options
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read option values" on product_option_values
  for select using (
    exists (
      select 1 from product_options po
      join products p on p.id = po.product_id
      where po.id = product_option_values.option_id and p.status = 'active'
    )
    or has_any_role('content_manager', 'admin', 'super_admin')
  );
create policy "Content staff manage option values" on product_option_values
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update option values" on product_option_values
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete option values" on product_option_values
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read variants of active products" on product_variants
  for select using (
    exists (select 1 from products p where p.id = product_variants.product_id and p.status = 'active')
    or has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
  );
create policy "Content staff insert variants" on product_variants
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update variants" on product_variants
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete variants" on product_variants
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read variant options" on product_variant_options
  for select using (true);
create policy "Content staff manage variant options" on product_variant_options
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete variant options" on product_variant_options
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read product images" on product_images
  for select using (true);
create policy "Content staff manage product images" on product_images
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update product images" on product_images
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete product images" on product_images
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read collections" on collections for select using (true);
create policy "Content staff insert collections" on collections
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update collections" on collections
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete collections" on collections
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read collection_products" on collection_products for select using (true);
create policy "Content staff manage collection_products" on collection_products
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff reorder collection_products" on collection_products
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete collection_products" on collection_products
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

-- ============================================================
-- Inventory
--
-- Trade-off: `inventory` (available/on-hand/reserved counts) is readable by
-- anyone so the storefront can show accurate stock/low-stock UI without a
-- extra service hop. Writes are staff-only; the actual write path in
-- practice is inserting into `inventory_movements`, whose trigger (defined
-- `security definer`) updates `inventory` regardless of the caller's grants
-- on that table — see 0004_inventory.sql.
-- ============================================================

alter table inventory enable row level security;
alter table inventory_movements enable row level security;

create policy "Public can read inventory levels" on inventory for select using (true);
create policy "Inventory staff update inventory" on inventory
  for update using (has_any_role('inventory_manager', 'admin', 'super_admin'));

create policy "Inventory staff read movements" on inventory_movements
  for select using (has_any_role('inventory_manager', 'order_manager', 'admin', 'super_admin'));
create policy "Inventory staff record movements" on inventory_movements
  for insert with check (has_any_role('inventory_manager', 'order_manager', 'admin', 'super_admin'));

-- ============================================================
-- Cart / wishlist
--
-- Guest carts (profile_id IS NULL) are reachable by anyone holding the
-- cart's UUID — there is no server-side session concept for anonymous
-- shoppers with the public anon key, so the unguessable cart id is the
-- capability token, same as a typical guest-cart cookie. Once a shopper
-- signs in, the app should claim the cart by setting profile_id.
-- ============================================================

alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;

create policy "Owner or guest can access cart" on carts
  for all
  using (profile_id = auth.uid() or profile_id is null)
  with check (profile_id = auth.uid() or profile_id is null);
create policy "Staff can read any cart" on carts
  for select using (has_any_role('customer_support', 'order_manager', 'admin', 'super_admin'));

create policy "Owner or guest can access cart_items" on cart_items
  for all
  using (
    exists (
      select 1 from carts c
      where c.id = cart_items.cart_id and (c.profile_id = auth.uid() or c.profile_id is null)
    )
  )
  with check (
    exists (
      select 1 from carts c
      where c.id = cart_items.cart_id and (c.profile_id = auth.uid() or c.profile_id is null)
    )
  );

create policy "Customers manage own wishlist" on wishlists
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Customers manage own wishlist_items" on wishlist_items
  for all
  using (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.profile_id = auth.uid()))
  with check (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.profile_id = auth.uid()));

-- ============================================================
-- Orders — no direct client writes; orders/payments are created and
-- transitioned by the checkout/payment Edge Functions via the service role.
-- ============================================================

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_addresses enable row level security;
alter table payments enable row level security;
alter table payment_transactions enable row level security;

create policy "Customers read own orders" on orders
  for select using (profile_id = auth.uid());
create policy "Staff read all orders" on orders
  for select using (has_any_role('order_manager', 'customer_support', 'admin', 'super_admin'));
create policy "Order staff update orders" on orders
  for update using (has_any_role('order_manager', 'admin', 'super_admin'));

create policy "Customers read own order_items" on order_items
  for select using (exists (select 1 from orders o where o.id = order_items.order_id and o.profile_id = auth.uid()));
create policy "Staff read all order_items" on order_items
  for select using (has_any_role('order_manager', 'customer_support', 'admin', 'super_admin'));

create policy "Customers read own order_addresses" on order_addresses
  for select using (exists (select 1 from orders o where o.id = order_addresses.order_id and o.profile_id = auth.uid()));
create policy "Staff read all order_addresses" on order_addresses
  for select using (has_any_role('order_manager', 'customer_support', 'admin', 'super_admin'));

create policy "Customers read own payments" on payments
  for select using (exists (select 1 from orders o where o.id = payments.order_id and o.profile_id = auth.uid()));
create policy "Staff read all payments" on payments
  for select using (has_any_role('order_manager', 'admin', 'super_admin'));

create policy "Staff read payment_transactions" on payment_transactions
  for select using (has_any_role('order_manager', 'admin', 'super_admin'));

-- ============================================================
-- Discounts — staff-managed; codes are validated via a SECURITY DEFINER
-- RPC at checkout time rather than granting broad client SELECT (so an
-- unauthenticated shopper can't enumerate every live discount code).
-- ============================================================

alter table discounts enable row level security;
alter table discount_codes enable row level security;

create policy "Order staff read discounts" on discounts
  for select using (has_any_role('order_manager', 'content_manager', 'admin', 'super_admin'));
create policy "Order staff manage discounts" on discounts
  for insert with check (has_any_role('order_manager', 'admin', 'super_admin'));
create policy "Order staff update discounts" on discounts
  for update using (has_any_role('order_manager', 'admin', 'super_admin'));
create policy "Order staff delete discounts" on discounts
  for delete using (has_any_role('order_manager', 'admin', 'super_admin'));

create policy "Order staff read discount_codes" on discount_codes
  for select using (has_any_role('order_manager', 'content_manager', 'admin', 'super_admin'));
create policy "Order staff manage discount_codes" on discount_codes
  for insert with check (has_any_role('order_manager', 'admin', 'super_admin'));
create policy "Order staff update discount_codes" on discount_codes
  for update using (has_any_role('order_manager', 'admin', 'super_admin'));
create policy "Order staff delete discount_codes" on discount_codes
  for delete using (has_any_role('order_manager', 'admin', 'super_admin'));

-- ============================================================
-- Reviews — approved reviews are public storefront content; authors manage
-- their own; content staff moderate.
-- ============================================================

alter table reviews enable row level security;
alter table review_images enable row level security;

create policy "Public can read approved reviews" on reviews
  for select using (status = 'approved');
create policy "Authors can read own reviews" on reviews
  for select using (profile_id = auth.uid());
create policy "Staff can read all reviews" on reviews
  for select using (has_any_role('content_manager', 'customer_support', 'admin', 'super_admin'));
create policy "Customers write own reviews" on reviews
  for insert with check (profile_id = auth.uid());
create policy "Customers update own reviews" on reviews
  for update using (profile_id = auth.uid());
create policy "Content staff moderate reviews" on reviews
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Customers delete own reviews" on reviews
  for delete using (profile_id = auth.uid());
create policy "Content staff delete reviews" on reviews
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read images of approved reviews" on review_images
  for select using (exists (select 1 from reviews r where r.id = review_images.review_id and r.status = 'approved'));
create policy "Authors manage own review images" on review_images
  for all
  using (exists (select 1 from reviews r where r.id = review_images.review_id and r.profile_id = auth.uid()))
  with check (exists (select 1 from reviews r where r.id = review_images.review_id and r.profile_id = auth.uid()));

-- ============================================================
-- Shipping / tax — public read (needed at checkout), staff write.
-- ============================================================

alter table shipping_zones enable row level security;
alter table shipping_methods enable row level security;
alter table tax_rates enable row level security;

create policy "Public can read shipping_zones" on shipping_zones for select using (true);
create policy "Order staff manage shipping_zones" on shipping_zones
  for all using (has_any_role('order_manager', 'admin', 'super_admin'))
  with check (has_any_role('order_manager', 'admin', 'super_admin'));

create policy "Public can read shipping_methods" on shipping_methods for select using (is_active or has_any_role('order_manager', 'admin', 'super_admin'));
create policy "Order staff manage shipping_methods" on shipping_methods
  for all using (has_any_role('order_manager', 'admin', 'super_admin'))
  with check (has_any_role('order_manager', 'admin', 'super_admin'));

create policy "Public can read tax_rates" on tax_rates for select using (true);
create policy "Order staff manage tax_rates" on tax_rates
  for all using (has_any_role('order_manager', 'admin', 'super_admin'))
  with check (has_any_role('order_manager', 'admin', 'super_admin'));

-- ============================================================
-- Newsletter / content
-- ============================================================

alter table newsletter_subscribers enable row level security;
alter table pages enable row level security;
alter table blog_posts enable row level security;

create policy "Anyone can subscribe" on newsletter_subscribers
  for insert with check (true);
create policy "Staff can read subscribers" on newsletter_subscribers
  for select using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Staff can manage subscribers" on newsletter_subscribers
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Staff can delete subscribers" on newsletter_subscribers
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read published pages" on pages
  for select using (status = 'published' or has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff manage pages" on pages
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update pages" on pages
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete pages" on pages
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Public can read published blog_posts" on blog_posts
  for select using (status = 'published' or has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff manage blog_posts" on blog_posts
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update blog_posts" on blog_posts
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete blog_posts" on blog_posts
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

-- ============================================================
-- Settings / audit logs — super_admin & admin only. Audit logs are never
-- client-writable (only the SECURITY DEFINER trigger function writes them).
-- ============================================================

alter table settings enable row level security;
alter table audit_logs enable row level security;

create policy "Admins read settings" on settings
  for select using (has_any_role('admin', 'super_admin'));
create policy "Admins manage settings" on settings
  for insert with check (has_any_role('admin', 'super_admin'));
create policy "Admins update settings" on settings
  for update using (has_any_role('admin', 'super_admin'));
create policy "Admins delete settings" on settings
  for delete using (has_any_role('admin', 'super_admin'));

create policy "Admins read audit_logs" on audit_logs
  for select using (has_any_role('admin', 'super_admin'));
