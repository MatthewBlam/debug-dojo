-- Enable UUID generation
create extension if not exists pgcrypto;

-- Enums
create type difficulty_level as enum ('easy', 'medium', 'hard');

create type problem_status as enum ('draft', 'reviewed', 'published');

create type submission_verdict as enum ('pass', 'partial', 'fail');

-- Replace these 6 values with your actual “slop types” if different
create type bug_category as enum (
  'incorrect_data_structure',
  'wrong_condition',
  'missing_edge_case',
  'bad_complexity',
  'state_mutation',
  'other'
);

-- Problems
create table public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty difficulty_level not null,
  bug_category bug_category not null,
  target_complexity text not null,
  slop_code text not null,
  reference_solution text not null,
  function_signature text not null,
  status problem_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- Test cases
create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input text not null,
  expected_output text not null,
  is_hidden boolean not null default false
);

-- Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  code text not null,
  verdict submission_verdict not null,
  complexity_detected text,
  cases_passed int not null default 0 check (cases_passed >= 0),
  cases_total int not null default 0 check (cases_total >= 0),
  feedback_card text,
  created_at timestamptz not null default now(),
  check (cases_passed <= cases_total)
);

-- Public profiles table for leaderboard joins
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  avatar_url text
);

-- Helpful indexes
create index problems_status_idx on public.problems(status);
create index problems_difficulty_idx on public.problems(difficulty);
create index test_cases_problem_id_idx on public.test_cases(problem_id);
create index submissions_user_id_idx on public.submissions(user_id);
create index submissions_problem_id_idx on public.submissions(problem_id);
create index submissions_created_at_idx on public.submissions(created_at desc);

-- Enable RLS
alter table public.problems enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;

-- Problems: readable by anyone
create policy "Anyone can read published problems"
on public.problems
for select
using (status = 'published');

-- Problems: service role can manage all
create policy "Service role can manage problems"
on public.problems
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Test cases: anyone can read non-hidden cases
create policy "Anyone can read non-hidden test cases"
on public.test_cases
for select
using (
  is_hidden = false
  and exists (
    select 1
    from public.problems p
    where p.id = test_cases.problem_id
      and p.status = 'published'
  )
);

-- Test cases: service role can read/manage all, including hidden
create policy "Service role can manage test cases"
on public.test_cases
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Submissions: users can read their own
create policy "Users can read own submissions"
on public.submissions
for select
using (auth.uid() = user_id);

-- Submissions: users can create their own submissions
create policy "Users can create own submissions"
on public.submissions
for insert
with check (auth.uid() = user_id);

-- Submissions: service role can manage all
create policy "Service role can manage submissions"
on public.submissions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Profiles: public read
create policy "Anyone can read profiles"
on public.profiles
for select
using (true);

-- Profiles: users can insert/update their own profile
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Profiles: service role can manage all
create policy "Service role can manage profiles"
on public.profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');