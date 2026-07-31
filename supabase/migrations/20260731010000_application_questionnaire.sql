alter table public.profiles
  add column application_profile_data jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_application_profile_data_object
    check (jsonb_typeof(application_profile_data) = 'object'),
  add constraint profiles_application_profile_data_size
    check (octet_length(application_profile_data::text) <= 100000);

create table public.application_question_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_key),
  constraint application_question_answers_key_length
    check (length(question_key) between 1 and 180),
  constraint application_question_answers_question_length
    check (length(question_text) between 1 and 1000),
  constraint application_question_answers_answer_length
    check (length(answer) between 1 and 8000)
);

create index application_question_answers_user_idx
  on public.application_question_answers(user_id, updated_at desc);

create trigger application_question_answers_updated_at
  before update on public.application_question_answers
  for each row execute procedure public.set_updated_at();

alter table public.application_question_answers enable row level security;

create policy application_question_answers_own
  on public.application_question_answers for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
