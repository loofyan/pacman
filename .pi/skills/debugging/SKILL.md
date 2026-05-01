---
name: debugging
description: Systematically debug issues using the scientific method. Use when diagnosing bugs, unexpected behavior, or production incidents. Enforces single-thesis iteration and minimal fixes.
---

# Debugging Skill

Follow this strict protocol for every debugging session.

## Protocol

### Phase 1 — Observe

1. Briefly restate the observed symptom in one or two sentences.
2. Create or confirm a reliable reproduction (minimal test case, repro script, or step-by-step reproduction).
   - The reproduction must fail before the fix and pass after.

### Phase 2 — Thesis

3. Propose **exactly one** concrete thesis for the root cause.
   - Write it as: "Thesis N: [cause] because [evidence]."
4. Validate it using the **cheapest reliable** method:
   - Unit test (fastest)
   - Integration test
   - Assertion in existing test
   - Lightweight instrumentation (logging, print statement)
   - Minimal reproduction script
   - *Pick the method that gives the most signal for the least cost.*
5. Run the validation.
6. Log the result:
   ```
   Thesis N: [cause]
   Validation: [method]  →  [supported / not supported]
   ```

#### If supported

7. Make the **smallest possible fix** — a single-line edit if that suffices.
8. Re-run the validation.
9. Add or update a regression test.

#### If not supported

10. Discard the thesis. Move to the next one.

### Phase 3 — Repeat

11. Do **not** combine multiple hypotheses in one iteration.
12. **Avoid broad refactors** during debugging.
13. If several theses fail consecutively (≥ 3), pause and summarise the strongest remaining explanations before continuing.
14. Remove all temporary debug code (instrumentation, prints, commented-out blocks) **before finishing**.

### Phase 4 — Report

End with a short report:

| Item | Content |
|------|---------|
| **Reproduction** | Steps or test that reliably reproduces the bug |
| **Theses tested** | List in order: "N. [cause] → [result]" |
| **Tests added / changed** | Names or paths of regression / updated tests |
| **Confirmed root cause** | The thesis that was validated |
| **Remaining uncertainty** | What is still unknown or assumed |

## Tips

- Always write the reproduction test **before** the fix.
- If the fix doesn't change the reproduction outcome, your root cause is still wrong.
- Prefer `vitest` / `jest` assertions over console logging when possible.
- When the bug is in a library or external dependency, note the version and file path.
