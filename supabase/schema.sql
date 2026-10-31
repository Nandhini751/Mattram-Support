-- Maatram Student Support: run this whole file once in Supabase > SQL Editor.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, email text, phone text,
  role text not null default 'rep' check (role in ('rep','coordinator','admin')),
  created_at timestamptz default now()
);

create table categories (id serial primary key, name text unique not null);
insert into categories (name) values ('Admission'),('Scholarship'),('Events'),('Mentoring'),('Technical'),('Other');

create table queries (
  id uuid primary key default gen_random_uuid(),
  student_name text not null, student_email text, student_phone text, institution text,
  category_id int references categories(id),
  channel text not null, priority text not null default 'Medium', description text not null,
  status text not null default 'New',
  assigned_to uuid references profiles(id),
  logged_by uuid references profiles(id) default auth.uid(),
  due_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now(), resolved_at timestamptz
);

create table query_history (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references queries(id) on delete cascade,
  changed_by uuid references profiles(id),
  old_status text, new_status text,
  old_assignee uuid references profiles(id), new_assignee uuid references profiles(id),
  note text, created_at timestamptz default now()
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references queries(id) on delete cascade,
  path text not null, file_name text, created_at timestamptz default now()
);

create table assignment_rules (
  id serial primary key,
  category_id int references categories(id),
  institution text,
  coordinator_id uuid not null references profiles(id)
);

create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  query_id uuid references queries(id) on delete cascade,
  kind text, recipient text, channel text default 'email', sent_at timestamptz default now()
);

-- Helper: the role of the logged-in user (security definer avoids RLS loops)
create function app_role() returns text language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

-- Create a profile whenever someone signs up (DEMO ONLY: role comes from the sign-up form)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email,
          coalesce(new.raw_user_meta_data->>'role','rep'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Auto-assign + due date when a query is created
create function before_query_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.due_at := now() + case new.priority when 'High' then interval '1 day' when 'Low' then interval '7 days' else interval '3 days' end;
  -- 1) a matching rule (institution match wins over category match)
  select coordinator_id into new.assigned_to from assignment_rules
   where (category_id = new.category_id or category_id is null)
     and (institution is null or institution = new.institution)
   order by (institution is not null) desc, (category_id is not null) desc limit 1;
  -- 2) otherwise the coordinator with the fewest open queries
  if new.assigned_to is null then
    select p.id into new.assigned_to from profiles p where p.role = 'coordinator'
     order by (select count(*) from queries q where q.assigned_to = p.id and q.status not in ('Resolved','Closed')), random()
     limit 1;
  end if;
  if new.assigned_to is not null then new.status := 'Assigned'; end if;
  return new;
end $$;
create trigger trg_before_query_insert before insert on queries for each row execute function before_query_insert();

create function after_query_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into query_history (query_id, changed_by, new_status, new_assignee, note)
  values (new.id, new.logged_by, new.status, new.assigned_to, 'Query logged');
  return new;
end $$;
create trigger trg_after_query_insert after insert on queries for each row execute function after_query_insert();

-- The only way to change a query: checks permission, requires a note, writes history
create function update_query(p_id uuid, p_status text, p_assignee uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare q queries%rowtype; r text := app_role(); new_status text;
begin
  select * into q from queries where id = p_id;
  if not found then raise exception 'Query not found'; end if;
  if not (r = 'admin' or (r = 'coordinator' and q.assigned_to = auth.uid())) then raise exception 'You cannot update this query'; end if;
  if p_note is null or length(trim(p_note)) = 0 then raise exception 'A note is required'; end if;
  if p_assignee is not null and p_assignee is distinct from q.assigned_to and r <> 'admin' then raise exception 'Only an admin can reassign'; end if;
  new_status := coalesce(p_status, q.status);
  update queries set
    status = new_status,
    assigned_to = coalesce(p_assignee, assigned_to),
    resolved_at = case when new_status in ('Resolved','Closed') then coalesce(resolved_at, now()) else null end,
    updated_at = now()
  where id = p_id;
  insert into query_history (query_id, changed_by, old_status, new_status, old_assignee, new_assignee, note)
  values (p_id, auth.uid(), q.status, new_status, q.assigned_to, coalesce(p_assignee, q.assigned_to), p_note);
end $$;

-- Row Level Security: the database itself enforces who sees what
alter table profiles enable row level security;
alter table categories enable row level security;
alter table queries enable row level security;
alter table query_history enable row level security;
alter table attachments enable row level security;
alter table assignment_rules enable row level security;
alter table notifications_log enable row level security;

create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles admin update" on profiles for update to authenticated using (app_role() = 'admin');
create policy "categories read" on categories for select to authenticated using (true);
create policy "categories admin" on categories for all to authenticated using (app_role() = 'admin') with check (app_role() = 'admin');
create policy "queries read" on queries for select to authenticated
  using (app_role() = 'admin' or logged_by = auth.uid() or assigned_to = auth.uid());
create policy "queries insert" on queries for insert to authenticated
  with check (app_role() in ('rep','admin') and logged_by = auth.uid());
create policy "history read" on query_history for select to authenticated
  using (exists (select 1 from queries q where q.id = query_id));
create policy "attachments read" on attachments for select to authenticated
  using (exists (select 1 from queries q where q.id = query_id));
create policy "attachments insert" on attachments for insert to authenticated
  with check (exists (select 1 from queries q where q.id = query_id and (q.logged_by = auth.uid() or app_role() = 'admin')));
create policy "rules admin" on assignment_rules for all to authenticated using (app_role() = 'admin') with check (app_role() = 'admin');
create policy "log admin read" on notifications_log for select to authenticated using (app_role() = 'admin');

-- Private file bucket (files are opened with temporary signed links)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict do nothing;
create policy "attachments upload" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "attachments download" on storage.objects for select to authenticated using (bucket_id = 'attachments');
