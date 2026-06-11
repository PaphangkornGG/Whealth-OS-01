-- 1. Create the transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date timestamp with time zone not null,
  type text not null,
  ticker text not null,
  name text,
  cls text,
  broker text,
  units numeric,
  price numeric,
  fee numeric default 0,
  ccy text,
  total numeric not null,
  wht_mode text,
  wht numeric,
  created_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security (RLS) so users can only access their own data
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create security policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);
