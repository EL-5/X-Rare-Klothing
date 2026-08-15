-- FAQ page redesign: FAQ content moves from being hard-coded in the React
-- component (src/pages/FAQ.tsx, pre-redesign) into a real table, editable
-- by content staff and publish/unpublish-able, mirroring the pages/
-- blog_posts pattern (0011) rather than inventing a new one.

create type faq_category as enum (
  'orders', 'shipping', 'returns_exchanges', 'products_sizing', 'payments', 'account', 'collaborations'
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category faq_category not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_category_idx on faqs (category);
create index faqs_published_sort_idx on faqs (is_published, sort_order);

create trigger faqs_set_updated_at
  before update on faqs
  for each row execute function set_updated_at();

alter table faqs enable row level security;

create policy "Public can read published FAQs" on faqs
  for select using (is_published or has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff manage FAQs" on faqs
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update FAQs" on faqs
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete FAQs" on faqs
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create trigger audit_faqs
  after insert or update or delete on faqs
  for each row execute function log_audit_event();

-- Seed content: migrated from the previous hard-coded FAQ.tsx, expanded to
-- cover every category the store actually has real functionality for.
-- Facts checked against live configuration before writing these, not
-- invented: shipping windows come from the real shipping_methods table
-- (Ghana zones range 1-5 business days, International zones range 3-14),
-- payment methods match the exact set Checkout.tsx implements (card,
-- Paystack, Flutterwave — no others), order cancellation reflects that
-- cancel_order is staff-only (0024) with no customer self-service path,
-- and the size guide / guest checkout / password reset claims all
-- reference features that exist in this codebase today.
insert into faqs (question, answer, category, slug, sort_order) values
  ('How do I place an order?', 'Browse the store, select your preferred product, choose your size and color, add the item to your cart, and proceed to checkout.', 'orders', 'how-do-i-place-an-order', 1),
  ('Can I change or cancel my order?', 'Contact us as soon as possible after placing your order. Our team can cancel or amend eligible orders before they enter processing — once an order has shipped, it can no longer be changed.', 'orders', 'can-i-change-or-cancel-my-order', 2),
  ('How do I track my order?', 'Once your order ships, you can view its status any time from your account under Orders.', 'orders', 'how-do-i-track-my-order', 3),
  ('Do I need an account to place an order?', 'No — you can check out as a guest. Creating an account just makes it faster to reorder and lets you track past orders in one place.', 'orders', 'do-i-need-an-account-to-order', 4),
  ('How long does shipping take?', 'Within Ghana, delivery typically takes 1–5 business days depending on your location and the shipping method you choose at checkout. International delivery typically takes 3–14 business days.', 'shipping', 'how-long-does-shipping-take', 1),
  ('Do you ship internationally?', 'Yes — X-Rare ships internationally. Shipping cost and delivery time are calculated at checkout based on your delivery address.', 'shipping', 'do-you-ship-internationally', 2),
  ('What is your return policy?', 'Unworn items with tags attached can be returned within 14 days of delivery. Contact us to start a return.', 'returns_exchanges', 'what-is-your-return-policy', 1),
  ('Can I change my size after ordering?', 'Sizes can''t be changed automatically once an order is placed. Contact us as soon as possible and we''ll do what we can before your order ships; otherwise it can be exchanged after delivery under our return policy.', 'returns_exchanges', 'can-i-change-my-size-after-ordering', 2),
  ('How do I know which size to order?', 'Use the size guide available on each applicable product page. If you''re between sizes, refer to the fit notes provided for that specific product.', 'products_sizing', 'how-do-i-know-which-size-to-order', 1),
  ('Are your products authentic?', 'Every X-Rare piece is designed and produced by us — we''re not a reseller or marketplace. What you order is the genuine article, direct from the brand.', 'products_sizing', 'are-your-products-authentic', 2),
  ('What payment methods do you accept?', 'We accept major debit and credit cards, plus Paystack and Flutterwave for local payment options.', 'payments', 'what-payment-methods-do-you-accept', 1),
  ('How do I reset my password?', 'From the login page, select "Forgot password" and follow the link we email you to set a new one.', 'account', 'how-do-i-reset-my-password', 1),
  ('How can I collaborate with X-Rare?', 'We''re always open to creative collaborations, partnerships, and press opportunities. Reach out through our Contact page with "Collaboration" as the subject.', 'collaborations', 'how-can-i-collaborate-with-x-rare', 1);
