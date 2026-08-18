-- Vehicle catalog photos
-- ----------------------
-- Each model carries one photo. The photos originate from Wikimedia Commons
-- (free licences) but are mirrored into the public `vehicle-catalog` storage
-- bucket by scripts/vehicle-catalog/mirror-images.mjs: Commons rate-limits
-- server-side fetches, and a page render should not depend on their uptime.
--
-- CC BY / CC BY-SA require visible credit, so author and licence are stored
-- next to the URL and rendered under every image.

alter table vehicle_models
  add column if not exists image_url        text,
  add column if not exists image_author     text,
  add column if not exists image_license    text,
  add column if not exists image_source_url text;

comment on column vehicle_models.image_url        is 'Public URL in the vehicle-catalog bucket (640x360 webp)';
comment on column vehicle_models.image_author     is 'Credit line required by the licence';
comment on column vehicle_models.image_license    is 'e.g. CC BY-SA 4.0, Public domain';
comment on column vehicle_models.image_source_url is 'Commons file page, for the licence link';

-- The driver's chosen car, denormalised onto the profile so the card renders
-- without a join.
alter table profiles
  add column if not exists car_image_url     text,
  add column if not exists car_image_author  text,
  add column if not exists car_image_license text;

-- Prefix and fuzzy search over 5.8k models needs an index.
create extension if not exists pg_trgm;
create index if not exists vehicle_models_name_trgm_idx on vehicle_models using gin (name gin_trgm_ops);
create index if not exists vehicle_makes_name_trgm_idx  on vehicle_makes  using gin (name gin_trgm_ops);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-catalog', 'vehicle-catalog', true, 2097152, array['image/webp'])
on conflict (id) do update set public = excluded.public;
