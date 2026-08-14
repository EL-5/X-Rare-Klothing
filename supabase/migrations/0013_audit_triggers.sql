-- Attach the generic audit trigger to tables where administrative changes
-- matter: catalog/pricing, discounts, orders, staff roles, settings, content.
-- (Left off high-churn, low-stakes tables like cart_items and inventory
-- movements — the latter is already its own append-only ledger.)

create trigger audit_products
  after insert or update or delete on products
  for each row execute function log_audit_event();

create trigger audit_product_variants
  after insert or update or delete on product_variants
  for each row execute function log_audit_event();

create trigger audit_orders
  after update on orders
  for each row execute function log_audit_event();

create trigger audit_discounts
  after insert or update or delete on discounts
  for each row execute function log_audit_event();

create trigger audit_discount_codes
  after insert or update or delete on discount_codes
  for each row execute function log_audit_event();

create trigger audit_user_roles
  after insert or delete on user_roles
  for each row execute function log_audit_event();

create trigger audit_settings
  after insert or update or delete on settings
  for each row execute function log_audit_event();

create trigger audit_pages
  after insert or update or delete on pages
  for each row execute function log_audit_event();

create trigger audit_blog_posts
  after insert or update or delete on blog_posts
  for each row execute function log_audit_event();
