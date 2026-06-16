export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';
export type RoundedType = 'default' | 'full';
export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date';
export type ToastType = 'success' | 'warning' | 'error' | 'info';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type CloseReason = 'close' | 'cancel' | 'mask' | 'esc' | 'api';

export interface ButtonClickDetail {
  originalEvent: MouseEvent;
}

export interface InputEventDetail {
  value: string;
}

export interface InputKeydownDetail {
  key: string;
  originalEvent: KeyboardEvent;
}

export interface SelectChangeDetail {
  value: string;
  label: string;
}

export interface ModalCloseDetail {
  reason: CloseReason;
}

export interface ModalBeforeCloseDetail {
  reason: CloseReason;
}

export interface ToastOptions {
  message?: string;
  type?: ToastType;
  duration?: number;
  closable?: boolean;
}

export interface MyButtonElement extends HTMLElement {
  variant: ButtonVariant;
  size: ComponentSize;
  type: ButtonType;
  disabled: boolean;
  loading: boolean;
  block: boolean;
  rounded: RoundedType;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'click', listener: (ev: CustomEvent<ButtonClickDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface MyInputElement extends HTMLElement {
  label: string | null;
  placeholder: string | null;
  type: InputType;
  value: string;
  size: ComponentSize;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  error: string | null;
  helpText: string | null;
  clearable: boolean;
  maxlength: string | null;
  min: string | null;
  max: string | null;
  step: string | null;
  block: boolean;
  focus(): void;
  blur(): void;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'input' | 'change', listener: (ev: CustomEvent<InputEventDetail>) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'focus' | 'blur' | 'clear', listener: (ev: CustomEvent) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'keydown', listener: (ev: CustomEvent<InputKeydownDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface MyOptionElement extends HTMLElement {
  value: string | null;
  disabled: boolean;
}

export interface MySelectElement extends HTMLElement {
  label: string | null;
  placeholder: string | null;
  value: string;
  size: ComponentSize;
  disabled: boolean;
  required: boolean;
  error: string | null;
  helpText: string | null;
  clearable: boolean;
  block: boolean;
  open(): void;
  close(): void;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'change', listener: (ev: CustomEvent<SelectChangeDetail>) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'open' | 'close' | 'clear', listener: (ev: CustomEvent) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface MyModalElement extends HTMLElement {
  open: boolean;
  size: ModalSize;
  title: string | null;
  maskClosable: boolean;
  escClosable: boolean;
  show(): void;
  hide(): void;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'confirm', listener: (ev: CustomEvent) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'close' | 'after-close' | 'after-open', listener: (ev: CustomEvent<ModalCloseDetail>) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'before-close', listener: (ev: CustomEvent<ModalBeforeCloseDetail>) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface MyToastElement extends HTMLElement {
  type: ToastType;
  duration: number;
  closable: boolean;
  close(): void;
  addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'close' | 'before-close', listener: (ev: CustomEvent) => void, options?: boolean | AddEventListenerOptions): void;
}

export interface ShowToast {
  (options: ToastOptions | string): MyToastElement;
  success(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): MyToastElement;
  warning(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): MyToastElement;
  error(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): MyToastElement;
  info(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): MyToastElement;
}

export interface CssThemeVariables {
  '--ui-color-primary': string;
  '--ui-color-primary-hover': string;
  '--ui-color-primary-active': string;
  '--ui-color-primary-light': string;
  '--ui-color-primary-contrast': string;
  '--ui-color-success': string;
  '--ui-color-success-hover': string;
  '--ui-color-success-light': string;
  '--ui-color-warning': string;
  '--ui-color-warning-hover': string;
  '--ui-color-warning-light': string;
  '--ui-color-danger': string;
  '--ui-color-danger-hover': string;
  '--ui-color-danger-light': string;
  '--ui-color-info': string;
  '--ui-color-info-hover': string;
  '--ui-color-info-light': string;
  '--ui-color-text-primary': string;
  '--ui-color-text-secondary': string;
  '--ui-color-text-tertiary': string;
  '--ui-color-text-disabled': string;
  '--ui-color-text-inverse': string;
  '--ui-color-bg': string;
  '--ui-color-bg-secondary': string;
  '--ui-color-bg-tertiary': string;
  '--ui-color-bg-overlay': string;
  '--ui-color-border': string;
  '--ui-color-border-hover': string;
  '--ui-color-border-focus': string;
  '--ui-color-shadow': string;
  '--ui-radius-none': string;
  '--ui-radius-sm': string;
  '--ui-radius-md': string;
  '--ui-radius-lg': string;
  '--ui-radius-xl': string;
  '--ui-radius-full': string;
  '--ui-font-family': string;
  '--ui-font-size-xs': string;
  '--ui-font-size-sm': string;
  '--ui-font-size-md': string;
  '--ui-font-size-lg': string;
  '--ui-font-size-xl': string;
  '--ui-font-size-2xl': string;
  '--ui-line-height-tight': string;
  '--ui-line-height-normal': string;
  '--ui-font-weight-normal': string;
  '--ui-font-weight-medium': string;
  '--ui-font-weight-semibold': string;
  '--ui-spacing-xs': string;
  '--ui-spacing-sm': string;
  '--ui-spacing-md': string;
  '--ui-spacing-lg': string;
  '--ui-spacing-xl': string;
  '--ui-spacing-2xl': string;
  '--ui-size-xs': string;
  '--ui-size-sm': string;
  '--ui-size-md': string;
  '--ui-size-lg': string;
  '--ui-shadow-sm': string;
  '--ui-shadow-md': string;
  '--ui-shadow-lg': string;
  '--ui-shadow-xl': string;
  '--ui-transition-fast': string;
  '--ui-transition-normal': string;
  '--ui-transition-slow': string;
  '--ui-z-dropdown': string;
  '--ui-z-toast': string;
  '--ui-z-modal': string;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-button': MyButtonElement;
    'my-input': MyInputElement;
    'my-select': MySelectElement;
    'my-option': MyOptionElement;
    'my-modal': MyModalElement;
    'my-toast': MyToastElement;
  }
}

export const MyButton: {
  prototype: MyButtonElement;
  new (): MyButtonElement;
};

export const MyInput: {
  prototype: MyInputElement;
  new (): MyInputElement;
};

export const MySelect: {
  prototype: MySelectElement;
  new (): MySelectElement;
};

export const MyOption: {
  prototype: MyOptionElement;
  new (): MyOptionElement;
};

export const MyModal: {
  prototype: MyModalElement;
  new (): MyModalElement;
};

export const MyToast: {
  prototype: MyToastElement;
  new (): MyToastElement;
};

export const showToast: ShowToast;
