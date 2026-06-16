const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://tpagojblgwljowupbcfc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwYWdvamJsZ3dsam93dXBiY2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjI2NzgsImV4cCI6MjA5NjA5ODY3OH0.rSbZI23WiyK6j3c18CPKgxeddoatjapw8_XiKEh0Nig";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('transactions').select('*').limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data length:", data.length);
    console.log("First 5 rows:", data);
  }
}
check();
