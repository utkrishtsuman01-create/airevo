/* Load Supabase asynchronously so an unavailable CDN never blocks the storefront. */
(function(){
  'use strict';
  let resolveReady,finished=false;
  window.airevoSupabaseReady=new Promise(resolve=>{resolveReady=resolve});
  function finish(ok){if(finished)return;finished=true;resolveReady(!!ok)}
  const config=window.AIREVO_SUPABASE_CONFIG;
  if(!config||!config.url||!config.publishableKey){
    console.error('Airevo Supabase configuration is missing.');
    finish(false);
    return;
  }
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0';
  script.async=true;
  script.onload=function(){
    if(finished)return;
    try{
      if(!window.supabase||typeof window.supabase.createClient!=='function')throw new Error('Supabase library did not expose createClient.');
      window.airevoSupabase=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      finish(true);
    }catch(error){console.error('Airevo Supabase client could not start.',error);finish(false)}
  };
  script.onerror=function(){console.error('Supabase CDN failed. Continuing without database features.');finish(false)};
  document.head.appendChild(script);
  setTimeout(function(){if(!finished){console.warn('Supabase load timed out. Continuing without database features.');finish(false)}},5000);
})();