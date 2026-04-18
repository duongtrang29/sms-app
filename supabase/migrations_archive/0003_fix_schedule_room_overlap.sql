alter table public.schedules
  add column if not exists active_date_range daterange
  generated always as (
    daterange(
      coalesce(start_date, '-infinity'::date),
      case
        when end_date is null then 'infinity'::date
        else end_date + 1
      end,
      '[)'
    )
  ) stored;

alter table public.schedules
  drop constraint if exists schedules_room_overlap_excl;

alter table public.schedules
  add constraint schedules_room_overlap_excl
  exclude using gist (
    room_id with =,
    day_of_week with =,
    time_range with &&,
    active_date_range with &&
  )
  where (room_id is not null);
