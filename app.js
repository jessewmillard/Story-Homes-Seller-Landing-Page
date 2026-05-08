/**
 * StoryHomes — Seller Lead Flow
 * Fullscreen multi-step experience
 */

'use strict';

/* ─── State ─── */
const state = {
  currentStep: 1,
  totalSteps: 4, // steps 1-4 (step 5 is confirmation)
  isTransitioning: false,
  formData: {
    // Address
    street_address: '',
    apt_unit: '',
    city: '',
    state: 'California',
    zip: '',
    // Property details
    property_type: '',
    condition: '',
    occupancy: '',
    timeline: '',
    // Contact
    full_name: '',
    email: '',
    phone: '',
    // UTM
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    // Meta
    timestamp: '',
    theme: ''
  }
};

/* ─── DOM ─── */
const $ = (id) => document.getElementById(id);

const els = {
  progressWrap: $('progress-wrap'),
  progressFill: $('progress-fill'),
  progressLabel: $('progress-label'),
  themeBtn: $('theme-btn'),
  btnHeaderCta: $('btn-header-cta'),
  btnStart: $('btn-start'),
  btnStep2: $('btn-step2'),
  btnStep3: $('btn-step3'),
  btnSubmit: $('btn-submit'),
  streetAddress: $('street-address'),
  city: $('city'),
  state: $('state'),
  zip: $('zip'),
  fullName: $('full-name'),
  email: $('email'),
  phone: $('phone'),
  acDropdown: $('ac-dropdown'),
};

/* ─── Theme ─── */
function getTheme() {
  return localStorage.getItem('sh-theme') || 'dark';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sh-theme', theme);
  state.formData.theme = theme;
}
function toggleTheme() {
  const next = getTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next);
}
applyTheme(getTheme());
els.themeBtn.addEventListener('click', toggleTheme);

/* ─── UTM Capture ─── */
function captureUTM() {
  const params = new URLSearchParams(window.location.search);
  const fields = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  fields.forEach(k => {
    if (params.has(k)) state.formData[k] = params.get(k);
  });
}
captureUTM();

/* ─── Step Navigation ─── */
function getStepEl(n) {
  return document.querySelector(`#step-${n}`);
}

function updateProgress(stepNum) {
  const isHero = stepNum === 1;
  els.progressWrap.classList.toggle('visible', !isHero);
  document.querySelector('.app-header').classList.toggle('on-hero', isHero);
  if (!isHero) {
    const pct = ((stepNum - 1) / state.totalSteps) * 100;
    els.progressFill.style.width = pct + '%';
    els.progressLabel.textContent = `Step ${stepNum - 1} of ${state.totalSteps}`;
  }
}

function goToStep(targetStep) {
  if (state.isTransitioning) return;
  if (targetStep === state.currentStep) return;
  state.isTransitioning = true;

  const from = getStepEl(state.currentStep);
  const to = getStepEl(targetStep);
  const goingForward = targetStep > state.currentStep;

  // Stage the incoming step off-screen (right or left)
  to.classList.remove('active', 'exit-left', 'enter-right');
  if (goingForward) {
    to.style.transform = 'translateX(40px)';
  } else {
    to.style.transform = 'translateX(-40px)';
  }
  to.style.opacity = '0';
  to.style.pointerEvents = 'none';

  // Force reflow
  void to.offsetHeight;

  // Exit the current step
  from.classList.remove('active');
  if (goingForward) {
    from.style.transform = 'translateX(-40px)';
  } else {
    from.style.transform = 'translateX(40px)';
  }
  from.style.opacity = '0';
  from.style.pointerEvents = 'none';

  // Enter the target step
  to.style.transform = 'translateX(0)';
  to.style.opacity = '1';
  to.style.pointerEvents = 'auto';
  to.classList.add('active');

  state.currentStep = targetStep;
  updateProgress(targetStep);

  setTimeout(() => {
    from.style.transform = '';
    from.style.opacity = '';
    from.style.pointerEvents = '';
    state.isTransitioning = false;

    // Scroll new step to top
    to.scrollTop = 0;

    // Focus first input if any
    const firstInput = to.querySelector('input:not([readonly])');
    if (firstInput) firstInput.focus();
  }, 420);
}

/* ─── Expose goToStep globally (used by back buttons) ─── */
window.goToStep = goToStep;

/* ─── Start button ─── */
els.btnStart.addEventListener('click', () => goToStep(2));
els.btnHeaderCta.addEventListener('click', () => goToStep(2));

/* ─── Back buttons ─── */
document.querySelectorAll('.btn-back[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => {
    goToStep(parseInt(btn.dataset.goto, 10));
  });
});

/* ─── Validation helpers ─── */
function setError(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
}
function clearError(id) { setError(id, ''); }

function markInputError(input, hasError) {
  input.classList.toggle('is-error', hasError);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v) {
  return v.replace(/\D/g, '').length >= 10;
}

function isValidZip(v) {
  return /^\d{5}$/.test(v.trim());
}

/* ─── Phone Formatter ─── */
els.phone.addEventListener('input', () => {
  let digits = els.phone.value.replace(/\D/g, '').slice(0, 10);
  let formatted = '';
  if (digits.length > 0) formatted = '(' + digits.slice(0, 3);
  if (digits.length >= 4) formatted += ') ' + digits.slice(3, 6);
  if (digits.length >= 7) formatted += '-' + digits.slice(6);
  els.phone.value = formatted;
});

/* ─── Zip digits only ─── */
els.zip.addEventListener('input', () => {
  els.zip.value = els.zip.value.replace(/\D/g, '').slice(0, 5);
});

/* ─── Step 2 Validation ─── */
function validateStep2() {
  let valid = true;

  const street = els.streetAddress.value.trim();
  if (!street) {
    setError('err-street', 'Please enter a street address.');
    markInputError(els.streetAddress, true);
    valid = false;
  } else {
    clearError('err-street');
    markInputError(els.streetAddress, false);
  }

  const city = els.city.value.trim();
  if (!city) {
    setError('err-city', 'Please enter a city.');
    markInputError(els.city, true);
    valid = false;
  } else {
    clearError('err-city');
    markInputError(els.city, false);
  }

  const zip = els.zip.value.trim();
  if (!isValidZip(zip)) {
    setError('err-zip', 'Enter a valid 5-digit ZIP.');
    markInputError(els.zip, true);
    valid = false;
  } else {
    clearError('err-zip');
    markInputError(els.zip, false);
  }

  return valid;
}

els.btnStep2.addEventListener('click', () => {
  if (!validateStep2()) return;
  state.formData.street_address = els.streetAddress.value.trim();
  state.formData.apt_unit       = (document.getElementById('apt-unit')?.value || '').trim();
  state.formData.city = els.city.value.trim();
  state.formData.zip = els.zip.value.trim();
  goToStep(3);
});

/* ─── Selection Cards ─── */
document.querySelectorAll('.sel-card').forEach(card => {
  card.addEventListener('click', () => {
    const group = card.dataset.group;
    // Deselect all in group
    document.querySelectorAll(`.sel-card[data-group="${group}"]`).forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    // Select this card
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
    // Store in state
    state.formData[group] = card.dataset.value;
    // Clear error
    const errMap = {
      property_type: 'err-type',
      condition: 'err-cond',
      occupancy: 'err-occ',
      timeline: 'err-time'
    };
    if (errMap[group]) clearError(errMap[group]);
  });
});

/* ─── Step 3 Validation ─── */
function validateStep3() {
  let valid = true;
  const checks = [
    { key: 'property_type', errId: 'err-type', msg: 'Please select a property type.' },
    { key: 'condition',     errId: 'err-cond', msg: 'Please select the current condition.' },
    { key: 'occupancy',     errId: 'err-occ',  msg: 'Please select who occupies the property.' },
    { key: 'timeline',      errId: 'err-time', msg: 'Please select your target timeline.' },
  ];
  checks.forEach(({ key, errId, msg }) => {
    if (!state.formData[key]) {
      setError(errId, msg);
      valid = false;
    } else {
      clearError(errId);
    }
  });
  return valid;
}

els.btnStep3.addEventListener('click', () => {
  if (!validateStep3()) {
    // Scroll to first error
    const firstErr = document.querySelector('#step-3 .field-error:not(:empty)');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  goToStep(4);
});

/* ─── Step 4 Validation ─── */
function validateStep4() {
  let valid = true;

  const name = els.fullName.value.trim();
  if (name.length < 2) {
    setError('err-name', 'Please enter your full name.');
    markInputError(els.fullName, true);
    valid = false;
  } else {
    clearError('err-name');
    markInputError(els.fullName, false);
  }

  const email = els.email.value.trim();
  if (!isValidEmail(email)) {
    setError('err-email', 'Please enter a valid email address.');
    markInputError(els.email, true);
    valid = false;
  } else {
    clearError('err-email');
    markInputError(els.email, false);
  }

  const phone = els.phone.value.trim();
  if (!isValidPhone(phone)) {
    setError('err-phone', 'Please enter a valid 10-digit phone number.');
    markInputError(els.phone, true);
    valid = false;
  } else {
    clearError('err-phone');
    markInputError(els.phone, false);
  }

  return valid;
}

/* ─── Form Submission ─── */
function buildPayload() {
  state.formData.full_name  = els.fullName.value.trim();
  state.formData.email      = els.email.value.trim();
  state.formData.phone      = els.phone.value.trim();
  state.formData.timestamp  = new Date().toISOString();
  state.formData.theme      = getTheme();

  // Clean payload for webhook/Sheets
  return {
    timestamp:       state.formData.timestamp,
    full_name:       state.formData.full_name,
    email:           state.formData.email,
    phone:           state.formData.phone,
    street_address:  state.formData.street_address,
    apt_unit:        state.formData.apt_unit,
    city:            state.formData.city,
    state:           state.formData.state,
    zip:             state.formData.zip,
    property_type:   state.formData.property_type,
    condition:       state.formData.condition,
    occupancy:       state.formData.occupancy,
    timeline:        state.formData.timeline,
    utm_source:      state.formData.utm_source,
    utm_medium:      state.formData.utm_medium,
    utm_campaign:    state.formData.utm_campaign,
    utm_content:     state.formData.utm_content,
    utm_term:        state.formData.utm_term,
  };
}

async function submitForm(payload) {
  /**
   * Replace WEBHOOK_URL with your endpoint:
   *   Google Sheets via Make / Zapier webhook
   *   Or direct Google Apps Script Web App URL
   *
   * Example:
   *   const WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/...';
   *   const WEBHOOK_URL = 'https://script.google.com/macros/s/.../exec';
   */
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyJ7_pYP4er0Vjf3LjLtYvUVG8T40f453ubBTgBqebbyQuylnWUIQTWUD9C_kA-4TLT7w/exec';

  if (!WEBHOOK_URL) {
    console.info('[Story Homes] Form payload (no webhook configured):', payload);
    // Simulate network delay in development
    await new Promise(r => setTimeout(r, 1200));
    return;
  }

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}

els.btnSubmit.addEventListener('click', async () => {
  if (!validateStep4()) return;

  const payload = buildPayload();

  // Loading state
  els.btnSubmit.classList.add('loading');
  els.btnSubmit.disabled = true;

  try {
    await submitForm(payload);
    goToStep(5);
  } catch (err) {
    console.error('[Story Homes] Submission error:', err);
    // Surface a gentle error without alarming the user
    setError('err-phone', 'Something went wrong. Please try again or call us directly.');
  } finally {
    els.btnSubmit.classList.remove('loading');
    els.btnSubmit.disabled = false;
  }
});

/* ─── Address Autocomplete ─── */

(function setupAutocomplete() {
  let debounceTimer = null;

  function showDropdown(suggestions) {
    const dd = els.acDropdown;
    dd.innerHTML = '';
    if (!suggestions.length) { dd.classList.remove('open'); return; }
    suggestions.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'ac-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', `ac-opt-${i}`);
      li.innerHTML = `
        <span class="ac-item-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <span class="ac-item-text">
          <span class="ac-item-main">${escapeHtml(s.main)}</span>
          ${s.sub ? `<span class="ac-item-sub">${escapeHtml(s.sub)}</span>` : ''}
        </span>
      `;
      li.addEventListener('mousedown', (e) => { e.preventDefault(); selectSuggestion(s); });
      dd.appendChild(li);
    });
    dd.classList.add('open');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function selectSuggestion(s) {
    els.acDropdown.classList.remove('open');
    els.streetAddress.value = s.street || s.main;
    if (s.city) els.city.value = s.city;
    if (s.zip)  els.zip.value  = s.zip;

    // Fetch full address components when a Google place_id is available
    if (s.place_id) {
      try {
        const resp = await fetch(`/.netlify/functions/places?place_id=${encodeURIComponent(s.place_id)}`);
        const data = await resp.json();
        const comps = data.result?.address_components;
        if (comps) {
          const get      = (t) => (comps.find(c => c.types.includes(t)) || {}).long_name  || '';
          const getShort = (t) => (comps.find(c => c.types.includes(t)) || {}).short_name || '';
          const streetNum  = get('street_number');
          const streetName = get('route');
          const city = get('locality') || get('sublocality') || get('neighborhood');
          const zip  = getShort('postal_code');
          if (streetNum && streetName) els.streetAddress.value = `${streetNum} ${streetName}`;
          if (city) els.city.value = city;
          if (zip)  els.zip.value  = zip;
        }
      } catch (_) { /* keep whatever was pre-filled */ }
    }

    clearError('err-street'); clearError('err-city'); clearError('err-zip');
    markInputError(els.streetAddress, false);
    markInputError(els.city, false);
    markInputError(els.zip, false);
  }

  async function fetchGoogleSuggestions(query) {
    const resp = await fetch(`/.netlify/functions/places?input=${encodeURIComponent(query)}`);
    const data = await resp.json();
    if (!data.predictions?.length) return [];
    return data.predictions.slice(0, 5).map(p => ({
      main:     p.structured_formatting?.main_text      || p.description,
      sub:      p.structured_formatting?.secondary_text || '',
      place_id: p.place_id,
    }));
  }

  async function fetchCensusSuggestions(query) {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query + ', California')}&benchmark=Public_AR_Current&format=json`;
    const resp = await fetch(url);
    const data = await resp.json();
    const matches = data?.result?.addressMatches || [];
    return matches.slice(0, 5).map(m => ({
      main: m.matchedAddress,
      sub:  null,
      street: m.addressComponents?.fromAddress
        ? `${m.addressComponents.fromAddress} ${m.addressComponents.streetName}${m.addressComponents.suffixType ? ' ' + m.addressComponents.suffixType : ''}`
        : null,
      city: m.addressComponents?.city || null,
      zip:  m.addressComponents?.zip  || null,
    }));
  }

  els.streetAddress.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = els.streetAddress.value.trim();
    if (q.length < 4) { els.acDropdown.classList.remove('open'); return; }

    debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await fetchGoogleSuggestions(q);
        showDropdown(suggestions);
      } catch (_) {
        // Google proxy unavailable — fall back to Census Bureau
        try {
          const suggestions = await fetchCensusSuggestions(q);
          showDropdown(suggestions);
        } catch (_) {
          els.acDropdown.classList.remove('open');
        }
      }
    }, 380);
  });

  els.streetAddress.addEventListener('blur', () => {
    setTimeout(() => els.acDropdown.classList.remove('open'), 180);
  });

  els.streetAddress.addEventListener('keydown', (e) => {
    const items = els.acDropdown.querySelectorAll('.ac-item');
    let focused = els.acDropdown.querySelector('.ac-item.focused');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!focused) { items[0].classList.add('focused'); }
      else {
        focused.classList.remove('focused');
        const next = focused.nextElementSibling;
        if (next) next.classList.add('focused');
        else items[0].classList.add('focused');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focused) {
        focused.classList.remove('focused');
        const prev = focused.previousElementSibling;
        if (prev) prev.classList.add('focused');
      }
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      focused.dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      els.acDropdown.classList.remove('open');
    }
  });
})();

/* ─── Clear input errors on change ─── */
[
  [els.streetAddress, 'err-street'],
  [els.city,          'err-city'],
  [els.zip,           'err-zip'],
  [els.fullName,      'err-name'],
  [els.email,         'err-email'],
  [els.phone,         'err-phone'],
].forEach(([input, errId]) => {
  input.addEventListener('input', () => {
    if (input.classList.contains('is-error')) {
      clearError(errId);
      markInputError(input, false);
    }
  });
});

/* ─── Hero Video Fade-in ───
   Uses WAAPI (same as the rotating word) to bypass the global CSS
   transition rule that would otherwise override opacity animation. */
(function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  function fadeIn() {
    video.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 2000, easing: 'ease', fill: 'forwards' }
    );
  }

  if (video.readyState >= 3) {
    // Already buffered enough — fire immediately
    fadeIn();
  } else {
    video.addEventListener('canplay', fadeIn, { once: true });
  }
})();

/* ─── Rotating Word Animation ───
   Uses the Web Animations API so the browser honours opacity/transform
   animations regardless of CSS cascade specificity. */
(function initRotatingWord() {
  const el = document.getElementById('rotating-word');
  if (!el) return;

  const outerEl = el.parentElement; // .rw-outer
  // Period is baked into each word so the container width accounts for it.
  // "closed date" removed — too wide for the text column at medium viewports.
  const words = ['terms.', 'timeline.', 'schedule.'];
  let idx = 0;
  let busy = false;

  /* ── Lock container width to the widest word ──
     Renders each word invisibly, measures it, then sets min-width on the
     outer container. The container never changes size, so the headline and
     everything below it never reflow during animation. */
  function calibrateWidth() {
    let maxW = 0;
    words.forEach(word => {
      el.textContent = word;
      maxW = Math.max(maxW, el.getBoundingClientRect().width);
    });
    outerEl.style.minWidth = Math.ceil(maxW) + 'px';
    el.textContent = words[0];
  }

  calibrateWidth();

  // Re-calibrate on resize since the font size is viewport-relative (clamp + vw).
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(calibrateWidth, 150);
  });

  async function rotate() {
    if (busy) return;
    busy = true;
    idx = (idx + 1) % words.length;

    /* ── Exit: slide up and fade out ── */
    const exitAnim = el.animate(
      [
        { opacity: 1, transform: 'translateY(0px)' },
        { opacity: 0, transform: 'translateY(-10px)' }
      ],
      { duration: 320, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
    );
    await exitAnim.finished;

    if (typeof exitAnim.commitStyles === 'function') {
      exitAnim.commitStyles();
    } else {
      el.style.opacity = '0';
    }
    exitAnim.cancel();
    el.textContent = words[idx];

    /* ── Enter: glide in from below ── */
    const enterAnim = el.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0px)' }
      ],
      { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
    await enterAnim.finished;

    el.style.opacity = '';
    el.style.transform = '';
    busy = false;
  }

  setInterval(rotate, 3500);
})();

/* ─── Final CTA button ─── */
['btn-comp-cta', 'btn-process-cta'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => goToStep(2), 350);
  });
});

const btnFinalCta = document.getElementById('btn-final-cta');
if (btnFinalCta) {
  btnFinalCta.addEventListener('click', () => {
    // Scroll back to top first, then trigger the flow
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => goToStep(2), 350);
  });
}

/* ─── Scroll reveal ───
   Uses IntersectionObserver to add `.revealed` class when elements
   enter the viewport, triggering the @keyframes reveal-up animation. */
(function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
})();

/* ─── Parallax — atmosphere image ───
   Subtle translateY on the building image as user scrolls.
   Intentionally gentle: max 30px shift, which reads as cinematic depth
   without distracting from the rest of the page. */
(function initParallax() {
  const targets = [
    { img: document.getElementById('atm-image'), section: document.querySelector('.atm-section') },
  ].filter(t => t.img && t.section);

  if (!targets.length) return;

  function updateParallax() {
    const viewH = window.innerHeight;
    targets.forEach(({ img, section }) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewH) return;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 60;
      img.style.transform = `translateY(${shift}px)`;
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
})();


/* ─── Count-up animation ─── */
(function initCountUp() {
  const counters = document.querySelectorAll('.metric-count[data-target]');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const raw = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - raw, 4);
        el.textContent = Math.round(ease * target);
        if (raw < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });

  counters.forEach(c => io.observe(c));
})();

/* ─── FAQ accordion ─── */
(function initFAQ() {
  const OPEN_MS = 300, CLOSE_MS = 240;
  const OPEN_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const CLOSE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

  function closeItem(trigger) {
    const body = trigger.nextElementSibling;
    const chevron = trigger.querySelector('.faq-chevron');
    trigger.setAttribute('aria-expanded', 'false');
    const h = body.getBoundingClientRect().height;
    body.animate([{ height: h + 'px' }, { height: '0px' }],
      { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' });
    chevron.animate([{ transform: 'rotate(180deg)' }, { transform: 'rotate(0deg)' }],
      { duration: CLOSE_MS, easing: CLOSE_EASE, fill: 'forwards' });
  }

  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const body = trigger.nextElementSibling;
      const chevron = trigger.querySelector('.faq-chevron');

      // Close any open sibling
      document.querySelectorAll('.faq-trigger[aria-expanded="true"]').forEach(other => {
        if (other !== trigger) closeItem(other);
      });

      if (expanded) {
        closeItem(trigger);
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        const naturalH = body.scrollHeight;
        body.animate([{ height: '0px' }, { height: naturalH + 'px' }],
          { duration: OPEN_MS, easing: OPEN_EASE, fill: 'forwards' });
        chevron.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }],
          { duration: OPEN_MS, easing: OPEN_EASE, fill: 'forwards' });
      }
    });
  });
})();

/* ─── Nav active section tracking ─── */
(function initNavActive() {
  const navLinks = document.querySelectorAll('.nav-link');
  if (!navLinks.length) return;

  const sections = ['reviews', 'why-story-homes', 'how-it-works', 'faq', 'get-started']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('nav-link--active', link.getAttribute('href') === '#' + id);
      });
    });
  }, { threshold: 0.35 });

  sections.forEach(s => io.observe(s));
})();

/* ─── Hamburger menu ─── */
(function initHamburger() {
  const btn    = document.getElementById('hamburger-btn');
  const nav    = document.getElementById('mobile-nav');
  const mobCta = document.getElementById('mob-get-started');
  if (!btn || !nav) return;

  let open = false;

  function openMenu() {
    open = true;
    nav.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    nav.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 240, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' });
  }

  function closeMenu() {
    open = false;
    btn.setAttribute('aria-expanded', 'false');
    const anim = nav.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }],
      { duration: 200, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' });
    anim.onfinish = () => { nav.hidden = true; };
  }

  btn.addEventListener('click', () => open ? closeMenu() : openMenu());

  // Close on any nav link click
  nav.querySelectorAll('.mob-nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Mobile Get Started CTA
  if (mobCta) {
    mobCta.addEventListener('click', () => {
      closeMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => goToStep(2), 400);
    });
  }

  // Close on outside tap
  document.addEventListener('click', e => {
    if (open && !nav.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });
})();

/* ─── City links ─── */
(function initCityLinks() {
  const list      = document.getElementById('cities-list');
  const cityInput = document.getElementById('btm-city');
  const heading   = document.querySelector('#get-started .step-head h2');
  const DEFAULT   = 'Where is your property?';

  function syncHeading(city) {
    if (!heading) return;
    heading.textContent = city.trim() ? `Where in ${city.trim()}?` : DEFAULT;
  }

  if (list) {
    list.addEventListener('click', e => {
      const link = e.target.closest('.city-link');
      if (!link) return;
      const city = link.dataset.city;
      if (cityInput) cityInput.value = city;
      syncHeading(city);
      // Scroll handled by href="#get-started"
    });
  }

  if (cityInput) {
    cityInput.addEventListener('input', () => {
      if (!cityInput.value.trim()) syncHeading('');
    });
  }
})();

/* ─── Bottom address form (final CTA) ─── */
(function initBtmForm() {
  const btn = document.getElementById('btn-btm-continue');
  if (!btn) return;
  const btmStreet = document.getElementById('btm-street');
  const btmErrStreet = document.createElement('span');
  btmErrStreet.className = 'field-error';
  btmStreet.parentNode.appendChild(btmErrStreet);

  btn.addEventListener('click', () => {
    const street = btmStreet.value.trim();
    if (!street) {
      btmErrStreet.textContent = 'Please enter a street address.';
      btmStreet.classList.add('is-error');
      btmStreet.focus();
      return;
    }
    btmErrStreet.textContent = '';
    btmStreet.classList.remove('is-error');

    // Pre-fill step 2 inputs, then always land on step 2 so the
    // Continue button runs and saves the address to state.formData.
    document.getElementById('street-address').value = street;
    const city = document.getElementById('btm-city').value.trim();
    const zip  = document.getElementById('btm-zip').value.trim();
    const apt  = document.getElementById('btm-apt').value.trim();
    if (city) document.getElementById('city').value = city;
    if (zip)  document.getElementById('zip').value  = zip;
    if (apt)  document.getElementById('apt-unit').value = apt;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => goToStep(2), 380);
  });

  btmStreet.addEventListener('input', () => {
    if (btmStreet.classList.contains('is-error')) {
      btmErrStreet.textContent = '';
      btmStreet.classList.remove('is-error');
    }
  });
})();

/* ─── Init ─── */
updateProgress(1);
