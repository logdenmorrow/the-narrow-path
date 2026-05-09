CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    gender,
    track
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(
        trim(
          concat_ws(
            ' ',
            new.raw_user_meta_data ->> 'first_name',
            new.raw_user_meta_data ->> 'last_name'
          )
        ),
        ''
      ),
      split_part(new.email, '@', 1)
    ),
    case
      when new.raw_user_meta_data ->> 'gender' in ('male', 'female')
        then new.raw_user_meta_data ->> 'gender'
      else null
    end,
    case
      when new.raw_user_meta_data ->> 'track' in ('brotherhood', 'sisterhood')
        then new.raw_user_meta_data ->> 'track'
      else 'brotherhood'
    end
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    gender = excluded.gender,
    track = excluded.track;

  return new;
end;
$function$
