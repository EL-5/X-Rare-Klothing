-- Reference data: the permission catalog and default role -> permission
-- mapping. This is schema-adjacent reference data (needed in every
-- environment, including production), so it lives in a migration rather
-- than the dev-only seed script in supabase/seed/.

insert into permissions (key, description) values
  ('products.read', 'View products, variants, and catalog structure'),
  ('products.write', 'Create/edit/archive products, variants, and catalog structure'),
  ('inventory.read', 'View stock levels and movement history'),
  ('inventory.write', 'Adjust stock, record restocks/returns/reservations'),
  ('orders.read', 'View orders and their line items'),
  ('orders.write', 'Update order status, add internal notes'),
  ('payments.read', 'View payment and transaction records'),
  ('discounts.read', 'View discounts and discount codes'),
  ('discounts.write', 'Create/edit discounts and discount codes'),
  ('customers.read', 'View customer profiles and addresses'),
  ('customers.support', 'Assist customers: view orders/cart on their behalf'),
  ('content.read', 'View pages, blog posts, and reviews queue'),
  ('content.write', 'Publish/edit pages, blog posts, and moderate reviews'),
  ('settings.read', 'View store settings'),
  ('settings.write', 'Change store settings'),
  ('users.manage', 'Grant/revoke admin roles'),
  ('audit.read', 'View the administrative audit log');

insert into role_permissions (role, permission_key)
select 'super_admin', key from permissions;

insert into role_permissions (role, permission_key)
select 'admin', key from permissions where key <> 'users.manage';

insert into role_permissions (role, permission_key) values
  ('inventory_manager', 'products.read'),
  ('inventory_manager', 'inventory.read'),
  ('inventory_manager', 'inventory.write'),
  ('inventory_manager', 'orders.read'),

  ('order_manager', 'orders.read'),
  ('order_manager', 'orders.write'),
  ('order_manager', 'payments.read'),
  ('order_manager', 'discounts.read'),
  ('order_manager', 'discounts.write'),
  ('order_manager', 'customers.read'),
  ('order_manager', 'customers.support'),
  ('order_manager', 'inventory.read'),

  ('content_manager', 'products.read'),
  ('content_manager', 'products.write'),
  ('content_manager', 'content.read'),
  ('content_manager', 'content.write'),
  ('content_manager', 'discounts.read'),

  ('customer_support', 'customers.read'),
  ('customer_support', 'customers.support'),
  ('customer_support', 'orders.read');
