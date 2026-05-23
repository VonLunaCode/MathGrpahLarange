# Lagrange Engine Specification

## Purpose

Pure mathematical module that computes the Lagrange interpolation polynomial P(x) from a set of nodes, following the formula: P(x) = Σ f(xᵢ) · Lᵢ(x), where Lᵢ(x) = Π (x − xⱼ) / (xᵢ − xⱼ) for j ≠ i.

## Requirements

### Requirement: Evaluate Polynomial at a Point

The engine MUST expose a function that accepts an array of (x, y) nodes and a query value x, and returns P(x) as a number. The function MUST be pure (no side effects, no DOM access).

#### Scenario: Single node

- GIVEN one node at (2, 5)
- WHEN P(x) is evaluated at x = 2
- THEN the result MUST equal 5.0

#### Scenario: Three nodes — exact interpolation

- GIVEN nodes (0, 1), (1, 2.718), (2, 54.5198)
- WHEN P(x) is evaluated at x = 0, 1, and 2
- THEN the result at each node MUST equal the node's y-value (within floating-point tolerance 1e-9)

#### Scenario: Interpolated value between nodes

- GIVEN nodes (0, 1), (1, 2.718), (2, 54.5198)
- WHEN P(x) is evaluated at x = 0.5
- THEN a numeric result is returned (no error)

### Requirement: Cardinal Basis Function

The engine MUST compute each Lᵢ(x) as a product of (x − xⱼ) / (xᵢ − xⱼ) for all j ≠ i.

#### Scenario: Lᵢ evaluates to 1 at its own node

- GIVEN nodes x₀=0, x₁=1, x₂=2
- WHEN L₁(x) is evaluated at x = 1
- THEN the result MUST equal 1.0

#### Scenario: Lᵢ evaluates to 0 at other nodes

- GIVEN nodes x₀=0, x₁=1, x₂=2
- WHEN L₁(x) is evaluated at x = 0 or x = 2
- THEN the result MUST equal 0.0

### Requirement: Reject Fewer Than Two Nodes

The engine SHOULD return null (or an empty result) when fewer than 2 nodes are provided, since interpolation is undefined.

#### Scenario: Zero or one node

- GIVEN an array with 0 or 1 nodes
- WHEN evaluate is called
- THEN the function returns null
