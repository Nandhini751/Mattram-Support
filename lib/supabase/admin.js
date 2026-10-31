// Server-only client that bypasses RLS. Never import this in a client component.
import { createClient } from '@supabase/supabase-js'

export const createAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
