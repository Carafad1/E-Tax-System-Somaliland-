export function formatAmount(amount, currency = "SLSH") {
  const value = Number(amount) || 0;
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(isoString) {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_err) {
    return isoString;
  }
}

export function formatStatusLabel(status) {
  if (!status) return "-";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const FREQUENCY_LABELS = {
  daily: "Daily",
  semi_annual: "Semi-Annual",
  yearly: "Yearly",
};

export function formatFrequencyLabel(frequency) {
  return FREQUENCY_LABELS[frequency] || frequency || "-";
}

export function formatPaymentMethodLabel(method) {
  const labels = {
    ZAAD: "ZAAD",
    EDAHAB: "eDahab",
    EVC_PLUS: "EVC Plus",
    BANK: "Bank",
    CARD: "Card",
  };
  return labels[method] || method;
}
