// Lightweight client-side checks for immediate UX feedback only.
// The backend is always the source of truth and re-validates everything.

export function validateFullName(value) {
  if (!value || value.trim().length < 3) {
    return "Full name must be at least 3 characters.";
  }
  return null;
}

export function validatePhone(value) {
  if (!value || value.replace(/\D/g, "").length < 7) {
    return "Please enter a valid phone number.";
  }
  return null;
}

export function validateEmail(value) {
  if (!value) return null;
  const pattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!pattern.test(value.trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validatePassword(value) {
  if (!value || !/^\d{4}$/.test(value)) {
    return "Password must be exactly 4 digits.";
  }
  return null;
}

export function validatePin(value) {
  if (!value || !/^\d{4,6}$/.test(value)) {
    return "PIN must be 4 to 6 digits.";
  }
  return null;
}
