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

.form-actions {
  display: flex;
  gap: var(--ui-spacing-sm);
  padding-top: var(--ui-spacing-md);
}
</style>
<form class="form" part="form">
  <slot></slot>
  <div class="form-actions" part="actions">
    <slot name="actions"></slot>
  </div>
</form>
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
  }

  connectedCallback() {
    this._form.addEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.addEventListener('slotchange', this._handleSlotChange);
  }

  disconnectedCallback() {
    this._form.removeEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.removeEventListener('slotchange', this._handleSlotChange);
  }

  attributeChangedCallback() {
    if (!this._form) return;
    const disabled = this.disabled;
    const loading = this.loading;
    this._getFields().forEach(field => {
      if (disabled) field.setAttribute('disabled', '');
      else field.removeAttribute('disabled');
    });
  }

  _handleSlotChange() {}

  _handleFormSubmit(e) {
    e.preventDefault();
    this.submit();
  }

  _getFields() {
    return Array.from(this.querySelectorAll('my-input, my-select, my-textarea'));
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

  submit() {
    const { valid, results } = this.validate();
    const formData = {};
    this._getFields().forEach(field => {
      const { name, value } = this._getFieldValue(field);
      if (name) formData[name] = value;
    });

    const event = new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { valid, formData, results }
    });
    this.dispatchEvent(event);

    if (valid) {
      this.dispatchEvent(new CustomEvent('valid-submit', {
        bubbles: true,
        composed: true,
        detail: { formData }
      }));
    }

    return { valid, formData, results };
  }

  getFormData() {
    const formData = {};
    this._getFields().forEach(field => {
      const { name, value } = this._getFieldValue(field);
      if (name) formData[name] = value;
    });
    return formData;
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
}

customElements.define('my-form', MyForm);
