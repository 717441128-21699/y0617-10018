import './button.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: none;
  position: fixed;
  inset: 0;
  z-index: var(--ui-z-modal);
  font-family: var(--ui-font-family);
}

:host([open]) {
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: var(--ui-color-bg-overlay);
  opacity: 0;
  transition: opacity var(--ui-transition-slow);
}

:host([open]) .overlay {
  opacity: 1;
}

.dialog-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ui-spacing-xl);
  overflow: auto;
}

.dialog {
  position: relative;
  background: var(--ui-color-bg);
  border-radius: var(--ui-radius-lg);
  box-shadow: var(--ui-shadow-xl);
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
  transition: all var(--ui-transition-slow);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
}

:host([open]) .dialog {
  opacity: 1;
  transform: scale(1) translateY(0);
}

:host([size="sm"]) .dialog { max-width: 384px; }
:host([size="md"]) .dialog { max-width: 520px; }
:host([size="lg"]) .dialog { max-width: 720px; }
:host([size="xl"]) .dialog { max-width: 960px; }
:host([size="full"]) .dialog {
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ui-spacing-lg) var(--ui-spacing-xl);
  border-bottom: 1px solid var(--ui-color-border);
  flex-shrink: 0;
}

.dialog-title {
  font-size: var(--ui-font-size-lg);
  font-weight: var(--ui-font-weight-semibold);
  color: var(--ui-color-text-primary);
  line-height: var(--ui-line-height-tight);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--ui-color-text-secondary);
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  padding: 0;
  transition: all var(--ui-transition-fast);
}
.close-btn:hover {
  background-color: var(--ui-color-bg-tertiary);
  color: var(--ui-color-text-primary);
}

.dialog-body {
  padding: var(--ui-spacing-xl);
  overflow-y: auto;
  flex: 1;
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
  color: var(--ui-color-text-primary);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ui-spacing-sm);
  padding: var(--ui-spacing-lg) var(--ui-spacing-xl);
  border-top: 1px solid var(--ui-color-border);
  flex-shrink: 0;
}

:host([hide-header]) .dialog-header { display: none; }
:host([hide-footer]) .dialog-footer { display: none; }
:host([hide-close]) .close-btn { display: none; }
</style>
<div class="overlay" part="overlay"></div>
<div class="dialog-wrapper" role="dialog" aria-modal="true" part="dialog-wrapper">
  <div class="dialog" part="dialog">
    <div class="dialog-header">
      <h3 class="dialog-title"><slot name="title">对话框标题</slot></h3>
      <button class="close-btn" type="button" aria-label="关闭">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="3" x2="13" y2="13"></line>
          <line x1="13" y1="3" x2="3" y2="13"></line>
        </svg>
      </button>
    </div>
    <div class="dialog-body">
      <slot>对话框内容</slot>
    </div>
    <div class="dialog-footer">
      <slot name="footer">
        <my-button variant="secondary" class="cancel-btn">取消</my-button>
        <my-button variant="primary" class="confirm-btn">确定</my-button>
      </slot>
    </div>
  </div>
</div>
`;

export class MyModal extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'size', 'title', 'hide-header', 'hide-footer', 'hide-close', 'mask-closable', 'esc-closable'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._overlay = this._shadowRoot.querySelector('.overlay');
    this._wrapper = this._shadowRoot.querySelector('.dialog-wrapper');
    this._dialog = this._shadowRoot.querySelector('.dialog');
    this._closeBtn = this._shadowRoot.querySelector('.close-btn');
    this._prevFocus = null;
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleMaskClick = this._handleMaskClick.bind(this);
    this._prevBodyOverflow = '';
  }

  connectedCallback() {
    this._closeBtn.addEventListener('click', () => this._onClose('close'));
    this._overlay.addEventListener('click', this._handleMaskClick);
    document.addEventListener('keydown', this._handleKeydown);

    this._ensureButtons();
    this._render();

    if (this.open) this._applyOpen();
  }

  disconnectedCallback() {
    this._closeBtn.removeEventListener('click', () => this._onClose('close'));
    this._overlay.removeEventListener('click', this._handleMaskClick);
    document.removeEventListener('keydown', this._handleKeydown);
    if (this.open) this._restoreBody();
  }

  attributeChangedCallback(name) {
    if (!this._dialog) return;
    if (name === 'open') {
      this.open ? this._applyOpen() : this._applyClose();
    }
    this._render();
  }

  _ensureButtons() {
    if (this.querySelector('[slot="footer"]')) return;
    const cancelBtn = this._shadowRoot.querySelector('.cancel-btn');
    const confirmBtn = this._shadowRoot.querySelector('.confirm-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onClose('cancel');
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onConfirm();
      });
    }
  }

  _handleMaskClick(e) {
    if (e.target === this._overlay || e.target === this._wrapper) {
      if (this.maskClosable) {
        this._onClose('mask');
      }
    }
  }

  _handleKeydown(e) {
    if (!this.open) return;
    if (e.key === 'Escape' && this.escClosable) {
      this._onClose('esc');
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      this._trapFocus(e.shiftKey);
    }
  }

  _trapFocus(backwards) {
    const focusable = this._dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) {
      this._closeBtn.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.shadowRoot.activeElement;
    if (backwards) {
      if (active === first) last.focus();
      else first.focus();
    } else {
      if (active === last) first.focus();
      else last.focus();
    }
  }

  _onClose(reason) {
    const event = new CustomEvent('before-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { reason }
    });
    this.dispatchEvent(event);
    if (event.defaultPrevented) return;
    this.open = false;
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true,
      detail: { reason }
    }));
  }

  _onConfirm() {
    const event = new CustomEvent('confirm', {
      bubbles: true,
      composed: true,
      cancelable: true
    });
    this.dispatchEvent(event);
    if (event.defaultPrevented) return;
    this.open = false;
    this.removeAttribute('open');
  }

  _applyOpen() {
    this._prevFocus = document.activeElement;
    this._prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      this._closeBtn.focus();
    });
    this.dispatchEvent(new CustomEvent('after-open', { bubbles: true, composed: true }));
  }

  _applyClose() {
    document.body.style.overflow = this._prevBodyOverflow;
    if (this._prevFocus && typeof this._prevFocus.focus === 'function') {
      this._prevFocus.focus();
    }
    this.dispatchEvent(new CustomEvent('after-close', { bubbles: true, composed: true }));
  }

  _render() {
    if (this.title) {
      const titleSlot = this._shadowRoot.querySelector('slot[name="title"]');
      if (titleSlot && !this.querySelector('[slot="title"]')) {
        titleSlot.textContent = this.title;
      }
    }
    this._dialog.setAttribute('role', 'dialog');
    if (this.title) this._dialog.setAttribute('aria-label', this.title);
  }

  show() { this.open = true; this.setAttribute('open', ''); }
  hide() { this.open = false; this.removeAttribute('open'); this._onClose('api'); }

  get open() { return this.hasAttribute('open'); }
  set open(val) { val ? this.setAttribute('open', '') : this.removeAttribute('open'); }

  get size() { return this.getAttribute('size') || 'md'; }
  set size(val) { this.setAttribute('size', val); }

  get title() { return this.getAttribute('title'); }
  set title(val) { this.setAttribute('title', val); }

  get maskClosable() { return this.getAttribute('mask-closable') !== 'false'; }
  set maskClosable(val) { this.setAttribute('mask-closable', String(val)); }

  get escClosable() { return this.getAttribute('esc-closable') !== 'false'; }
  set escClosable(val) { this.setAttribute('esc-closable', String(val)); }
}

customElements.define('my-modal', MyModal);
