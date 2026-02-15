# Language Semantics Specification (Prototype)

This document defines the **semantic rules** of the language used by the interpreter/solver. The language is intentionally small; many behaviors are specified to be *sound and deterministic* even when expressions remain unresolved.

The program’s entry point is the global variable `output`. Running a program means **reducing** `output` as much as possible and printing the result. “Reducing” may be partial: if an expression cannot be reduced further, it is printed in unreduced form while preserving all information.

---

## 0. Core Concepts

### 0.1 Values denote sets

Every expression denotes a **set of possible runtime values** (even “ordinary values” like `2` denote a singleton set). This is what makes types and values share one semantic space.

Three distinguished values:

* `()` (**ANY / Top**): the set of all values of all kinds.
* `!()` (**NEVER / Bottom**): the empty set.
* `nil`: a singleton null-like value.

### 0.2 Kinds (tagged universe)

Values live in a tagged disjoint union universe (kinds), at minimum:

* **i32**
* **nil**
* **scope** (with a fixed, closed set of fields / “shape”)
* **logical** values (`()` / `!()` and unresolved predicates that reduce to one of them)

Unions can contain mixed kinds (e.g. `2 | {}`), but some operations may yield `!()` on incompatible branches.

### 0.3 i32 arithmetic

Integers are **signed 32-bit** with wraparound overflow.

Example:

```ten
a = 2147483647 + 1
output = a
```

Printed result: `-2147483648`

---

## 1. Scopes, Bindings, and Immutability

### 1.1 Scope bodies

A scope body contains only **binding statements** (variable declarations/assignments) separated by commas or newlines.

Global (top-level) is also a scope.

### 1.2 Variables and fields are immutable

A binding can be constrained multiple times, but **repeating a binding is a user-facing error** (diagnostic), while semantics continues by intersecting constraints:

* Repeating `x = A` and `x = B` yields effective `x = A & B`.
* Repeating `x: T1` and `x: T2` yields effective `x: T1 & T2`.
* Same for fields: repeating `foo.a = A` and `foo.a = B` yields `foo.a = A & B`.

If the intersection is empty, the effective value becomes `!()`.

Example (repeat value binding):

```ten
x = 2
x = 2
output = x
```

Printed result: `2` (but emit diagnostic about duplicate binding of `x`)

Example (contradiction):

```ten
x = 2
x = 3
output = x
```

Printed result: `!()` (emit diagnostic)

### 1.3 Builtins scope

Scopes form a parent chain:

`builtins -> global -> nested user scopes (tree)`

* Builtins are regular bindings in the builtins scope (e.g. `int`, `nil`, `true`, `false`).
* Builtins can be shadowed/overwritten in global/user scopes.
* `^name` can be used to access the parent scope binding (so in global, `^int` refers to builtins `int`).

`nil`, `true`, and `false` are regular identifiers at parse time (not reserved lexer keywords). Their default meaning comes from builtins.

---

## 2. Name Resolution (Reads)

### 2.1 Reads never declare

A read of an identifier must resolve to an existing binding; otherwise it is a **semantic error** and reduces to `!()`.

### 2.2 Unprefixed lookup order

When reading `foo` inside a scope `S`:

1. Check `S`’s **immediate parent**, then its parent, … up to **global**, then **builtins**
2. If not found in any parent, check **current scope `S`**
3. If still not found: error + `!()`

This is intentionally “parent-first” (prevents shadowing by default).

Example:

```ten
a = 1
foo = {
    b = a
    a = 2
}
output = foo.b
```

Printed result: `1`

Because `a` read inside `foo` sees parent `a` first.

### 2.3 Explicit prefixes

* `.foo` reads **current scope only** (no parent search). If absent: error + `!()`.
* `^foo` reads **parent chain only** (skips current). If absent in parent chain: error + `!()`.

Examples:

```ten
a = 1
foo = {
    a = 2
    x = .a
    y = ^a
}
output = {x = foo.x, y = foo.y}
```

Printed result: `{x = 2, y = 1}`

---

## 3. Selectors and Closed Scopes

### 3.1 Scope values

A scope literal `{...}` denotes a **scope value** whose fields are the bindings defined inside it.

Scopes are **closed**:

* The set of fields is fixed by the scope’s definition.
* You cannot add fields later to an existing scope value.

### 3.2 Reading a field: `foo.bar`

To read `foo.bar`:

* Reduce `foo` enough to determine whether it can be a scope **with field `bar`**.
* If `foo` is (or can be) such a scope, reduce the field expression.
* Otherwise: **diagnostic + reduce to `!()`**.

When `foo` is a union, field access distributes and invalid branches become `!()`:

* `(A | B).bar == (A.bar) | (B.bar)`
* If `A` has no `.bar`, then `A.bar = !()` with a diagnostic.

Example:

```ten
x = ({a = 2} | {b = 3}).a
output = x
```

Printed result: `2`

Explanation: `({a=2}.a) | ({b=3}.a)` → `2 | !()` → `2` (diagnostic on missing field in `{b=3}` branch).

### 3.3 Writing a field: `foo.bar = v`

Field assignment is allowed only as a **simple selector LHS** (no computed LHS, no `(cond?x:y).a = ...`).

To write `foo.bar = v`:

* `foo` must be a **binding in the current scope** (writes do not target parents).
* `foo` must have an explicit **scope type** (via `foo: {...}`) and must not already have a finalized scope value.
* `bar` must be a declared field in that scope type.
* `bar` must not already be value-bound (otherwise duplicate binding rule applies: error + intersection).
* `v` must be compatible with the declared type of `bar` (may remain unresolved).

Example (valid):

```ten
foo: {a: int, b: int}
foo.a = 3
foo.b = 4
output = foo
```

Printed result: `{a = 3, b = 4}`

Example (invalid: writing to a scope value):

```ten
foo = {a = 3}
foo.b = 4
output = foo
```

Printed result: `!()` (diagnostic: cannot add field to closed scope value)

Example (invalid: write without explicit scope type):

```ten
foo = ()
foo.a = 3
output = foo
```

Printed result: `!()` (diagnostic)

---

## 4. Types, Values, and Compatibility

### 4.1 `x: T` is a constraint (membership)

`x: T` constrains `x` to values in set `T`.

* Multiple `:` constraints intersect: `x: T1, x: T2` ⇒ `x: T1 & T2` (diagnostic).
* `T` is an expression in the same semantic space.

### 4.2 `x = V` is also a constraint (equality / value restriction)

`x = V` constrains the value of `x` to set `V`.

* Multiple `=` constraints intersect: `x = A, x = B` ⇒ `x = A & B` (diagnostic).
* A value constraint also constrains the type: effectively `Type(x) := Type(x) & V`.

Practical consequence: `x = 2 | 3` means “x can be 2 or 3” (as a set), same as `x: 2 | 3`, but duplicates still diagnose.

### 4.3 Builtin `int`

`int` denotes the set of all i32 values:

`int = ... | -2 | -1 | 0 | 1 | 2 | ...`

So:

* `int & 3` = `3`
* `int & {}` = `!()`

If `int` is overwritten in a nested scope, it acts like any other binding.

Example:

```ten
int = 5
output = ^int
```

Printed result: `int` (the builtin `int` from builtins scope)

### 4.4 Compatibility checks

Whenever the interpreter can prove incompatibility (e.g. forcing `int & {}`), it yields `!()`.

If a value is unresolved, compatibility may be deferred, but the constraint must be preserved structurally.

---

## 5. Union and Intersection

### 5.1 Union: `A | B`

* Denotes set union.
* Kinds may differ.
* Simplifications:

  * `!() | A` ⇒ `A`
  * `A | !()` ⇒ `A`
  * `nil | A` stays explicit unless `A` already contains `nil`
  * `A | A` ⇒ `A`
* Operations distribute over `|` (lazily): applying an operation to a union yields a union of applying it to each branch.

Example:

```ten
a = 2 | 3
output = a + 1
```

Printed result: `3 | 4`

### 5.2 Intersection: `A & B`

* Denotes set intersection.
* If intersection is empty, result is `!()`.
* Does **not** throw; no error is required (except for duplicate-binding diagnostics and other semantic issues).
* Simplifications:

  * `!() & A` ⇒ `!()`
  * `() & A` ⇒ `A`
  * `nil & A` ⇒ `nil` iff `A` includes `nil`, otherwise `!()`
  * `A & A` ⇒ `A`
* Distributes over `|` (lazily) when beneficial:

  * `(A | B) & C` ⇒ `(A & C) | (B & C)` (then simplify)

### 5.3 Scope intersections

Two scopes intersect only if they have the **same closed field set** (“shape”). If shapes differ, the intersection is empty:

* `{a=2} & {b=3}` ⇒ `!()`

(There is no implicit “merge”; a merge operator/tool may exist later but is not part of this spec.)

---

## 6. Comparisons and Logical Values

### 6.1 Predicates reduce to `()` or `!()` when decidable

Comparisons like `<=`, `==` produce logical values:

* `()` if satisfiable/true under the current assumptions
* `!()` if unsatisfiable/false under the current assumptions
* or remain **unresolved predicate expressions** if not decidable yet

### 6.2 Narrowing via predicates

Predicates participate in narrowing through `&` and ternary (see below). In general:

* Solving is **order independent**:

  * `A & B & C` is equivalent to `C & B & A`

The interpreter must be able to propagate constraints **both ways** to a fixed point (or until stuck), at least through constructs in this language (not necessarily complete for all arithmetic, but must be sound).

Example (bidirectional through ternary):

```ten
foo = {
    a = int
    b = a == 1 ? 2 : 3
}
output = foo & (foo.a == 1)
```

Expected behavior: `foo.a == 1` implies `foo.b == 1` (since `b` is 2 only in the `a==1` branch), so the reduced output should be:

Printed result: `{a = 1, b = 2}`

If full reduction cannot be achieved (because the solver is too weak), it must still preserve a sound unresolved form, but this example is considered an important correctness target.

---

## 7. Ternary Operator

### 7.1 Semantic expansion

`cond ? if_true : if_false` denotes `(cond & if_true) | (!cond & if_false)`

### 7.2 Laziness requirement

Both branches must be evaluated **lazily** to avoid non-termination in recursive definitions. A branch should only be reduced when required by a read/propagation step.

Fib base case depends on this:

```ten
Fib = {
    n: int
    result = n <= 1
        ? n
        : Fib{n = n-1}.result + Fib{n = n-2}.result
}
output = Fib{n = 10}.result
```

Printed result: `55`

This must terminate despite recursion because the else branch is not forced when `n <= 2` holds.

---

## 8. Instantiation: `T{...}`

### 8.1 Meaning

`val = T{a = 3, b = 2}` is semantically equivalent to:

* `val: T`
* `val.a = 3`
* `val.b = 2`

The `{...}` inside `T{...}` is a **new scope** (so `.x` inside refers to the instantiated scope).

### 8.2 Reading sibling fields during instantiation

Assignments inside `T{...}` may reference other fields of the same instantiated scope using `.field`.

Example:

```ten
T = {a = 3, b: int}
val = T{b = .a + 2}
output = val.b
```

Printed result: `5`

### 8.3 Parent scope of instantiation (closure rule)

The parent scope of the `{...}` created by `T{...}` is the scope where `T` is **defined** (closure behavior), not where it is used.

This enables recursion and predictable capture.

---

## 9. Evaluation Model (Observable Semantics)

### 9.1 Two-phase per-scope processing

For a scope value/expression:

1. **Index phase:** collect all bindings in the scope body into a binding table, without evaluating RHS expressions. This makes out-of-order declarations deterministic.
2. **Reduction phase:** when a value is read (directly or indirectly by printing `output`), reduce only what is needed, lazily, possibly leaving residual unresolved expressions.

### 9.2 Unresolved results are valid outputs

If `output` cannot be fully reduced, the interpreter prints a structurally faithful expression (preserving unions, intersections, ternaries, predicates).

Example:

```ten
foo = {a = int, b = a == 1 ? 1 : 2}
output = foo
```

Printed result (one acceptable form): `{a = int, b = a == 1 ? 1 : 2}`

### 9.3 Narrowing can enable later resolution

Example demonstrating “preserve now, resolve later”:

```ten
foo = {a = int, b = a == 1 ? 1 : 2}
output = (foo.a == 1) & foo
```

Printed result: `{a = 1, b = 1}`

The constraint `(foo.a == 1)` restricts `foo` to a world where `a=1`, enabling `b` to reduce.

---

## 10. Errors vs `!()`

* **Semantic errors** produce diagnostics but evaluation continues.
* Many failures reduce to `!()`:

  * undefined variable reads
  * invalid selector reads (`foo` not a scope or missing field)
  * impossible intersections
  * illegal field writes

This allows the solver to keep reducing and potentially surface multiple issues.

---

## 11. Critical Edge Cases (Must Match)

### 11.1 Parent-first lookup (“no shadowing by default”)

```ten
a = 1
foo = {b = a, a = 2}
output = foo.b
```

Result: `1`

### 11.2 `.name` and `^name`

```ten
a = 1
foo = {a = 2, x = .a, y = ^a}
output = {x = foo.x, y = foo.y}
```

Result: `{x = 2, y = 1}`

### 11.3 Union projection with missing fields

```ten
x = ({a = 2} | {b = 3}).a
output = x
```

Result: `2` (diagnostic on `{b=3}.a`)

### 11.4 Scope shape intersection

```ten
output = {a = int} & {a = 3 | 2} & {a = 3}
```

Result: `{a = 3}`

### 11.5 Empty scope shape intersection

```ten
output = {a = 2} & {b = 3}
```

Result: `!()`

### 11.6 Wraparound arithmetic

```ten
output = 2147483647 + 1
```

Result: `-2147483648`

### 11.7 Lazy ternary prevents infinite recursion

(Fib example) result must be `55`.

### 11.8 Bidirectional constraint propagation through ternary

```ten
foo = {a = int, b = a == 1 ? 2 : 3}
output = foo & (foo.a == 1)
```

Result: `{a = 1, b = 2}`

### 11.9 Nil in recursive structures

```ten
Node = {value: int, next: Node | nil}

a = Node{value = 1, next = b}
b = Node{value = 2, next = c}
c = Node{value = 3, next = nil}

Sum = {
    node: Node
    value = node.next == nil
        ? node.value
        : node.value + Sum{node=node.next}.value
}

output = Sum{node=a}.value
```

Result: `6`

---

## Notes for Implementers (Non-prescriptive)

* The interpreter may represent unresolved expressions as nodes in a dependency graph and run a work-queue to a fixed point.
* Laziness is required: do not eagerly reduce both sides of unions/intersections/ternaries.
* Constraint propagation should be **order independent** and try to reach a stable reduced form, while allowing “stuck but sound” residual expressions when full resolution is impossible.
