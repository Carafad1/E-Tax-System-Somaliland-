export const APP_NAME = "E-Tax System Somaliland";
export const APP_SUBTITLE = "Official Digital Tax Payment System";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const PAYMENT_METHODS = [
  { value: "ZAAD", label: "ZAAD" },
  { value: "EDAHAB", label: "eDahab" },
  { value: "EVC_PLUS", label: "EVC Plus" },
  { value: "BANK", label: "Bank" },
  { value: "CARD", label: "Card" },
];

export const CURRENCIES = [
  { value: "SLSH", label: "SLSH" },
  { value: "USD", label: "USD" },
];

export const TAXPAYER_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

export const BUSINESS_TYPES = [
  { value: "Retail", label: "Retail" },
  { value: "Wholesale", label: "Wholesale" },
  { value: "Service", label: "Service" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Other", label: "Other" },
];

export const PAYMENT_STATUSES = ["pending", "processing", "completed", "failed", "cancelled"];
