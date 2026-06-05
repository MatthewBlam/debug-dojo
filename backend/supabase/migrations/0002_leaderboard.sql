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
language plpgsql
stable
security definer
as $$
declare
  safe_lim int := least(greatest(lim, 1), 100);
begin
  return query
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
  limit safe_lim;
end;
$$;

grant execute on function public.leaderboard_top(int) to anon, authenticated;
