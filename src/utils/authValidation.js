export const emailValidationMessage = "Please enter a valid email address.";
export const passwordValidationMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const reservedDomainLabels = new Set(["null", "undefined"]);
const localPartPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const domainLabelPattern = /^[A-Za-z0-9-]+$/;
const tldPattern = /^[A-Za-z]{2,63}$/;

export const isValidEmail = (value) => {
  const email = String(value || "");
  if (!email || email !== email.trim() || /\s/.test(email)) return false;
  if ((email.match(/@/g) || []).length !== 1) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;
  if (!localPartPattern.test(localPart)) return false;

  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !label)) return false;
  if (labels.some((label) => reservedDomainLabels.has(label.toLowerCase()))) return false;
  if (
    labels.some(
      (label) => !domainLabelPattern.test(label) || label.startsWith("-") || label.endsWith("-")
    )
  ) {
    return false;
  }

  const tld = labels.at(-1);
  return tldPattern.test(tld) && !reservedDomainLabels.has(tld.toLowerCase());
};

export const getPasswordChecks = (value) => {
  const password = String(value || "");
  return [
    { key: "length", label: "8+ characters", valid: password.length >= 8 },
    { key: "uppercase", label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { key: "lowercase", label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { key: "number", label: "Number", valid: /[0-9]/.test(password) },
    { key: "special", label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
};

export const isStrongPassword = (value) => {
  const password = String(value || "");
  return password.trim().length > 0 && getPasswordChecks(password).every((check) => check.valid);
};

export const emailRules = [
  { required: true, message: "Please enter your email" },
  {
    validator: (_, value) =>
      !value || isValidEmail(value) ? Promise.resolve() : Promise.reject(new Error(emailValidationMessage)),
  },
];

export const strongPasswordRules = [
  { required: true, message: "Please enter a password" },
  {
    validator: (_, value) =>
      !value || isStrongPassword(value)
        ? Promise.resolve()
        : Promise.reject(new Error(passwordValidationMessage)),
  },
];
