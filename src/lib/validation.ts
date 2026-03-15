export function validateAmount(value: string): string | null {
  if (!value || value.trim() === "") return "Amount is required";
  const num = parseFloat(value);
  if (isNaN(num)) return "Enter a valid number";
  if (num <= 0) return "Amount must be greater than 0";
  if (num > 99999999) return "Amount is too large";
  return null;
}

export function validateRequired(value: string, field: string): string | null {
  if (!value || value.trim() === "") return `${field} is required`;
  return null;
}

export function validateDate(value: string): string | null {
  if (!value) return "Date is required";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid date";
  return null;
}

export function validateFutureDate(value: string): string | null {
  const dateErr = validateDate(value);
  if (dateErr) return dateErr;
  if (new Date(value) <= new Date()) return "Date must be in the future";
  return null;
}
