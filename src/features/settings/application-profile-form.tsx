"use client";

import { Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  emptyEducationEntry,
  emptyEmploymentEntry,
  type ApplicationProfile,
  type EducationEntry,
  type EmploymentEntry,
} from "@/lib/application-profile";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 font-normal";
const textareaClass =
  "mt-2 min-h-28 w-full rounded-xl border border-line bg-white p-3 font-normal";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-line bg-paper/45 p-5">
      <legend className="px-2 font-display text-xl font-semibold">{title}</legend>
      <p className="mb-5 text-sm leading-6 text-muted">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function YesNo({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: boolean | null;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select
        name={name}
        className={inputClass}
        defaultValue={value === null ? "" : value ? "yes" : "no"}
      >
        <option value="">Choose</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

function IdentitySelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <select name={name} className={inputClass} defaultValue={value}>
        <option value="">Do not store an answer</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ApplicationProfileForm({
  profile,
}: {
  profile: ApplicationProfile;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [employment, setEmployment] = useState(profile.employmentHistory);
  const [education, setEducation] = useState(profile.educationHistory);

  const updateEmployment = (
    index: number,
    patch: Partial<EmploymentEntry>,
  ) => {
    setEmployment((entries) =>
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };
  const updateEducation = (index: number, patch: Partial<EducationEntry>) => {
    setEducation((entries) =>
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const answer = (name: string) => {
      const selected = value(name);
      return selected === "" ? null : selected === "yes";
    };
    const response = await fetch("/api/application-profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: value("firstName"),
        lastName: value("lastName"),
        preferredName: value("preferredName"),
        phone: value("phone"),
        addressLine1: value("addressLine1"),
        addressLine2: value("addressLine2"),
        city: value("city"),
        region: value("region"),
        postalCode: value("postalCode"),
        countryCode: value("countryCode").toUpperCase(),
        linkedinUrl: value("linkedinUrl"),
        websiteUrl: value("websiteUrl"),
        githubUrl: value("githubUrl"),
        currentTitle: value("currentTitle"),
        currentCompany: value("currentCompany"),
        yearsExperience: value("yearsExperience"),
        workAuthorized: answer("workAuthorized"),
        requiresSponsorship: answer("requiresSponsorship"),
        over18: answer("over18"),
        willingToRelocate: answer("willingToRelocate"),
        willingToTravel: answer("willingToTravel"),
        availableStartDate: value("availableStartDate"),
        noticePeriod: value("noticePeriod"),
        salaryExpectation: value("salaryExpectation"),
        salaryCurrency: value("salaryCurrency").toUpperCase(),
        referralSource: value("referralSource"),
        whyInterested: value("whyInterested"),
        proudAchievement: value("proudAchievement"),
        additionalInformation: value("additionalInformation"),
        employmentHistory: employment,
        educationHistory: education,
        demographicAnswers: {
          genderIdentity: value("genderIdentity"),
          transgenderIdentity: value("transgenderIdentity"),
          sexualOrientation: value("sexualOrientation"),
          raceEthnicity: form
            .getAll("raceEthnicity")
            .map((entry) => String(entry)),
          veteranStatus: value("veteranStatus"),
          disabilityStatus: value("disabilityStatus"),
          firstGenerationProfessional: value(
            "firstGenerationProfessional",
          ),
          governmentGender: value("governmentGender"),
          hispanicLatino: value("hispanicLatino"),
        },
        protectedDataConsent: form.get("protectedDataConsent") === "on",
        directApplyConsent: form.get("directApplyConsent") === "on",
      }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? "Application questionnaire saved. Future employer-specific answers will be added to your answer bank."
        : (result.message ??
            "Could not save. Make sure the latest Supabase migration is applied."),
    );
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Section
        title="Identity and contact"
        description="The legal and contact details most portals require."
      >
        <label className="text-sm font-bold">
          Legal first name
          <input
            name="firstName"
            required
            className={inputClass}
            defaultValue={profile.firstName}
            autoComplete="given-name"
          />
        </label>
        <label className="text-sm font-bold">
          Legal last name
          <input
            name="lastName"
            required
            className={inputClass}
            defaultValue={profile.lastName}
            autoComplete="family-name"
          />
        </label>
        <label className="text-sm font-bold">
          Preferred name
          <input
            name="preferredName"
            className={inputClass}
            defaultValue={profile.preferredName}
          />
        </label>
        <label className="text-sm font-bold">
          Account email
          <input
            className={`${inputClass} bg-paper text-muted`}
            value={profile.email}
            disabled
            readOnly
          />
        </label>
        <label className="text-sm font-bold">
          Phone
          <input
            name="phone"
            required
            className={inputClass}
            defaultValue={profile.phone}
            autoComplete="tel"
          />
        </label>
        <label className="text-sm font-bold">
          Country code
          <input
            name="countryCode"
            required
            maxLength={2}
            className={inputClass}
            defaultValue={profile.countryCode}
            autoComplete="country"
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Street address
          <input
            name="addressLine1"
            required
            className={inputClass}
            defaultValue={profile.addressLine1}
            autoComplete="address-line1"
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Address line 2
          <input
            name="addressLine2"
            className={inputClass}
            defaultValue={profile.addressLine2}
            autoComplete="address-line2"
          />
        </label>
        <label className="text-sm font-bold">
          City
          <input
            name="city"
            required
            className={inputClass}
            defaultValue={profile.city}
            autoComplete="address-level2"
          />
        </label>
        <label className="text-sm font-bold">
          State or region
          <input
            name="region"
            required
            className={inputClass}
            defaultValue={profile.region}
            autoComplete="address-level1"
          />
        </label>
        <label className="text-sm font-bold">
          Postal code
          <input
            name="postalCode"
            required
            className={inputClass}
            defaultValue={profile.postalCode}
            autoComplete="postal-code"
          />
        </label>
      </Section>

      <Section
        title="Professional profile"
        description="Reusable details for résumé, profile, and experience fields."
      >
        <label className="text-sm font-bold">
          Current or most recent title
          <input
            name="currentTitle"
            required
            className={inputClass}
            defaultValue={profile.currentTitle}
          />
        </label>
        <label className="text-sm font-bold">
          Current or most recent company
          <input
            name="currentCompany"
            className={inputClass}
            defaultValue={profile.currentCompany}
          />
        </label>
        <label className="text-sm font-bold">
          Total years of experience
          <input
            name="yearsExperience"
            required
            className={inputClass}
            defaultValue={profile.yearsExperience}
            placeholder="e.g. 4"
          />
        </label>
        <label className="text-sm font-bold">
          LinkedIn URL
          <input
            name="linkedinUrl"
            type="url"
            className={inputClass}
            defaultValue={profile.linkedinUrl}
            placeholder="https://linkedin.com/in/…"
          />
        </label>
        <label className="text-sm font-bold">
          Portfolio or website
          <input
            name="websiteUrl"
            type="url"
            className={inputClass}
            defaultValue={profile.websiteUrl}
            placeholder="https://…"
          />
        </label>
        <label className="text-sm font-bold">
          GitHub URL
          <input
            name="githubUrl"
            type="url"
            className={inputClass}
            defaultValue={profile.githubUrl}
            placeholder="https://github.com/…"
          />
        </label>
      </Section>

      <fieldset className="rounded-2xl border border-line bg-paper/45 p-5">
        <legend className="px-2 font-display text-xl font-semibold">
          Employment history
        </legend>
        <p className="mb-5 text-sm leading-6 text-muted">
          Add roles that a portal may require separately from your résumé.
        </p>
        <div className="space-y-4">
          {employment.map((entry, index) => (
            <div
              key={`employment-${index}`}
              className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2"
            >
              <label className="text-sm font-bold">
                Employer
                <input
                  className={inputClass}
                  value={entry.employer}
                  onChange={(event) =>
                    updateEmployment(index, { employer: event.target.value })
                  }
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Job title
                <input
                  className={inputClass}
                  value={entry.title}
                  onChange={(event) =>
                    updateEmployment(index, { title: event.target.value })
                  }
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Location
                <input
                  className={inputClass}
                  value={entry.location}
                  onChange={(event) =>
                    updateEmployment(index, { location: event.target.value })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">
                  Start
                  <input
                    type="month"
                    className={inputClass}
                    value={entry.startMonth}
                    onChange={(event) =>
                      updateEmployment(index, {
                        startMonth: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="text-sm font-bold">
                  End
                  <input
                    type="month"
                    className={inputClass}
                    value={entry.endMonth}
                    disabled={entry.current}
                    onChange={(event) =>
                      updateEmployment(index, { endMonth: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={entry.current}
                  onChange={(event) =>
                    updateEmployment(index, {
                      current: event.target.checked,
                      endMonth: event.target.checked ? "" : entry.endMonth,
                    })
                  }
                />
                I currently work here
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Responsibilities and achievements
                <textarea
                  className={textareaClass}
                  value={entry.summary}
                  onChange={(event) =>
                    updateEmployment(index, { summary: event.target.value })
                  }
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                className="justify-self-start text-brand"
                onClick={() =>
                  setEmployment((entries) =>
                    entries.filter((_, entryIndex) => entryIndex !== index),
                  )
                }
              >
                <Trash2 className="size-4" /> Remove role
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() =>
            setEmployment((entries) => [
              ...entries,
              { ...emptyEmploymentEntry },
            ])
          }
        >
          <Plus className="size-4" /> Add employment
        </Button>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-paper/45 p-5">
        <legend className="px-2 font-display text-xl font-semibold">
          Education
        </legend>
        <p className="mb-5 text-sm leading-6 text-muted">
          Add degrees or programs commonly requested by application portals.
        </p>
        <div className="space-y-4">
          {education.map((entry, index) => (
            <div
              key={`education-${index}`}
              className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2"
            >
              <label className="text-sm font-bold">
                School
                <input
                  className={inputClass}
                  value={entry.school}
                  onChange={(event) =>
                    updateEducation(index, { school: event.target.value })
                  }
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Degree
                <input
                  className={inputClass}
                  value={entry.degree}
                  onChange={(event) =>
                    updateEducation(index, { degree: event.target.value })
                  }
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Field of study
                <input
                  className={inputClass}
                  value={entry.fieldOfStudy}
                  onChange={(event) =>
                    updateEducation(index, {
                      fieldOfStudy: event.target.value,
                    })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">
                  Start year
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    className={inputClass}
                    value={entry.startYear}
                    onChange={(event) =>
                      updateEducation(index, { startYear: event.target.value })
                    }
                  />
                </label>
                <label className="text-sm font-bold">
                  End year
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    className={inputClass}
                    value={entry.endYear}
                    onChange={(event) =>
                      updateEducation(index, { endYear: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="justify-self-start text-brand"
                onClick={() =>
                  setEducation((entries) =>
                    entries.filter((_, entryIndex) => entryIndex !== index),
                  )
                }
              >
                <Trash2 className="size-4" /> Remove education
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() =>
            setEducation((entries) => [
              ...entries,
              { ...emptyEducationEntry },
            ])
          }
        >
          <Plus className="size-4" /> Add education
        </Button>
      </fieldset>

      <Section
        title="Eligibility and logistics"
        description="Answers frequently required before a portal will accept an application."
      >
        <YesNo
          name="over18"
          label="Are you at least 18?"
          value={profile.over18}
        />
        <YesNo
          name="workAuthorized"
          label="Authorized to work in your target country?"
          value={profile.workAuthorized}
        />
        <YesNo
          name="requiresSponsorship"
          label="Require employer sponsorship now or later?"
          value={profile.requiresSponsorship}
        />
        <p className="rounded-xl border border-line bg-white p-3 text-sm leading-6 text-muted sm:col-span-2">
          Choose Yes if an employer must start or sponsor an immigration or work
          permit case now or in the future, including an H-1B or another
          employment-based work permit.
        </p>
        <YesNo
          name="willingToRelocate"
          label="Willing to relocate?"
          value={profile.willingToRelocate}
        />
        <YesNo
          name="willingToTravel"
          label="Willing to travel for work?"
          value={profile.willingToTravel}
        />
        <label className="text-sm font-bold">
          Earliest start date
          <input
            name="availableStartDate"
            type="date"
            className={inputClass}
            defaultValue={profile.availableStartDate}
          />
        </label>
        <label className="text-sm font-bold">
          Notice period
          <input
            name="noticePeriod"
            className={inputClass}
            defaultValue={profile.noticePeriod}
            placeholder="e.g. Two weeks"
          />
        </label>
        <label className="text-sm font-bold">
          Salary expectation
          <input
            name="salaryExpectation"
            className={inputClass}
            defaultValue={profile.salaryExpectation}
            placeholder="e.g. 120000 or negotiable"
          />
        </label>
        <label className="text-sm font-bold">
          Salary currency
          <input
            name="salaryCurrency"
            required
            maxLength={3}
            className={inputClass}
            defaultValue={profile.salaryCurrency}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          How do you usually hear about roles?
          <input
            name="referralSource"
            className={inputClass}
            defaultValue={profile.referralSource}
            placeholder="e.g. Company careers page"
          />
        </label>
      </Section>

      <Section
        title="Voluntary self-identification"
        description="Optional and sensitive. JobMates never infers these answers or uses them for job ranking. Choose “Prefer not to answer” when you want JobMates to make that selection on required forms."
      >
        <IdentitySelect
          name="genderIdentity"
          label="Gender identity"
          value={profile.demographicAnswers.genderIdentity}
          options={[
            "Woman",
            "Man",
            "Non-binary",
            "Genderqueer or gender non-conforming",
            "Prefer not to answer",
          ]}
        />
        <IdentitySelect
          name="transgenderIdentity"
          label="Do you identify as transgender?"
          value={profile.demographicAnswers.transgenderIdentity}
          options={["Yes", "No", "Prefer not to answer"]}
        />
        <IdentitySelect
          name="sexualOrientation"
          label="Sexual orientation"
          value={profile.demographicAnswers.sexualOrientation}
          options={[
            "Straight or heterosexual",
            "Gay",
            "Lesbian",
            "Bisexual",
            "Queer",
            "Asexual",
            "Pansexual",
            "Prefer not to answer",
          ]}
        />
        <IdentitySelect
          name="firstGenerationProfessional"
          label="First-generation professional"
          value={profile.demographicAnswers.firstGenerationProfessional}
          options={["Yes", "No", "Prefer not to answer"]}
        />
        <div className="text-sm font-bold sm:col-span-2">
          Race or ethnicity — select all that apply
          <div className="mt-2 grid gap-2 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
            {[
              "American Indian or Alaska Native",
              "Asian",
              "Black or African American",
              "Hispanic, Latino, or Spanish origin",
              "Middle Eastern or North African",
              "Native Hawaiian or other Pacific Islander",
              "White",
              "Two or more races",
              "Prefer not to answer",
            ].map((option) => (
              <label
                key={option}
                className="flex items-start gap-2 font-normal"
              >
                <input
                  name="raceEthnicity"
                  type="checkbox"
                  value={option}
                  className="mt-1"
                  defaultChecked={profile.demographicAnswers.raceEthnicity.includes(
                    option,
                  )}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <IdentitySelect
          name="veteranStatus"
          label="Protected veteran status"
          value={profile.demographicAnswers.veteranStatus}
          options={[
            "I identify as one or more classifications of protected veteran",
            "I am not a protected veteran",
            "I do not wish to answer",
          ]}
        />
        <IdentitySelect
          name="disabilityStatus"
          label="Disability status"
          value={profile.demographicAnswers.disabilityStatus}
          options={[
            "Yes, I have a disability or have had one in the past",
            "No, I do not have a disability and have not had one in the past",
            "I do not wish to answer",
          ]}
        />
        <IdentitySelect
          name="governmentGender"
          label="Gender for government reporting"
          value={profile.demographicAnswers.governmentGender}
          options={["Female", "Male", "Non-binary", "I do not wish to answer"]}
        />
        <IdentitySelect
          name="hispanicLatino"
          label="Are you Hispanic or Latino?"
          value={profile.demographicAnswers.hispanicLatino}
          options={["Yes", "No", "I do not wish to answer"]}
        />
        <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 sm:col-span-2">
          <input
            name="protectedDataConsent"
            type="checkbox"
            className="mt-1"
            defaultChecked={profile.protectedDataConsent}
          />
          <span>
            <strong>Use my saved self-identification answers</strong>
            <br />
            I authorize JobMates to fill the choices above when an employer asks.
            If this is unchecked or a portal uses an unmatched choice, JobMates
            asks me inside the app before submitting.
          </span>
        </label>
      </Section>

      <Section
        title="Reusable written answers"
        description="JobMates uses these only when the wording fits. A job-specific question is sent back to you instead of being guessed."
      >
        <label className="text-sm font-bold sm:col-span-2">
          Why are you interested in this kind of role?
          <textarea
            name="whyInterested"
            className={textareaClass}
            defaultValue={profile.whyInterested}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Achievement or project you are proud of
          <textarea
            name="proudAchievement"
            className={textareaClass}
            defaultValue={profile.proudAchievement}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Additional information you commonly include
          <textarea
            name="additionalInformation"
            className={textareaClass}
            defaultValue={profile.additionalInformation}
          />
        </label>
      </Section>

      <label className="flex items-start gap-3 rounded-2xl border border-sage/30 bg-mint/60 p-4 text-sm leading-6">
        <input
          name="directApplyConsent"
          type="checkbox"
          required
          className="mt-1"
          defaultChecked={profile.directApplyConsent}
        />
        <span>
          <strong className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Enable direct apply
          </strong>
          I reviewed these details and authorize JobMates to use them when I
          right-swipe. JobMates will ask about unknown questions and will not
          infer demographic answers or complete CAPTCHA, login, or
          legal-attestation fields for me.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>
          <Save className="size-4" />
          {busy ? "Saving…" : "Save application questionnaire"}
        </Button>
        {message && (
          <p role="status" className="text-sm text-muted">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
