-- Contact page redesign: adds a new notification_type value on its own,
-- committed before it's referenced by anything (the enqueue call in
-- 0044_contact_submissions.sql). Postgres enum values added mid-transaction
-- aren't safely usable until committed, so this is deliberately its own
-- migration rather than folded into 0044.
alter type notification_type add value 'contact_submission';
