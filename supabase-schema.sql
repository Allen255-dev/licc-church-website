-- ============================================================
-- LICC WEBSITE — SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New Query → paste this → Run)
-- ============================================================

-- SERMONS TABLE
create table sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  preacher text not null,
  category text default 'Sunday Service',
  youtube_url text not null,
  sermon_date date not null,
  description text,
  created_at timestamptz default now()
);

-- EVENTS TABLE
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time text,
  end_time text,
  location text default 'Main Auditorium',
  image_url text,
  created_at timestamptz default now()
);

-- GALLERY TABLE
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

-- NEWS / BLOG TABLE
create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  author text default 'LICC Admin',
  published_date date not null default current_date,
  created_at timestamptz default now()
);

-- BRANCHES TABLE
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text default 'City Campus',
  pastor text,
  address text not null,
  city text default 'Port Harcourt',
  state text default 'Rivers State',
  phone text,
  whatsapp text,
  email text,
  service_times text,
  google_maps_url text,
  display_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Public can READ everything. Only authenticated admin can WRITE.
-- ============================================================

alter table sermons enable row level security;
alter table events enable row level security;
alter table gallery enable row level security;
alter table news enable row level security;
alter table branches enable row level security;

-- Public read access (anyone visiting the website)
create policy "Public can view sermons" on sermons for select using (true);
create policy "Public can view events" on events for select using (true);
create policy "Public can view gallery" on gallery for select using (true);
create policy "Public can view news" on news for select using (true);
create policy "Public can view branches" on branches for select using (true);

-- Authenticated write access (admin panel, after login)
create policy "Authenticated can insert branches" on branches for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update branches" on branches for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete branches" on branches for delete using (auth.role() = 'authenticated');

-- Authenticated write access (admin panel, after login)
create policy "Authenticated can insert sermons" on sermons for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update sermons" on sermons for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete sermons" on sermons for delete using (auth.role() = 'authenticated');

create policy "Authenticated can insert events" on events for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update events" on events for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete events" on events for delete using (auth.role() = 'authenticated');

create policy "Authenticated can insert gallery" on gallery for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update gallery" on gallery for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete gallery" on gallery for delete using (auth.role() = 'authenticated');

create policy "Authenticated can insert news" on news for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update news" on news for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete news" on news for delete using (auth.role() = 'authenticated');

-- ============================================================
-- MESSAGES TABLE (contact form & visit bookings)
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  reason text,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Anyone can submit a message (public contact form / visit booking)
create policy "Public can insert messages" on messages for insert with check (true);
-- Only authenticated admin can read / manage messages
create policy "Authenticated can view messages" on messages for select using (auth.role() = 'authenticated');
create policy "Authenticated can update messages" on messages for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete messages" on messages for delete using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET for gallery/news images
-- (Also create this manually in Dashboard → Storage → New Bucket
--  named "media", set to PUBLIC — see setup guide for details)
-- ============================================================
-- QUOTES TABLE
create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  author_name text not null,
  author_role text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table quotes enable row level security;
create policy "Public can view quotes" on quotes for select using (true);
create policy "Authenticated can insert quotes" on quotes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update quotes" on quotes for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete quotes" on quotes for delete using (auth.role() = 'authenticated');
