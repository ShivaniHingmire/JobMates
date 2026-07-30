# AI evaluations

Production prompts and schemas are versioned independently:

- `resume-extract-v1`
- `job-extract-v1`
- `match-explanation-v1`
- `outreach-v1`
- deterministic scorer `hybrid-v1`

CI uses `MockAiProvider`. The checked-in corpus contains 30 synthetic pairs
across engineering, product, design, marketing, and operations. Real-model
evaluation runs weekly or manually in an isolated OpenAI project.

The beta gate is 100% schema-valid output or handled refusal, skill F1 of at
least 0.85, deterministic score invariants, traceability for every concrete
outreach claim, and zero invented employer, title, date, credential, or metric
in manual review. A prompt or model change needs before/after results and a
version increment.
