insert into public.skills(slug, label, aliases) values
  ('typescript', 'TypeScript', array['ts']),
  ('javascript', 'JavaScript', array['js', 'ecmascript']),
  ('react', 'React', array['react.js', 'reactjs']),
  ('next-js', 'Next.js', array['nextjs', 'next']),
  ('product-design', 'Product design', array['digital product design']),
  ('user-research', 'User research', array['ux research']),
  ('sql', 'SQL', array['postgresql', 'postgres'])
on conflict (slug) do nothing;

insert into public.companies(
  slug,
  name,
  greenhouse_board_token,
  enabled
) values
  ('calendly', 'Calendly', 'calendly', true),
  ('dropbox', 'Dropbox', 'dropbox', true),
  ('cockroach-labs', 'Cockroach Labs', 'cockroachlabs', true),
  ('amplitude', 'Amplitude', 'amplitude', true),
  ('mixpanel', 'Mixpanel', 'mixpanel', true),
  ('twitch', 'Twitch', 'twitch', true),
  ('duolingo', 'Duolingo', 'duolingo', true),
  ('gusto', 'Gusto', 'gusto', true),
  ('airtable', 'Airtable', 'airtable', true),
  ('webflow', 'Webflow', 'webflow', true)
on conflict (greenhouse_board_token) do update set
  name = excluded.name,
  enabled = true;
