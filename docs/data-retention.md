# Data retention and deletion

Résumés are private until a user replaces or deletes them. The original object,
extracted text, structured profile, skill evidence, and embedding are retained
to power matches. Deleting a résumé cascades through résumé skills, match
analyses, and message drafts. Applications remain because they are the user’s
independent search record.

Account deletion removes résumé Storage objects first and then deletes the Auth
user. Database foreign keys cascade through all owned records.

Application logs must not contain original filenames, document text, prompts,
generated drafts, or free-form notes. Interaction event metadata is restricted
to non-PII product state.

OpenAI requests set `store: false` and include a keyed HMAC safety identifier when
configured. API data is not used for training by default, but abuse-monitoring
logs may be retained for up to 30 days under OpenAI’s standard API controls.
