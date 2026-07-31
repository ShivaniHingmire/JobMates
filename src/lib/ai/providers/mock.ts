import {
  JobProfileSchema,
  MatchExplanationSchema,
  OutreachDraftSchema,
  ResumeProfileSchema,
  type JobProfile,
  type MatchEvidence,
  type MatchExplanation,
  type OutreachDraft,
  type OutreachInput,
  type ResumeProfile,
} from "@/lib/ai/contracts";
import type { AiProvider } from "@/lib/ai/provider";

function hashEmbedding(text: string) {
  const vector = Array.from({ length: 1536 }, (_, index) => {
    const code = text.charCodeAt(index % Math.max(text.length, 1)) || 0;
    return ((code * (index + 17)) % 997) / 997;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  return vector.map((value) => value / magnitude);
}

function truncateMessage(message: string, limit: number) {
  if (message.length <= limit) return message;
  return `${message.slice(0, limit - 1).trimEnd()}…`;
}

export class MockAiProvider implements AiProvider {
  async parseResume(
    text: string,
  ): Promise<ResumeProfile> {
    const skills = [
      "Product strategy",
      "User research",
      "Figma",
      "Analytics",
      "Design systems",
      "Accessibility",
      "TypeScript",
      "React",
      "Node.js",
      "API design",
      "SQL",
      "Python",
      "Data modeling",
      "React Native",
      "Cloud infrastructure",
      "Observability",
      "Security",
      "People management",
      "System design",
      "Mentoring",
      "Experimentation",
      "Roadmaps",
      "Operations",
      "Stakeholder management",
      "AI products",
      "Research planning",
      "Synthesis",
      "Content strategy",
      "UX writing",
      "Design operations",
      "Journey mapping",
      "Facilitation",
      "Program management",
      "Lifecycle marketing",
      "SEO",
      "Editorial planning",
      "Positioning",
      "Market research",
      "Sales enablement",
      "Copywriting",
      "Brand strategy",
      "Storytelling",
      "CRM",
      "Strategic planning",
      "Risk management",
      "Customer experience",
      "Communication",
      "Forecasting",
      "Research operations",
      "Vendor management",
    ].filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));

    return ResumeProfileSchema.parse({
      headline: "Cross-functional product professional",
      summary:
        "Evidence-led product experience spanning customer discovery, execution, and communication.",
      totalYearsExperience: null,
      seniority: "senior",
      roles: [],
      skills: skills.map((name) => ({
        name,
        years: null,
        confidence: 0.9,
        evidence: `${name} appears in the résumé.`,
      })),
      education: [],
      certifications: [],
      projects: [],
    });
  }

  async parseJob(text = ""): Promise<JobProfile> {
    const requiredLine = text.match(/Required skills:\s*([^.]*)/i)?.[1];
    const requiredSkills = requiredLine
      ? requiredLine.split(",").map((skill) => skill.trim()).filter(Boolean)
      : ["User research"];
    return JobProfileSchema.parse({
      summary: "A cross-functional role focused on measurable product outcomes.",
      seniority: "senior",
      minimumYearsExperience: null,
      skills: requiredSkills.map((name) => ({
          name,
          importance: "required",
          confidence: 0.9,
          evidence: `${name} is explicitly listed as required.`,
        })),
      responsibilities: ["Own outcomes for a focused product area"],
      education: [],
      workplaceType: "unknown",
      employmentType: "full-time",
    });
  }

  async embed(texts: string[]) {
    return texts.map(hashEmbedding);
  }

  async explainMatch(
    input: MatchEvidence,
  ): Promise<MatchExplanation> {
    return MatchExplanationSchema.parse({
      summary: `${input.matchedSkills.length} relevant strengths support this ${input.score}% résumé fit.`,
      strengths: input.matchedSkills.slice(0, 3),
      gaps: input.missingRequiredSkills.slice(0, 3),
      suggestedResumeFocus: input.resumeEvidence.slice(0, 2),
    });
  }

  async generateOutreach(
    input: OutreachInput,
  ): Promise<OutreachDraft> {
    const fact = input.sourceFacts[0];
    const greeting = input.recipientName
      ? `Hi ${input.recipientName},`
      : "Hello,";
    const email = `${greeting}\n\nI’m reaching out about the ${input.jobTitle} role at ${input.company}. ${fact} The role’s focus on ${input.matchedSkills.slice(0, 2).join(" and ")} feels closely connected to the problems I hope to keep working on.\n\nWhat caught my attention is the combination of clear ownership and cross-functional collaboration described in the posting. I would value the chance to learn how the team defines success in the first six months, what the most important current challenge looks like, and where this person can make an early contribution.\n\nIf my background may be useful, I would be glad to share more context and hear about the team’s priorities. I know your time is limited, so even a brief direction to the right person would be appreciated.\n\nThank you for considering my note.`;
    const connection = `${greeting} I’m exploring the ${input.jobTitle} role at ${input.company}. ${fact} I’d value connecting and following the team’s work.`;
    const followUp = `${greeting}\n\nI wanted to follow up about the ${input.jobTitle} role at ${input.company}. ${fact} The work around ${input.matchedSkills.slice(0, 2).join(" and ")} is especially relevant to my background. What would you say is the most important outcome for this role in its first six months? I’d appreciate any perspective you can share.`;
    return OutreachDraftSchema.parse({
      subject:
        input.channel === "email"
          ? `Interest in ${input.jobTitle} at ${input.company}`
          : null,
      body:
        input.channel === "email"
          ? email
          : input.channel === "linkedin_connection"
            ? truncateMessage(connection, 300)
            : truncateMessage(followUp, 600),
      usedFacts: [fact],
    });
  }
}
