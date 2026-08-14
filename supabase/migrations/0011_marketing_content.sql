-- Newsletter subscribers and CMS-style content (pages, blog posts).

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  first_name text,
  status newsletter_subscriber_status not null default 'subscribed',
  source text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pages_set_updated_at
  before update on pages
  for each row execute function set_updated_at();

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_image text,
  author_id uuid references profiles (id) on delete set null,
  status content_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_status_idx on blog_posts (status);

create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();
