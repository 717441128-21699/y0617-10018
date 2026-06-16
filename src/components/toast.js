const template = document.createElement('template');
template.innerHTML = `
<style>
@import '/src/styles/theme.css';

:host {
  display: flex;
  align-items: flex-start;
  gap: var(--ui-spacing-sm);
  padding: var(--ui-spacing-md) var(--ui-spacing-lg);
  border-radius: var(--ui-radius-md);
  background: var(--ui-color-bg);
  box-shadow: var(--ui-shadow-md);
  border: 1px solid var(--ui-color-border);
  font-family: var(--ui-font-family);
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
  color: var(--ui-color-text-primary);
  box-sizing: border-box;
  min-width: 280px;
  max-width: 480px;
  animation: toastEnter var(--ui-transition-slow);
}

:host([visible="false"]) {
  animation: toastLeave var(--ui-transition-normal) forwards;
}

@keyframes toastEnter {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toastLeave {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}

:host([type="success"]) {
  background: var(--ui-color-success-light);
  border-color: #a7f3d0;
  color: #065f46;
}
:host([type="success"]) .icon { color: var(--ui-color-success); }

:host([type="warning"]) {
  background: var(--ui-color-warning-light);
  border-color: #fde68a;
  color: #92400e;
}
:host([type="warning"]) .icon { color: var(--ui-color-warning); }

:host([type="error"]) {
  background: var(--ui-color-danger-light);
  border-color: #fecaca;
  color: #991b1b;
}
:host([type="error"]) .icon { color: var(--ui-color-danger); }

:host([type="info"]) {
  background: var(--ui-color-info-light);
  border-color: #bfdbfe;
  color: #1e40af;
}
:host([type="info"]) .icon { color: var(--ui-color-info); }

.icon {
  display: flex;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 1px;
}

.content {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: currentColor;
  opacity: 0.6;
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  padding: 0;
  margin-left: var(--ui-spacing-xs);
  flex-shrink: 0;
  transition: all var(--ui-transition-fast);
}
.close-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}
</style>
<span class="icon">
  <svg class="icon-success" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
  </svg>
  <svg class="icon-warning" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style="display:none;">
    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
  </svg>
  <svg class="icon-error" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style="display:none;">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
  </svg>
  <svg class="icon-info" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style="display:none;">
    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
  </svg>
</span>
<div class="content"><slot></slot></div>
<button class="close-btn" type="button" aria-label="关闭" style="display:none;">
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="2" y1="2" x2="12" y2="12"></line>
    <line x1="12" y1="2" x2="2" y2="12"></line>
  </svg>
</button>
`;

const ICON_MAP = {
  success: 'icon-success',
  warning: 'icon-warning',
  error: 'icon-error',
  info: 'icon-info'
};

let _toastContainer = null;

function getContainer() {
  if (_toastContainer) return _toastContainer;
  _toastContainer = document.createElement('div');
  _toastContainer.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--ui-z-toast, 2000);
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  `;
  _toastContainer.style.setProperty('--ui-z-toast', '2000');
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

export class MyToast extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'duration', 'closable', 'visible'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._closeBtn = this._shadowRoot.querySelector('.close-btn');
    this._timer = null;
  }

  connectedCallback() {
    this._closeBtn.addEventListener('click', () => this.close());
    this.style.pointerEvents = 'auto';
    this._render();
    if (this.duration > 0) this._startTimer();
  }

  disconnectedCallback() {
    if (this._timer) clearTimeout(this._timer);
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _startTimer() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.close(), this.duration);
  }

  _render() {
    const type = this.type;
    Object.values(ICON_MAP).forEach(cls => {
      const el = this._shadowRoot.querySelector(`.${cls}`);
      if (el) el.style.display = ICON_MAP[type] === cls ? 'block' : 'none';
    });
    this._closeBtn.style.display = this.closable ? 'flex' : 'none';
  }

  close() {
    if (this.getAttribute('visible') === 'false') return;
    this.dispatchEvent(new CustomEvent('before-close', {
      bubbles: true,
      composed: true,
      cancelable: true
    }));
    this.setAttribute('visible', 'false');
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true
    }));
    setTimeout(() => {
      if (this.parentNode) this.parentNode.removeChild(this);
    }, 200);
  }

  get type() { return this.getAttribute('type') || 'info'; }
  set type(val) { this.setAttribute('type', val); }

  get duration() {
    const v = parseInt(this.getAttribute('duration'));
    return isNaN(v) ? 3000 : v;
  }
  set duration(val) { this.setAttribute('duration', String(val)); }

  get closable() { return this.hasAttribute('closable'); }
  set closable(val) { val ? this.setAttribute('closable', '') : this.removeAttribute('closable'); }
}

customElements.define('my-toast', MyToast);

export function showToast(options) {
  if (typeof options === 'string') {
    options = { message: options };
  }
  const {
    message = '',
    type = 'info',
    duration = 3000,
    closable = false
  } = options;

  const container = getContainer();
  const toast = document.createElement('my-toast');
  toast.type = type;
  toast.duration = duration;
  if (closable) toast.setAttribute('closable', '');
  toast.textContent = message;
  container.appendChild(toast);
  return toast;
}

showToast.success = (msg, opts = {}) => showToast({ ...opts, message: msg, type: 'success' });
showToast.warning = (msg, opts = {}) => showToast({ ...opts, message: msg, type: 'warning' });
showToast.error = (msg, opts = {}) => showToast({ ...opts, message: msg, type: 'error' });
showToast.info = (msg, opts = {}) => showToast({ ...opts, message: msg, type: 'info' });
