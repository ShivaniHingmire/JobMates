create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

create type public.resume_parse_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.job_analysis_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.job_disposition as enum ('interested', 'rejected', 'saved');
create type public.skill_importance as enum ('required', 'preferred', 'mentioned');
create type public.application_status as enum (
  'planned', 'applied', 'screening', 'interview', 'offer',
  'rejected', 'withdrawn', 'archived'
);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  location_text text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_titles text[] not null default '{}',
  target_skills text[] not null default '{}',
  locations text[] not null default '{}',
  workplace_types text[] not null default '{}',
  employment_types text[] not null default '{}',
  salary_floor integer check (salary_floor is null or salary_floor >= 0),
  experience_level text,
  requires_sponsorship boolean,
  excluded_companies text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  profile_embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  byte_size integer not null check (byte_size between 1 and 5242880),
  sha256 text not null,
  parse_status public.resume_parse_status not null default 'pending',
  safe_error_code text,
  extracted_text text,
  parsed_profile jsonb,
  embedding extensions.vector(1536),
  model text,
  prompt_version text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index resumes_one_primary_per_user
  on public.resumes(user_id) where is_primary;

create table public.skills (
  id bigint generated always as identity primary key,
  slug text not null unique,
  label text not null,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.resume_skills (
  resume_id uuid not null references public.resumes(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete restrict,
  years numeric(4,1),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence text not null,
  created_at timestamptz not null default now(),
  primary key (resume_id, skill_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website_url text,
  greenhouse_board_token text not null unique,
  enabled boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  source text not null default 'greenhouse',
  source_job_id text not null,
  title text not null,
  description_text text not null,
  location_text text,
  country_code text,
  workplace_type text,
  employment_type text,
  salary_min integer,
  salary_max integer,
  salary_currency text default 'USD',
  apply_url text not null,
  posted_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  content_hash text not null,
  raw_payload jsonb not null default '{}',
  requirements jsonb,
  analysis_status public.job_analysis_status not null default 'pending',
  analysis_attempts smallint not null default 0,
  next_retry_at timestamptz,
  analysis_claimed_at timestamptz,
  safe_error_code text,
  embedding extensions.vector(1536),
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_job_id)
);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete restrict,
  importance public.skill_importance not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence text not null,
  created_at timestamptz not null default now(),
  primary key (job_id, skill_id, importance)
);

create table public.user_job_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  disposition public.job_disposition not null,
  first_seen_at timestamptz not null default now(),
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.interaction_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  event_type text not null,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.match_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  components jsonb not null,
  matched_skill_ids bigint[] not null default '{}',
  missing_required_skill_ids bigint[] not null default '{}',
  missing_preferred_skill_ids bigint[] not null default '{}',
  evidence jsonb not null default '{}',
  explanation jsonb,
  scoring_version text not null,
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id, resume_id, scoring_version)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete restrict,
  status public.application_status not null default 'planned',
  applied_at timestamptz,
  next_action_at timestamptz,
  notes text not null default '',
  source_url text,
  last_status_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table public.application_status_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  channel text not null check (channel in (
    'email', 'linkedin_connection', 'linkedin_message'
  )),
  recipient text,
  tone text not null,
  subject text,
  body text not null,
  source_facts jsonb not null,
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_runs (
  id bigint generated always as identity primary key,
  feature text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  status text not null,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer,
  safe_error_code text,
  user_id uuid references auth.users(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.job_sync_runs (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies(id) on delete set null,
  status text not null,
  fetched_count integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  deactivated_count integer not null default 0,
  safe_error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index jobs_active_posted_idx on public.jobs(company_id, posted_at desc)
  where is_active;
create index jobs_analysis_queue_idx
  on public.jobs(analysis_status, next_retry_at, created_at);
create index user_job_states_recent_idx
  on public.user_job_states(user_id, decided_at desc);
create index interaction_events_user_idx
  on public.interaction_events(user_id, occurred_at desc);
create index applications_user_idx
  on public.applications(user_id, last_status_at desc);
create index application_events_user_idx
  on public.application_status_events(user_id, occurred_at desc);
create index drafts_user_idx on public.message_drafts(user_id, created_at desc);
create index jobs_embedding_hnsw on public.jobs
  using hnsw (embedding extensions.vector_cosine_ops);
create index resumes_embedding_hnsw on public.resumes
  using hnsw (embedding extensions.vector_cosine_ops);
create index preferences_embedding_hnsw on public.job_preferences
  using hnsw (profile_embedding extensions.vector_cosine_ops);

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger preferences_updated_at before update on public.job_preferences
  for each row execute procedure public.set_updated_at();
create trigger resumes_updated_at before update on public.resumes
  for each row execute procedure public.set_updated_at();
create trigger companies_updated_at before update on public.companies
  for each row execute procedure public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
  for each row execute procedure public.set_updated_at();
create trigger states_updated_at before update on public.user_job_states
  for each row execute procedure public.set_updated_at();
create trigger matches_updated_at before update on public.match_analyses
  for each row execute procedure public.set_updated_at();
create trigger applications_updated_at before update on public.applications
  for each row execute procedure public.set_updated_at();
create trigger drafts_updated_at before update on public.message_drafts
  for each row execute procedure public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.job_preferences enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_skills enable row level security;
alter table public.companies enable row level security;
alter table public.skills enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.user_job_states enable row level security;
alter table public.interaction_events enable row level security;
alter table public.match_analyses enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_events enable row level security;
alter table public.message_drafts enable row level security;
alter table public.ai_runs enable row level security;
alter table public.job_sync_runs enable row level security;

create policy profiles_own on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy preferences_own on public.job_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy resumes_own on public.resumes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy resume_skills_own on public.resume_skills for all
  using (exists(select 1 from public.resumes r where r.id = resume_id and r.user_id = auth.uid()))
  with check (exists(select 1 from public.resumes r where r.id = resume_id and r.user_id = auth.uid()));
create policy companies_read on public.companies for select to authenticated using (true);
create policy skills_read on public.skills for select to authenticated using (true);
create policy jobs_read on public.jobs for select to authenticated using (true);
create policy job_skills_read on public.job_skills for select to authenticated using (true);
create policy states_own on public.user_job_states for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy events_own_read on public.interaction_events for select
  using (user_id = auth.uid());
create policy events_own_append on public.interaction_events for insert
  with check (
    user_id = auth.uid()
    and jsonb_typeof(metadata) = 'object'
    and length(metadata::text) <= 2000
  );
create policy matches_own on public.match_analyses for all
  using (
    user_id = auth.uid() and exists(
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = auth.uid()
    )
  ) with check (
    user_id = auth.uid() and exists(
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = auth.uid()
    )
  );
create policy applications_own on public.applications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy application_events_own_read on public.application_status_events for select
  using (
    user_id = auth.uid() and exists(
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );
create policy application_events_own_append on public.application_status_events for insert
  with check (
    user_id = auth.uid() and exists(
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );
create policy drafts_own on public.message_drafts for all
  using (
    user_id = auth.uid() and exists(
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = auth.uid()
    )
  ) with check (
    user_id = auth.uid() and exists(
      select 1 from public.resumes r
      where r.id = resume_id and r.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy resume_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resume_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resume_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resume_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create function public.record_job_action(
  target_job_id uuid,
  target_action public.job_disposition,
  action_idempotency_key text
) returns public.user_job_states
language plpgsql security invoker set search_path = '' as $$
declare result public.user_job_states;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;

  if exists (
    select 1 from public.interaction_events
    where idempotency_key = action_idempotency_key and user_id = auth.uid()
  ) then
    select * into result from public.user_job_states
    where user_id = auth.uid() and job_id = target_job_id;
    return result;
  end if;

  insert into public.interaction_events(user_id, job_id, event_type, idempotency_key)
  values (auth.uid(), target_job_id, target_action::text, action_idempotency_key);

  insert into public.user_job_states(user_id, job_id, disposition)
  values (auth.uid(), target_job_id, target_action)
  on conflict (user_id, job_id) do update
  set disposition = excluded.disposition, decided_at = now(), updated_at = now()
  returning * into result;
  return result;
end;
$$;

create function public.claim_jobs_for_analysis(batch_size integer default 5)
returns setof public.jobs language sql security definer set search_path = '' as $$
  update public.jobs
  set analysis_status = 'processing', analysis_claimed_at = now(),
      analysis_attempts = analysis_attempts + 1
  where id in (
    select id from public.jobs
    where analysis_status = 'pending'
      and (next_retry_at is null or next_retry_at <= now())
    order by created_at
    for update skip locked
    limit least(greatest(batch_size, 1), 5)
  )
  returning *;
$$;
revoke all on function public.claim_jobs_for_analysis(integer) from public, anon, authenticated;
grant execute on function public.claim_jobs_for_analysis(integer) to service_role;

create function public.get_swipe_candidates(candidate_limit integer default 20)
returns table(job_id uuid, score smallint, posted_at timestamptz)
language sql security invoker set search_path = '' as $$
  with ranked as (
    select j.id, ma.score, j.posted_at,
      row_number() over (partition by j.company_id order by ma.score desc, j.posted_at desc) company_rank
    from public.jobs j
    join public.match_analyses ma on ma.job_id = j.id and ma.user_id = auth.uid()
    left join public.user_job_states s on s.job_id = j.id and s.user_id = auth.uid()
    where j.is_active and j.analysis_status = 'ready' and s.job_id is null
  )
  select id, score, posted_at from ranked
  where company_rank <= 2
  order by score desc, posted_at desc
  limit least(greatest(candidate_limit, 1), 20);
$$;

create function public.get_user_analytics()
returns jsonb language sql security invoker set search_path = '' as $$
  with event_totals as (
    select
      count(*) filter (where event_type = 'viewed') viewed,
      count(*) filter (where event_type = 'interested') interested,
      count(*) filter (where event_type = 'rejected') rejected,
      count(*) filter (where event_type = 'saved') saved
    from public.interaction_events where user_id = auth.uid()
  ),
  days as (
    select day::date
    from generate_series(current_date - interval '6 days', current_date, interval '1 day') day
  ),
  weekly as (
    select d.day, count(e.id) value
    from days d
    left join public.application_status_events e
      on e.user_id = auth.uid()
      and e.to_status = 'applied'
      and e.occurred_at::date = d.day
    group by d.day order by d.day
  ),
  status_counts as (
    select status::text, count(*) count
    from public.applications where user_id = auth.uid()
    group by status
  ),
  gaps as (
    select missing_skill skill, count(*) count
    from public.match_analyses ma,
      lateral jsonb_array_elements_text(
        coalesce(ma.evidence -> 'missingRequiredSkills', '[]'::jsonb)
      ) missing_skill
    where ma.user_id = auth.uid()
    group by missing_skill
    order by count(*) desc
    limit 8
  ),
  score_outcomes as (
    select initcap(s.disposition::text) label, round(avg(latest.score))::integer value
    from public.user_job_states s
    join lateral (
      select score from public.match_analyses ma
      where ma.user_id = s.user_id and ma.job_id = s.job_id
      order by ma.created_at desc limit 1
    ) latest on true
    where s.user_id = auth.uid()
    group by s.disposition
    union all
    select 'Applied' label, round(avg(latest.score))::integer value
    from public.applications a
    join lateral (
      select score from public.match_analyses ma
      where ma.user_id = a.user_id and ma.job_id = a.job_id
      order by ma.created_at desc limit 1
    ) latest on true
    where a.user_id = auth.uid() and a.status <> 'planned'
    having count(*) > 0
  )
  select jsonb_build_object(
    'viewed', e.viewed,
    'interested', e.interested,
    'rejected', e.rejected,
    'saved', e.saved,
    'weekly_activity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', to_char(day, 'Dy'), 'value', value
      ) order by day) from weekly
    ), '[]'::jsonb),
    'status_counts', coalesce((
      select jsonb_agg(jsonb_build_object('status', status, 'count', count))
      from status_counts
    ), '[]'::jsonb),
    'missing_skills', coalesce((
      select jsonb_agg(jsonb_build_object('skill', skill, 'count', count))
      from gaps
    ), '[]'::jsonb),
    'score_outcomes', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'value', value))
      from score_outcomes
    ), '[]'::jsonb),
    'upcoming_followups', (
      select count(*) from public.applications
      where user_id = auth.uid()
        and next_action_at between now() and now() + interval '7 days'
    )
  ) from event_totals e;
$$;
