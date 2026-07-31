import { NextResponse } from "next/server";
import { EditableApplicationProfileSchema } from "@/lib/application-profile";
import { getApplicationProfile } from "@/lib/application-profile.server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const nullable = (value: string) => value || null;

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    data: await getApplicationProfile(user),
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = EditableApplicationProfileSchema.safeParse(
    await request.json(),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        message: parsed.error.issues[0]?.message ?? "Check the form fields.",
      },
      { status: 400 },
    );
  if (user.isDemo) return NextResponse.json({ ok: true });

  const profile = parsed.data;
  const {
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    region,
    postalCode,
    countryCode,
    linkedinUrl,
    websiteUrl,
    workAuthorized,
    requiresSponsorship,
    ...applicationProfileData
  } = profile;
  const supabase = await createClient();
  const { error } = await supabase!
    .from("profiles")
    .update({
      legal_first_name: firstName,
      legal_last_name: lastName,
      phone_number: nullable(phone),
      address_line_1: nullable(addressLine1),
      address_line_2: nullable(addressLine2),
      city: nullable(city),
      region: nullable(region),
      postal_code: nullable(postalCode),
      country_code: countryCode,
      linkedin_url: nullable(linkedinUrl),
      website_url: nullable(websiteUrl),
      work_authorized: workAuthorized,
      requires_sponsorship: requiresSponsorship,
      application_profile_data: applicationProfileData,
    })
    .eq("id", user.id);
  if (error)
    return NextResponse.json({ ok: false, code: "RETRYABLE" }, { status: 503 });

  return NextResponse.json({ ok: true });
}
