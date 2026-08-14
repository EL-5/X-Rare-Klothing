-- X-Rare rebrand: new orders get an "XR-" number instead of "HF-".
-- Historical order numbers are left untouched — they're a real financial
-- record, not something to silently rewrite.
alter table orders alter column order_number set default ('XR-' || nextval('order_number_seq')::text);
