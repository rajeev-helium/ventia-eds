const FIELD_TYPES = new Set(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'checkbox', 'radio']);

function parseConfig(block) {
  const config = { workerUrl: '', fields: [] };

  [...block.children].forEach((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    const [type, ...rest] = cells;

    if (type.toLowerCase() === 'worker-url') {
      config.workerUrl = rest[0] || '';
      return;
    }

    if (type.toLowerCase() === 'field') {
      const [name, fieldType, ...options] = rest;
      const isRequired = options.includes('required');
      const optionList = options.filter((o) => o !== 'required').join('').split(',').map((o) => o.trim())
        .filter(Boolean);
      config.fields.push({
        name, fieldType: fieldType?.toLowerCase() || 'text', required: isRequired, options: optionList,
      });
    }
  });

  return config;
}

function buildField({
  name, fieldType, required, options,
}) {
  if (!name || !FIELD_TYPES.has(fieldType)) return null;

  const id = `cf-${name.toLowerCase().replace(/\s+/g, '-')}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = name + (required ? ' *' : '');

  let input;

  if (fieldType === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 5;
  } else if (fieldType === 'select') {
    input = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `Select ${name}...`;
    placeholder.disabled = true;
    placeholder.selected = true;
    input.append(placeholder);
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      input.append(o);
    });
  } else {
    input = document.createElement('input');
    input.type = fieldType;
  }

  input.id = id;
  input.name = name.toLowerCase().replace(/\s+/g, '_');
  if (required) input.required = true;

  const wrapper = document.createElement('div');
  wrapper.className = 'contact-form-field';
  wrapper.append(label, input);
  return wrapper;
}

export default function decorate(block) {
  const config = parseConfig(block);
  block.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'contact-form-form';
  form.noValidate = true;

  config.fields.forEach((fieldDef) => {
    const field = buildField(fieldDef);
    if (field) form.append(field);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button accent';
  submit.textContent = 'Send message';
  form.append(submit);

  const status = document.createElement('div');
  status.className = 'contact-form-status';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('role', 'status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending...';
    status.textContent = '';
    status.className = 'contact-form-status';

    const data = Object.fromEntries(new FormData(form));

    try {
      const resp = await fetch(config.workerUrl || '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      form.reset();
      status.textContent = 'Thank you — your message has been sent. We\'ll be in touch shortly.';
      status.classList.add('is-success');
    } catch {
      status.textContent = 'Sorry, something went wrong. Please try again or call us directly.';
      status.classList.add('is-error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send message';
    }
  });

  block.append(form, status);
}
