const template = document.createElement('template');
template.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: block;
  font-family: var(--ui-font-family);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--ui-spacing-lg);
}

.form.loading {
  position: relative;
}

.form.loading .form-overlay {
  display: flex;
}

.form-overlay {
  display: none;
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(1px);
  align-items: center;
  justify-content: center;
  border-radius: var(--ui-radius-md);
  z-index: 10;
  font-size: var(--ui-font-size-md);
  color: var(--ui-color-text-secondary);
  gap: var(--ui-spacing-sm);
}

.form-overlay .loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--ui-color-text-secondary);
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fieldset {
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-md);
  padding: var(--ui-spacing-lg);
  margin-bottom: var(--ui-spacing-lg);
}

.fieldset-legend {
  padding: 0 var(--ui-spacing-sm);
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-semibold);
  color: var(--ui-color-text-primary);
  background: var(--ui-color-bg);
  margin-left: -var(--ui-spacing-xs);
}

.fieldset-body {
  display: flex;
  flex-direction: column;
  gap: var(--ui-spacing-md);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--ui-spacing-md);
}

.form-actions {
  display: flex;
  gap: var(--ui-spacing-sm);
  padding-top: var(--ui-spacing-md);
}
</style>
<form class="form" part="form">
  <slot></slot>
  <div class="form-overlay" part="overlay">
    <span class="loading-spinner"></span>
    <span>Processing...</span>
  </div>
  <div class="form-actions" part="actions">
    <slot name="actions"></slot>
  </div>
</form>
`;

const fieldsetTemplate = document.createElement('template');
fieldsetTemplate.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: block;
}

.fieldset {
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-md);
  padding: var(--ui-spacing-lg);
  margin-bottom: var(--ui-spacing-lg);
}

:host([disabled]) .fieldset {
  opacity: 0.6;
  pointer-events: none;
  border-color: var(--ui-color-text-disabled);
}

.fieldset-legend {
  padding: 0 var(--ui-spacing-sm);
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-semibold);
  color: var(--ui-color-text-primary);
  background: var(--ui-color-bg);
  margin-left: -var(--ui-spacing-xs);
}

:host([disabled]) .fieldset-legend {
  color: var(--ui-color-text-disabled);
}

.fieldset-body {
  display: flex;
  flex-direction: column;
  gap: var(--ui-spacing-md);
}
</style>
<fieldset class="fieldset" part="fieldset">
  <legend class="fieldset-legend" part="legend"></legend>
  <div class="fieldset-body" part="body">
    <slot></slot>
  </div>
</fieldset>
`;

export class MyForm extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'loading'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._form = this._shadowRoot.querySelector('.form');
    this._handleSlotChange = this._handleSlotChange.bind(this);
    this._handleFormSubmit = this._handleFormSubmit.bind(this);
    this._handleValidationChange = this._handleValidationChange.bind(this);
  }

  connectedCallback() {
    this._form.addEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.addEventListener('slotchange', this._handleSlotChange);
    this.addEventListener('validate', this._handleValidationChange);
    this._syncState();
  }

  disconnectedCallback() {
    this._form.removeEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.removeEventListener('slotchange', this._handleSlotChange);
    this.removeEventListener('validate', this._handleValidationChange);
  }

  attributeChangedCallback() {
    this._syncState();
  }

  _syncState() {
    if (!this._form) return;
    const disabled = this.disabled;
    const loading = this.loading;
    if (loading) {
      this._form.classList.add('loading');
    } else {
      this._form.classList.remove('loading');
    }
    this._getFields().forEach(field => {
      if (disabled || loading) field.setAttribute('disabled', '');
      else field.removeAttribute('disabled');
    });
    this._getFieldsets().forEach(fieldset => {
      if (disabled || loading) fieldset.setAttribute('disabled', '');
      else fieldset.removeAttribute('disabled');
    });
  }

  _handleSlotChange() {}

  _handleFormSubmit(e) {
    e.preventDefault();
    this.submit();
  }

  _handleValidationChange(e) {
    if (e.target !== this) {
      this.dispatchEvent(new CustomEvent('validation-change', {
        bubbles: true,
        composed: true,
        detail: e.detail
      }));
    }
  }

  _getFields() {
    return Array.from(this.querySelectorAll('my-input, my-select, my-textarea, my-button'));
  }

  _getFieldsets() {
    return Array.from(this.querySelectorAll('my-fieldset'));
  }

  _getFieldValue(field) {
    const name = field.getAttribute('name') || field.label || '';
    if (field.tagName === 'MY-SELECT' && field.multiple) {
      const values = field.values || [];
      return { name, value: field.value, values };
    }
    return { name, value: field.value || '' };
  }

  validate() {
    const fields = this._getFields();
    const results = [];
    let allValid = true;
    let firstInvalid = null;

    fields.forEach(field => {
      if (typeof field.validate === 'function') {
        const result = field.validate();
        results.push({
          field,
          name: field.getAttribute('name') || field.label || '',
          ...result
        });
        if (!result.valid) {
          allValid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      }
    });

    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }

    const event = new CustomEvent('validate', {
      bubbles: true,
      composed: true,
      detail: { valid: allValid, results }
    });
    this.dispatchEvent(event);

    return { valid: allValid, results };
  }

  reset() {
    const fields = this._getFields();
    fields.forEach(field => {
      if (typeof field.reset === 'function') {
        field.reset();
      }
    });
    this.dispatchEvent(new CustomEvent('reset', {
      bubbles: true,
      composed: true
    }));
  }

  resetValidation() {
    const fields = this._getFields();
    fields.forEach(field => {
      if (typeof field.resetValidation === 'function') {
        field.resetValidation();
      }
    });
  }

  submit(callback) {
    const { valid, results } = this.validate();
    const formData = {};
    this._getFields().forEach(field => {
      const { name, value } = this._getFieldValue(field);
      if (name) formData[name] = value;
    });

    const invalidFields = results
      .filter(r => !r.valid)
      .map(r => r.name);
    const errors = {};
    results
      .filter(r => !r.valid)
      .forEach(r => { errors[r.name] = r.message; });

    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: invalidFields.length,
      invalidFields,
      errors
    };

    const event = new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { valid, formData, results, summary }
    });
    this.dispatchEvent(event);

    if (valid) {
      this.dispatchEvent(new CustomEvent('valid-submit', {
        bubbles: true,
        composed: true,
        detail: { formData }
      }));

      if (typeof callback === 'function') {
        this.loading = true;
        (async () => {
          try {
            const result = await callback(formData);
            if (result) {
              this.dispatchEvent(new CustomEvent('submit-success', {
                bubbles: true,
                composed: true,
                detail: { formData, result }
              }));
            }
          } catch (error) {
            this.dispatchEvent(new CustomEvent('submit-error', {
              bubbles: true,
              composed: true,
              detail: { formData, error }
            }));
          } finally {
            this.loading = false;
          }
        })();
      }
    }

    return { valid, formData, results, summary };
  }

  getFormData() {
    const formData = {};
    this._getFields().forEach(field => {
      const { name, value } = this._getFieldValue(field);
      if (name) formData[name] = value;
    });
    return formData;
  }

  setFieldValue(name, value) {
    const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
      .find(f => f.getAttribute('name') === name);
    if (field) {
      field.value = value;
    }
  }

  getFieldValue(name) {
    const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
      .find(f => f.getAttribute('name') === name);
    if (!field) return undefined;
    const { value } = this._getFieldValue(field);
    return value;
  }

  setFieldError(name, error) {
    const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
      .find(f => f.getAttribute('name') === name);
    if (field) {
      field.error = error;
    }
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
}

export class MyFieldset extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'disabled'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(fieldsetTemplate.content.cloneNode(true));
    this._legend = this._shadowRoot.querySelector('.fieldset-legend');
  }

  connectedCallback() {
    this._syncTitle();
  }

  attributeChangedCallback(name) {
    if (name === 'title') {
      this._syncTitle();
    }
  }

  _syncTitle() {
    if (this._legend) {
      this._legend.textContent = this.title || '';
    }
  }

  get title() { return this.getAttribute('title'); }
  set title(val) { val ? this.setAttribute('title', val) : this.removeAttribute('title'); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
}

customElements.define('my-form', MyForm);
customElements.define('my-fieldset', MyFieldset);
