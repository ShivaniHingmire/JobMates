insert into public.skills(slug, label, aliases) values
  ('typescript', 'TypeScript', array['ts']),
  ('javascript', 'JavaScript', array['js', 'ecmascript']),
  ('react', 'React', array['react.js', 'reactjs']),
  ('next-js', 'Next.js', array['nextjs', 'next']),
  ('product-design', 'Product design', array['digital product design']),
  ('user-research', 'User research', array['ux research']),
  ('sql', 'SQL', array['postgresql', 'postgres'])
on conflict (slug) do nothing;
