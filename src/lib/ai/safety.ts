import "server-only";

import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

export function createSafetyIdentifier(userId?: string) {
  if (!userId || !env.SAFETY_IDENTIFIER_HMAC_SECRET) return undefined;
  return createHmac("sha256", env.SAFETY_IDENTIFIER_HMAC_SECRET)
    .update(userId)
    .digest("hex");
}
