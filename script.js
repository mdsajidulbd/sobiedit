// Utility: selector helpers
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

// Elements
const form = $('#orderForm');
const dropzone = $('#dropzone');
const fileInput = $('#photo');
const preview = $('#preview');
const previewImg = $('#previewImg');
const removeFileBtn = $('#removeFile');
const statusEl = $('#formStatus');
const yearEl = $('#year');

// Config
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Init year
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Dropzone interactions
const openFileDialog = () => fileInput && fileInput.click();

const setPreview = (file) => {
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  preview.hidden = false;
};

const clearPreview = () => {
  previewImg.src = '';
  preview.hidden = true;
  fileInput.value = '';
};

const validateFile = (file) => {
  if (!file) return 'Please select an image file.';
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported format. Use JPG, PNG, or WEBP.';
  if (file.size > MAX_BYTES) return 'File is too large. Max size is 20 MB.';
  return '';
};

dropzone?.addEventListener('click', openFileDialog);
dropzone?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openFileDialog();
  }
});

['dragenter', 'dragover'].forEach((evtName) => {
  dropzone?.addEventListener(evtName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((evtName) => {
  dropzone?.addEventListener(evtName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone?.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const file = dt?.files?.[0];
  const msg = validateFile(file);
  const errEl = document.querySelector('[data-error-for="photo"]');
  if (msg) {
    if (errEl) errEl.textContent = msg;
    clearPreview();
    return;
  }
  if (errEl) errEl.textContent = '';
  fileInput.files = dt.files;
  setPreview(file);
});

fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  const msg = validateFile(file);
  const errEl = document.querySelector('[data-error-for="photo"]');
  if (msg) {
    if (errEl) errEl.textContent = msg;
    clearPreview();
    return;
  }
  if (errEl) errEl.textContent = '';
  if (file) setPreview(file);
});

removeFileBtn?.addEventListener('click', clearPreview);

// Form validation helpers
const setError = (name, message) => {
  const err = document.querySelector(`[data-error-for="${name}"]`);
  if (err) err.textContent = message || '';
};

const validate = () => {
  let ok = true;
  const data = new FormData(form);

  const name = (data.get('name') || '').toString().trim();
  if (!name) { setError('name', 'Name is required.'); ok = false; } else setError('name');

  const email = (data.get('email') || '').toString().trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) { setError('email', 'Email is required.'); ok = false; }
  else if (!emailRe.test(email)) { setError('email', 'Enter a valid email.'); ok = false; }
  else setError('email');

  const service = (data.get('service') || '').toString();
  if (!service) { setError('service', 'Please select a service.'); ok = false; } else setError('service');

  const instructions = (data.get('instructions') || '').toString().trim();
  if (!instructions) { setError('instructions', 'Please add instructions.'); ok = false; } else setError('instructions');

  const file = fileInput.files?.[0];
  const fileErr = validateFile(file);
  if (fileErr) { setError('photo', fileErr); ok = false; } else setError('photo');

  return ok;
};

// EmailJS helper
const initEmailJS = () => {
  const formEl = form;
  if (!formEl) return { ok: false, reason: 'Form not found' };
  const serviceId = formEl.getAttribute('data-emailjs-service');
  const templateId = formEl.getAttribute('data-emailjs-template');
  const publicKey = formEl.getAttribute('data-emailjs-public');
  if (!serviceId || !templateId || !publicKey) return { ok: false, reason: 'Missing EmailJS config' };
  if (window.emailjs && !initEmailJS.initialized) {
    window.emailjs.init(publicKey);
    initEmailJS.initialized = true;
  }
  return { ok: true, serviceId, templateId };
};

// Submit handler
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';

  if (!validate()) {
    statusEl.textContent = 'Please fix the highlighted fields.';
    return;
  }

  const formData = new FormData(form);
  try {
    const cfg = initEmailJS();
    if (!cfg.ok) {
      // Fallback demo behavior
      await new Promise((r) => setTimeout(r, 900));
      statusEl.textContent = 'Request submitted (demo). Configure EmailJS to enable email sending.';
      form.reset();
      clearPreview();
      return;
    }

    statusEl.textContent = 'Sending...';
    await window.emailjs.sendForm(cfg.serviceId, cfg.templateId, form);
    statusEl.textContent = 'Request submitted! We\'ll email you shortly.';
    form.reset();
    clearPreview();
  } catch (err) {
    statusEl.textContent = 'Something went wrong submitting your request.';
  }
});


