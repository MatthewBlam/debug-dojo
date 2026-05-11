-- Sprint 1 seed: Two Sum slop problem

delete from public.problems where title = 'Two Sum';

with inserted_problem as (
  insert into public.problems (
    title,
    description,
    difficulty,
    bug_category,
    target_complexity,
    slop_code,
    reference_solution,
    function_signature,
    status
  )
  values (
    'Two Sum',
    $description$
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume each input has at most one valid answer, and you may not use the same element twice.

Return the answer as an array of two indices. If no valid pair exists, return an empty array.
$description$,
    'easy',
    'bad_complexity',
    'O(n)',
    $slop_code$
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]

    return []
$slop_code$,
    $reference_solution$
def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        if complement in seen:
            return [seen[complement], i]

        seen[num] = i

    return []
$reference_solution$,
    'def two_sum(nums, target):',
    'published'
  )
  returning id
)
insert into public.test_cases (
  problem_id,
  input,
  is_hidden
)
select
  inserted_problem.id,
  test_case.input,
  test_case.is_hidden
from inserted_problem
cross join (
  values
    (
      '{"nums":[2,7,11,15],"target":9,"expected":[0,1]}',
      false
    ),
    (
      '{"nums":[3,3],"target":6,"expected":[0,1]}',
      false
    ),
    (
      '{"nums":[],"target":0,"expected":[]}',
      false
    )
) as test_case(input, is_hidden);