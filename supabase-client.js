(function(){
  if (!window.supabase || !window.AIREVO_SUPABASE_CONFIG) {
    console.error("Airevo Supabase client could not start. Check the CDN and public config.");
    return;
  }
  window.airevoSupabase = window.supabase.createClient(
    window.AIREVO_SUPABASE_CONFIG.url,
    window.AIREVO_SUPABASE_CONFIG.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();