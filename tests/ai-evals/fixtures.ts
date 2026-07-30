const domains = {
  engineering: [
    ["Frontend Engineer", ["TypeScript", "React", "Accessibility"]],
    ["Backend Engineer", ["SQL", "Node.js", "API design"]],
    ["Data Engineer", ["SQL", "Python", "Data modeling"]],
    ["Mobile Engineer", ["TypeScript", "React Native", "Accessibility"]],
    ["Platform Engineer", ["Cloud infrastructure", "Observability", "Security"]],
    ["Engineering Manager", ["People management", "System design", "Mentoring"]],
  ],
  product: [
    ["Product Manager", ["Product strategy", "Analytics", "User research"]],
    ["Growth Product Manager", ["Experimentation", "Analytics", "Roadmaps"]],
    ["Technical Product Manager", ["API design", "Product strategy", "SQL"]],
    ["Product Operations Lead", ["Operations", "Analytics", "Stakeholder management"]],
    ["AI Product Manager", ["AI products", "User research", "Product strategy"]],
    ["Product Lead", ["Roadmaps", "Product strategy", "People management"]],
  ],
  design: [
    ["Product Designer", ["Figma", "User research", "Design systems"]],
    ["UX Researcher", ["User research", "Research planning", "Synthesis"]],
    ["Content Designer", ["Content strategy", "UX writing", "User research"]],
    ["Design Systems Lead", ["Design systems", "Figma", "Accessibility"]],
    ["Service Designer", ["Journey mapping", "User research", "Facilitation"]],
    ["Design Program Manager", ["Program management", "Design operations", "Stakeholder management"]],
  ],
  marketing: [
    ["Growth Marketer", ["Experimentation", "Analytics", "Lifecycle marketing"]],
    ["Content Strategist", ["Content strategy", "SEO", "Editorial planning"]],
    ["Product Marketing Manager", ["Positioning", "Market research", "Sales enablement"]],
    ["Lifecycle Marketer", ["Lifecycle marketing", "Analytics", "Copywriting"]],
    ["Brand Strategist", ["Brand strategy", "Market research", "Storytelling"]],
    ["Marketing Operations Lead", ["Operations", "Analytics", "CRM"]],
  ],
  operations: [
    ["Business Operations Manager", ["Operations", "Analytics", "Strategic planning"]],
    ["Program Manager", ["Program management", "Stakeholder management", "Risk management"]],
    ["Customer Operations Lead", ["Operations", "Customer experience", "People management"]],
    ["Chief of Staff", ["Strategic planning", "Stakeholder management", "Communication"]],
    ["Revenue Operations Manager", ["CRM", "Analytics", "Forecasting"]],
    ["Research Operations Manager", ["Research operations", "Program management", "Vendor management"]],
  ],
} as const;

export const evaluationFixtures = Object.entries(domains).flatMap(
  ([domain, roles]) =>
    roles.map(([title, requiredSkills], index) => ({
      id: `${domain}-${index + 1}`,
      domain,
      resumeText: `Candidate for ${title}. Demonstrated experience with ${requiredSkills[0]} and ${requiredSkills[1]}.`,
      jobText: `${title}. Required skills: ${requiredSkills.join(", ")}. This is a full-time role.`,
      expectedResumeSkills: requiredSkills.slice(0, 2),
      expectedRequiredSkills: [...requiredSkills],
      expectedMissingSkills: requiredSkills.slice(2),
    })),
);
