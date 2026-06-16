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

.form.validating {
  position: relative;
}

.form.validating .form-validating-indicator {
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

.form-validating-indicator {
  display: none;
  position: absolute;
  top: var(--ui-spacing-xs);
  right: var(--ui-spacing-xs);
  align-items: center;
  gap: var(--ui-spacing-xs);
  font-size: var(--ui-font-size-xs);
  color: var(--ui-color-text-secondary);
  z-index: 5;
  padding: var(--ui-spacing-xs) var(--ui-spacing-sm);
  background: var(--ui-color-bg);
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-color-border);
}

.form-validating-indicator .validating-spinner {
  width: 12px;
  height: 12px;
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
  <div class="form-validating-indicator" part="validating-indicator">
    <span class="validating-spinner"></span>
    <span>Validating...</span>
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
    return ['disabled', 'loading', 'submit-changes-only', 'commit-on-success', 'warn-on-leave'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._form = this._shadowRoot.querySelector('.form');
    this._validatingIndicator = this._shadowRoot.querySelector('.form-validating-indicator');
    this._handleSlotChange = this._handleSlotChange.bind(this);
    this._handleFormSubmit = this._handleFormSubmit.bind(this);
    this._handleValidationChange = this._handleValidationChange.bind(this);
    this._handleDirtyChangeForWarn = this._handleDirtyChangeForWarn.bind(this);
    this._beforeUnloadHandler = this._beforeUnloadHandler.bind(this);
    this._initialValues = {};
    this._fieldOriginalStates = new Map();
    this._buttonOriginalStates = new Map();
    this._initialValuesCaptured = false;
    this._setInitialValuesCalled = false;
    this._hadValidationErrors = false;
    this._asyncValidators = new Map();
    this._validating = false;
    this._asyncValidationAborted = false;
  }

  connectedCallback() {
    this._form.addEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.addEventListener('slotchange', this._handleSlotChange);
    this.addEventListener('validate', this._handleValidationChange);
    this.addEventListener('dirty-change', this._handleDirtyChangeForWarn);
    this._captureInitialValues();
    this._syncState();
    this._updateWarnOnLeaveListener();
  }

  disconnectedCallback() {
    this._form.removeEventListener('submit', this._handleFormSubmit);
    const slot = this._shadowRoot.querySelector('slot:not([name])');
    if (slot) slot.removeEventListener('slotchange', this._handleSlotChange);
    this.removeEventListener('validate', this._handleValidationChange);
    this.removeEventListener('dirty-change', this._handleDirtyChangeForWarn);
    this._removeWarnOnLeaveListener();
  }

  attributeChangedCallback(name) {
    this._syncState();
    if (name === 'warn-on-leave') {
      this._updateWarnOnLeaveListener();
    }
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
    const validating = this._validating;

    if (loading) {
      this._form.classList.add('loading');
    } else {
      this._form.classList.remove('loading');
    }

    if (validating) {
      this._form.classList.add('validating');
    } else {
      this._form.classList.remove('validating');
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

  _handleDirtyChangeForWarn() {
    this._updateWarnOnLeaveListener();
  }

  _beforeUnloadHandler(e) {
    if (this.warnOnLeave && this.isDirty) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  }

  _updateWarnOnLeaveListener() {
    if (this.warnOnLeave && this.isDirty) {
      window.addEventListener('beforeunload', this._beforeUnloadHandler);
    } else {
      this._removeWarnOnLeaveListener();
    }
  }

  _removeWarnOnLeaveListener() {
    window.removeEventListener('beforeunload', this._beforeUnloadHandler);
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

  setAsyncValidator(fieldName, validatorFn) {
    if (typeof validatorFn === 'function') {
      this._asyncValidators.set(fieldName, validatorFn);
    } else {
      this._asyncValidators.delete(fieldName);
    }
  }

  _buildSummary(results, allValid) {
    const invalidFields = results.filter(r => !r.valid).map(r => r.name);
    const errors = {};
    results.filter(r => !r.valid).forEach(r => { errors[r.name] = r.message; });
    const dirtyFields = this.submitChangesOnly ? this.getDirtyFields() : null;
    const submittedFields = dirtyFields
      ? results.map(r => r.name).filter(n => dirtyFields.includes(n))
      : results.map(r => r.name);
    const unmodifiedFields = dirtyFields
      ? results.map(r => r.name).filter(n => !dirtyFields.includes(n))
      : [];
    const isSubmissionEmpty = dirtyFields ? dirtyFields.length === 0 : false;
    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: invalidFields.length,
      invalidFields,
      errors,
      changedFields: dirtyFields,
      submittedFields,
      unmodifiedFields,
      isSubmissionEmpty
    };
  }

  async validateField(fieldName) {
    const field = Array.from(this.querySelectorAll('my-input, my-select, my-textarea'))
      .find(f => f.getAttribute('name') === fieldName);

    if (!field) {
      return { valid: true, message: '', field: null, name: fieldName };
    }

    let syncResult = { valid: true, message: '' };
    if (typeof field.validate === 'function') {
      syncResult = field.validate();
    }

    if (!syncResult.valid) {
      return {
        field,
        name: fieldName,
        valid: false,
        message: syncResult.message
      };
    }

    const asyncValidator = this._asyncValidators.get(fieldName);
    if (!asyncValidator) {
      return {
        field,
        name: fieldName,
        valid: true,
        message: ''
      };
    }

    field.setAttribute('validating', '');

    try {
      const formData = this.getFormData();
      let value = field.value || '';
      if (field.tagName === 'MY-SELECT' && field.multiple) {
        const values = field.values || [];
        value = values.join(',');
      }

      const result = await asyncValidator(value, formData);

      if (typeof result === 'string') {
        field.error = result;
        return {
          field,
          name: fieldName,
          valid: false,
          message: result
        };
      }

      if (result && typeof result === 'object') {
        if (!result.valid) {
          field.error = result.message || 'Validation failed';
          return {
            field,
            name: fieldName,
            valid: false,
            message: result.message || 'Validation failed'
          };
        }
      }

      field.removeAttribute('error');
      if (typeof field.resetValidation === 'function') {
        field.resetValidation();
      }
      return {
        field,
        name: fieldName,
        valid: true,
        message: ''
      };
    } catch (error) {
      const message = error.message || 'Validation failed';
      field.error = message;
      return {
        field,
        name: fieldName,
        valid: false,
        message
      };
    } finally {
      field.removeAttribute('validating');
    }
  }

  validate(mode) {
    const useAsync = mode === 'async' || (mode && typeof mode === 'object' && mode.async);

    if (!useAsync) {
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

      this.dispatchEvent(new CustomEvent('validation-complete', {
        bubbles: true,
        composed: true,
        detail: { valid: allValid, results, mode: 'sync' }
      }));

      const summary = this._buildSummary(results, allValid);
      return { valid: allValid, results, summary };
    }

    return this._validateAsync();
  }

  async _validateAsync() {
    this._validating = true;
    this._asyncValidationAborted = false;
    this._syncState();

    const syncResult = this.validate('sync');

    if (!syncResult.valid) {
      this._validating = false;
      this._syncState();
      this.dispatchEvent(new CustomEvent('validation-complete', {
        bubbles: true,
        composed: true,
        detail: { valid: false, results: syncResult.results, mode: 'async' }
      }));
      return { valid: false, results: syncResult.results, summary: syncResult.summary };
    }

    const fields = this._getDataFields();
    const asyncResults = [];
    let allValid = true;
    let firstInvalid = null;

    for (const field of fields) {
      if (this._asyncValidationAborted) break;

      const name = field.getAttribute('name') || field.label || '';
      const hasAsyncValidator = this._asyncValidators.has(name);

      if (!hasAsyncValidator) {
        asyncResults.push({
          field,
          name,
          valid: true,
          message: ''
        });
        continue;
      }

      const result = await this.validateField(name);
      asyncResults.push(result);

      if (!result.valid) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    }

    if (firstInvalid && typeof firstInvalid.focus === 'function') {
      firstInvalid.focus();
    }

    this._validating = false;
    this._syncState();

    const combinedResults = asyncResults;
    this._hadValidationErrors = !allValid;

    this.dispatchEvent(new CustomEvent('validation-complete', {
      bubbles: true,
      composed: true,
      detail: { valid: allValid, results: combinedResults, mode: 'async' }
    }));

    const summary = this._buildSummary(combinedResults, allValid);
    return { valid: allValid, results: combinedResults, summary };
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
    this._asyncValidationAborted = true;
    this._validating = false;
    const fields = this._getDataFields();
    fields.forEach(field => {
      if (typeof field.resetValidation === 'function') {
        field.resetValidation();
      }
      field.removeAttribute('error');
      field.removeAttribute('validating');
    });
    this._syncState();
  }

  commitValues() {
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
    this._setInitialValuesCalled = true;
    this._renderChanged();
  }

  submit(callback, options) {
    const useAsync = options && (options.async || options.mode === 'async');

    if (useAsync) {
      return this._submitAsync(callback, options);
    }

    return this._submitSync(callback);
  }

  _submitSync(callback) {
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

    const allFieldNames = allFields
      .map(f => f.getAttribute('name'))
      .filter(Boolean);

    const submittedFields = submitChangesOnly
      ? (dirtyFields || [])
      : allFieldNames;

    const unmodifiedFields = submitChangesOnly
      ? allFieldNames.filter(n => !dirtyFields.includes(n))
      : [];

    const isSubmissionEmpty = submittedFields.length === 0;

    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: invalidFields.length,
      invalidFields,
      errors,
      submittedFields,
      unmodifiedFields,
      isSubmissionEmpty
    };

    if (submitChangesOnly) {
      summary.changedFields = dirtyFields || [];
    }

    const submitDetail = { valid, formData, results, summary, isSubmissionEmpty, unmodifiedFields };
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
      if (isSubmissionEmpty && submitChangesOnly) {
        this.dispatchEvent(new CustomEvent('submit-empty', {
          bubbles: true,
          composed: true,
          detail: { formData, summary }
        }));
      } else {
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
                if (this.commitOnSuccess) {
                  this.commitValues();
                }
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
    }

    return { valid, formData, results, summary, isSubmissionEmpty };
  }

  async _submitAsync(callback, options) {
    const validationResult = await this.validate('async');

    if (!validationResult.valid) {
      const allFields = this._getDataFields();
      const submitChangesOnly = this.submitChangesOnly;
      const dirtyFields = submitChangesOnly ? this.getDirtyFields() : null;

      const invalidFields = validationResult.results
        .filter(r => !r.valid)
        .map(r => r.name);
      const errors = {};
      validationResult.results
        .filter(r => !r.valid)
        .forEach(r => { errors[r.name] = r.message; });

      const allFieldNames = allFields
        .map(f => f.getAttribute('name'))
        .filter(Boolean);

      const submittedFields = submitChangesOnly
        ? (dirtyFields || [])
        : allFieldNames;

      const unmodifiedFields = submitChangesOnly
        ? allFieldNames.filter(n => !dirtyFields.includes(n))
        : [];

      const summary = {
        total: validationResult.results.length,
        valid: validationResult.results.filter(r => r.valid).length,
        invalid: invalidFields.length,
        invalidFields,
        errors,
        submittedFields,
        unmodifiedFields,
        isSubmissionEmpty: false
      };

      if (submitChangesOnly) {
        summary.changedFields = dirtyFields || [];
      }

      const formData = {};
      return {
        valid: false,
        formData,
        results: validationResult.results,
        summary,
        isSubmissionEmpty: false
      };
    }

    return this._submitSync(callback);
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

  get validating() {
    return this._validating;
  }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  get submitChangesOnly() { return this.hasAttribute('submit-changes-only'); }
  set submitChangesOnly(val) { val ? this.setAttribute('submit-changes-only', '') : this.removeAttribute('submit-changes-only'); }

  get commitOnSuccess() { return this.hasAttribute('commit-on-success'); }
  set commitOnSuccess(val) { val ? this.setAttribute('commit-on-success', '') : this.removeAttribute('commit-on-success'); }

  get warnOnLeave() { return this.hasAttribute('warn-on-leave'); }
  set warnOnLeave(val) { val ? this.setAttribute('warn-on-leave', '') : this.removeAttribute('warn-on-leave'); }
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
