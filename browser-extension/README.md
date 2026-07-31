# JobMates Apply Assistant

The extension is the browser-side part of Direct apply. A right swipe prepares
a short-lived application package, opens the employer application in a hidden
tab, fills the form, uploads the primary résumé, advances multi-step forms, and
submits when every required answer is known.

Unknown required questions are sent back to the open JobMates page. The answer
is saved to the user's JobMates answer bank and returned to the same hidden tab.
The employer tab becomes visible only for a portal login, CAPTCHA, unsupported
sensitive question, legal attestation, failed résumé upload, or portal
validation that cannot safely be resolved. Supported voluntary
self-identification fields can be filled only from answers the user explicitly
entered and authorized in JobMates.

The extension never receives the JobMates password. It does not create or reuse
employer passwords, guess or infer protected answers, bypass verification, or
accept legal terms for the user.

## Install locally

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select `/Users/shivani/JobMates/browser-extension`.
5. After every code update, click **Reload** on the extension card and refresh
   JobMates.
6. Keep JobMates open at `http://127.0.0.1:3000`.
7. Confirm **Direct apply** is enabled in the extension popup.
8. Complete **Settings → Application questionnaire**, including a primary
   résumé, then right-swipe a job.

## Portal coverage

The assistant uses a generic accessible-label matcher plus portal recognition
for Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Workable, iCIMS,
Jobvite, BambooHR, Breezy HR, Recruitee, Teamtailor, JazzHR, Rippling, UKG,
ADP, Taleo, SuccessFactors, Oracle Recruiting, Eightfold, Pinpoint, and
Personio. Employer-owned application domains are supported by injecting only
into the exact application tab created from a user swipe.

Portal markup and anti-automation checks change frequently. “Recognized” means
the extension can attempt the generic safe flow; it does not mean every tenant
or every application can be submitted without an exception.
