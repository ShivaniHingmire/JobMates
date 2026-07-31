import "server-only";

import type { AppUser } from "@/lib/auth";
import {
  ApplicationProfileSchema,
  emptyDemographicAnswers,
  type ApplicationProfile,
} from "@/lib/application-profile";
import { createClient } from "@/lib/supabase/server";

function splitName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function applicationDefaults(): Omit<
  ApplicationProfile,
  "firstName" | "lastName" | "email"
> {
  return {
    preferredName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "US",
    linkedinUrl: "",
    websiteUrl: "",
    githubUrl: "",
    currentTitle: "",
    currentCompany: "",
    yearsExperience: "",
    workAuthorized: null,
    requiresSponsorship: null,
    over18: null,
    willingToRelocate: null,
    willingToTravel: null,
    availableStartDate: "",
    noticePeriod: "",
    salaryExpectation: "",
    salaryCurrency: "USD",
    referralSource: "",
    whyInterested: "",
    proudAchievement: "",
    additionalInformation: "",
    employmentHistory: [],
    educationHistory: [],
    demographicAnswers: { ...emptyDemographicAnswers },
    protectedDataConsent: false,
    directApplyConsent: false,
  };
}

interface StoredProfileRow {
  display_name: string | null;
  legal_first_name: string | null;
  legal_last_name: string | null;
  phone_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  work_authorized: boolean | null;
  requires_sponsorship: boolean | null;
  application_profile_data?: unknown;
}

export async function getApplicationProfile(
  user: AppUser,
): Promise<ApplicationProfile> {
  const fallbackName = splitName(user.displayName);
  if (user.isDemo)
    return {
      ...applicationDefaults(),
      ...fallbackName,
      email: user.email,
      city: "New York",
      region: "NY",
      currentTitle: "Product Designer",
      currentCompany: "Independent",
      yearsExperience: "4",
      directApplyConsent: true,
    };

  const supabase = await createClient();
  const extended = await supabase!
    .from("profiles")
    .select(
      "display_name,legal_first_name,legal_last_name,phone_number,address_line_1,address_line_2,city,region,postal_code,country_code,linkedin_url,website_url,work_authorized,requires_sponsorship,application_profile_data",
    )
    .eq("id", user.id)
    .single();
  let data = extended.data as StoredProfileRow | null;
  if (extended.error) {
    const legacy = await supabase!
      .from("profiles")
      .select(
        "display_name,legal_first_name,legal_last_name,phone_number,address_line_1,address_line_2,city,region,postal_code,country_code,linkedin_url,website_url,work_authorized,requires_sponsorship",
      )
      .eq("id", user.id)
      .single();
    data = legacy.data as StoredProfileRow | null;
  }

  const storedName = splitName(data?.display_name ?? user.displayName);
  const storedApplicationData =
    data?.application_profile_data &&
    typeof data.application_profile_data === "object" &&
    !Array.isArray(data.application_profile_data)
      ? data.application_profile_data
      : {};
  const candidate = {
    ...applicationDefaults(),
    ...storedApplicationData,
    firstName: data?.legal_first_name ?? storedName.firstName,
    lastName: data?.legal_last_name ?? storedName.lastName,
    email: user.email,
    phone: data?.phone_number ?? "",
    addressLine1: data?.address_line_1 ?? "",
    addressLine2: data?.address_line_2 ?? "",
    city: data?.city ?? "",
    region: data?.region ?? "",
    postalCode: data?.postal_code ?? "",
    countryCode: data?.country_code ?? "US",
    linkedinUrl: data?.linkedin_url ?? "",
    websiteUrl: data?.website_url ?? "",
    workAuthorized: data?.work_authorized ?? null,
    requiresSponsorship: data?.requires_sponsorship ?? null,
  };
  const parsed = ApplicationProfileSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  return {
    ...applicationDefaults(),
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: user.email,
    phone: candidate.phone,
    addressLine1: candidate.addressLine1,
    addressLine2: candidate.addressLine2,
    city: candidate.city,
    region: candidate.region,
    postalCode: candidate.postalCode,
    countryCode: candidate.countryCode,
    linkedinUrl: candidate.linkedinUrl,
    websiteUrl: candidate.websiteUrl,
    workAuthorized: candidate.workAuthorized,
    requiresSponsorship: candidate.requiresSponsorship,
  };
}
