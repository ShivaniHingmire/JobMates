import "server-only";

import mammoth from "mammoth";
import { extractText } from "unpdf";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export class ResumeFileError extends Error {
  constructor(
    public readonly code:
      | "FILE_TOO_LARGE"
      | "UNSUPPORTED_TYPE"
      | "INVALID_SIGNATURE"
      | "NO_TEXT"
      | "PARSE_FAILED",
    message: string,
  ) {
    super(message);
  }
}

export function validateResumeBytes(bytes: Uint8Array, mimeType: string) {
  if (bytes.byteLength > MAX_RESUME_BYTES) {
    throw new ResumeFileError(
      "FILE_TOO_LARGE",
      "Résumé files must be 5 MB or smaller.",
    );
  }
  if (!SUPPORTED_RESUME_TYPES.includes(mimeType as never)) {
    throw new ResumeFileError(
      "UNSUPPORTED_TYPE",
      "Upload a PDF or DOCX résumé.",
    );
  }

  const isPdf =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;
  const isDocx =
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (
    (mimeType === "application/pdf" && !isPdf) ||
    (mimeType !== "application/pdf" && !isDocx)
  ) {
    throw new ResumeFileError(
      "INVALID_SIGNATURE",
      "The file contents do not match its type.",
    );
  }
}

export async function extractResumeText(
  bytes: Uint8Array,
  mimeType: string,
) {
  validateResumeBytes(bytes, mimeType);
  try {
    let text: string;
    if (mimeType === "application/pdf") {
      const result = await extractText(bytes, { mergePages: true });
      text = result.text;
    } else {
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(bytes),
      });
      text = result.value;
    }

    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length < 200) {
      throw new ResumeFileError(
        "NO_TEXT",
        "We could not find enough selectable text. Upload a text-based PDF or DOCX.",
      );
    }
    return normalized;
  } catch (error) {
    if (error instanceof ResumeFileError) throw error;
    throw new ResumeFileError(
      "PARSE_FAILED",
      "This résumé could not be read. It may be protected or malformed.",
    );
  }
}
