import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { getSafeNextPath, withPreservedNext } from '../lib/auth-guard.js';
import { consumeFlash, queueFlash } from '../lib/flash.js';
import { setLoading } from '../lib/loading.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { signIn } from '../services/authService.js';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  form: document.querySelector('#login-form'),
  email: document.querySelector('#login-email'),
  password: document.querySelector('#login-password'),
  submit: document.querySelector('[data-submit]'),
  formError: document.querySelector('[data-form-error]'),
  switchSignup: document.querySelector('[data-switch-signup]'),
};

/**
 * Validates a login email value.
 * @param {string} value - Email value.
 * @returns {string} Error message, or an empty string.
 */
function validateEmail(value) {
  const email = value.trim();

  if (!email) {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }

  return '';
}

/**
 * Validates a login password value.
 * @param {string} value - Password value.
 * @returns {string} Error message, or an empty string.
 */
function validatePassword(value) {
  if (!value) {
    return 'Password is required.';
  }

  return '';
}

/**
 * Paints or clears one field-level error message.
 * @param {HTMLInputElement} input - Input element.
 * @param {string} fieldName - Error slot name.
 * @param {string} message - Error message, or an empty string.
 */
function setFieldError(input, fieldName, message) {
  const slot = refs.form.querySelector(`[data-field-error="${fieldName}"]`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');

  if (slot) {
    slot.textContent = message;
  }
}

/**
 * Paints or clears the form-level error alert.
 * @param {string} message - Error message, or an empty string.
 */
function setFormError(message) {
  refs.formError.hidden = !message;
  refs.formError.textContent = message;
}

/**
 * Validates the complete login form and paints inline errors.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
  const emailError = validateEmail(refs.email.value);
  const passwordError = validatePassword(refs.password.value);

  setFieldError(refs.email, 'email', emailError);
  setFieldError(refs.password, 'password', passwordError);

  return !emailError && !passwordError;
}

/**
 * Handles login submit, server errors, and the safe post-login redirect.
 * @param {SubmitEvent} event - Form submit event.
 */
async function handleSubmit(event) {
  event.preventDefault();
  setFormError('');

  if (!validateForm()) {
    return;
  }

  setLoading(refs.submit, true, 'Logging in');

  const result = await signIn({
    email: refs.email.value.trim(),
    password: refs.password.value,
  });

  setLoading(refs.submit, false);

  if (!result.ok) {
    const message = result.error || 'Could not log you in.';
    setFormError(message);
    showErrorToast(message);
    return;
  }

  queueFlash({
    type: 'success',
    title: 'Welcome back',
    message: 'You are logged in.',
  });
  window.location.assign(getSafeNextPath('/'));
}

/**
 * Boots the login screen and shared shell.
 */
function showStoredFlash() {
  const flash = consumeFlash();

  if (!flash) {
    return;
  }

  const options = { title: flash.title, durationMs: flash.durationMs };

  if (flash.type === 'success') {
    showSuccessToast(flash.message, options);
  } else if (flash.type === 'error') {
    showErrorToast(flash.message, options);
  } else {
    showInfoToast(flash.message, options);
  }
}

/**
 * Boots the login screen and shared shell.
 */
function bootLogin() {
  if (!refs.header || !refs.bottomNav || !refs.form) {
    throw new Error('Login page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});
  showStoredFlash();

  if (refs.switchSignup) {
    refs.switchSignup.setAttribute('href', withPreservedNext('/pages/signup.html'));
  }

  refs.email.addEventListener('input', () => setFieldError(refs.email, 'email', ''));
  refs.password.addEventListener('input', () => setFieldError(refs.password, 'password', ''));
  refs.form.addEventListener('submit', handleSubmit);
}

bootLogin();
