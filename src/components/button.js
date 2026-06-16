const template = document.createElement('template');
template.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: inline-block;
  font-family: var(--ui-font-family);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--ui-radius-md);
  font-family: inherit;
  font-weight: var(--ui-font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: all var(--ui-transition-fast);
  text-decoration: none;
  line-height: 1;
}

.button:focus-visible {
  outline: 2px solid var(--ui-color-border-focus);
  outline-offset: 2px;
}

.button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Variant: primary */
.variant--primary {
  background-color: var(--ui-color-primary);
  color: var(--ui-color-primary-contrast);
  border-color: var(--ui-color-primary);
}
.variant--primary:hover:not([disabled]) {
  background-color: var(--ui-color-primary-hover);
  border-color: var(--ui-color-primary-hover);
}
.variant--primary:active:not([disabled]) {
  background-color: var(--ui-color-primary-active);
  border-color: var(--ui-color-primary-active);
}

/* Variant: secondary */
.variant--secondary {
  background-color: var(--ui-color-bg);
  color: var(--ui-color-text-primary);
  border-color: var(--ui-color-border);
}
.variant--secondary:hover:not([disabled]) {
  background-color: var(--ui-color-bg-secondary);
  border-color: var(--ui-color-border-hover);
  color: var(--ui-color-primary);
}
.variant--secondary:active:not([disabled]) {
  background-color: var(--ui-color-bg-tertiary);
}

/* Variant: outline */
.variant--outline {
  background-color: transparent;
  color: var(--ui-color-primary);
  border-color: var(--ui-color-primary);
}
.variant--outline:hover:not([disabled]) {
  background-color: var(--ui-color-primary-light);
}
.variant--outline:active:not([disabled]) {
  background-color: rgba(79, 70, 229, 0.2);
}

/* Variant: ghost */
.variant--ghost {
  background-color: transparent;
  color: var(--ui-color-text-primary);
  border-color: transparent;
}
.variant--ghost:hover:not([disabled]) {
  background-color: var(--ui-color-bg-tertiary);
}
.variant--ghost:active:not([disabled]) {
  background-color: var(--ui-color-border);
}

/* Variant: danger */
.variant--danger {
  background-color: var(--ui-color-danger);
  color: var(--ui-color-text-inverse);
  border-color: var(--ui-color-danger);
}
.variant--danger:hover:not([disabled]) {
  background-color: var(--ui-color-danger-hover);
  border-color: var(--ui-color-danger-hover);
}
.variant--danger:active:not([disabled]) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

/* Size: xs */
.size--xs {
  height: var(--ui-size-xs);
  padding: 0 var(--ui-spacing-sm);
  font-size: var(--ui-font-size-xs);
  border-radius: var(--ui-radius-sm);
}

/* Size: sm */
.size--sm {
  height: var(--ui-size-sm);
  padding: 0 var(--ui-spacing-md);
  font-size: var(--ui-font-size-sm);
  border-radius: var(--ui-radius-sm);
}

/* Size: md */
.size--md {
  height: var(--ui-size-md);
  padding: 0 var(--ui-spacing-lg);
  font-size: var(--ui-font-size-md);
  border-radius: var(--ui-radius-md);
}

/* Size: lg */
.size--lg {
  height: var(--ui-size-lg);
  padding: 0 var(--ui-spacing-xl);
  font-size: var(--ui-font-size-lg);
  border-radius: var(--ui-radius-lg);
}

/* Block */
:host([block]) {
  display: block;
}
:host([block]) .button {
  width: 100%;
}

/* Loading */
.loading-spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Rounded full */
.rounded--full {
  border-radius: var(--ui-radius-full);
}
</style>
<button class="button" part="button">
  <span class="icon-left" style="display: none;"><slot name="icon-left"></slot></span>
  <span class="loading" style="display: none;"><span class="loading-spinner"></span></span>
  <span class="label"><slot></slot></span>
  <span class="icon-right" style="display: none;"><slot name="icon-right"></slot></span>
</button>
`;

export class MyButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'type', 'disabled', 'loading', 'block', 'rounded'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._button = this._shadowRoot.querySelector('.button');
    this._loadingEl = this._shadowRoot.querySelector('.loading');
    this._iconLeft = this._shadowRoot.querySelector('.icon-left');
    this._iconRight = this._shadowRoot.querySelector('.icon-right');
    this._handleClick = this._handleClick.bind(this);
  }

  connectedCallback() {
    this._button.addEventListener('click', this._handleClick);
    this._updateSlots();
    this._render();

    const observer = new MutationObserver(() => this._updateSlots());
    observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this._button.removeEventListener('click', this._handleClick);
  }

  attributeChangedCallback() {
    if (this._button) this._render();
  }

  _updateSlots() {
    const hasLeftIcon = this.querySelector('[slot="icon-left"]');
    const hasRightIcon = this.querySelector('[slot="icon-right"]');
    this._iconLeft.style.display = hasLeftIcon ? 'inline-flex' : 'none';
    this._iconRight.style.display = hasRightIcon ? 'inline-flex' : 'none';
  }

  _handleClick(e) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }

  _render() {
    const variant = this.variant;
    const size = this.size;
    const rounded = this.rounded;

    this._button.className = `button variant--${variant} size--${size}`;
    if (rounded === 'full') this._button.classList.add('rounded--full');

    this._button.type = this.type;
    this._button.disabled = this.disabled || this.loading;
    this._loadingEl.style.display = this.loading ? 'inline-flex' : 'none';
  }

  get variant() {
    return this.getAttribute('variant') || 'primary';
  }
  set variant(val) {
    this.setAttribute('variant', val);
  }

  get size() {
    return this.getAttribute('size') || 'md';
  }
  set size(val) {
    this.setAttribute('size', val);
  }

  get type() {
    return this.getAttribute('type') || 'button';
  }
  set type(val) {
    this.setAttribute('type', val);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }
  set disabled(val) {
    val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled');
  }

  get loading() {
    return this.hasAttribute('loading');
  }
  set loading(val) {
    val ? this.setAttribute('loading', '') : this.removeAttribute('loading');
  }

  get block() {
    return this.hasAttribute('block');
  }
  set block(val) {
    val ? this.setAttribute('block', '') : this.removeAttribute('block');
  }

  get rounded() {
    return this.getAttribute('rounded') || 'default';
  }
  set rounded(val) {
    this.setAttribute('rounded', val);
  }
}

customElements.define('my-button', MyButton);
