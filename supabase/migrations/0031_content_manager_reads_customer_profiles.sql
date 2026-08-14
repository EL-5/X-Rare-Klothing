-- Fix: AdminReviews shows "Unknown customer" for every review because
-- content_manager (the role that actually moderates reviews) wasn't in the
-- "Staff read any profile" policy's role list — caught live while
-- verifying Batch 15's Hide action. content_manager needs to see who wrote
-- a review it's moderating.
drop policy "Staff read any profile" on profiles;
create policy "Staff read any profile" on profiles
  for select using (has_any_role('content_manager', 'customer_support', 'order_manager', 'admin', 'super_admin'));
