import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { getSafeNextPath, withPreservedNext } from '../lib/auth-guard.js';
import { queueFlash } from '../lib/flash.js';
import { setLoading } from '../lib/loading.js';
import { showErrorToast } from '../lib/toast.js';
import { signUp } from '../services/authService.js';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  form: document.querySelector('#signup-form'),
  name: document.querySelector('#signup-name'),
  email: document.querySelector('#signup-email'),
  password: document.querySelector('#signup-password'),
  confirmPassword: document.querySelector('#signup-confirm-password'),
  submit: document.querySelector('[data-submit]'),
  formError: document.querySelector('[data-form-error]'),
  switchLogin: document.querySelector('[data-switch-login]'),
};

/**
 * Validates the customer's display name.
 * @param {string} value - Name value.
 * @returns {string} Error message, or an empty string.
 */
function validateName(value) {
  if (!value.trim()) {
    return 'Full name is required.';
  }

  if (value.trim().length < 2) {
    return 'Enter your full name.';
  }

  return '';
}

/**
 * Validates a signup email value.
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
 * Validates a new password value.
 * @param {string} value - Password value.
 * @returns {string} Error message, or an empty string.
 */
function validatePassword(value) {
  if (!value) {
    return 'Password is required.';
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  return '';
}

/**
 * Validates password confirmation.
 * @param {string} password - Password value.
 * @param {string} confirmPassword - Confirmation value.
 * @returns {string} Error message, or an empty string.
 */
function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return 'Confirm your password.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
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
 * Validates the complete signup form and paints inline errors.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
  const nameError = validateName(refs.name.value);
  const emailError = validateEmail(refs.email.value);
  const passwordError = validatePassword(refs.password.value);
  const confirmPasswordError = validateConfirmPassword(refs.password.value, refs.confirmPassword.value);

  setFieldError(refs.name, 'name', nameError);
  setFieldError(refs.email, 'email', emailError);
  setFieldError(refs.password, 'password', passwordError);
  setFieldError(refs.confirmPassword, 'confirmPassword', confirmPasswordError);

  return !nameError && !emailError && !passwordError && !confirmPasswordError;
}

/**
 * Handles signup submit, confirmation-email mode, session mode, and safe redirects.
 * @param {SubmitEvent} event - Form submit event.
 */
async function handleSubmit(event) {
  event.preventDefault();
  setFormError('');

  if (!validateForm()) {
    return;
  }

  setLoading(refs.submit, true, 'Creating account');

  const result = await signUp({
    name: refs.name.value.trim(),
    email: refs.email.value.trim(),
    password: refs.password.value,
  });

  setLoading(refs.submit, false);

  if (!result.ok) {
    const message = result.error || 'Could not create your account.';
    setFormError(message);
    showErrorToast(message);
    return;
  }

  if (result.data?.session) {
    const intendedPath = getSafeNextPath('/');

    queueFlash({
      type: 'success',
      title: 'Account created',
      message: 'Your account is ready. Complete your profile to continue.',
    });
    window.location.assign(`/pages/profile.html?next=${encodeURIComponent(intendedPath)}&incomplete=1`);
    return;
  }

  queueFlash({
    type: 'info',
    title: 'Account created',
    message: 'Your account was created. Confirm your email if Supabase asks for it, then log in.',
    durationMs: 5200,
  });
  window.location.assign(withPreservedNext('/pages/login.html'));
}

/**
 * Boots the signup screen and shared shell.
 */
function bootSignup() {
  if (!refs.header || !refs.bottomNav || !refs.form) {
    throw new Error('Signup page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, {});

  if (refs.switchLogin) {
    refs.switchLogin.setAttribute('href', withPreservedNext('/pages/login.html'));
  }

  refs.name.addEventListener('input', () => setFieldError(refs.name, 'name', ''));
  refs.email.addEventListener('input', () => setFieldError(refs.email, 'email', ''));
  refs.password.addEventListener('input', () => setFieldError(refs.password, 'password', ''));
  refs.confirmPassword.addEventListener('input', () => setFieldError(refs.confirmPassword, 'confirmPassword', ''));
  refs.form.addEventListener('submit', handleSubmit);
}

bootSignup();
