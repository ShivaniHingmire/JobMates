begin;
select plan(3);

insert into auth.users(id, email) values
  ('10000000-0000-0000-0000-000000000001', 'one@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'two@example.test');

insert into public.job_preferences(user_id, target_titles) values
  ('10000000-0000-0000-0000-000000000001', array['Designer']),
  ('20000000-0000-0000-0000-000000000002', array['Engineer']);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);

select results_eq(
  'select count(*)::bigint from public.job_preferences',
  array[1::bigint],
  'a user sees only their preferences'
);

select results_eq(
  $query$
    select count(*)::bigint from public.job_preferences
    where user_id = '20000000-0000-0000-0000-000000000002'
  $query$,
  array[0::bigint],
  'cross-user preference reads are denied'
);

update public.job_preferences set salary_floor = 1
where user_id = '20000000-0000-0000-0000-000000000002';

set local role postgres;
select is(
  (
    select salary_floor from public.job_preferences
    where user_id = '20000000-0000-0000-0000-000000000002'
  ),
  null::integer,
  'cross-user update cannot change the hidden row'
);

select * from finish();
rollback;
