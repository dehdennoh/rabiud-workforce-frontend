-- Rabiud Services application completion migration
-- Run in Supabase SQL Editor after confirming these table names.

alter table public.documents
  add column if not exists file_path text,
  add column if not exists file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Application tables: authenticated users only. Add role-specific restrictions
-- in profiles policies or separate table policies as your operations rules mature.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'companies', 'workers', 'assignments', 'attendance', 'payroll',
    'advances', 'documents', 'client_invoices', 'invoice_lines',
    'invoice_payments', 'input_vat_purchases'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "authenticated read %I" on public.%I', table_name, table_name);
    execute format('create policy "authenticated read %I" on public.%I for select to authenticated using (true)', table_name, table_name);
  end loop;
end $$;

-- Mutations require an authenticated session. Role restrictions remain enforced by
-- application permissions and should be tightened against the profiles role column.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'companies', 'workers', 'assignments', 'attendance', 'payroll',
    'advances', 'documents', 'client_invoices', 'invoice_lines',
    'invoice_payments', 'input_vat_purchases'
  ]
  loop
    execute format('drop policy if exists "authenticated insert %I" on public.%I', table_name, table_name);
    execute format('create policy "authenticated insert %I" on public.%I for insert to authenticated with check (true)', table_name, table_name);
    execute format('drop policy if exists "authenticated update %I" on public.%I', table_name, table_name);
    execute format('create policy "authenticated update %I" on public.%I for update to authenticated using (true) with check (true)', table_name, table_name);
  end loop;
end $$;

-- Document storage: authenticated users may upload, read, and remove files.
drop policy if exists "authenticated read employee documents" on storage.objects;
create policy "authenticated read employee documents" on storage.objects
for select to authenticated using (bucket_id = 'employee-documents');

drop policy if exists "authenticated upload employee documents" on storage.objects;
create policy "authenticated upload employee documents" on storage.objects
for insert to authenticated with check (bucket_id = 'employee-documents');

drop policy if exists "authenticated remove employee documents" on storage.objects;
create policy "authenticated remove employee documents" on storage.objects
for delete to authenticated using (bucket_id = 'employee-documents');

-- Role updates are restricted to admins and operations managers.
drop policy if exists "profiles role update" on public.profiles;
create policy "profiles role update" on public.profiles
for update to authenticated
using (
  exists (
    select 1 from public.profiles actor
    where actor.id = auth.uid()
      and actor.role in ('Admin', 'Operations Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles actor
    where actor.id = auth.uid()
      and actor.role in ('Admin', 'Operations Manager')
  )
);
