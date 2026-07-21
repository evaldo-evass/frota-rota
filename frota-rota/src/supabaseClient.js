import { createClient } from "@supabase/supabase-js";

// PASSO OBRIGATÓRIO: troque os dois valores abaixo pelos da SUA conta Supabase.
// Encontra-os em: Project Settings → API → Project URL / anon public key
const SUPABASE_URL = "https://myhnogoqhagaghfugubq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15aG5vZ29xaGFnYWdoZnVndWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjU5NDgsImV4cCI6MjEwMDIwMTk0OH0.367xAWL37VZTe8Eue4f1ZESwQw8nPszsJ216zI-lVps";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
