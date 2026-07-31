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

Application questionnaire data and reusable employer-question answers are
stored in user-owned rows until updated or the account is deleted. When a user
explicitly starts an application, JobMates can issue a 30-minute application
package to the optional browser extension. It contains the selected job, the
user-managed application profile and answer bank, and a short-lived signed URL
for the primary résumé. The extension stores each package only in browser
session storage and fills the exact application tab created by that swipe.
Unknown ordinary questions return to JobMates and their answers are saved.
Voluntary self-identification answers are stored only when the user enters them
and are used only when the user separately enables protected-data autofill.
JobMates never infers these answers or adds one-time protected responses to the
general answer bank. Verification, unsupported sensitive questions,
attestations, portal login, and unsafe validation exceptions bring the employer
tab forward.

JobMates does not store employer-portal passwords or reuse a JobMates password on
third-party sites.

OpenAI requests set `store: false` and include a keyed HMAC safety identifier when
configured. API data is not used for training by default, but abuse-monitoring
logs may be retained for up to 30 days under OpenAI’s standard API controls.
