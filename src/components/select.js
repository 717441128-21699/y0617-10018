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
  position: relative;
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

.select-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-md);
  background-color: var(--ui-color-bg);
  cursor: pointer;
  transition: all var(--ui-transition-fast);
}

.select-container:hover:not(.disabled) {
  border-color: var(--ui-color-border-hover);
}

.select-container.open {
  border-color: var(--ui-color-border-focus);
  box-shadow: 0 0 0 3px var(--ui-color-primary-light);
}

.select-container.disabled {
  background-color: var(--ui-color-bg-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.select-container.error {
  border-color: var(--ui-color-danger);
}

.select-container.error.open {
  box-shadow: 0 0 0 3px var(--ui-color-danger-light);
}

.select-value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: var(--ui-spacing-sm) var(--ui-spacing-md);
  height: var(--ui-size-md);
  box-sizing: border-box;
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
}

.placeholder {
  color: var(--ui-color-text-tertiary);
}

.select-container.size--sm .select-value {
  height: var(--ui-size-sm);
  font-size: var(--ui-font-size-sm);
  padding: var(--ui-spacing-xs) var(--ui-spacing-sm);
}

.select-container.size--lg .select-value {
  height: var(--ui-size-lg);
  font-size: var(--ui-font-size-lg);
  padding: var(--ui-spacing-md) var(--ui-spacing-lg);
}

.caret {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: var(--ui-spacing-md);
  color: var(--ui-color-text-tertiary);
  transition: transform var(--ui-transition-fast);
  flex-shrink: 0;
}

.select-container.open .caret {
  transform: rotate(180deg);
}

.select-container.size--sm .caret { padding-right: var(--ui-spacing-sm); }
.select-container.size--lg .caret { padding-right: var(--ui-spacing-lg); }

.clear-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: var(--ui-spacing-xs);
  border: none;
  background: var(--ui-color-bg-tertiary);
  color: var(--ui-color-text-secondary);
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all var(--ui-transition-fast);
  flex-shrink: 0;
}
.clear-btn:hover {
  background: var(--ui-color-border-hover);
  color: var(--ui-color-text-primary);
}

.dropdown {
  position: fixed;
  z-index: var(--ui-z-dropdown);
  background: var(--ui-color-bg);
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-md);
  box-shadow: var(--ui-shadow-lg);
  padding: var(--ui-spacing-xs);
  margin: 4px 0 0 0;
  overflow-y: auto;
  max-height: 256px;
  min-width: 100%;
  box-sizing: border-box;
  display: none;
}

.dropdown.open {
  display: block;
  animation: dropdownFadeIn var(--ui-transition-fast);
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-input {
  width: 100%;
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-sm);
  padding: var(--ui-spacing-xs) var(--ui-spacing-sm);
  font-size: var(--ui-font-size-sm);
  outline: none;
  margin-bottom: var(--ui-spacing-xs);
  box-sizing: border-box;
  font-family: inherit;
}
.search-input:focus {
  border-color: var(--ui-color-border-focus);
}

.loading-state {
  padding: var(--ui-spacing-lg);
  text-align: center;
  color: var(--ui-color-text-tertiary);
  font-size: var(--ui-font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-spacing-sm);
}
.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--ui-color-text-tertiary);
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.options-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.option {
  display: flex;
  align-items: center;
  padding: var(--ui-spacing-sm) var(--ui-spacing-md);
  border-radius: var(--ui-radius-sm);
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
  cursor: pointer;
  transition: background-color var(--ui-transition-fast);
  list-style: none;
}

.option:hover {
  background-color: var(--ui-color-bg-tertiary);
}

.option.selected {
  background-color: var(--ui-color-primary-light);
  color: var(--ui-color-primary);
  font-weight: var(--ui-font-weight-medium);
}

.option.disabled {
  color: var(--ui-color-text-disabled);
  cursor: not-allowed;
}
.option.disabled:hover {
  background-color: transparent;
}

.option.focused {
  background-color: var(--ui-color-bg-tertiary);
}

.option-check {
  margin-right: var(--ui-spacing-xs);
  color: var(--ui-color-primary);
  font-size: var(--ui-font-size-sm);
  flex-shrink: 0;
}

.empty-state {
  padding: var(--ui-spacing-lg);
  text-align: center;
  color: var(--ui-color-text-tertiary);
  font-size: var(--ui-font-size-sm);
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

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: var(--ui-spacing-xs) 0;
  flex: 1;
  min-width: 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--ui-color-primary-light);
  color: var(--ui-color-primary);
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-font-size-xs);
  line-height: var(--ui-line-height-normal);
  white-space: nowrap;
}

.tag-remove {
  display: inline-flex;
  cursor: pointer;
  opacity: 0.6;
  font-size: 14px;
  line-height: 1;
}
.tag-remove:hover {
  opacity: 1;
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
  <div class="select-container" tabindex="0">
    <div class="select-value">
      <span class="value-text placeholder">请选择</span>
      <div class="tags-container" style="display:none;"></div>
    </div>
    <button class="clear-btn" type="button" title="清除">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="2" x2="8" y2="8"></line>
        <line x1="8" y1="2" x2="2" y2="8"></line>
      </svg>
    </button>
    <span class="caret">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
      </svg>
    </span>
  </div>
  <div class="dropdown" role="listbox">
    <input class="search-input" type="text" placeholder="搜索..." style="display:none;" />
    <div class="loading-state" style="display:none;">
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>
    <div class="empty-state" style="display:none;"></div>
    <ul class="options-list"></ul>
  </div>
  <div class="help-text" style="display:none;"></div>
  <div class="error-text" style="display:none;"></div>
</div>
`;

export class MySelect extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'placeholder', 'value', 'size', 'disabled', 'required', 'error', 'help-text', 'clearable', 'block', 'name', 'multiple', 'searchable', 'loading'];
  }

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._wrapper = this._shadowRoot.querySelector('.wrapper');
    this._labelEl = this._shadowRoot.querySelector('.label');
    this._labelText = this._shadowRoot.querySelector('.label-text');
    this._requiredMark = this._shadowRoot.querySelector('.required-mark');
    this._container = this._shadowRoot.querySelector('.select-container');
    this._valueText = this._shadowRoot.querySelector('.value-text');
    this._tagsContainer = this._shadowRoot.querySelector('.tags-container');
    this._dropdown = this._shadowRoot.querySelector('.dropdown');
    this._searchInput = this._shadowRoot.querySelector('.search-input');
    this._loadingStateEl = this._shadowRoot.querySelector('.loading-state');
    this._emptyStateEl = this._shadowRoot.querySelector('.empty-state');
    this._optionsListEl = this._shadowRoot.querySelector('.options-list');
    this._clearBtn = this._shadowRoot.querySelector('.clear-btn');
    this._helpText = this._shadowRoot.querySelector('.help-text');
    this._errorText = this._shadowRoot.querySelector('.error-text');
    this._options = [];
    this._selectedValues = [];
    this._optionEls = [];
    this._focusedIndex = -1;
    this._isOpen = false;
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleSearchInput = this._handleSearchInput.bind(this);
    this._handleSearchKeydown = this._handleSearchKeydown.bind(this);
    this._slotObserver = null;
  }

  connectedCallback() {
    this._container.addEventListener('click', this._onToggle.bind(this));
    this._container.addEventListener('keydown', this._handleKeydown);
    this._clearBtn.addEventListener('click', this._onClear.bind(this));
    this._searchInput.addEventListener('input', this._handleSearchInput);
    this._searchInput.addEventListener('keydown', this._handleSearchKeydown);
    document.addEventListener('mousedown', this._handleOutsideClick);

    this._slotObserver = new MutationObserver(() => this._syncOptions());
    this._slotObserver.observe(this, { childList: true, subtree: true });

    this._syncOptions();
    this._render();
  }

  disconnectedCallback() {
    this._container.removeEventListener('click', this._onToggle);
    this._container.removeEventListener('keydown', this._handleKeydown);
    this._clearBtn.removeEventListener('click', this._onClear);
    this._searchInput.removeEventListener('input', this._handleSearchInput);
    this._searchInput.removeEventListener('keydown', this._handleSearchKeydown);
    document.removeEventListener('mousedown', this._handleOutsideClick);
    if (this._slotObserver) this._slotObserver.disconnect();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._container) {
      if (name === 'loading') {
        this._renderEmptyState();
      }
      this._render();
    }
  }

  _syncOptions() {
    const optionEls = this.querySelectorAll('my-option');
    this._options = Array.from(optionEls).map(el => ({
      value: el.getAttribute('value'),
      label: el.textContent.trim(),
      disabled: el.hasAttribute('disabled'),
      element: el
    }));

    if (this.multiple) {
      this._syncSelectedValues();
    } else {
      if (this.value !== null && this.value !== undefined && this.value !== '') {
        const selected = this._options.find(o => o.value === this.value);
        if (selected) {
          this._valueText.textContent = selected.label;
          this._valueText.classList.remove('placeholder');
        }
      }
    }

    this._renderDropdown();
  }

  _syncSelectedValues() {
    const attrVal = this.getAttribute('value');
    if (attrVal && attrVal !== '') {
      this._selectedValues = attrVal.split(',').filter(v => v !== '');
    } else {
      this._selectedValues = [];
    }
  }

  _getVisibleOptions() {
    return this._optionsListEl.querySelectorAll('.option:not(.disabled):not([style*="display: none"])');
  }

  _renderDropdown() {
    this._optionsListEl.innerHTML = '';
    this._optionEls = [];

    this._options.forEach(opt => {
      const li = document.createElement('li');
      li.className = 'option';
      li.dataset.value = opt.value;
      li.textContent = opt.label;
      if (opt.disabled) li.classList.add('disabled');

      if (this.multiple) {
        if (this._selectedValues.includes(opt.value)) {
          li.classList.add('selected');
          const check = document.createElement('span');
          check.className = 'option-check';
          check.textContent = '\u2713';
          li.insertBefore(check, li.firstChild);
        }
      } else {
        if (opt.value === this.value) li.classList.add('selected');
      }

      if (!opt.disabled) {
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          this._selectOption(opt.value, opt.label);
        });
      }
      this._optionsListEl.appendChild(li);
      this._optionEls.push(li);
    });

    this._renderEmptyState();
  }

  _renderEmptyState() {
    const searchKeyword = this.searchable ? this._searchInput.value.toLowerCase() : '';

    if (this.loading) {
      this._loadingStateEl.style.display = 'flex';
      this._emptyStateEl.style.display = 'none';
      this._optionsListEl.style.display = 'none';
      return;
    }

    this._loadingStateEl.style.display = 'none';

    if (this._options.length === 0) {
      this._emptyStateEl.style.display = 'block';
      this._emptyStateEl.textContent = '暂无选项';
      this._optionsListEl.style.display = 'none';
      return;
    }

    if (searchKeyword) {
      const hasVisible = this._options.some(opt => opt.label.toLowerCase().includes(searchKeyword));
      if (!hasVisible) {
        this._emptyStateEl.style.display = 'block';
        this._emptyStateEl.textContent = '未找到匹配结果';
        this._optionsListEl.style.display = 'none';
        return;
      }
    }

    this._emptyStateEl.style.display = 'none';
    this._optionsListEl.style.display = 'block';
  }

  _selectOption(value, label) {
    if (this.multiple) {
      const idx = this._selectedValues.indexOf(value);
      if (idx >= 0) {
        this._selectedValues.splice(idx, 1);
      } else {
        this._selectedValues.push(value);
      }
      const newValue = this._selectedValues.join(',');
      this.setAttribute('value', newValue);
      this._updateTags();
      this._updateOptionSelectedStates();
      const labels = this._selectedValues.map(v => {
        const opt = this._options.find(o => o.value === v);
        return opt ? opt.label : v;
      });
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: newValue, values: [...this._selectedValues], labels }
      }));

      if (this.error) {
        const hasSelection = this._selectedValues.length > 0;
        if (!this.required || hasSelection) {
          this.resetValidation();
          this.dispatchEvent(new CustomEvent('validation-change', {
            bubbles: true,
            composed: true,
            detail: { valid: true }
          }));
        }
      }
    } else {
      this.value = value;
      this._valueText.textContent = label;
      this._valueText.classList.remove('placeholder');
      this._updateOptionSelectedStates();
      this.close();
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value, label }
      }));

      if (this.error) {
        this.resetValidation();
        this.dispatchEvent(new CustomEvent('validation-change', {
          bubbles: true,
          composed: true,
          detail: { valid: true }
        }));
      }
    }
  }

  _updateOptionSelectedStates() {
    this._optionEls.forEach(li => {
      const value = li.dataset.value;
      li.classList.remove('selected');
      const existingCheck = li.querySelector('.option-check');
      if (existingCheck) existingCheck.remove();

      if (this.multiple) {
        if (this._selectedValues.includes(value)) {
          li.classList.add('selected');
          const check = document.createElement('span');
          check.className = 'option-check';
          check.textContent = '\u2713';
          li.insertBefore(check, li.firstChild);
        }
      } else {
        if (value === this.value) li.classList.add('selected');
      }
    });
  }

  _updateTags() {
    if (!this.multiple) return;
    this._tagsContainer.innerHTML = '';
    if (this._selectedValues.length === 0) {
      this._tagsContainer.style.display = 'none';
      this._valueText.style.display = '';
      this._valueText.textContent = this.placeholder || '请选择';
      this._valueText.classList.add('placeholder');
      return;
    }
    this._valueText.style.display = 'none';
    this._tagsContainer.style.display = 'flex';
    this._selectedValues.forEach(val => {
      const opt = this._options.find(o => o.value === val);
      if (!opt) return;
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = opt.label;
      const remove = document.createElement('span');
      remove.className = 'tag-remove';
      remove.textContent = '\u00d7';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeTag(val);
      });
      tag.appendChild(remove);
      this._tagsContainer.appendChild(tag);
    });
  }

  _removeTag(value) {
    const idx = this._selectedValues.indexOf(value);
    if (idx >= 0) {
      this._selectedValues.splice(idx, 1);
    }
    const newValue = this._selectedValues.join(',');
    this.setAttribute('value', newValue);
    this._updateTags();
    this._updateOptionSelectedStates();
    const labels = this._selectedValues.map(v => {
      const opt = this._options.find(o => o.value === v);
      return opt ? opt.label : v;
    });
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { value: newValue, values: [...this._selectedValues], labels }
    }));

    if (this.error) {
      const isSatisfied = this.multiple
        ? this._selectedValues.length > 0
        : (this.value && this.value !== '');
      if (!this.required || isSatisfied) {
        this.resetValidation();
        this.dispatchEvent(new CustomEvent('validation-change', {
          bubbles: true,
          composed: true,
          detail: { valid: true }
        }));
      }
    }
  }

  _onToggle(e) {
    if (this.disabled) return;
    e.stopPropagation();
    if (this._isOpen) this.close();
    else this.open();
  }

  _onClear(e) {
    e.stopPropagation();
    if (this.multiple) {
      this._selectedValues = [];
      this.setAttribute('value', '');
      this._updateTags();
    } else {
      this.value = '';
      this.removeAttribute('value');
      this._valueText.textContent = this.placeholder || '请选择';
      this._valueText.classList.add('placeholder');
    }
    this._updateOptionSelectedStates();
    this._updateClearBtn();
    this.dispatchEvent(new CustomEvent('clear', {
      bubbles: true,
      composed: true
    }));
    if (this.multiple) {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: '', values: [], labels: [] }
      }));
    } else {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: '', label: '' }
      }));
    }

    if (this.error) {
      const isSatisfied = this.multiple
        ? this._selectedValues.length > 0
        : (this.value && this.value !== '');
      if (!this.required || isSatisfied) {
        this.resetValidation();
        this.dispatchEvent(new CustomEvent('validation-change', {
          bubbles: true,
          composed: true,
          detail: { valid: true }
        }));
      }
    }
  }

  _handleOutsideClick(e) {
    if (!this._isOpen) return;
    const path = e.composedPath();
    if (!path.includes(this) && !path.includes(this._dropdown)) {
      this.close();
    }
  }

  _handleKeydown(e) {
    if (this.disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this._isOpen) {
          if (this._focusedIndex >= 0) {
            const visible = this._getVisibleOptions();
            if (visible[this._focusedIndex]) {
              const value = visible[this._focusedIndex].dataset.value;
              const opt = this._options.find(o => o.value === value);
              if (opt) this._selectOption(opt.value, opt.label);
            }
          } else {
            this.close();
          }
        } else {
          this.open();
        }
        break;
      case 'Escape':
        this.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this._isOpen) this.open();
        this._moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this._isOpen) this._moveFocus(-1);
        break;
      case 'Backspace':
        if (this.multiple && this._selectedValues.length > 0) {
          this._removeTag(this._selectedValues[this._selectedValues.length - 1]);
        }
        break;
    }
  }

  _handleSearchInput() {
    this._focusedIndex = -1;
    const searchKeyword = this._searchInput.value.toLowerCase();

    this._optionEls.forEach((li, index) => {
      const opt = this._options[index];
      if (opt && searchKeyword && !opt.label.toLowerCase().includes(searchKeyword)) {
        li.style.display = 'none';
      } else {
        li.style.display = '';
      }
    });

    this._renderEmptyState();
  }

  _handleSearchKeydown(e) {
    switch (e.key) {
      case 'Escape':
        e.stopPropagation();
        this.close();
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (this._focusedIndex >= 0) {
          const visible = this._getVisibleOptions();
          if (visible[this._focusedIndex]) {
            const value = visible[this._focusedIndex].dataset.value;
            const opt = this._options.find(o => o.value === value);
            if (opt) {
              this._selectOption(opt.value, opt.label);
              if (this.multiple) {
                this._searchInput.focus();
              }
            }
          }
        } else {
          const visible = this._getVisibleOptions();
          if (visible.length > 0) {
            const value = visible[0].dataset.value;
            const opt = this._options.find(o => o.value === value);
            if (opt) {
              this._selectOption(opt.value, opt.label);
              if (this.multiple) {
                this._searchInput.focus();
              }
            }
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._moveFocus(-1);
        break;
    }
  }

  _moveFocus(direction) {
    const visible = this._getVisibleOptions();
    if (visible.length === 0) return;

    visible.forEach(opt => opt.classList.remove('focused'));

    this._focusedIndex = this._focusedIndex + direction;
    if (this._focusedIndex < 0) this._focusedIndex = visible.length - 1;
    if (this._focusedIndex >= visible.length) this._focusedIndex = 0;

    visible[this._focusedIndex].classList.add('focused');
    visible[this._focusedIndex].scrollIntoView({ block: 'nearest' });
  }

  _positionDropdown() {
    const rect = this._container.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(256, this._options.length * 40 + 16);
    this._dropdown.style.width = `${rect.width}px`;
    this._dropdown.style.left = `${rect.left}px`;
    if (spaceBelow < dropdownHeight + 8 && rect.top > spaceBelow) {
      this._dropdown.style.top = `${rect.top - 4}px`;
      this._dropdown.style.transform = 'translateY(-100%)';
    } else {
      this._dropdown.style.top = `${rect.bottom + 4}px`;
      this._dropdown.style.transform = 'none';
    }
  }

  open() {
    if (this._isOpen || this.disabled) return;
    this._isOpen = true;
    this._focusedIndex = -1;
    this._container.classList.add('open');
    this._positionDropdown();
    requestAnimationFrame(() => {
      this._dropdown.classList.add('open');
      if (this.searchable) {
        this._searchInput.style.display = 'block';
        this._searchInput.focus();
      }
    });
    this._renderEmptyState();
    this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._focusedIndex = -1;
    this._container.classList.remove('open');
    this._dropdown.classList.remove('open');
    if (this.searchable) {
      this._searchInput.value = '';
      this._searchInput.style.display = 'none';
    }
    this._optionEls.forEach(li => {
      li.style.display = '';
      li.classList.remove('focused');
    });
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  focus() {
    if (this.disabled) return;
    if (this._isOpen && this.searchable) {
      this._searchInput.focus();
    } else {
      this._container.focus();
    }
  }

  _updateClearBtn() {
    if (this.multiple) {
      if (this.clearable && !this.disabled && this._selectedValues.length > 0) {
        this._clearBtn.style.display = 'flex';
      } else {
        this._clearBtn.style.display = 'none';
      }
    } else {
      if (this.clearable && !this.disabled && this.value && this.value !== '') {
        this._clearBtn.style.display = 'flex';
      } else {
        this._clearBtn.style.display = 'none';
      }
    }
  }

  _render() {
    this._labelText.textContent = this.label;
    this._labelEl.style.display = this.label ? 'block' : 'none';
    this._requiredMark.style.display = this.required ? 'inline' : 'none';

    const size = this.size || 'md';
    this._container.className = `select-container size--${size}`;
    if (this._isOpen) this._container.classList.add('open');
    if (this.disabled) this._container.classList.add('disabled');
    if (this.error) this._container.classList.add('error');

    if (this.multiple) {
      this._syncSelectedValues();
      this._updateTags();
    } else {
      if (!this.value || this.value === '') {
        this._valueText.textContent = this.placeholder || '请选择';
        this._valueText.classList.add('placeholder');
      }
    }

    this._helpText.textContent = this.helpText || '';
    this._helpText.style.display = this.helpText && !this.error ? 'block' : 'none';

    this._errorText.textContent = this.error || '';
    this._errorText.style.display = this.error ? 'block' : 'none';

    this._container.setAttribute('aria-disabled', this.disabled);
    this._container.tabIndex = this.disabled ? -1 : 0;

    this._updateClearBtn();
  }

  validate() {
    if (this.required) {
      if (this.multiple) {
        if (this._selectedValues.length === 0) {
          this.error = '请选择此项';
          this.dispatchEvent(new CustomEvent('validation-change', {
            bubbles: true,
            composed: true,
            detail: { valid: false }
          }));
          return { valid: false, message: '请选择此项' };
        }
      } else {
        if (!this.value || this.value === '') {
          this.error = '请选择此项';
          this.dispatchEvent(new CustomEvent('validation-change', {
            bubbles: true,
            composed: true,
            detail: { valid: false }
          }));
          return { valid: false, message: '请选择此项' };
        }
      }
    }
    this.dispatchEvent(new CustomEvent('validation-change', {
      bubbles: true,
      composed: true,
      detail: { valid: true }
    }));
    return { valid: true, message: '' };
  }

  resetValidation() {
    this.removeAttribute('error');
  }

  reset() {
    if (this.multiple) {
      this._selectedValues = [];
      this.setAttribute('value', '');
      this._updateTags();
    } else {
      this.removeAttribute('value');
      this._valueText.textContent = this.placeholder || '请选择';
      this._valueText.classList.add('placeholder');
    }
    this._updateOptionSelectedStates();
    this.resetValidation();
  }

  get label() { return this.getAttribute('label'); }
  set label(val) { this.setAttribute('label', val); }

  get placeholder() { return this.getAttribute('placeholder'); }
  set placeholder(val) { this.setAttribute('placeholder', val); }

  get value() {
    const v = this.getAttribute('value');
    return v === null ? '' : v;
  }
  set value(val) {
    if (this.multiple) {
      if (typeof val === 'string' && val !== '') {
        this._selectedValues = val.split(',').filter(v => v !== '');
      } else {
        this._selectedValues = [];
      }
      this.setAttribute('value', typeof val === 'string' ? val : '');
      this._updateTags();
      this._updateOptionSelectedStates();
      this._updateClearBtn();
    } else {
      this.setAttribute('value', val);
      if (this._options.length > 0) {
        const selected = this._options.find(o => o.value === val);
        if (selected) {
          this._valueText.textContent = selected.label;
          this._valueText.classList.remove('placeholder');
        }
      }
      this._updateOptionSelectedStates();
      this._updateClearBtn();
    }
  }

  get values() {
    if (this.multiple) {
      return [...this._selectedValues];
    }
    const v = this.value;
    return v ? [v] : [];
  }

  get size() { return this.getAttribute('size') || 'md'; }
  set size(val) { this.setAttribute('size', val); }

  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  get required() { return this.hasAttribute('required'); }
  set required(val) { val ? this.setAttribute('required', '') : this.removeAttribute('required'); }

  get error() { return this.getAttribute('error'); }
  set error(val) { val ? this.setAttribute('error', val) : this.removeAttribute('error'); }

  get helpText() { return this.getAttribute('help-text'); }
  set helpText(val) { val ? this.setAttribute('help-text', val) : this.removeAttribute('help-text'); }

  get clearable() { return this.hasAttribute('clearable'); }
  set clearable(val) { val ? this.setAttribute('clearable', '') : this.removeAttribute('clearable'); }

  get block() { return this.hasAttribute('block'); }
  set block(val) { val ? this.setAttribute('block', '') : this.removeAttribute('block'); }

  get name() { return this.getAttribute('name'); }
  set name(val) { this.setAttribute('name', val); }

  get multiple() { return this.hasAttribute('multiple'); }
  set multiple(val) { val ? this.setAttribute('multiple', '') : this.removeAttribute('multiple'); }

  get searchable() { return this.hasAttribute('searchable'); }
  set searchable(val) { val ? this.setAttribute('searchable', '') : this.removeAttribute('searchable'); }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
}

customElements.define('my-select', MySelect);

class MyOption extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled'];
  }
  constructor() {
    super();
    this.style.display = 'none';
  }
}
customElements.define('my-option', MyOption);

export { MyOption };
