begin;
select plan(5);

select has_table('public', 'resumes', 'resumes exists');
select has_table('public', 'jobs', 'jobs exists');
select has_function('public', 'record_job_action', array['uuid', 'job_disposition', 'text'], 'atomic action RPC exists');
select policies_are(
  'storage',
  'objects',
  array[
    'resume_objects_select',
    'resume_objects_insert',
    'resume_objects_update',
    'resume_objects_delete'
  ],
  'private résumé policies exist'
);
select policies_are(
  'public',
  'interaction_events',
  array['events_own_read', 'events_own_append'],
  'interaction event policies exist'
);

select * from finish();
rollback;
