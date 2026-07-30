begin;
select plan(9);

select has_table('public', 'resumes', 'resumes exists');
select has_table('public', 'jobs', 'jobs exists');
select has_function('public', 'record_job_action', array['uuid', 'job_disposition', 'text'], 'atomic action RPC exists');
select has_policy('storage', 'objects', 'resume_objects_select', 'private résumé read policy exists');
select has_policy('storage', 'objects', 'resume_objects_insert', 'private résumé insert policy exists');
select has_policy('storage', 'objects', 'resume_objects_update', 'private résumé update policy exists');
select has_policy('storage', 'objects', 'resume_objects_delete', 'private résumé delete policy exists');
select has_policy('public', 'interaction_events', 'events_own_read', 'event read policy exists');
select has_policy('public', 'interaction_events', 'events_own_append', 'event append policy exists');

select * from finish();
rollback;
