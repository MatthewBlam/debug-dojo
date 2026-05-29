def two_sum(nums: list[int], target: int) -> list[int]:
    """Return indices of the two numbers that add up to target.

    Assumes exactly one solution exists. Each input may only be used once.
    """
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []