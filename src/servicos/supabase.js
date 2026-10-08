// src/servicos/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zlghtjgmpxguzguxmytc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2h0amdtcHhndXpndXhteXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MjkxMDEsImV4cCI6MjEwNjQwNTEwMX0.orXX6wEZDYRPB3efXLMI6-sQ6-wx5r7trTc1mbf7bWU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);