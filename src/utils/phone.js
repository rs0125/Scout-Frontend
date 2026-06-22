// Soft phone-number sanity check. Tolerant of whitespace, dashes and parens.
// Accepts: 10-digit Indian mobiles, landlines (with/without STD code), and a
// +91 / 0 prefix. Returns false only when the value clearly isn't a phone
// number — it's used for a non-blocking warning, not to reject input.
export const looksLikePhone = (raw) => {
  if (!raw) return true; // empty handled by required-field check, not here
  const digits = String(raw).replace(/[\s\-().]/g, '');
  // Strip a leading +91, 91 or 0 trunk prefix before counting digits.
  const national = digits.replace(/^(\+91|91|0)/, '');
  // Reject anything with non-digit characters left over (letters, etc.).
  if (!/^\d+$/.test(national)) return false;
  // Indian mobiles are 10 digits; landlines (STD code + number) run 8–11.
  return national.length >= 8 && national.length <= 11;
};
