-- Partial index for efficient leaderboard query
create index if not exists submissions_pass_idx
on public.submissions(user_id, problem_id)
where verdict = 'pass';

-- Leaderboard function
create or replace function public.leaderboard_top(lim int default 50)
returns table (
  rank bigint,
  github_username text,
  avatar_url text,
  problems_solved bigint
)
language sql
stable
security definer
as $$
  select
    row_number() over (order by count(distinct s.problem_id) desc) as rank,
    p.github_username,
    p.avatar_url,
    count(distinct s.problem_id) as problems_solved
  from public.submissions s
  join public.profiles p on p.id = s.user_id
  where s.verdict = 'pass'
  group by p.id, p.github_username, p.avatar_url
  order by problems_solved desc
  limit lim;
$$;

grant execute on function public.leaderboard_top(int) to anon, authenticated;
