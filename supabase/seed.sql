-- DUMMY DATA ONLY. Run AFTER you have signed up at least 2 coordinators and 1 admin.
insert into queries (student_name, student_email, institution, category_id, channel, priority, description)
select 'Student ' || g, 'student' || g || '@example.com',
  (array['Anna University','Loyola College','SRM Institute','MIT Campus'])[1 + floor(random()*4)::int],
  1 + floor(random()*6)::int,
  (array['WhatsApp','Phone','Email','Form','In person'])[1 + floor(random()*5)::int],
  (array['Low','Medium','High'])[1 + floor(random()*3)::int],
  'Dummy query number ' || g
from generate_series(1, 30) g;

-- Make them look older so overdue and reminder features have something to show
update queries set created_at = now() - make_interval(hours => (random()*240)::int);
update queries set
  due_at = created_at + interval '3 days',
  updated_at = created_at + make_interval(hours => (random()*60)::int),
  status = (array['Assigned','Assigned','In progress','Waiting for student','Resolved','Closed'])[1 + floor(random()*6)::int];
update queries set resolved_at = updated_at where status in ('Resolved','Closed');
