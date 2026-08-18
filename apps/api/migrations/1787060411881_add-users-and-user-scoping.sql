-- Up Migration

create table users (
  id text primary key,
  email text not null,
  created_at timestamptz not null default now()
);

-- Any existing rows would have no valid owner.
truncate table places;

alter table places
  add column user_id text not null references users(id),
  drop constraint places_pkey,
  add primary key (user_id, place_id);

-- Down Migration

alter table places
  drop constraint places_pkey,
  drop column user_id,
  add primary key (place_id);

drop table users;
