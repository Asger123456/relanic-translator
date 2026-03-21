import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://qecjrmowzelkcmhnkwwn.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlY2pybW93emVsa2NtaG5rd3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI4MjcsImV4cCI6MjA4OTY2ODgyN30.UF9FypOSA9VXoiHHyw4lfITltjyMeyKdH-4xblTNWjc'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
