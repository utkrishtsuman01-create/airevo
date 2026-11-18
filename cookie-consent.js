(() => {
  'use strict';
  const KEY = 'airevo-cookie-choice-v1';
  try { if (localStorage.getItem(KEY)) return; } catch (_) {}
  const style = document.createElement('style');
  style.textContent = `
    .airevo-cookie-backdrop{position:fixed;inset:0;z-index:5000;background:#10283a66;display:flex;align-items:flex-end;justify-content:center;padding:18px}
    .airevo-cookie-card{width:min(760px,100%);background:#fff;border:1px solid #dceaf1;border-radius:20px;box-shadow:0 22px 70px #10283a35;padding:24px;color:#18394d;font-family:"DM Sans",Arial,sans-serif}
    .airevo-cookie-card h2{font:800 22px/1.2 Manrope,Arial,sans-serif;margin:0 0 8px}
    .airevo-cookie-card p{font-size:13px;line-height:1.65;color:#607789;margin:0 0 16px}
    .airevo-cookie-actions{display:flex;gap:9px;flex-wrap:wrap}
    .airevo-cookie-actions button{border:1px solid #cbdde7;border-radius:999px;padding:11px 17px;font:700 12px "DM Sans",Arial,sans-serif;cursor:pointer;background:#fff;color:#21465b}
    .airevo-cookie-actions .primary{background:#183e56;color:#fff;border-color:#183e56}
    .airevo-cookie-card a{color:#1686b8;text-decoration:underline}
    @media(max-width:520px){.airevo-cookie-backdrop{padding:10px}.airevo-cookie-card{padding:19px;border-radius:16px}.airevo-cookie-actions{display:grid;grid-template-columns:1fr}.airevo-cookie-actions button{width:100%}}
  `;
  document.head.appendChild(style);
  const wrap=document.createElement('div');
  wrap.className='airevo-cookie-backdrop';
  wrap.setAttribute('role','dialog');
  wrap.setAttribute('aria-modal','true');
  wrap.setAttribute('aria-labelledby','airevo-cookie-title');
  wrap.innerHTML=`<section class="airevo-cookie-card">
    <h2 id="airevo-cookie-title">Your privacy matters</h2>
    <p>This demo store uses essential browser storage to keep basic features working, such as your basket and this cookie choice. Optional analytics or advertising cookies are not enabled in this demo. Choose whether to allow optional cookies. Read our <a href="/privacy-policy.html">Privacy Policy</a> and <a href="/cookie-policy.html">Cookie Policy</a>.</p>
    <div class="airevo-cookie-actions">
      <button type="button" data-choice="all" class="primary">Accept all</button>
      <button type="button" data-choice="essential">Accept only essential</button>
      <button type="button" data-choice="deny">Deny cookies</button>
    </div>
  </section>`;
  document.body.appendChild(wrap);
  wrap.addEventListener('click',e=>{
    const b=e.target.closest('[data-choice]');
    if(!b)return;
    const choice=b.dataset.choice;
    try { localStorage.setItem(KEY,JSON.stringify({choice, savedAt:new Date().toISOString()})); } catch (_) {}
    wrap.remove();
  });
})();