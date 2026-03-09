# Notes App

A real-time notes application with Google authentication.

## Features

- Google OAuth login
- Add, view, and delete notes
- Real-time note synchronization
- Secure per-user note storage

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Add your Supabase URL and anon key to `script.js`
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

## Quick Start

```bash
python -m http.server 3000
```

Open `http://localhost:3000` in your browser and log in with Google.

## Tech Stack

- Frontend: HTML, JavaScript
- Backend: Supabase (Authentication & Database)

---

**Note:** This is a demo. It contains no confidential data/IP.
