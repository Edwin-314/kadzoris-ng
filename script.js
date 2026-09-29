// ============================================================
// MOBILE NAVIGATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');

  if (toggle && menu && overlay) {
    const closeMenu = () => {
      menu.classList.remove('open');
      overlay.classList.remove('open');
      toggle.classList.remove('active');
    };
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      overlay.classList.toggle('open');
      toggle.classList.toggle('active');
    });
    overlay.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }
});

// ============================================================
// APPLICATION FORM -> n8n WEBHOOK
// ============================================================
// Production n8n webhook — workflow must be Active in n8n for this to work.
const N8N_WEBHOOK_URL = "https://edwinonoru.n8n-wsk.com/webhook/kadzoris-apply";

async function handleApplyForm(event) {
  event.preventDefault();
  const form = event.target;
  const statusEl = document.getElementById('applyStatus');
  const submitBtn = form.querySelector('button[type="submit"]');

  const payload = {
    organization: form.organization.value.trim(),
    contactPerson: form.contactPerson.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    industry: form.industry.value,
    serviceNeeded: form.serviceNeeded.value,
    currentWebsite: form.currentWebsite.value.trim(),
    message: form.message.value.trim(),
    submittedAt: new Date().toISOString(),
    source: "kadzoris.ng/contact"
  };

  if (!payload.organization || !payload.contactPerson || !payload.phone) {
    statusEl.textContent = "Please fill in your organization name, contact person, and phone number.";
    statusEl.style.color = "#C97A3B";
    return;
  }

  statusEl.textContent = "Sending your application...";
  statusEl.style.color = "var(--ash)";
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Webhook responded with an error");

    statusEl.textContent = "✓ Application received — we'll reach out within 48 hours.";
    statusEl.style.color = "#3E9E6E";
    form.reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong sending your application. Please try again, or message us directly on WhatsApp.";
    statusEl.style.color = "#C0453B";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ============================================================
// LIGHTWEIGHT CONVERSION EVENT HOOKS
// Sends to dataLayer when an analytics provider is present and always emits
// a browser CustomEvent so analytics can be connected later without rewrites.
// ============================================================
function trackKadzorisEvent(eventName, detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('kadzoris:event', { detail: { event: eventName, ...detail } }));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...detail });
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => trackKadzorisEvent(el.dataset.track, { path: location.pathname }));
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(el => el.addEventListener('click', () => trackKadzorisEvent('phone_clicked')));
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => el.addEventListener('click', () => trackKadzorisEvent('email_clicked')));
});

// ============================================================
// DIGITAL GAP ASSESSMENT — transparent rule-based preliminary assessment
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('digitalGapForm');
  if (!form) return;

  const steps = [...form.querySelectorAll('.assessment-step')];
  const labels = [...document.querySelectorAll('.assessment-step-labels span')];
  const progress = document.getElementById('assessmentProgressBar');
  const prev = document.getElementById('assessmentPrev');
  const next = document.getElementById('assessmentNext');
  const submit = document.getElementById('assessmentSubmit');
  const status = document.getElementById('assessmentStatus');
  const result = document.getElementById('digitalGapResult');
  const resultCategories = document.getElementById('resultCategories');
  const whatsapp = document.getElementById('assessmentWhatsApp');
  let current = 0;

  trackKadzorisEvent('digital_gap_started', { path: location.pathname });

  function renderStep() {
    steps.forEach((s, i) => s.classList.toggle('active', i === current));
    labels.forEach((l, i) => l.classList.toggle('active', i === current));
    progress.style.width = `${((current + 1) / steps.length) * 100}%`;
    prev.disabled = current === 0;
    next.style.display = current === steps.length - 1 ? 'none' : 'inline-flex';
    submit.style.display = current === steps.length - 1 ? 'inline-flex' : 'none';
    status.textContent = '';
    window.scrollTo({ top: Math.max(0, form.offsetTop - 120), behavior: 'smooth' });
  }

  function validateCurrentStep() {
    const required = [...steps[current].querySelectorAll('[required]')];
    const invalid = required.find(el => el.type === 'checkbox' ? !el.checked : !el.value.trim());
    if (invalid) {
      status.textContent = 'Please complete the required fields before continuing.';
      invalid.focus();
      return false;
    }
    return true;
  }

  next.addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    current = Math.min(current + 1, steps.length - 1);
    renderStep();
  });

  prev.addEventListener('click', () => {
    current = Math.max(current - 1, 0);
    renderStep();
  });

  function value(name) {
    const el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  function scoreAssessment() {
    const score = { Visibility: 0, Conversion: 0, 'Customer Experience': 0, Automation: 0, Operations: 0, Data: 0, Integration: 0 };

    const website = value('website').toLowerCase();
    if (!website || website === 'no website' || website === 'none') score.Visibility += 4;
    if (value('websiteConversion') === 'none') score.Visibility += 3;
    if (value('websiteConversion') === 'low') score.Conversion += 4;

    if (value('enquiryRecording') === 'none') { score.Conversion += 4; score.Data += 3; }
    if (value('enquiryRecording') === 'manual') { score.Conversion += 2; score.Data += 2; }
    if (value('followUp') === 'memory') { score.Conversion += 4; score.Automation += 3; }
    if (value('followUp') === 'mixed') { score.Conversion += 2; score.Automation += 2; }

    if (value('contactMethod').includes('WhatsApp') || value('contactMethod').includes('Multiple')) score['Customer Experience'] += 2;
    if (value('orders') === 'manual') { score['Customer Experience'] += 3; score.Automation += 3; }
    if (value('orders') === 'partial') { score['Customer Experience'] += 2; score.Automation += 1; }

    if (value('customerData') === 'scattered') { score.Operations += 3; score.Data += 4; }
    if (value('customerData') === 'partial') { score.Operations += 1; score.Data += 2; }
    if (value('operationsSoftware') === 'none') score.Operations += 3;
    if (value('accounting') === 'none') score.Operations += 2;
    if (value('hr') === 'none') score.Operations += 1;
    if (value('crm') === 'no') { score.Operations += 2; score.Data += 2; }
    if (value('visibility') === 'no') score.Data += 4;
    if (value('visibility') === 'some') score.Data += 2;
    if (value('integrations') === 'no') score.Integration += 5;
    if (value('integrations') === 'some') score.Integration += 2;

    if (value('repetitiveTasks').length > 8) score.Automation += 3;
    if (value('bottleneck').length > 8) score.Operations += 2;

    return Object.entries(score).sort((a, b) => b[1] - a[1]).filter(([, s]) => s > 0).slice(0, 5);
  }

  const descriptions = {
    Visibility: 'Your digital presence may not yet make it easy enough for customers to find and understand the business.',
    Conversion: 'Enquiries and digital attention may not be moving through a clear, trackable path to action.',
    'Customer Experience': 'Customers may be waiting on manual responses or moving through unnecessary friction.',
    Automation: 'Routine tasks and follow-ups may be consuming time that can be handled more systematically.',
    Operations: 'Important work may still depend on informal or fragmented processes that become harder to scale.',
    Data: 'Business information may be scattered or difficult for management to turn into timely decisions.',
    Integration: 'Your tools may be operating as separate islands instead of sharing information automatically.'
  };

  async function storeAssessment(payload) {
    try {
      localStorage.setItem('kadzorisDigitalGapAssessment', JSON.stringify(payload));
    } catch (_) {}

    const leadPayload = {
      organization: payload.businessName,
      contactPerson: payload.contactName,
      phone: payload.phone,
      email: payload.email,
      industry: payload.industry,
      serviceNeeded: 'Digital Gap Assessment',
      currentWebsite: payload.website,
      message: JSON.stringify({ source: 'digital-gap-assessment', preliminaryGaps: payload.preliminaryGaps, answers: payload.answers }),
      submittedAt: payload.submittedAt,
      source: 'kadzoris.ng/digital-gap-assessment'
    };

    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadPayload)
      });
    } catch (_) {}
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    const ranked = scoreAssessment();
    const gaps = ranked.length ? ranked.map(([name]) => name) : ['Digital Strategy'];
    resultCategories.innerHTML = ranked.length
      ? ranked.map(([name]) => `<div class="result-category"><strong>${name}</strong><span>${descriptions[name]}</span></div>`).join('')
      : '<div class="result-category"><strong>Digital Strategy</strong><span>Your answers do not show one dominant gap. A short consultation can help identify where technology would create the most value.</span></div>';

    const answers = {};
    new FormData(form).forEach((v, k) => {
      if (answers[k]) answers[k] = Array.isArray(answers[k]) ? [...answers[k], v] : [answers[k], v];
      else answers[k] = v;
    });

    const payload = {
      businessName: value('businessName'), industry: value('industry'), website: value('website'),
      contactName: value('contactName'), phone: value('phone'), email: value('email'),
      preliminaryGaps: gaps, answers, submittedAt: new Date().toISOString()
    };

    submit.disabled = true;
    status.textContent = 'Preparing your preliminary result...';
    await storeAssessment(payload);

    const waText = `Hi Kadzoris, I completed the Digital Gap Assessment for ${payload.businessName}. My preliminary opportunity areas are: ${gaps.join(', ')}. I'd like to discuss which one could create the most value.`;
    whatsapp.href = `https://wa.me/2347071594483?text=${encodeURIComponent(waText)}`;

    form.hidden = true;
    document.querySelector('.assessment-progress-wrap').hidden = true;
    result.hidden = false;
    status.textContent = '';
    trackKadzorisEvent('digital_gap_completed', { gaps: gaps.join('|') });
    window.scrollTo({ top: Math.max(0, result.offsetTop - 120), behavior: 'smooth' });
  });

  renderStep();
});