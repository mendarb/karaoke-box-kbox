// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ckqgsldcwkejzdecfacx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcWdzbGRjd2tlanpkZWNmYWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MzMyMzIsImV4cCI6MjA1MTAwOTIzMn0.-9xLGjs1uOVNsZn1k2RimFXq4PrUtXnDa5GxGU54Fac";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);