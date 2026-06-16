const template = document.createElement('template');
template.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: block;
  font-family: var(--ui-font-family);
}

.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--ui-spacing-xs);
  width: 100%;
}

.label {
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-medium);
  color: var(--ui-color-text-primary);
  line-height: var(--ui-line-height-normal);
}

.required-mark {
  color: var(--ui-color-danger);
  margin-left: 2px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-md);
  background-color: var(--ui-color-bg);
  transition: all var(--ui-transition-fast);
}

.input-container:hover:not(.disabled) {
  border-color: var(--ui-color-border-hover);
}

.input-container.focused {
  border-color: var(--ui-color-border-focus);
  box-shadow: 0 0 0 3px var(--ui-color-primary-light);
}

.input-container.disabled {
  background-color: var(--ui-color-bg-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.input-container.error {
  border-color: var(--ui-color-danger);
}

.input-container.error.focused {
  box-shadow: 0 0 0 3px var(--ui-color-danger-light);
}

.prefix {
  display: flex;
  align-items: center;
  padding-left: var(--ui-spacing-md);
  color: var(--ui-color-text-tertiary);
  flex-shrink: 0;
}

.suffix {
  display: flex;
  align-items: center;
  padding-right: var(--ui-spacing-md);
  color: var(--ui-color-text-tertiary);
  flex-shrink: 0;
}

.input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
  padding: var(--ui-spacing-sm) var(--ui-spacing-md);
  height: var(--ui-size-md);
  box-sizing: border-box;
  width: 100%;
}

.input::placeholder {
  color: var(--ui-color-text-tertiary);
}

.input:disabled {
  cursor: not-allowed;
  color: var(--ui-color-text-disabled);
}

.input::-webkit-outer-spin-button,
.input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input[type="number"] {
  -moz-appearance: textfield;
}

.input-container.size--sm .input {
  height: var(--ui-size-sm);
  font-size: var(--ui-font-size-sm);
  padding: var(--ui-spacing-xs) var(--ui-spacing-sm);
}
.input-container.size--sm .prefix { padding-left: var(--ui-spacing-sm); }
.input-container.size--sm .suffix { padding-right: var(--ui-spacing-sm); }

.input-container.size--lg .input {
  height: var(--ui-size-lg);
  font-size: var(--ui-font-size-lg);
  padding: var(--ui-spacing-md) var(--ui-spacing-lg);
}
.input-container.size--lg .prefix { padding-left: var(--ui-spacing-lg); }
.input-container.size--lg .suffix { padding-right: var(--ui-spacing-lg); }

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: var(--ui-color-bg-tertiary);
  color: var(--ui-color-text-secondary);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all var(--ui-transition-fast);
}
.clear-btn:hover {
  background: var(--ui-color-border-hover);
  color: var(--ui-color-text-primary);
}

.help-text {
  font-size: var(--ui-font-size-xs);
  color: var(--ui-color-text-secondary);
  line-height: var(--ui-line-height-normal);
}

.error-text {
  font-size: var(--ui-font-size-xs);
  color: var(--ui-color-danger);
  line-height: var(--ui-line-height-normal);
}

:host([block]) {
  width: 100%;
}
</style>
<div class="wrapper">
  <label class="label" style="display:none;">
    <span class="label-text"></span>
    <span class="required-mark" style="display:none;">*</span>
  </label>
  <div class="input-container">
    <span class="prefix" style="display:none;"><slot name="prefix"></slot></span>
    <input class="input" part="input" />
    <span class="clear-btn" style="display:none;" title="清除">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="2" x2="8" y2="8"></line>
        <line x1="8" y1="2" x2="2" y2="8"></line>
      </svg>
    </span>
    <span class="suffix" style="display:none;"><slot name="suffix"></slot></span>
  </div>
  <div class="help-text" style="display:none;"></div>
  <div class="error-text" style="display:none;"></div>
</div>
`;

const RULE_MESSAGES = {
  required: '此项为必填',
  email: '请输入有效的邮箱地址',
  url: '请输入有效的URL',
  number: '请输入有效的数字',
  pattern: '格式不正确',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/i;

function parseRules(rulesStr) {
  if (!rulesStr) return [];
  return rulesStr.split('|').map(segment => {
    const colonIdx = segment.indexOf(':');
    if (colonIdx === -1) return { name: segment, param: null };
    const name = segment.substring(0, colonIdx);
    const param = segment.substring(colonIdx + 1);
    return { name, param };
  });
}

export class MyInput extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'type', 'value', 'size', 'disabled', 'readonly', 'required', 'error', 'help-text', 'clearable', 'maxlength', 'min', 'max', 'step', 'block', 'rules', 'pattern', 'name', 'validate-trigger', 'minlength'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._wrapper = this._shadowRoot.querySelector('.wrapper');
    this._labelEl = this._shadowRoot.querySelector('.label');
    this._labelText = this._shadowRoot.querySelector('.label-text');
    this._requiredMark = this._shadowRoot.querySelector('.required-mark');
    this._container = this._shadowRoot.querySelector('.input-container');
    this._input = this._shadowRoot.querySelector('.input');
    this._prefix = this._shadowRoot.querySelector('.prefix');
    this._suffix = this._shadowRoot.querySelector('.suffix');
    this._clearBtn = this._shadowRoot.querySelector('.clear-btn');
    this._helpText = this._shadowRoot.querySelector('.help-text');
    this._errorText = this._shadowRoot.querySelector('.error-text');
    this._oldValue = '';
    this._parsedRules = [];
    this._initialValue = '';
    this._onBlurBound = this._onBlur.bind(this);
  }

  connectedCallback() {
    this._input.addEventListener('input', this._onInput.bind(this));
    this._input.addEventListener('focus', this._onFocus.bind(this));
    this._input.addEventListener('blur', this._onBlurBound);
    this._input.addEventListener('change', this._onChange.bind(this));
    this._input.addEventListener('keydown', this._onKeydown.bind(this));
    this._clearBtn.addEventListener('click', this._onClear.bind(this));
    this._initialValue = this.value;
    this._parseAndStoreRules();
    this._render();
    this._updateSlots();

    const observer = new MutationObserver(() => this._updateSlots());
    observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this._input.removeEventListener('input', this._onInput);
    this._input.removeEventListener('focus', this._onFocus);
    this._input.removeEventListener('blur', this._onBlurBound);
    this._input.removeEventListener('change', this._onChange);
    this._input.removeEventListener('keydown', this._onKeydown);
    this._clearBtn.removeEventListener('click', this._onClear);
  }

  attributeChangedCallback(name) {
    if (name === 'rules') {
      this._parseAndStoreRules();
    }
    if (this._input) this._render();
  }

  _parseAndStoreRules() {
    this._parsedRules = parseRules(this.rules);
  }

  _updateSlots() {
    const hasPrefix = this.querySelector('[slot="prefix"]');
    const hasSuffix = this.querySelector('[slot="suffix"]');
    this._prefix.style.display = hasPrefix ? 'flex' : 'none';
    this._suffix.style.display = hasSuffix ? 'flex' : 'none';
  }

  _onInput(e) {
    const value = this._input.value;
    this._oldValue = value;
    this.dispatchEvent(new CustomEvent('input', {
      bubbles: true,
      composed: true,
      detail: { value }
    }));
    this._updateClearBtn();
  }

  _onChange(e) {
    const value = this._input.value;
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { value }
    }));
  }

  _onFocus() {
    this._container.classList.add('focused');
    this.dispatchEvent(new CustomEvent('focus', {
      bubbles: true,
      composed: true
    }));
  }

  _onBlur() {
    this._container.classList.remove('focused');
    this.dispatchEvent(new CustomEvent('blur', {
      bubbles: true,
      composed: true
    }));
    const trigger = this.getAttribute('validate-trigger') || 'blur';
    if (trigger !== 'none' && this._parsedRules.length > 0) {
      this.validate();
    }
  }

  _onKeydown(e) {
    this.dispatchEvent(new CustomEvent('keydown', {
      bubbles: true,
      composed: true,
      detail: { key: e.key, originalEvent: e }
    }));
  }

  _onClear() {
    this._input.value = '';
    this.value = '';
    this._updateClearBtn();
    this._input.focus();
    this.dispatchEvent(new CustomEvent('clear', {
      bubbles: true,
      composed: true
    }));
    this.dispatchEvent(new CustomEvent('input', {
      bubbles: true,
      composed: true,
      detail: { value: '' }
    }));
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { value: '' }
    }));
  }

  _updateClearBtn() {
    if (this.clearable && !this.disabled && !this.readonly && this._input.value.length > 0) {
      this._clearBtn.style.display = 'flex';
    } else {
      this._clearBtn.style.display = 'none';
    }
  }

  validate() {
    const value = this.value;
    const rules = this._parsedRules;

    for (const rule of rules) {
      const result = this._validateRule(rule, value);
      if (!result.valid) {
        this.error = result.message;
        return result;
      }
    }

    if (this.pattern) {
      try {
        const regex = new RegExp(this.pattern);
        if (!regex.test(value)) {
          this.error = RULE_MESSAGES.pattern;
          return { valid: false, message: RULE_MESSAGES.pattern };
        }
      } catch (e) {
        // invalid regex, skip
      }
    }

    this.removeAttribute('error');
    return { valid: true, message: '' };
  }

  _validateRule(rule, value) {
    switch (rule.name) {
      case 'required':
        if (!value || !value.trim()) {
          return { valid: false, message: RULE_MESSAGES.required };
        }
        break;

      case 'email':
        if (value && !EMAIL_REGEX.test(value)) {
          return { valid: false, message: RULE_MESSAGES.email };
        }
        break;

      case 'url':
        if (value && !URL_REGEX.test(value)) {
          return { valid: false, message: RULE_MESSAGES.url };
        }
        break;

      case 'number':
        if (value && isNaN(Number(value))) {
          return { valid: false, message: RULE_MESSAGES.number };
        }
        break;

      case 'min': {
        const n = parseInt(rule.param, 10);
        if (value.length < n) {
          return { valid: false, message: `最少输入${n}个字符` };
        }
        break;
      }

      case 'max': {
        const n = parseInt(rule.param, 10);
        if (value.length > n) {
          return { valid: false, message: `最多输入${n}个字符` };
        }
        break;
      }

      case 'minlength': {
        const n = parseInt(rule.param, 10);
        if (value.length < n) {
          return { valid: false, message: `最少输入${n}个字符` };
        }
        break;
      }

      case 'pattern': {
        if (rule.param) {
          try {
            const regex = new RegExp(rule.param);
            if (!regex.test(value)) {
              return { valid: false, message: RULE_MESSAGES.pattern };
            }
          } catch (e) {
            // invalid regex, skip
          }
        }
        break;
      }
    }

    return { valid: true, message: '' };
  }

  resetValidation() {
    this.removeAttribute('error');
  }

  reset() {
    this.value = this._initialValue;
    this.resetValidation();
  }

  _render() {
    this._labelText.textContent = this.label;
    this._labelEl.style.display = this.label ? 'block' : 'none';
    this._requiredMark.style.display = this.required ? 'inline' : 'none';

    const size = this.size || 'md';
    this._container.className = `input-container size--${size}`;

    if (this.disabled) this._container.classList.add('disabled');
    if (this.error) this._container.classList.add('error');

    this._input.type = this.type || 'text';
    this._input.placeholder = this.placeholder || '';
    this._input.disabled = this.disabled;
    this._input.readOnly = this.readonly;
    this._input.required = this.required;
    if (this.maxlength) this._input.maxLength = parseInt(this.maxlength);
    if (this.minlength) this._input.minLength = parseInt(this.minlength);
    if (this.hasAttribute('value') && this._input.value !== this.value) {
      this._input.value = this.value || '';
    }
    if (this.min !== null) this._input.min = this.min;
    if (this.max !== null) this._input.max = this.max;
    if (this.step !== null) this._input.step = this.step;

    this._helpText.textContent = this.helpText || '';
    this._helpText.style.display = this.helpText && !this.error ? 'block' : 'none';

    this._errorText.textContent = this.error || '';
    this._errorText.style.display = this.error ? 'block' : 'none';

    this._updateClearBtn();
  }

  focus() { this._input?.focus(); }
  blur() { this._input?.blur(); }

  get label() { return this.getAttribute('label'); }
  set label(val) { this.setAttribute('label', val); }

  get placeholder() { return this.getAttribute('placeholder'); }
  set placeholder(val) { this.setAttribute('placeholder', val); }

  get type() { return this.getAttribute('type') || 'text'; }
  set type(val) { this.setAttribute('type', val); }

  get value() {
    if (this._input) return this._input.value;
    return this.getAttribute('value') || '';
  }
  set value(val) {
    this.setAttribute('value', val);
    if (this._input) this._input.value = val || '';
  }

  get size() { return this.getAttribute('size') || 'md'; }
  set size(val) { this.setAttribute('size', val); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get readonly() { return this.hasAttribute('readonly'); }
  set readonly(val) { val ? this.setAttribute('readonly', '') : this.removeAttribute('readonly'); }

  get required() { return this.hasAttribute('required'); }
  set required(val) { val ? this.setAttribute('required', '') : this.removeAttribute('required'); }

  get error() { return this.getAttribute('error'); }
  set error(val) { val ? this.setAttribute('error', val) : this.removeAttribute('error'); }

  get helpText() { return this.getAttribute('help-text'); }
  set helpText(val) { val ? this.setAttribute('help-text', val) : this.removeAttribute('help-text'); }

  get clearable() { return this.hasAttribute('clearable'); }
  set clearable(val) { val ? this.setAttribute('clearable', '') : this.removeAttribute('clearable'); }

  get maxlength() { return this.getAttribute('maxlength'); }
  set maxlength(val) { this.setAttribute('maxlength', val); }

  get min() { return this.getAttribute('min'); }
  set min(val) { this.setAttribute('min', val); }

  get max() { return this.getAttribute('max'); }
  set max(val) { this.setAttribute('max', val); }

  get step() { return this.getAttribute('step'); }
  set step(val) { this.setAttribute('step', val); }

  get block() { return this.hasAttribute('block'); }
  set block(val) { val ? this.setAttribute('block', '') : this.removeAttribute('block'); }

  get rules() { return this.getAttribute('rules'); }
  set rules(val) { this.setAttribute('rules', val); }

  get pattern() { return this.getAttribute('pattern'); }
  set pattern(val) { this.setAttribute('pattern', val); }

  get name() { return this.getAttribute('name'); }
  set name(val) { this.setAttribute('name', val); }

  get minlength() { return this.getAttribute('minlength'); }
  set minlength(val) { this.setAttribute('minlength', val); }
}

customElements.define('my-input', MyInput);
