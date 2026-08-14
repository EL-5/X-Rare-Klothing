-- Product reviews.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  status review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, profile_id)
);
create index reviews_product_id_idx on reviews (product_id);
create index reviews_status_idx on reviews (status);

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

create table review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index review_images_review_id_idx on review_images (review_id);
