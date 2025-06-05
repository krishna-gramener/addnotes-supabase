# Supabase Notes App

A simple real-time notes application using Supabase for authentication and database.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Add your Supabase URL and anon key to `supabaseConfig.js`
3. Run SQL in Supabase dashboard:
```sql
-- Create notes table
create table notes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  text text not null
);

-- Enable RLS
alter table notes enable row level security;

-- Create policies
create policy "Users can create their own notes" on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own notes" on notes for select
  using (auth.uid() = user_id);

create policy "Users can delete their own notes" on notes for delete
  using (auth.uid() = user_id);
```

4. Enable Google Auth in Supabase Authentication settings
5. Enable Realtime for the `notes` table in Supabase Database settings

## Run Locally

```bash
python -m http.server 3000
```

Visit `http://localhost:3000`
