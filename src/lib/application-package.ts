import { z } from "zod";
import {
  ApplicationProfileSchema,
  SavedApplicationAnswerSchema,
} from "@/lib/application-profile";

export const ApplicationPackageSchema = z.object({
  version: z.literal(1),
  packageId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  job: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    company: z.string().min(1),
    applyUrl: z.string().url(),
  }),
  applicant: ApplicationProfileSchema,
  answerBank: z.array(SavedApplicationAnswerSchema).max(500),
  resume: z
    .object({
      downloadUrl: z.string().url(),
      filename: z.string().min(1).max(255),
      mimeType: z.enum([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
    })
    .nullable(),
  missingFields: z.array(z.string()),
});

export type ApplicationPackage = z.infer<typeof ApplicationPackageSchema>;
