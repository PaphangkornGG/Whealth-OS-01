// Supabase client configuration and initialization
(function() {
  const SUPABASE_URL = "https://tpagojblgwljowupbcfc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwYWdvamJsZ3dsam93dXBiY2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjI2NzgsImV4cCI6MjA5NjA5ODY3OH0.rSbZI23WiyK6j3c18CPKgxeddoatjapw8_XiKEh0Nig";

  Object.defineProperty(window, 'supabaseClient', {
    get: function() {
      if (!window._supabaseClient) {
        if (window.supabase) {
          window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
          console.error("Supabase CDN library not loaded yet!");
        }
      }
      return window._supabaseClient;
    },
    configurable: true,
    enumerable: true
  });
})();
