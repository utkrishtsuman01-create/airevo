(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s));
const client=()=>window.airevoSupabase;
function show(el,msg,error=false){if(!el)return;el.textContent=msg;el.className='status-message show'+(error?' error':'')}
function redirectAfterLogin(){const u=new URL(location.href),to=u.searchParams.get('next');location.href=to&&to.startsWith('/')?to:'/account.html'}
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
   const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:location.origin+'/login.html?verified=1'}});
   if(error)show(status,error.message,true);
   else show(status,data.session?'Account created. You are signed in.':'Account created. Please check your inbox and verify your email before signing in.');
  }else{
   const {data,error}=await s.auth.signInWithPassword({email,password});
   if(error)show(status,error.message,true);else redirectAfterLogin();
  }
  btn.disabled=false;
 });
 $('#forgot-password')?.addEventListener('click',async e=>{
  e.preventDefault();const email=$('#auth-email').value.trim();if(!email){show(status,'Enter your email address first.');$('#auth-email').focus();return}
  const {error}=await s.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/login.html?type=recovery'});
  show(status,error?error.message:'Password reset instructions have been sent if this email belongs to an account.',!!error);
 });
 const url=new URL(location.href);
 if(url.searchParams.get('type')==='recovery'){
  form.hidden=true;$('#password-reset-form').hidden=false;$('#auth-heading').textContent='Choose a new password';
  $('#password-reset-form').addEventListener('submit',async e=>{
   e.preventDefault();const password=$('#reset-new-password').value;
   const {error}=await s.auth.updateUser({password});
   show(status,error?error.message:'Your password has been updated. You can now sign in.',!!error);
   if(!error){$('#password-reset-form').hidden=true;form.hidden=false;setMode('login')}
  });
 }
 if(url.searchParams.get('verified')==='1')show(status,'Email verification completed. Sign in to continue.');
 s.auth.getSession().then(({data})=>{if(data.session&&url.searchParams.get('type')!=='recovery')redirectAfterLogin()});
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
  const {data:role,error}=await s.from('user_roles').select('role').eq('user_id',session.user.id).maybeSingle();
  if(error){show(status,error.message,true);return false}
  if(role?.role==='admin'){show(status,'Administrator access verified. Loading dashboard…');window.AirevoAdmin?.render();return true}
  const {data:req}=await s.from('admin_access_requests').select('status').eq('user_id',session.user.id).maybeSingle();
  show(status,req?.status==='pending'?'Your email is signed in, but admin access is still pending approval.':'Your account is not an administrator. Request approval from the Airevo owner.');
  return false;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();const email=$('#admin-email').value.trim(),password=$('#admin-password').value,btn=$('#admin-auth-submit');btn.disabled=true;
  if(mode==='signup'){
   const name=$('#admin-fullname').value.trim();
   if(password!==$('#admin-confirm').value){show(status,'The passwords do not match.',true);btn.disabled=false;return}
   const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:name,airevo_admin_request:true},emailRedirectTo:location.origin+'/admin?verified=1'}});
   if(error)show(status,error.message,true);
   else show(status,data.session?'Admin account created. Admin rights remain pending approval.':'Admin account request created. Verify your email, then wait for the owner to approve access.');
  }else{
   const {error}=await s.auth.signInWithPassword({email,password});
   if(error)show(status,error.message,true);else await checkAdmin();
  }
  btn.disabled=false;
 });
 $('#admin-forgot-password')?.addEventListener('click',async e=>{
  e.preventDefault();const email=$('#admin-email').value.trim();if(!email){show(status,'Enter your admin email address first.');return}
  const {error}=await s.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/admin?type=recovery'});
  show(status,error?'Unable to send reset instructions: '+error.message:'Password reset instructions have been sent if this email belongs to an account.',!!error);
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