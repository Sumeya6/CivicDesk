const ETHIOPIAN_PHONE_PATTERN = /^(?:09\d{8}|9\d{8}|2519\d{8}|\+2519\d{8})$/;

function normalizeEthiopianPhone(phoneNumber) {
  if (typeof phoneNumber !== "string") return null;

  const value = phoneNumber.trim();
  if (!ETHIOPIAN_PHONE_PATTERN.test(value)) return null;

  if (value.startsWith("+251")) return value;
  if (value.startsWith("251")) return `+${value}`;
  if (value.startsWith("0")) return `+251${value.slice(1)}`;
  return `+251${value}`;
}

function getEthiopianPhoneVariants(phoneNumber) {
  const canonical = normalizeEthiopianPhone(phoneNumber);
  if (!canonical) return [];

  const localNumber = canonical.slice(4);
  return [canonical, `0${localNumber}`, localNumber, canonical.slice(1)];
}

module.exports = {
  ETHIOPIAN_PHONE_PATTERN,
  normalizeEthiopianPhone,
  getEthiopianPhoneVariants,
};
