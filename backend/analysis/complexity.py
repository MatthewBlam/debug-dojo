"""AST-based complexity analyzer for user-submitted code.

Uses Python's ast module to statically estimate time complexity
by walking the syntax tree and tracking loop nesting, sort calls,
and recursive function calls.
"""

import ast

# Ordered from best to worst complexity
COMPLEXITY_ORDER = [
    "O(1)",
    "O(log n)",
    "O(n)",
    "O(n log n)",
    "O(n^2)",
    "O(n^3)",
]


def _complexity_rank(label: str) -> int | None:
    """Return the index in COMPLEXITY_ORDER, or None if unknown."""
    try:
        return COMPLEXITY_ORDER.index(label)
    except ValueError:
        return None


def _worse(a: str, b: str) -> str:
    """Return whichever complexity is worse (higher rank). Unknown beats all known."""
    rank_a = _complexity_rank(a)
    rank_b = _complexity_rank(b)
    if rank_a is None:
        return a
    if rank_b is None:
        return b
    return a if rank_a >= rank_b else b


class _FunctionComplexityVisitor(ast.NodeVisitor):
    """Analyze a single function definition for time complexity."""

    def __init__(self, func_name: str) -> None:
        self.func_name = func_name
        self.loop_depth = 0
        self.max_loop_depth = 0
        self.has_sort_at_depth: int | None = None  # depth where sort was seen
        self.is_recursive = False

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        if node.name == self.func_name:
            self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        if node.name == self.func_name:
            self.generic_visit(node)

    def visit_For(self, node: ast.For) -> None:
        self.loop_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self.loop_depth)
        self.generic_visit(node)
        self.loop_depth -= 1

    def visit_While(self, node: ast.While) -> None:
        self.loop_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self.loop_depth)
        self.generic_visit(node)
        self.loop_depth -= 1

    def visit_Call(self, node: ast.Call) -> None:
        # Check for recursion: function calls itself
        if isinstance(node.func, ast.Name) and node.func.id == self.func_name:
            self.is_recursive = True

        # Check for sorted() built-in
        if isinstance(node.func, ast.Name) and node.func.id == "sorted":
            if self.has_sort_at_depth is None:
                self.has_sort_at_depth = self.loop_depth
            else:
                self.has_sort_at_depth = max(self.has_sort_at_depth, self.loop_depth)

        # Check for .sort() method call
        if isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
            if self.has_sort_at_depth is None:
                self.has_sort_at_depth = self.loop_depth
            else:
                self.has_sort_at_depth = max(self.has_sort_at_depth, self.loop_depth)

        self.generic_visit(node)

    def get_complexity(self) -> str:
        if self.is_recursive:
            return "recursive"

        # Start with loop-depth based complexity
        if self.max_loop_depth == 0:
            base = "O(1)"
        elif self.max_loop_depth == 1:
            base = "O(n)"
        elif self.max_loop_depth == 2:
            base = "O(n^2)"
        else:
            base = "O(n^3)"

        # Factor in sort calls
        if self.has_sort_at_depth is not None:
            sort_depth = self.has_sort_at_depth
            if sort_depth == 0:
                sort_complexity = "O(n log n)"
            elif sort_depth == 1:
                sort_complexity = "O(n^2)"
            else:
                sort_complexity = "O(n^3)"
            base = _worse(base, sort_complexity)

        return base


def analyze_complexity(code: str) -> str:
    """Analyze code and return estimated time complexity.

    Returns a known complexity label, 'recursive', or 'unknown'.
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return "unknown"

    worst = None

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            visitor = _FunctionComplexityVisitor(node.name)
            visitor.visit(node)
            result = visitor.get_complexity()
            if worst is None:
                worst = result
            else:
                worst = _worse(worst, result)

    # No function definitions found
    if worst is None:
        return "unknown"

    return worst


def complexity_is_acceptable(detected: str, target: str) -> bool:
    """Return True if detected complexity is at most as bad as target.

    'unknown' is always acceptable (benefit of the doubt).
    """
    if detected == "recursive":
        return False

    if detected == "unknown":
        return True

    detected_rank = _complexity_rank(detected)
    target_rank = _complexity_rank(target)

    # If either is not in our ordering, give benefit of the doubt
    if detected_rank is None or target_rank is None:
        return True

    return detected_rank <= target_rank
