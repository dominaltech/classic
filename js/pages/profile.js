import { renderBottomNav } from '../components/bottomNav.js';
import { renderHeader } from '../components/header.js';
import { bindHeaderCartBadge } from '../lib/cart-badge.js';
import { getSafeNextPath, requireAuth } from '../lib/auth-guard.js';
import { consumeFlash, queueFlash } from '../lib/flash.js';
import { setLoading } from '../lib/loading.js';
import { isProfileComplete } from '../lib/profile-guard.js';
import { showErrorToast, showInfoToast, showSuccessToast } from '../lib/toast.js';
import { getProfile, updateProfile } from '../services/profileService.js';

const refs = {
  header: document.querySelector('#app-header'),
  bottomNav: document.querySelector('#app-bottom-nav'),
  form: document.querySelector('#profile-form'),
  name: document.querySelector('#profile-name'),
  address: document.querySelector('#profile-address'),
  phone: document.querySelector('#profile-phone'),
  submit: document.querySelector('[data-submit]'),
  formError: document.querySelector('[data-form-error]'),
  formErrorText: document.querySelector('[data-form-error-text]'),
  retry: document.querySelector('[data-retry]'),
};

const state = {
  auth: null,
  profile: null,
  loadingProfile: false,
  flashShown: false,
  wasIncompleteOnLoad: false,
};

/**
 * Shows a queued one-time message after redirects.
 */
function showStoredFlash() {
  const flash = consumeFlash();

  if (!flash) {
    return;
  }

  state.flashShown = true;

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
 * Enables or disables the whole profile form during reads/writes.
 * @param {boolean} isBusy - Busy flag.
 */
function setFormBusy(isBusy) {
  state.loadingProfile = isBusy;
  refs.form.setAttribute('aria-busy', String(isBusy));
  refs.name.disabled = isBusy;
  refs.address.disabled = isBusy;
  refs.phone.disabled = isBusy;
  refs.submit.disabled = isBusy;
}

/**
 * Paints or clears one field-level error message.
 * @param {HTMLInputElement | HTMLTextAreaElement} input - Input element.
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
 * @param {boolean} canRetry - Whether to show the retry action.
 */
function setFormError(message, canRetry = false) {
  refs.formError.hidden = !message;
  refs.formErrorText.textContent = message;
  refs.retry.hidden = !canRetry;
}

/**
 * Validates the full-name field.
 * @param {string} value - Field value.
 * @returns {string} Error message, or an empty string.
 */
function validateName(value) {
  const clean = value.trim();

  if (!clean) {
    return 'Full name is required.';
  }

  if (clean.length < 2) {
    return 'Enter your full name.';
  }

  return '';
}

/**
 * Validates the delivery-address field.
 * @param {string} value - Field value.
 * @returns {string} Error message, or an empty string.
 */
function validateAddress(value) {
  const clean = value.trim();

  if (!clean) {
    return 'Delivery address is required.';
  }

  if (clean.length < 10) {
    return 'Enter a complete delivery address.';
  }

  return '';
}

/**
 * Validates the phone field using a permissive international-friendly format.
 * @param {string} value - Field value.
 * @returns {string} Error message, or an empty string.
 */
function validatePhone(value) {
  const clean = value.trim();
  const digits = clean.replace(/\D/g, '');

  if (!clean) {
    return 'Phone number is required.';
  }

  if (!/^[+()\-.\s\d]+$/.test(clean) || digits.length < 8 || digits.length > 15) {
    return 'Enter a valid phone number.';
  }

  return '';
}

/**
 * Validates the complete profile form and paints inline errors.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
  const nameError = validateName(refs.name.value);
  const addressError = validateAddress(refs.address.value);
  const phoneError = validatePhone(refs.phone.value);

  setFieldError(refs.name, 'name', nameError);
  setFieldError(refs.address, 'address', addressError);
  setFieldError(refs.phone, 'phone', phoneError);

  return !nameError && !addressError && !phoneError;
}

/**
 * Fills the form with the latest profile values.
 * @param {object} profile - Profile row.
 */
function fillForm(profile) {
  refs.name.value = profile?.name || '';
  refs.address.value = profile?.address || '';
  refs.phone.value = profile?.phone || '';
}

/**
 * Loads the authenticated customer's profile and paints loading/error states.
 */
async function loadProfile() {
  if (!state.auth) {
    return;
  }

  setFormError('');
  setFormBusy(true);

  const result = await getProfile(state.auth.user.id);

  setFormBusy(false);

  if (!result.ok) {
    setFormError(result.error || 'Could not load your profile.', true);
    showErrorToast(result.error || 'Could not load your profile.');
    return;
  }

  state.profile = result.data;
  state.wasIncompleteOnLoad = !isProfileComplete(state.profile);
  fillForm(state.profile);

  if (!isProfileComplete(state.profile) && !state.flashShown) {
    showInfoToast('Complete your profile before using cart or checkout.', {
      title: 'Profile incomplete',
      durationMs: 5200,
    });
  }
}

/**
 * Saves the profile and returns the customer to the originally intended page when applicable.
 * @param {SubmitEvent} event - Form submit event.
 */
async function handleSubmit(event) {
  event.preventDefault();
  setFormError('');

  if (!state.auth) {
    return;
  }

  const wasIncompleteBeforeSave = !isProfileComplete(state.profile);

  if (!validateForm()) {
    return;
  }

  setLoading(refs.submit, true, 'Saving profile');

  const result = await updateProfile(state.auth.user.id, {
    name: refs.name.value,
    address: refs.address.value,
    phone: refs.phone.value,
  });

  setLoading(refs.submit, false);

  if (!result.ok) {
    setFormError(result.error || 'Could not save your profile.');
    showErrorToast(result.error || 'Could not save your profile.');
    return;
  }

  state.profile = result.data;

  const next = getSafeNextPath('/');
  const shouldReturnToNext = next !== '/' && !next.startsWith('/pages/profile.html') && isProfileComplete(state.profile);
  const shouldReturnHomeAfterCompletion = wasIncompleteBeforeSave && isProfileComplete(state.profile);

  if (shouldReturnToNext || shouldReturnHomeAfterCompletion) {
    queueFlash({
      type: 'success',
      title: 'Profile saved',
      message: 'Your profile is complete. Taking you back.',
    });
    window.location.assign(shouldReturnToNext ? next : '/');
    return;
  }

  showSuccessToast('Your profile has been saved.', { title: 'Profile saved' });
}

/**
 * Boots the profile screen behind the auth guard.
 */
async function bootProfile() {
  if (!refs.header || !refs.bottomNav || !refs.form) {
    throw new Error('Profile page mount nodes are missing.');
  }

  bindHeaderCartBadge(renderHeader(refs.header, {}));
  renderBottomNav(refs.bottomNav, { activeRoute: 'profile' });
  showStoredFlash();

  state.auth = await requireAuth();

  if (!state.auth) {
    return;
  }

  refs.retry.addEventListener('click', loadProfile);
  refs.name.addEventListener('input', () => setFieldError(refs.name, 'name', ''));
  refs.address.addEventListener('input', () => setFieldError(refs.address, 'address', ''));
  refs.phone.addEventListener('input', () => setFieldError(refs.phone, 'phone', ''));
  refs.form.addEventListener('submit', handleSubmit);

  await loadProfile();
}

bootProfile();
