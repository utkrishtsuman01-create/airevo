(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s));
const client=()=>window.airevoSupabase;
function show(el,msg,error=false){if(!el)return;el.textContent=msg;el.className='status-message show'+(error?' error':'')}
function redirectAfterLogin(){const u=new URL(location.href),to=u.searchParams.get('next');location.href=to&&to.startsWith('/')&&!to.startsWith('//')?to:'/account.html'}
function customerBoot(){
 const s=client();if(!s)return;
 const form=$('#customer-auth-form'),status=$('#customer-auth-status');
 if(!form)return;
 let mode='login';
 function setMode(next){
  mode=next;all('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));
  $('#auth-heading').textContent=mode==='signup'?'Create your Airevo account':'Sign in to your account';
  $('#auth-name-field').hidden=mode!=='signup';
  $('#auth-confirm-password-field').hidden=mode!=='signup';
  $('#forgot-password').style.display=mode==='login'?'':'none';
  $('#customer-auth-submit').textContent=mode==='signup'?'Create account':'Sign in';
  status.className='status-message';status.textContent='';
 }
 all('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.authMode)));
 form.addEventListener('submit',async e=>{
  e.preventDefault();const email=$('#auth-email').value.trim(),password=$('#auth-password').value;
  const btn=$('#customer-auth-submit');btn.disabled=true;
  if(mode==='signup'){
   const name=$('#auth-fullname').value.trim(),confirm=$('#auth-confirm-password').value;
   if(password!==confirm){show(status,'The passwords do not match.',true);btn.disabled=false;return}
   const {data,error}=await s.functions.invoke('customer-signup',{body:{email,password,name}});
   if(error){
    let message=error.message||'Unable to create your account.';
    try{const detail=await error.context?.json?.();if(detail?.error)message=detail.error}catch(_){}
    show(status,message,true);
   }else if(data?.session){
    const {error:sessionError}=await s.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
    if(sessionError)show(status,'Your account was created, but automatic sign-in failed. Please sign in with your new account.',true);
    else{show(status,'Your Airevo account is ready. Redirecting…');redirectAfterLogin()}
   }else show(status,data?.error||'Unable to create your account.',true);
  }else{
   const {data,error}=await s.auth.signInWithPassword({email,password});
   if(error)show(status,error.message,true);else redirectAfterLogin();
  }
  btn.disabled=false;
 });
 const recoveryEmail=$('#password-recovery-email-form'),recoveryCode=$('#password-recovery-code-form'),recoveryNew=$('#password-recovery-new-form');
 const recoveryForms=[form,recoveryEmail,recoveryCode,recoveryNew];
 function showRecoveryStep(step,title,message=''){
  recoveryForms.forEach((node,index)=>{if(node)node.hidden=index!==step});
  const tabs=document.querySelector('.auth-tabs');if(tabs)tabs.hidden=step!==0;
  $('#auth-heading').textContent=title;
  if(message)show(status,message);else{status.className='status-message';status.textContent=''}
 }
 let recoveryAddress='';
 $('#forgot-password')?.addEventListener('click',e=>{e.preventDefault();recoveryAddress=$('#auth-email').value.trim();$('#recovery-email').value=recoveryAddress;showRecoveryStep(1,'Reset your password','Enter the email address linked to your Airevo account.')});
 $('#recovery-back-login')?.addEventListener('click',()=>showRecoveryStep(0,'Sign in to your account'));
 recoveryEmail?.addEventListener('submit',async e=>{
  e.preventDefault();recoveryAddress=$('#recovery-email').value.trim();const btn=$('#recovery-send-code');btn.disabled=true;
  const {error}=await s.auth.resetPasswordForEmail(recoveryAddress);
  if(error)show(status,error.message,true);
  else{showRecoveryStep(2,'Verify your email','If an account exists for this address, a verification code has been sent. Check your inbox and spam folder.');}
  btn.disabled=false;
 });
 $('#recovery-resend-code')?.addEventListener('click',async()=>{
  const btn=$('#recovery-resend-code');btn.disabled=true;const {error}=await s.auth.resetPasswordForEmail(recoveryAddress);
  show(status,error?error.message:'A new code has been requested. Check your inbox.',!!error);btn.disabled=false;
 });
 $('#recovery-back-email')?.addEventListener('click',()=>showRecoveryStep(1,'Reset your password'));
 recoveryCode?.addEventListener('submit',async e=>{
  e.preventDefault();const token=$('#recovery-code').value.trim(),btn=$('#recovery-verify-code');btn.disabled=true;
  const {error}=await s.auth.verifyOtp({email:recoveryAddress,token,type:'recovery'});
  if(error)show(status,error.message,true);
  else showRecoveryStep(3,'Create a new password','Your email has been verified. Choose a new password.');
  btn.disabled=false;
 });
 recoveryNew?.addEventListener('submit',async e=>{
  e.preventDefault();const password=$('#recovery-new-password').value,confirm=$('#recovery-confirm-password').value,btn=$('#recovery-update-password');
  if(password!==confirm){show(status,'The passwords do not match.',true);return}
  if(password.length<8){show(status,'Use at least 8 characters for your password.',true);return}
  btn.disabled=true;const {error}=await s.auth.updateUser({password});
  if(error)show(status,error.message,true);
  else{showRecoveryStep(0,'Sign in to your account','Your password has been updated. Please sign in with your new password.');$('#auth-password').value='';}
  btn.disabled=false;
 });
 const url=new URL(location.href);
 if(url.searchParams.get('verified')==='1')show(status,'Email verification completed. Sign in to continue.');
 s.auth.getSession().then(({data})=>{if(data.session&&!['recovery'].includes(url.searchParams.get('type')))redirectAfterLogin()});
}
function adminBootForm(){
 const s=client();if(!s)return;
 const form=$('#admin-auth-form'),status=$('#admin-auth-status');if(!form)return;
 let mode='login';
 function setMode(next){
  mode=next;all('[data-admin-mode]').forEach(b=>b.classList.toggle('active',b.dataset.adminMode===mode));
  $('#admin-name-field').hidden=mode!=='signup';$('#admin-confirm-field').hidden=mode!=='signup';
  $('#admin-auth-submit').textContent=mode==='signup'?'Create admin account request':'Sign in to admin';
  status.className='status-message';status.textContent='';
 }
 all('[data-admin-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.adminMode)));
 async function checkAdmin(){
  const {data:{session}}=await s.auth.getSession();if(!session)return false;
  if(String(session.user.email||'').toLowerCase()!=='info@airevo.com'){
   show(status,'This account is not the designated Airevo owner. Admin access is restricted to info@airevo.com.',true);return false;
  }
  if(!session.user.email_confirmed_at){show(status,'Verify info@airevo.com using the Supabase verification email, then sign in again.',true);return false}
  const {data:role,error}=await s.from('user_roles').select('role').eq('user_id',session.user.id).maybeSingle();
  if(error){show(status,error.message,true);return false}
  if(role?.role!=='admin'){
   const {data:bootstrap,error:bootstrapError}=await s.functions.invoke('bootstrap-owner-admin');
   if(bootstrapError||!bootstrap?.ok){show(status,bootstrapError?.message||bootstrap?.error||'Unable to activate the permanent owner account.',true);return false}
  }
  show(status,'Permanent owner access verified. Loading dashboard…');window.AirevoAdmin?.render();return true;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();const email=$('#admin-email').value.trim(),password=$('#admin-password').value,btn=$('#admin-auth-submit');btn.disabled=true;
  if(mode==='signup'){
   const name=$('#admin-fullname').value.trim();
   if(email.toLowerCase()!=='info@airevo.com'){show(status,'Only the designated Airevo owner email can create the administrator account.',true);btn.disabled=false;return}
   if(password!==$('#admin-confirm').value){show(status,'The passwords do not match.',true);btn.disabled=false;return}
   const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:name,airevo_admin_request:true},emailRedirectTo:location.origin+'/admin?verified=1'}});
   if(error)show(status,error.message,true);
   else if(data.session){show(status,'Owner account created. Activating secure owner access…');await checkAdmin()}else show(status,'Owner account created. Verify info@airevo.com using the Supabase email, then sign in to activate the permanent owner account.');
  }else{
   const {error}=await s.auth.signInWithPassword({email,password});
   if(error)show(status,error.message,true);else await checkAdmin();
  }
  btn.disabled=false;
 });
 $('#admin-forgot-password')?.addEventListener('click',async e=>{
  e.preventDefault();const email=$('#admin-email').value.trim();if(!email){show(status,'Enter your admin email address first.');return}
  if(email.toLowerCase()!=='info@airevo.com'){show(status,'Password recovery is available only for the designated Airevo owner account.',true);return}
  const {error}=await s.auth.resetPasswordForEmail(email);
  if(error){show(status,'Unable to request a recovery code: '+error.message,true);return}
  form.hidden=true;
  let recovery=$('#admin-otp-recovery');
  if(!recovery){
   recovery=document.createElement('form');recovery.id='admin-otp-recovery';recovery.className='auth-form';
   recovery.innerHTML='<div class="field"><label>Email verification code</label><input id="admin-recovery-token" inputmode="numeric" autocomplete="one-time-code" required></div><div class="field"><label>New password</label><input id="admin-recovery-password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Confirm new password</label><input id="admin-recovery-confirm" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn">Verify code and update password</button><button type="button" class="btn dark" id="admin-recovery-back">Back to sign in</button>';
   form.parentNode.insertBefore(recovery,form.nextSibling);
   $('#admin-recovery-back').addEventListener('click',()=>{recovery.hidden=true;form.hidden=false;show(status,'')});
   recovery.addEventListener('submit',async ev=>{
    ev.preventDefault();const token=$('#admin-recovery-token').value.trim(),password=$('#admin-recovery-password').value;
    if(password!==$('#admin-recovery-confirm').value){show(status,'The passwords do not match.',true);return}
    const {error:verifyError}=await s.auth.verifyOtp({email,type:'recovery',token});
    if(verifyError){show(status,verifyError.message,true);return}
    const {error:updateError}=await s.auth.updateUser({password});
    if(updateError){show(status,updateError.message,true);return}
    await s.auth.signOut();recovery.hidden=true;form.hidden=false;show(status,'Admin password updated. Sign in using your new password.');
   });
  }
  recovery.hidden=false;show(status,'If the owner account exists, a recovery code has been requested. Check the owner inbox.');
 });
 const url=new URL(location.href);
 if(url.searchParams.get('verified')==='1')show(status,'Email verified. Sign in to check your admin access.');
 if(url.searchParams.get('type')==='recovery'){
  form.hidden=true;
  let reset=$('#admin-password-reset-form');
  if(!reset){
   reset=document.createElement('form');reset.id='admin-password-reset-form';reset.className='auth-form';
   reset.innerHTML='<div class="field"><label>New password</label><input id="admin-reset-password" type="password" minlength="8" required></div><div class="field"><label>Confirm new password</label><input id="admin-reset-confirm" type="password" minlength="8" required></div><button class="btn">Update admin password</button>';
   form.parentNode.insertBefore(reset,form.nextSibling);
  }
  reset.hidden=false;
  reset.addEventListener('submit',async e=>{
   e.preventDefault();
   const p=$('#admin-reset-password').value;
   if(p!==$('#admin-reset-confirm').value){show(status,'The passwords do not match.',true);return}
   const {error}=await s.auth.updateUser({password:p});
   show(status,error?error.message:'Your admin password has been updated. Sign in again.',!!error);
   if(!error){await s.auth.signOut();reset.hidden=true;form.hidden=false;setMode('login')}
  });
 } else if(url.searchParams.get('verified')==='1')show(status,'Email verified. Sign in to check your admin access.');
 checkAdmin();
}
window.AirevoAuth={customerBoot,adminBootForm};
})();