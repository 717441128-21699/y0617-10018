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
    return ['disabled', 'loading', 'submit-changes-only'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._form = this._shadowRoot.querySelector('.form');
    this._handleSlotChange = this._handleSlotChange.bind(this);
    this._handleFormSubmit = this._handleFormSubmit.bind(this);
    this._handleValidationChange = this._handleValidationChange.bind(this);
    this._initialValues = {};
    this._fieldOriginalStates = new Map();
    this._buttonOriginalStates = new Map();
    this._initialValuesCaptured = false;
    this._setInitialValuesCalled = false;
    this._hadValidationErrors = false;
  }

  connectedCallback() {
    this._form.addEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.addEventListener('slotchange', this._handleSlotChange);
    this.addEventListener('validate', this._handleValidationChange);
    this._captureInitialValues();
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

  _captureInitialValues() {
    const fields = this._getFields();
    fields.forEach(field => {
      const name = field.getAttribute('name');
      if (name) {
        let value = field.value || '';
        if (field.tagName === 'MY-SELECT' && field.multiple) {
          const values = field.values || [];
          value = values.join(',');
        }
        this._initialValues[name] = value;
      }
    });
    this._initialValuesCaptured = true;
  }

  setInitialValues(values) {
    this._setInitialValuesCalled = true;
    this._initialValues = { ...values };
    Object.keys(values).forEach(name => {
      let val = values[name];
      const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
        .find(f => f.getAttribute('name') === name);
      if (field) {
        if (field.tagName === 'MY-SELECT' && field.multiple && Array.isArray(val)) {
          val = val.join(',');
        }
        this.setFieldValue(name, val);
      } else {
        this._initialValues[name] = Array.isArray(val) ? val.join(',') : val;
      }
    });
    this._renderChanged();
  }

  _normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  _compareValues(a, b) {
    const normA = this._normalizeValue(a);
    const normB = this._normalizeValue(b);
    return normA === normB;
  }

  get isDirty() {
    const fields = this._getFields();
    for (const field of fields) {
      const name = field.getAttribute('name');
      if (!name) continue;
      let currentValue = field.value || '';
      if (field.tagName === 'MY-SELECT' && field.multiple) {
        const values = field.values || [];
        currentValue = values.join(',');
      }
      const initialValue = this._initialValues[name] || '';
      if (!this._compareValues(currentValue, initialValue)) {
        return true;
      }
    }
    return false;
  }

  getDirtyFields() {
    const dirty = [];
    const fields = this._getFields();
    fields.forEach(field => {
      const name = field.getAttribute('name');
      if (!name) return;
      let currentValue = field.value || '';
      if (field.tagName === 'MY-SELECT' && field.multiple) {
        const values = field.values || [];
        currentValue = values.join(',');
      }
      const initialValue = this._initialValues[name] || '';
      if (!this._compareValues(currentValue, initialValue)) {
        dirty.push(name);
      }
    });
    return dirty;
  }

  _getFieldLabel(field, value) {
    if (field.tagName === 'MY-SELECT' && typeof field.getSelectedLabels === 'function') {
      const labels = field.getSelectedLabels();
      if (Array.isArray(labels)) {
        return labels.join(', ');
      }
      return labels || value;
    }
    return value;
  }

  getChangedValues() {
    const changed = {};
    const dirtyFields = this.getDirtyFields();
    dirtyFields.forEach(name => {
      const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
        .find(f => f.getAttribute('name') === name);
      if (!field) return;

      let currentValue = field.value || '';
      if (field.tagName === 'MY-SELECT' && field.multiple) {
        const values = field.values || [];
        currentValue = values.join(',');
      }
      const oldValue = this._initialValues[name] || '';

      const entry = {
        oldValue: oldValue,
        newValue: currentValue
      };

      if (field.tagName === 'MY-SELECT') {
        entry.newLabel = this._getFieldLabel(field, currentValue);
        if (typeof field.getSelectedLabels === 'function') {
          const tempField = field;
          const origValue = field.value;
          const origValues = field.values ? [...field.values] : null;
          if (field.multiple && Array.isArray(oldValue.split(','))) {
            const oldArr = oldValue ? oldValue.split(',').filter(Boolean) : [];
            const curValue = field.value;
            const curValues = field.values ? [...field.values] : [];
            field.values = oldArr;
            entry.oldLabel = this._getFieldLabel(field, oldValue);
            field.values = curValues;
          } else {
            field.value = oldValue;
            entry.oldLabel = this._getFieldLabel(field, oldValue);
            field.value = origValue;
          }
        } else {
          entry.oldLabel = oldValue;
        }
      }

      changed[name] = entry;
    });
    return changed;
  }

  _renderChanged() {
    this.dispatchEvent(new CustomEvent('dirty-change', {
      bubbles: true,
      composed: true,
      detail: { isDirty: this.isDirty, dirtyFields: this.getDirtyFields() }
    }));
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

    const fields = this._getFields();
    const fieldsets = this._getFieldsets();

    if (disabled || loading) {
      if (this._fieldOriginalStates.size === 0) {
        fields.forEach(field => {
          this._fieldOriginalStates.set(field, {
            disabled: field.hasAttribute('disabled'),
            readonly: field.hasAttribute('readonly')
          });
        });
      }

      fields.forEach(field => {
        const originalState = this._fieldOriginalStates.get(field);
        if (originalState) {
          if (originalState.disabled || originalState.readonly) {
            return;
          }
        }
        if (field.hasAttribute('readonly') || field.hasAttribute('disabled')) {
          return;
        }
        field.setAttribute('disabled', '');
      });

      fieldsets.forEach(fieldset => {
        fieldset.setAttribute('disabled', '');
      });
    } else {
      fields.forEach(field => {
        const originalState = this._fieldOriginalStates.get(field);
        if (originalState) {
          if (originalState.disabled) {
            field.setAttribute('disabled', '');
          } else {
            field.removeAttribute('disabled');
          }
        } else {
          if (!field.hasAttribute('readonly')) {
            field.removeAttribute('disabled');
          }
        }
      });

      fieldsets.forEach(fieldset => {
        fieldset.removeAttribute('disabled');
      });

      this._fieldOriginalStates.clear();
    }
  }

  _handleSlotChange() {
    if (!this._initialValuesCaptured) {
      this._captureInitialValues();
    }
  }

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

  _getDataFields() {
    return Array.from(this.querySelectorAll('my-input, my-select, my-textarea'));
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

  _backupButtonStates() {
    this._buttonOriginalStates.clear();
    const actionsSlot = this._shadowRoot.querySelector('slot[name="actions"]');
    if (!actionsSlot) return;
    const buttons = Array.from(actionsSlot.assignedElements({ flatten: true }))
      .filter(el => el.tagName === 'MY-BUTTON');
    buttons.forEach(btn => {
      this._buttonOriginalStates.set(btn, {
        loading: btn.hasAttribute('loading')
      });
    });
  }

  _restoreButtonStates() {
    this._buttonOriginalStates.forEach((state, btn) => {
      if (state.loading) {
        btn.setAttribute('loading', '');
      } else {
        btn.removeAttribute('loading');
      }
    });
    this._buttonOriginalStates.clear();
  }

  _setPrimaryButtonLoading() {
    const actionsSlot = this._shadowRoot.querySelector('slot[name="actions"]');
    if (!actionsSlot) return;
    const buttons = Array.from(actionsSlot.assignedElements({ flatten: true }))
      .filter(el => el.tagName === 'MY-BUTTON');
    let primaryBtn = buttons.find(btn => btn.getAttribute('variant') === 'primary');
    if (!primaryBtn && buttons.length > 0) {
      primaryBtn = buttons[0];
    }
    if (primaryBtn) {
      primaryBtn.setAttribute('loading', '');
    }
  }

  validate() {
    const fields = this._getDataFields();
    const results = [];
    let allValid = true;
    let firstInvalid = null;
    let hadErrorsBefore = false;

    fields.forEach(field => {
      if (field.hasAttribute('error')) {
        hadErrorsBefore = true;
      }
    });

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
        } else {
          field.removeAttribute('error');
          if (typeof field.resetValidation === 'function') {
            field.resetValidation();
          }
        }
      }
    });

    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }

    if (allValid && hadErrorsBefore) {
      this.dispatchEvent(new CustomEvent('validation-cleared', {
        bubbles: true,
        composed: true,
        detail: { valid: true, results }
      }));
    }

    this._hadValidationErrors = !allValid;

    const event = new CustomEvent('validate', {
      bubbles: true,
      composed: true,
      detail: { valid: allValid, results }
    });
    this.dispatchEvent(event);

    return { valid: allValid, results };
  }

  reset() {
    const fields = this._getDataFields();
    const hasInitialValues = this._setInitialValuesCalled || Object.keys(this._initialValues).length > 0;

    if (hasInitialValues) {
      fields.forEach(field => {
        const name = field.getAttribute('name');
        if (name && this._initialValues.hasOwnProperty(name)) {
          field.value = this._initialValues[name];
        }
      });
      this.resetValidation();
    } else {
      fields.forEach(field => {
        if (typeof field.reset === 'function') {
          field.reset();
        }
      });
    }
    this.dispatchEvent(new CustomEvent('reset', {
      bubbles: true,
      composed: true
    }));
  }

  clear() {
    const fields = this._getDataFields();
    fields.forEach(field => {
      if (typeof field.reset === 'function') {
        field.reset();
      } else {
        field.value = '';
      }
    });
    this.resetValidation();
    this.dispatchEvent(new CustomEvent('reset', {
      bubbles: true,
      composed: true
    }));
  }

  resetValidation() {
    const fields = this._getDataFields();
    fields.forEach(field => {
      if (typeof field.resetValidation === 'function') {
        field.resetValidation();
      }
      field.removeAttribute('error');
    });
  }

  submit(callback) {
    const { valid, results } = this.validate();
    const allFields = this._getDataFields();
    const submitChangesOnly = this.submitChangesOnly;
    const dirtyFields = submitChangesOnly ? this.getDirtyFields() : null;
    const changedValues = submitChangesOnly ? this.getChangedValues() : null;

    const formData = {};
    allFields.forEach(field => {
      const { name, value } = this._getFieldValue(field);
      if (!name) return;
      if (submitChangesOnly) {
        if (dirtyFields && dirtyFields.includes(name)) {
          formData[name] = value;
        }
      } else {
        formData[name] = value;
      }
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

    if (submitChangesOnly) {
      summary.changedFields = dirtyFields || [];
    }

    const submitDetail = { valid, formData, results, summary };
    if (submitChangesOnly) {
      submitDetail.changedValues = changedValues;
    }

    const event = new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: submitDetail
    });
    this.dispatchEvent(event);

    if (valid) {
      this.dispatchEvent(new CustomEvent('valid-submit', {
        bubbles: true,
        composed: true,
        detail: { formData }
      }));

      if (submitChangesOnly) {
        this.dispatchEvent(new CustomEvent('submit-changed', {
          bubbles: true,
          composed: true,
          detail: { changedValues, formData }
        }));
      }

      if (typeof callback === 'function') {
        this._backupButtonStates();
        this._setPrimaryButtonLoading();
        this.loading = true;
        (async () => {
          try {
            const result = await callback(formData);
            if (result) {
              this.resetValidation();
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
            this._restoreButtonStates();
          }
        })();
      }
    }

    return { valid, formData, results, summary };
  }

  getFormData() {
    const formData = {};
    this._getDataFields().forEach(field => {
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

  get submitChangesOnly() { return this.hasAttribute('submit-changes-only'); }
  set submitChangesOnly(val) { val ? this.setAttribute('submit-changes-only', '') : this.removeAttribute('submit-changes-only'); }
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
