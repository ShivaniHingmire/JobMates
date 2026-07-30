import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: "demo-user",
      email: "demo@jobmates.app",
      displayName: "Alex Morgan",
      isDemo: true,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase!.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "Job seeker";
  return {
    id: data.claims.sub,
    email,
    displayName: email.split("@")[0],
    isDemo: false,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
