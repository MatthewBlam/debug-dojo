create extension if not exists pgcrypto;

drop function if exists public.leaderboard_top(int);
drop table if exists public.submissions cascade;
drop table if exists public.test_cases cascade;
drop table if exists public.problem_tags cascade;
drop table if exists public.problems cascade;
drop table if exists public.profiles cascade;
drop type if exists public.verdict cascade;
drop type if exists public.submission_verdict cascade;
drop type if exists public.bug_category cascade;
drop type if exists public.status cascade;
drop type if exists public.difficulty cascade;

create type public.difficulty as enum ('easy', 'medium', 'hard');

create type public.status as enum ('draft', 'reviewed', 'published');

create type public.bug_category as enum (
  'bad_complexity',
  'off_by_one',
  'wrong_base_case',
  'missing_edge_case',
  'subtle_logic_error',
  'redundant_work'
);

create type public.submission_verdict as enum ('pending', 'pass', 'partial', 'fail');

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique check (short_id ~ '^[0-9]{3}$'),
  title text not null,
  description text not null,
  difficulty public.difficulty not null,
  bug_category public.bug_category not null,
  target_complexity text not null,
  slop_code text not null,
  reference_solution text not null,
  function_signature text not null,
  status public.status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.problem_tags (
  problem_id uuid not null references public.problems(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 48),
  position int not null default 0 check (position >= 0),
  primary key (problem_id, tag)
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input jsonb not null check (jsonb_typeof(input) = 'object'),
  is_hidden boolean not null default false,
  position int not null default 0 check (position >= 0)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  code text not null,
  verdict public.submission_verdict not null default 'pending',
  complexity_detected text,
  cases_passed int not null default 0 check (cases_passed >= 0),
  cases_total int not null default 0 check (cases_total >= 0),
  test_case_results jsonb not null default '[]'::jsonb,
  feedback_card text,
  created_at timestamptz not null default now(),
  judged_at timestamptz,
  check (cases_passed <= cases_total)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  avatar_url text
);

create index problems_status_idx on public.problems(status);
create index problems_short_id_idx on public.problems(short_id);
create index problems_difficulty_idx on public.problems(difficulty);
create index problem_tags_problem_id_idx on public.problem_tags(problem_id);
create index test_cases_problem_id_position_idx on public.test_cases(problem_id, position);
create index submissions_user_id_created_at_idx on public.submissions(user_id, created_at desc);
create index submissions_problem_id_idx on public.submissions(problem_id);
create index submissions_pass_problem_idx on public.submissions(user_id, problem_id)
where verdict = 'pass';

alter table public.problems enable row level security;
alter table public.problem_tags enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;

create policy "Service role can manage problems"
on public.problems
for all
to service_role
using (true)
with check (true);

create policy "Service role can manage problem tags"
on public.problem_tags
for all
to service_role
using (true)
with check (true);

create policy "Service role can manage test cases"
on public.test_cases
for all
to service_role
using (true)
with check (true);

create policy "Users can read own submissions"
on public.submissions
for select
using ((select auth.uid()) = user_id);

create policy "Service role can manage submissions"
on public.submissions
for all
to service_role
using (true)
with check (true);

create policy "Users can read own profile"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Service role can manage profiles"
on public.profiles
for all
to service_role
using (true)
with check (true);
