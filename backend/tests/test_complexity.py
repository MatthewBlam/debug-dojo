"""Tests for the AST-based complexity analyzer."""

import pytest

from analysis.complexity import analyze_complexity, complexity_is_acceptable


class TestAnalyzeComplexity:
    """Tests for analyze_complexity."""

    def test_simple_o1_function(self):
        code = "def f(x): return x + 1"
        assert analyze_complexity(code) == "O(1)"

    def test_single_loop_on(self):
        code = (
            "def f(nums):\n"
            "    for n in nums:\n"
            "        pass\n"
        )
        assert analyze_complexity(code) == "O(n)"

    def test_nested_loop_on2_two_sum_brute_force(self):
        code = (
            "def two_sum(nums, target):\n"
            "    for i in range(len(nums)):\n"
            "        for j in range(i + 1, len(nums)):\n"
            "            if nums[i] + nums[j] == target:\n"
            "                return [i, j]\n"
            "    return []\n"
        )
        assert analyze_complexity(code) == "O(n^2)"

    def test_hash_map_solution_on(self):
        code = (
            "def two_sum(nums, target):\n"
            "    seen = {}\n"
            "    for i, n in enumerate(nums):\n"
            "        if target - n in seen:\n"
            "            return [seen[target - n], i]\n"
            "        seen[n] = i\n"
            "    return []\n"
        )
        assert analyze_complexity(code) == "O(n)"

    def test_sort_at_top_level_on_log_n(self):
        code = (
            "def f(nums):\n"
            "    nums.sort()\n"
            "    return nums\n"
        )
        assert analyze_complexity(code) == "O(n log n)"

    def test_sorted_at_top_level_on_log_n(self):
        code = (
            "def f(nums):\n"
            "    return sorted(nums)\n"
        )
        assert analyze_complexity(code) == "O(n log n)"

    def test_sort_inside_loop_on2(self):
        code = (
            "def f(nums):\n"
            "    for i in range(len(nums)):\n"
            "        nums.sort()\n"
        )
        assert analyze_complexity(code) == "O(n^2)"

    def test_recursion_returns_unknown(self):
        code = (
            "def fib(n):\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    return fib(n - 1) + fib(n - 2)\n"
        )
        assert analyze_complexity(code) == "unknown"

    def test_invalid_syntax_returns_unknown(self):
        code = "def f(: this is not valid python"
        assert analyze_complexity(code) == "unknown"

    def test_no_function_returns_unknown(self):
        code = "x = 1 + 2"
        assert analyze_complexity(code) == "unknown"

    def test_multiple_functions_takes_worst(self):
        code = (
            "def simple(x): return x + 1\n"
            "\n"
            "def quadratic(nums):\n"
            "    for i in nums:\n"
            "        for j in nums:\n"
            "            pass\n"
        )
        assert analyze_complexity(code) == "O(n^2)"

    def test_triple_nested_loop_on3(self):
        code = (
            "def f(nums):\n"
            "    for i in nums:\n"
            "        for j in nums:\n"
            "            for k in nums:\n"
            "                pass\n"
        )
        assert analyze_complexity(code) == "O(n^3)"


class TestComplexityIsAcceptable:
    """Tests for complexity_is_acceptable."""

    def test_same_complexity_is_acceptable(self):
        assert complexity_is_acceptable("O(n)", "O(n)") is True

    def test_worse_detected_is_not_acceptable(self):
        assert complexity_is_acceptable("O(n^2)", "O(n)") is False

    def test_unknown_is_always_acceptable(self):
        assert complexity_is_acceptable("unknown", "O(n)") is True

    def test_better_detected_is_acceptable(self):
        assert complexity_is_acceptable("O(1)", "O(n)") is True

    def test_o1_acceptable_for_o1(self):
        assert complexity_is_acceptable("O(1)", "O(1)") is True

    def test_on_not_acceptable_for_o1(self):
        assert complexity_is_acceptable("O(n)", "O(1)") is False

    def test_on_log_n_acceptable_for_on2(self):
        assert complexity_is_acceptable("O(n log n)", "O(n^2)") is True
