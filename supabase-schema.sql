-- ============================================================
-- LICC WEBSITE — SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New Query → paste this → Run)
-- ============================================================

-- 1. SERMONS TABLE
create table if not exists sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 300),
  preacher text not null check (char_length(trim(preacher)) between 1 and 200),
  category text default 'Sunday Service' check (char_length(category) <= 100),
  youtube_url text not null check (char_length(trim(youtube_url)) between 5 and 1000),
  sermon_date date not null,
  description text check (description is null or char_length(description) <= 5000),
  created_at timestamptz not null default now()
);

-- 2. EVENTS TABLE
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 300),
  description text check (description is null or char_length(description) <= 5000),
  event_date date not null,
  start_time text check (start_time is null or char_length(start_time) <= 50),
  end_time text check (end_time is null or char_length(end_time) <= 50),
  location text default 'Main Auditorium' check (char_length(location) <= 250),
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  created_at timestamptz not null default now()
);

-- 3. GALLERY TABLE
create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null check (char_length(trim(image_url)) between 5 and 1000),
  caption text check (caption is null or char_length(caption) <= 500),
  created_at timestamptz not null default now()
);

-- 4. NEWS / BLOG TABLE
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 300),
  body text not null check (char_length(trim(body)) >= 1),
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  author text default 'LICC Admin' check (char_length(author) <= 150),
  published_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 5. BRANCHES TABLE
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 200),
  tag text default 'City Campus' check (char_length(tag) <= 100),
  pastor text check (pastor is null or char_length(pastor) <= 150),
  address text not null check (char_length(trim(address)) between 1 and 400),
  city text default 'Port Harcourt' check (char_length(city) <= 100),
  state text default 'Rivers State' check (char_length(state) <= 100),
  phone text check (phone is null or char_length(phone) <= 60),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 60),
  email text check (email is null or char_length(email) <= 255),
  service_times text check (service_times is null or char_length(service_times) <= 500),
  google_maps_url text check (google_maps_url is null or char_length(google_maps_url) <= 1000),
  display_order int default 0,
  created_at timestamptz not null default now()
);

-- 6. MESSAGES TABLE (Contact Form & Visit Bookings)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text check (email is null or char_length(trim(email)) <= 255),
  phone text check (phone is null or char_length(trim(phone)) <= 60),
  reason text check (reason is null or char_length(trim(reason)) <= 150),
  message text not null check (char_length(trim(message)) between 1 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. QUOTES TABLE
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null check (char_length(trim(quote_text)) between 1 and 1000),
  author_name text not null check (char_length(trim(author_name)) between 1 and 200),
  author_role text check (author_role is null or char_length(author_role) <= 150),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table sermons enable row level security;
alter table events enable row level security;
alter table gallery enable row level security;
alter table news enable row level security;
alter table branches enable row level security;
alter table messages enable row level security;
alter table quotes enable row level security;

-- -----------------
-- PUBLIC READ POLICIES
-- -----------------
drop policy if exists "Public can view sermons" on sermons;
create policy "Public can view sermons" on sermons for select using (true);

drop policy if exists "Public can view events" on events;
create policy "Public can view events" on events for select using (true);

drop policy if exists "Public can view gallery" on gallery;
create policy "Public can view gallery" on gallery for select using (true);

drop policy if exists "Public can view news" on news;
create policy "Public can view news" on news for select using (true);

drop policy if exists "Public can view branches" on branches;
create policy "Public can view branches" on branches for select using (true);

drop policy if exists "Public can view quotes" on quotes;
create policy "Public can view quotes" on quotes for select using (true);

-- -----------------
-- AUTHENTICATED WRITE POLICIES (Admin Only)
-- -----------------
-- Sermons
drop policy if exists "Authenticated can insert sermons" on sermons;
create policy "Authenticated can insert sermons" on sermons for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update sermons" on sermons;
create policy "Authenticated can update sermons" on sermons for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete sermons" on sermons;
create policy "Authenticated can delete sermons" on sermons for delete using (auth.role() = 'authenticated');

-- Events
drop policy if exists "Authenticated can insert events" on events;
create policy "Authenticated can insert events" on events for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update events" on events;
create policy "Authenticated can update events" on events for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete events" on events;
create policy "Authenticated can delete events" on events for delete using (auth.role() = 'authenticated');

-- Gallery
drop policy if exists "Authenticated can insert gallery" on gallery;
create policy "Authenticated can insert gallery" on gallery for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update gallery" on gallery;
create policy "Authenticated can update gallery" on gallery for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete gallery" on gallery for delete using (auth.role() = 'authenticated');

-- News
drop policy if exists "Authenticated can insert news" on news;
create policy "Authenticated can insert news" on news for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update news" on news;
create policy "Authenticated can update news" on news for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete news" on news;
create policy "Authenticated can delete news" on news for delete using (auth.role() = 'authenticated');

-- Branches
drop policy if exists "Authenticated can insert branches" on branches;
create policy "Authenticated can insert branches" on branches for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update branches" on branches;
create policy "Authenticated can update branches" on branches for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete branches" on branches;
create policy "Authenticated can delete branches" on branches for delete using (auth.role() = 'authenticated');

-- Quotes
drop policy if exists "Authenticated can insert quotes" on quotes;
create policy "Authenticated can insert quotes" on quotes for insert with check (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update quotes" on quotes;
create policy "Authenticated can update quotes" on quotes for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete quotes" on quotes;
create policy "Authenticated can delete quotes" on quotes for delete using (auth.role() = 'authenticated');

-- -----------------
-- MESSAGES POLICIES
-- -----------------
-- Anyone can submit a message, but it CANNOT be inserted with read = true, and must contain name and message
drop policy if exists "Public can insert messages" on messages;
create policy "Public can insert messages" on messages for insert with check (
  read = false
  and char_length(trim(name)) > 0
  and char_length(trim(message)) > 0
);

-- Admin can also insert messages
drop policy if exists "Authenticated can insert messages" on messages;
create policy "Authenticated can insert messages" on messages for insert with check (auth.role() = 'authenticated');

-- Only authenticated admin can view, mark as read, or delete messages
drop policy if exists "Authenticated can view messages" on messages;
create policy "Authenticated can view messages" on messages for select using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can update messages" on messages;
create policy "Authenticated can update messages" on messages for update using (auth.role() = 'authenticated');
drop policy if exists "Authenticated can delete messages" on messages;
create policy "Authenticated can delete messages" on messages for delete using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET SECURITY POLICIES
-- Target bucket: "media" (set to Public bucket in Dashboard)
-- Protects file storage so only authenticated admins can upload/edit/delete
-- ============================================================

-- 1. Public can read/view all media objects in "media" bucket
drop policy if exists "Public can view media" on storage.objects;
create policy "Public can view media"
  on storage.objects for select
  using (bucket_id = 'media');

-- 2. Only authenticated admins can upload objects to "media"
drop policy if exists "Authenticated admins can upload media" on storage.objects;
create policy "Authenticated admins can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

-- 3. Only authenticated admins can update objects in "media"
drop policy if exists "Authenticated admins can update media" on storage.objects;
create policy "Authenticated admins can update media"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

-- 4. Only authenticated admins can delete objects in "media"
drop policy if exists "Authenticated admins can delete media" on storage.objects;
create policy "Authenticated admins can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );
