import { z } from "zod";

export const JOB_CATEGORIES = ["ai", "tech", "software"] as const;
export const JobCategorySchema = z.enum(JOB_CATEGORIES);
export type JobCategory = z.infer<typeof JobCategorySchema>;

export const ATS_PROVIDERS = ["greenhouse", "ashby", "lever"] as const;
export const AtsProviderSchema = z.enum(ATS_PROVIDERS);
export type AtsProvider = z.infer<typeof AtsProviderSchema>;

export interface CuratedCompany {
  slug: string;
  name: string;
  category: JobCategory;
  provider: AtsProvider;
  token: string;
  websiteUrl: string;
}

/**
 * A deliberately small, auditable registry of prominent AI and software
 * employers. The bootstrap command validates every public ATS feed before
 * enabling it, so a renamed or retired board never becomes a fake listing.
 */
export const CURATED_COMPANIES = [
  { slug: "openai", name: "OpenAI", category: "ai", provider: "ashby", token: "openai", websiteUrl: "https://openai.com" },
  { slug: "anthropic", name: "Anthropic", category: "ai", provider: "greenhouse", token: "anthropic", websiteUrl: "https://anthropic.com" },
  { slug: "scale-ai", name: "Scale AI", category: "ai", provider: "greenhouse", token: "scaleai", websiteUrl: "https://scale.com" },
  { slug: "cohere", name: "Cohere", category: "ai", provider: "ashby", token: "cohere", websiteUrl: "https://cohere.com" },
  { slug: "perplexity", name: "Perplexity", category: "ai", provider: "ashby", token: "perplexity", websiteUrl: "https://perplexity.ai" },
  { slug: "cursor", name: "Cursor", category: "ai", provider: "ashby", token: "cursor", websiteUrl: "https://cursor.com" },
  { slug: "together-ai", name: "Together AI", category: "ai", provider: "greenhouse", token: "togetherai", websiteUrl: "https://together.ai" },
  { slug: "runway", name: "Runway", category: "ai", provider: "ashby", token: "runway", websiteUrl: "https://runwayml.com" },
  { slug: "fireworks-ai", name: "Fireworks AI", category: "ai", provider: "greenhouse", token: "fireworksai", websiteUrl: "https://fireworks.ai" },
  { slug: "coreweave", name: "CoreWeave", category: "ai", provider: "greenhouse", token: "coreweave", websiteUrl: "https://coreweave.com" },
  { slug: "google-deepmind", name: "Google DeepMind", category: "ai", provider: "greenhouse", token: "deepmind", websiteUrl: "https://deepmind.google" },
  { slug: "nuro", name: "Nuro", category: "ai", provider: "greenhouse", token: "nuro", websiteUrl: "https://nuro.ai" },
  { slug: "vectara", name: "Vectara", category: "ai", provider: "greenhouse", token: "vectara", websiteUrl: "https://vectara.com" },
  { slug: "descript", name: "Descript", category: "ai", provider: "greenhouse", token: "descript", websiteUrl: "https://descript.com" },
  { slug: "pinecone", name: "Pinecone", category: "ai", provider: "ashby", token: "pinecone", websiteUrl: "https://pinecone.io" },
  { slug: "langchain", name: "LangChain", category: "ai", provider: "ashby", token: "langchain", websiteUrl: "https://langchain.com" },
  { slug: "modal", name: "Modal", category: "ai", provider: "ashby", token: "modal", websiteUrl: "https://modal.com" },
  { slug: "replit", name: "Replit", category: "ai", provider: "ashby", token: "replit", websiteUrl: "https://replit.com" },
  { slug: "elevenlabs", name: "ElevenLabs", category: "ai", provider: "ashby", token: "elevenlabs", websiteUrl: "https://elevenlabs.io" },
  { slug: "lovable", name: "Lovable", category: "ai", provider: "ashby", token: "lovable", websiteUrl: "https://lovable.dev" },
  { slug: "mercor", name: "Mercor", category: "ai", provider: "ashby", token: "mercor", websiteUrl: "https://mercor.com" },
  { slug: "sierra", name: "Sierra", category: "ai", provider: "ashby", token: "sierra", websiteUrl: "https://sierra.ai" },
  { slug: "harvey", name: "Harvey", category: "ai", provider: "ashby", token: "harvey", websiteUrl: "https://harvey.ai" },
  { slug: "glean", name: "Glean", category: "ai", provider: "greenhouse", token: "gleanwork", websiteUrl: "https://glean.com" },
  { slug: "anduril", name: "Anduril", category: "ai", provider: "greenhouse", token: "andurilindustries", websiteUrl: "https://anduril.com" },
  { slug: "shield-ai", name: "Shield AI", category: "ai", provider: "lever", token: "shieldai", websiteUrl: "https://shield.ai" },
  { slug: "character-ai", name: "Character.AI", category: "ai", provider: "ashby", token: "character", websiteUrl: "https://character.ai" },
  { slug: "waymo", name: "Waymo", category: "ai", provider: "greenhouse", token: "waymo", websiteUrl: "https://waymo.com" },
  { slug: "anyscale", name: "Anyscale", category: "ai", provider: "ashby", token: "anyscale", websiteUrl: "https://anyscale.com" },
  { slug: "saronic", name: "Saronic", category: "ai", provider: "ashby", token: "Saronic", websiteUrl: "https://saronic.com" },
  { slug: "crusoe", name: "Crusoe", category: "ai", provider: "ashby", token: "Crusoe", websiteUrl: "https://crusoe.ai" },
  { slug: "poolside", name: "Poolside", category: "ai", provider: "ashby", token: "poolside", websiteUrl: "https://poolside.ai" },
  { slug: "cognition", name: "Cognition", category: "ai", provider: "ashby", token: "cognition", websiteUrl: "https://cognition.ai" },
  { slug: "decagon", name: "Decagon", category: "ai", provider: "ashby", token: "decagon", websiteUrl: "https://decagon.ai" },

  { slug: "airbnb", name: "Airbnb", category: "tech", provider: "greenhouse", token: "airbnb", websiteUrl: "https://airbnb.com" },
  { slug: "stripe", name: "Stripe", category: "tech", provider: "greenhouse", token: "stripe", websiteUrl: "https://stripe.com" },
  { slug: "doordash", name: "DoorDash", category: "tech", provider: "greenhouse", token: "doordashusa", websiteUrl: "https://doordash.com" },
  { slug: "coinbase", name: "Coinbase", category: "tech", provider: "greenhouse", token: "coinbase", websiteUrl: "https://coinbase.com" },
  { slug: "robinhood", name: "Robinhood", category: "tech", provider: "greenhouse", token: "robinhood", websiteUrl: "https://robinhood.com" },
  { slug: "pinterest", name: "Pinterest", category: "tech", provider: "greenhouse", token: "pinterest", websiteUrl: "https://pinterest.com" },
  { slug: "lyft", name: "Lyft", category: "tech", provider: "greenhouse", token: "lyft", websiteUrl: "https://lyft.com" },
  { slug: "discord", name: "Discord", category: "tech", provider: "greenhouse", token: "discord", websiteUrl: "https://discord.com" },
  { slug: "twitch", name: "Twitch", category: "tech", provider: "greenhouse", token: "twitch", websiteUrl: "https://twitch.tv" },
  { slug: "figma", name: "Figma", category: "tech", provider: "greenhouse", token: "figma", websiteUrl: "https://figma.com" },
  { slug: "notion", name: "Notion", category: "tech", provider: "ashby", token: "notion", websiteUrl: "https://notion.so" },
  { slug: "ramp", name: "Ramp", category: "tech", provider: "ashby", token: "ramp", websiteUrl: "https://ramp.com" },
  { slug: "plaid", name: "Plaid", category: "tech", provider: "ashby", token: "plaid", websiteUrl: "https://plaid.com" },
  { slug: "brex", name: "Brex", category: "tech", provider: "greenhouse", token: "brex", websiteUrl: "https://brex.com" },
  { slug: "gusto", name: "Gusto", category: "tech", provider: "greenhouse", token: "gusto", websiteUrl: "https://gusto.com" },
  { slug: "wealthsimple", name: "Wealthsimple", category: "tech", provider: "ashby", token: "wealthsimple", websiteUrl: "https://wealthsimple.com" },
  { slug: "airwallex", name: "Airwallex", category: "tech", provider: "ashby", token: "airwallex", websiteUrl: "https://airwallex.com" },
  { slug: "instacart", name: "Instacart", category: "tech", provider: "greenhouse", token: "instacart", websiteUrl: "https://instacart.com" },
  { slug: "cloudflare", name: "Cloudflare", category: "tech", provider: "greenhouse", token: "cloudflare", websiteUrl: "https://cloudflare.com" },
  { slug: "datadog", name: "Datadog", category: "tech", provider: "greenhouse", token: "datadog", websiteUrl: "https://datadoghq.com" },
  { slug: "vercel", name: "Vercel", category: "tech", provider: "greenhouse", token: "vercel", websiteUrl: "https://vercel.com" },
  { slug: "supabase", name: "Supabase", category: "tech", provider: "ashby", token: "supabase", websiteUrl: "https://supabase.com" },
  { slug: "linear", name: "Linear", category: "tech", provider: "ashby", token: "linear", websiteUrl: "https://linear.app" },
  { slug: "render", name: "Render", category: "tech", provider: "ashby", token: "render", websiteUrl: "https://render.com" },
  { slug: "railway", name: "Railway", category: "tech", provider: "ashby", token: "railway", websiteUrl: "https://railway.com" },
  { slug: "neon", name: "Neon", category: "tech", provider: "lever", token: "neon", websiteUrl: "https://neon.com" },
  { slug: "spacex", name: "SpaceX", category: "tech", provider: "greenhouse", token: "spacex", websiteUrl: "https://spacex.com" },
  { slug: "lucid-motors", name: "Lucid Motors", category: "tech", provider: "greenhouse", token: "lucidmotors", websiteUrl: "https://lucidmotors.com" },
  { slug: "faire", name: "Faire", category: "tech", provider: "greenhouse", token: "faire", websiteUrl: "https://faire.com" },
  { slug: "samsara", name: "Samsara", category: "tech", provider: "greenhouse", token: "samsara", websiteUrl: "https://samsara.com" },
  { slug: "reddit", name: "Reddit", category: "tech", provider: "greenhouse", token: "reddit", websiteUrl: "https://redditinc.com" },
  { slug: "roblox", name: "Roblox", category: "tech", provider: "greenhouse", token: "roblox", websiteUrl: "https://roblox.com" },
  { slug: "chime", name: "Chime", category: "tech", provider: "greenhouse", token: "chime", websiteUrl: "https://chime.com" },

  { slug: "databricks", name: "Databricks", category: "software", provider: "greenhouse", token: "databricks", websiteUrl: "https://databricks.com" },
  { slug: "snowflake", name: "Snowflake", category: "software", provider: "ashby", token: "snowflake", websiteUrl: "https://snowflake.com" },
  { slug: "confluent", name: "Confluent", category: "software", provider: "ashby", token: "confluent", websiteUrl: "https://confluent.io" },
  { slug: "elastic", name: "Elastic", category: "software", provider: "greenhouse", token: "elastic", websiteUrl: "https://elastic.co" },
  { slug: "gitlab", name: "GitLab", category: "software", provider: "greenhouse", token: "gitlab", websiteUrl: "https://gitlab.com" },
  { slug: "fivetran", name: "Fivetran", category: "software", provider: "greenhouse", token: "fivetran", websiteUrl: "https://fivetran.com" },
  { slug: "grafana-labs", name: "Grafana Labs", category: "software", provider: "greenhouse", token: "grafanalabs", websiteUrl: "https://grafana.com" },
  { slug: "postman", name: "Postman", category: "software", provider: "greenhouse", token: "postman", websiteUrl: "https://postman.com" },
  { slug: "airtable", name: "Airtable", category: "software", provider: "greenhouse", token: "airtable", websiteUrl: "https://airtable.com" },
  { slug: "webflow", name: "Webflow", category: "software", provider: "greenhouse", token: "webflow", websiteUrl: "https://webflow.com" },
  { slug: "pagerduty", name: "PagerDuty", category: "software", provider: "greenhouse", token: "pagerduty", websiteUrl: "https://pagerduty.com" },
  { slug: "tailscale", name: "Tailscale", category: "software", provider: "greenhouse", token: "tailscale", websiteUrl: "https://tailscale.com" },
  { slug: "launchdarkly", name: "LaunchDarkly", category: "software", provider: "greenhouse", token: "launchdarkly", websiteUrl: "https://launchdarkly.com" },
  { slug: "cockroach-labs", name: "Cockroach Labs", category: "software", provider: "greenhouse", token: "cockroachlabs", websiteUrl: "https://cockroachlabs.com" },
  { slug: "planetscale", name: "PlanetScale", category: "software", provider: "greenhouse", token: "planetscale", websiteUrl: "https://planetscale.com" },
  { slug: "calendly", name: "Calendly", category: "software", provider: "greenhouse", token: "calendly", websiteUrl: "https://calendly.com" },
  { slug: "dropbox", name: "Dropbox", category: "software", provider: "greenhouse", token: "dropbox", websiteUrl: "https://dropbox.com" },
  { slug: "amplitude", name: "Amplitude", category: "software", provider: "greenhouse", token: "amplitude", websiteUrl: "https://amplitude.com" },
  { slug: "mixpanel", name: "Mixpanel", category: "software", provider: "greenhouse", token: "mixpanel", websiteUrl: "https://mixpanel.com" },
  { slug: "duolingo", name: "Duolingo", category: "software", provider: "greenhouse", token: "duolingo", websiteUrl: "https://duolingo.com" },
  { slug: "asana", name: "Asana", category: "software", provider: "greenhouse", token: "asana", websiteUrl: "https://asana.com" },
  { slug: "twilio", name: "Twilio", category: "software", provider: "greenhouse", token: "twilio", websiteUrl: "https://twilio.com" },
  { slug: "jobber", name: "Jobber", category: "software", provider: "ashby", token: "jobber", websiteUrl: "https://getjobber.com" },
  { slug: "mongodb", name: "MongoDB", category: "software", provider: "greenhouse", token: "mongodb", websiteUrl: "https://mongodb.com" },
  { slug: "okta", name: "Okta", category: "software", provider: "greenhouse", token: "okta", websiteUrl: "https://okta.com" },
  { slug: "docker", name: "Docker", category: "software", provider: "ashby", token: "docker", websiteUrl: "https://docker.com" },
  { slug: "posthog", name: "PostHog", category: "software", provider: "ashby", token: "posthog", websiteUrl: "https://posthog.com" },
  { slug: "1password", name: "1Password", category: "software", provider: "ashby", token: "1password", websiteUrl: "https://1password.com" },
  { slug: "intercom", name: "Intercom", category: "software", provider: "greenhouse", token: "intercom", websiteUrl: "https://intercom.com" },
  { slug: "klaviyo", name: "Klaviyo", category: "software", provider: "greenhouse", token: "klaviyo", websiteUrl: "https://klaviyo.com" },
  { slug: "braze", name: "Braze", category: "software", provider: "greenhouse", token: "braze", websiteUrl: "https://braze.com" },
  { slug: "sentry", name: "Sentry", category: "software", provider: "ashby", token: "sentry", websiteUrl: "https://sentry.io" },
  { slug: "hubspot", name: "HubSpot", category: "software", provider: "greenhouse", token: "hubspotjobs", websiteUrl: "https://hubspot.com" },
] as const satisfies readonly CuratedCompany[];

const companyBySlug = new Map<
  string,
  (typeof CURATED_COMPANIES)[number]
>(
  CURATED_COMPANIES.map((company) => [company.slug, company]),
);

export function categoryForCompany(slug: string): JobCategory {
  return companyBySlug.get(slug)?.category ?? "tech";
}

export function boardKey(provider: AtsProvider, token: string) {
  return `${provider}:${token}`;
}

export function parseBoardKey(value: string): {
  provider: AtsProvider;
  token: string;
} {
  const separator = value.indexOf(":");
  if (separator === -1) return { provider: "greenhouse", token: value };
  const provider = AtsProviderSchema.parse(value.slice(0, separator));
  const token = value.slice(separator + 1).trim();
  if (!/^[a-z0-9_-]{1,100}$/i.test(token)) throw new Error("INVALID_BOARD_TOKEN");
  return { provider, token };
}
