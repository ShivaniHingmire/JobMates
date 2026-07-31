# ATS portal research and Direct apply matrix

Reviewed July 30, 2026. “Live sample” means a current public job or application
page was inspected. Public pages can differ from the final tenant-specific form
after the Apply button, so JobMates also uses runtime field discovery.

## Live samples reviewed

| ATS | Public sample | What the reusable model must cover |
| --- | --- | --- |
| Greenhouse | [Study.com application](https://boards.greenhouse.io/embed/job_app?token=4126095008) | Name, contact, résumé, preferred name, location, links, authorization, sponsorship, relocation, custom selects |
| Lever | [Global Commissioning application](https://jobs.lever.co/global-cxm/dbf8c34e-eade-407d-b9c6-81e5329afcc9/apply) | Full name, contact, résumé, location, current company, links, written responses, radio groups |
| Ashby | [Astronomer role](https://jobs.ashbyhq.com/astronomer/1d29fe9a-7351-4b82-9017-de16dc86382f) | JavaScript-rendered application, résumé, contact, links, employer questions |
| SmartRecruiters | [Experian role](https://jobs.smartrecruiters.com/Experian/744000130219594-software-engineer) | Apply-step navigation, contact/profile data, tenant questions |
| Workable | [Pavago role](https://apply.workable.com/pavago/j/BE57C76E5B) | Apply-step navigation, résumé/contact, screening questions |
| Jobvite | [Progress role](https://jobs.jobvite.com/progress/job/oT43yfwi) | Apply/apply-later navigation, account or verification exceptions, multi-step fields |
| iCIMS | [iCIMS role](https://careers.icims.com/benefits/jobs/6503) | Tenant-specific paths, account/login exception, multi-step history |
| Rippling ATS | [Advanced Navigation role](https://ats.rippling.com/es-ES/advanced-navigation/jobs/9f184825-11d4-47c2-a5d7-f81c2699dd55) | Locale paths, JavaScript rendering, résumé/contact and custom questions |
| UKG / UltiPro | [TCOM role](https://recruiting.ultipro.com/TCO1001TCOM/JobBoard/74e57e92-4355-44d7-8471-3c6eecfda9ef/OpportunityDetail?opportunityId=9e7ca9f8-5cee-4353-bf1f-a0817d6f909b) | Apply-step navigation, account/login exception, multi-step application |
| Breezy HR | [Canny application](https://canny.breezy.hr/p/78d00330158d/apply) | Direct `/apply` path, contact/résumé, custom questions, clear submission confirmation |

## Additional compatibility targets

These families are recognized by hostname and use the same runtime field
discovery. They still require live tenant-by-tenant regression fixtures before
being described as fully validated.

| ATS | Recognized host pattern | Expected exception |
| --- | --- | --- |
| Workday | `*.myworkdayjobs.com` | Account creation/login and deeply dynamic multi-step controls |
| BambooHR | `*.bamboohr.com` | Tenant-specific custom application layout |
| Recruitee | `*.recruitee.com` | JavaScript-rendered custom questions |
| Teamtailor | `*.teamtailor.com` | Employer branding/custom domains and consent steps |
| JazzHR | `*.applytojob.com` | Custom screening questions |
| ADP | `workforcenow.adp.com` | Account/login and multi-step application |
| Taleo | `*.taleo.net` | Account/login, legacy controls, multi-page flow |
| SAP SuccessFactors | `*.successfactors.com` | Account/login and tenant-specific controls |
| Oracle Recruiting | `*.oraclecloud.com` | Account/login and dynamic multi-step controls |
| Eightfold | `*.eightfold.ai` | Account/login and JavaScript-rendered controls |
| Pinpoint | `*.pinpointhq.com` | Custom questions and consent |
| Personio | `*.jobs.personio.com` | Contact/résumé and tenant questions |

## Shared safety behavior

- Direct apply runs only after the user completes and authorizes the JobMates
  application questionnaire.
- Blank required non-sensitive questions return to JobMates and become reusable
  saved answers.
- Explicitly supplied voluntary self-identification choices can be filled.
  CAPTCHA, portal login/password, legal attestations, and unsupported sensitive
  fields bring the exception tab forward.
- JobMates never treats a click as success. It records “applied” only after a
  recognizable portal confirmation is observed.
