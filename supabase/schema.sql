-- Run this in the Supabase SQL Editor to set up the Job Application Tracker table.

create table if not exists job_applications (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  role text not null,
  date_applied date not null,
  status text not null default 'Applied',
  jobready_score integer check (jobready_score >= 0 and jobready_score <= 100),
  interview_date date,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table job_applications enable row level security;

-- Allow all operations for anon key (single-user app — add auth policies later to restrict per user)
create policy "Allow all for anon" on job_applications
  for all using (true) with check (true);
