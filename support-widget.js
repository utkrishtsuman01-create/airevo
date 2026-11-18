(() => {
  'use strict';
  if (document.body?.dataset.page === 'admin') return;

  const whatsappUrl = 'https://wa.me/919836147993?text=' + encodeURIComponent('Hi Airevo, I need help.');
  const style = document.createElement('style');
  style.textContent = `
    .airevo-help-float{position:fixed;left:22px;bottom:22px;z-index:180;display:flex;align-items:center;gap:10px;padding:11px 17px 11px 11px;border:1px solid #d8e8ef;border-radius:999px;background:#fff;color:#17394d;box-shadow:0 10px 35px #0b24352b;font:800 13px/1.2 "DM Sans",sans-serif;cursor:pointer;transition:transform .2s,box-shadow .2s}
    .airevo-help-float:hover{transform:translateY(-3px);box-shadow:0 15px 38px #0b24353b}
    .airevo-help-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:50%;background:#20c765;color:#fff;flex:none}
    .airevo-help-icon svg{width:22px;height:22px;display:block}
    .airevo-help-label{white-space:nowrap}
    .airevo-contact-backdrop{position:fixed;inset:0;z-index:220;display:none;align-items:center;justify-content:center;padding:16px;background:#071522b8;backdrop-filter:blur(7px)}
    .airevo-contact-backdrop.is-open{display:flex}
    .airevo-contact-dialog{position:relative;width:min(650px,100%);max-height:min(90vh,760px);overflow:auto;border-radius:20px;background:#fff;box-shadow:0 28px 90px #0005}
    .airevo-contact-head{position:relative;padding:27px 30px 23px;background:linear-gradient(135deg,#f1faff,#dceef7);color:#15384c}
    .airevo-contact-eyebrow{font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1388bd}
    .airevo-contact-head h2{margin:7px 44px 5px 0;font:800 27px/1.15 Manrope,sans-serif;letter-spacing:-.03em}
    .airevo-contact-head p{margin:0;color:#61798a;font-size:12px;line-height:1.65}
    .airevo-contact-close{position:absolute;right:17px;top:17px;width:36px;height:36px;border:0;border-radius:50%;background:#fff;color:#163c53;font-size:23px;line-height:1}
    .airevo-contact-body{padding:25px 30px 29px}
    .airevo-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
    .airevo-contact-field{display:grid;gap:6px;min-width:0}
    .airevo-contact-field.full{grid-column:1/-1}
    .airevo-contact-field label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#526c7c}
    .airevo-contact-field input,.airevo-contact-field select,.airevo-contact-field textarea{width:100%;min-width:0;border:1px solid #d6e4eb;border-radius:9px;background:#fff;padding:12px 13px;color:#203d50;font:400 13px "DM Sans",sans-serif}
    .airevo-contact-field textarea{min-height:100px;resize:vertical}
    .airevo-contact-submit{margin-top:16px;border:0;border-radius:999px;background:#75c9f2;color:#fff;padding:13px 22px;font:800 11px "DM Sans",sans-serif;letter-spacing:.04em}
    .airevo-contact-submit:disabled{opacity:.65;cursor:wait}
    .airevo-contact-status{display:none;margin-top:12px;padding:11px 13px;border-radius:9px;background:#edf7fb;color:#31566a;font-size:12px}
    .airevo-contact-status.show{display:block}
    .airevo-contact-status.error{background:#fff0ef;color:#983d36}
    @media(max-width:560px){.airevo-help-float{left:13px;bottom:13px;padding:8px 13px 8px 8px;font-size:12px}.airevo-help-icon{width:36px;height:36px}.airevo-contact-head{padding:23px 21px 19px}.airevo-contact-body{padding:20px 21px 24px}.airevo-contact-grid{grid-template-columns:1fr}.airevo-contact-field.full{grid-column:auto}.airevo-contact-head h2{font-size:23px}}
  `;
  document.head.appendChild(style);

  const help = document.createElement('a');
  help.className = 'airevo-help-float';
  help.href = whatsappUrl;
  help.target = '_blank';
  help.rel = 'noopener noreferrer';
  help.setAttribute('aria-label', 'Get help from Airevo on WhatsApp');
  help.innerHTML = '<span class="airevo-help-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.9 11.9 0 0 0 1.8 17.8L.2 23.7l6-1.6A11.9 11.9 0 0 0 20.5 3.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9 9 0 1 1 12 21Zm5-6.7c-.3-.2-1.7-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-.9-2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.2-1.3 0-.1-.2-.2-.5-.4Z"/></svg></span><span class="airevo-help-label">Do you need help?</span>';
  document.body.appendChild(help);

  const backdrop = document.createElement('div');
  backdrop.className = 'airevo-contact-backdrop';
  backdrop.id = 'airevo-contact-popup';
  backdrop.innerHTML = `
    <section class="airevo-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="airevo-contact-title">
      <div class="airevo-contact-head">
        <button class="airevo-contact-close" type="button" aria-label="Close contact form">×</button>
        <span class="airevo-contact-eyebrow">We're here to help</span>
        <h2 id="airevo-contact-title">How can we help you?</h2>
        <p>Tell us what you need and the Airevo team will get back to you.</p>
      </div>
      <div class="airevo-contact-body">
        <form id="airevo-contact-form">
          <div class="airevo-contact-grid">
            <div class="airevo-contact-field"><label for="airevo-contact-name">Your name</label><input id="airevo-contact-name" name="name" autocomplete="name" required maxlength="120" placeholder="Enter your name"></div>
            <div class="airevo-contact-field"><label for="airevo-contact-email">Email address</label><input id="airevo-contact-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
            <div class="airevo-contact-field"><label for="airevo-contact-phone">Phone number</label><input id="airevo-contact-phone" name="phone" type="tel" autocomplete="tel" placeholder="Your mobile number"></div>
            <div class="airevo-contact-field"><label for="airevo-contact-subject">What do you need help with?</label><select id="airevo-contact-subject" name="subject"><option>Product enquiry</option><option>Pricing and availability</option><option>Kitchen planning</option><option>Installation support</option><option>Order assistance</option><option>Other</option></select></div>
            <div class="airevo-contact-field full"><label for="airevo-contact-message">Your message</label><textarea id="airevo-contact-message" name="message" required maxlength="4000" placeholder="Write your enquiry here..."></textarea></div>
          </div>
          <div class="airevo-contact-status" id="airevo-contact-status" role="status"></div>
          <button class="airevo-contact-submit" type="submit">Send enquiry ↗</button>
        </form>
      </div>
    </section>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.classList.remove('is-open');
  backdrop.querySelector('.airevo-contact-close').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close(); });

  const params = new URLSearchParams(location.search);
  const autoOpen = () => {
    if (params.has('contact') || params.has('intent') || !sessionStorage.getItem('airevo-contact-popup-dismissed')) {
      backdrop.classList.add('is-open');
    }
  };
  backdrop.querySelector('.airevo-contact-close').addEventListener('click', () => {
    sessionStorage.setItem('airevo-contact-popup-dismissed', '1');
  });
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) sessionStorage.setItem('airevo-contact-popup-dismissed', '1');
  });
  window.addEventListener('pageshow', () => setTimeout(autoOpen, 950), { once: true });

  const form = backdrop.querySelector('#airevo-contact-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const status = backdrop.querySelector('#airevo-contact-status');
    const submit = form.querySelector('button[type="submit"]');
    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      subject: form.elements.subject.value,
      message: form.elements.message.value.trim()
    };
    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.textContent = 'Sending your enquiry…';
    status.className = 'airevo-contact-status show';
    try {
      const client = window.airevoSupabase;
      if (!client) throw new Error('The enquiry service is temporarily unavailable. Please try WhatsApp instead.');
      const { error } = await client.from('contact_inquiries').insert(payload);
      if (error) throw error;
      status.textContent = 'Thank you! Your enquiry has been received.';
      form.reset();
      setTimeout(close, 1700);
    } catch (error) {
      status.textContent = error.message || 'Unable to send your enquiry. Please try WhatsApp.';
      status.className = 'airevo-contact-status show error';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send enquiry ↗';
    }
  });
})();
