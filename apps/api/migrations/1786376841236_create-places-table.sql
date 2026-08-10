-- Up Migration

create table places (
  place_id text primary key,
  title text not null,
  resolved_title text null,
  list_name text not null,
  url text not null,
  lat double precision not null,
  lng double precision not null,
  types text[] not null default '{}',
  saved_at timestamptz not null default now()
);

-- Down Migration

drop table places;
