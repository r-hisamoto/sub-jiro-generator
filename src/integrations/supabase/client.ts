// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xwimlzbnnuleqylnekoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aW1semJubnVsZXF5bG5la295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNjIyNDYsImV4cCI6MjA1MDgzODI0Nn0.H6-12gYRaU5a-l7ZX5C-8nBz96L7IUjTZjCoIwSxAqo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);