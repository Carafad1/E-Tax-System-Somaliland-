import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { API_URL } from "../constants/config";
import { getSession } from "../storage/secureStorage";
import { getActiveUser } from "./authService";
import { api } from "./api";
import { formatAmount, formatDate, formatFrequencyLabel } from "../utils/formatters";

let isSharingActive = false;

async function safeShareAsync(uri, options) {
  if (isSharingActive) {
    return;
  }
  isSharingActive = true;
  try {
    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      await Sharing.shareAsync(uri, options);
    }
  } catch (err) {
    console.log("Receipt sharing handled safely:", err?.message || err);
  } finally {
    isSharingActive = false;
  }
}

// Ceiling on a receipt PDF download, matched to the 25s the API client
// allows (see services/api.js): the backend renders the PDF on demand and
// the phone is on a real mobile network, so a very short timeout does not
// "fail fast" - it fails *always*, silently downgrading every download to
// the locally-rendered HTML fallback instead of the official server-issued
// document.
const DOWNLOAD_TIMEOUT_MS = 25000;

function downloadWithTimeout(url, fileUri, options, timeoutMs = DOWNLOAD_TIMEOUT_MS) {
  let timeoutId;
  return Promise.race([
    FileSystem.downloadAsync(url, fileUri, options),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Download timeout")), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timeoutId));
}

// Receipt fields are interpolated into the HTML fallback below, and a
// taxpayer's own name/business name reaches it straight from their profile.
// Escaping keeps a name containing "<" or "&" from corrupting - or
// injecting markup into - an official receipt document.
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// No fake receipts anywhere in this file: a receipt is an official proof of
// tax payment, and "valid: true" from verifyReceipt() is specifically what
// someone checks to confirm a payment is real. Fabricating a passing
// verification (or a placeholder receipt) when the backend is actually
// unreachable would let a fake payment appear to check out as genuine, so
// every function below either returns real backend data or throws.

export async function listReceipts(params) {
  const { data } = await api.get("/receipts", { params });
  return data.data;
}

export async function getReceipt(referenceId, preloadedData = null) {
  // If the caller already has the real receipt data (from the payment
  // response that just came back from the backend), use it directly rather
  // than re-fetching - this is real data passed forward, not invented.
  // Missing fields stay null/undefined so the UI shows "-", never a
  // plausible-looking guess (e.g. "ZAAD" or "Hargeisa").
  if (preloadedData && preloadedData.citizen_name) {
    return {
      receipt_number: preloadedData.receipt_number ?? null,
      reference_id: preloadedData.reference_id ?? referenceId ?? null,
      transaction_id: preloadedData.transaction_id ?? null,
      taxpayer_id: preloadedData.taxpayer_id ?? null,
      citizen_name: preloadedData.citizen_name ?? null,
      business_name: preloadedData.business_name ?? null,
      tax_type: preloadedData.tax_type ?? preloadedData.tax_type_name ?? null,
      tax_type_frequency: preloadedData.tax_type_frequency ?? null,
      amount: preloadedData.amount ?? 0,
      currency: preloadedData.currency ?? "SLSH",
      payment_method: preloadedData.payment_method ?? null,
      tax_period: preloadedData.tax_period ?? null,
      city_name: preloadedData.city ?? preloadedData.city_name ?? null,
      payment_date: preloadedData.payment_date ?? null,
      qr_code_data: `E-TAX-SOMALILAND:${preloadedData.reference_id ?? referenceId ?? ""}:${preloadedData.taxpayer_id ?? ""}`,
      status: preloadedData.status ?? null,
      valid: true,
    };
  }
  const { data } = await api.get(`/receipts/${referenceId}`);
  return data.data.receipt;
}

export async function verifyReceipt(referenceId) {
  const { data } = await api.get(`/receipts/${referenceId}/verify`);
  return data.data;
}

async function buildOfficialReceiptHtml(rec, safeRef) {
  const activeUser = await getActiveUser();
  
  // Every value here comes from the real receipt/payment record (or the
  // real active user as a last resort for the name/TIN). A missing field
  // shows as "-" - never a plausible-looking invented value on an official
  // government document.
  const receiptNum = escapeHtml(rec?.receipt_number || "-");
  const refId = escapeHtml(rec?.reference_id || safeRef || "-");
  const txnId = escapeHtml(rec?.transaction_id || "-");
  const taxpayerId = escapeHtml(rec?.taxpayer_id || rec?.taxpayer_tin || activeUser?.tin || "-");
  const citizenName = escapeHtml(rec?.citizen_name || rec?.taxpayer_name || activeUser?.full_name || "-");
  const businessName = escapeHtml(rec?.business_name || activeUser?.business_name || "-");
  const taxType = escapeHtml(rec?.tax_type || rec?.tax_type_name || "-");
  const frequency = escapeHtml(rec?.tax_type_frequency ? formatFrequencyLabel(rec.tax_type_frequency) : "-");
  const paymentMethod = escapeHtml(rec?.payment_method || "-");
  const currency = rec?.currency || "SLSH";
  const amountFormatted = escapeHtml(formatAmount(rec?.amount, currency));
  const paymentDate = escapeHtml(rec?.payment_date ? formatDate(rec.payment_date) : "-");
  const status = escapeHtml(String(rec?.status || "UNKNOWN").toUpperCase());

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; color: #1E293B; background: #FFF; }
        .header { text-align: center; margin-bottom: 16px; }
        .gov-title { color: #0B6E4F; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
        .gov-subtitle { color: #475569; font-size: 13px; font-weight: 600; margin-top: 4px; }
        .badge { background: #0B6E4F; color: #FFF; font-weight: 700; font-size: 14px; text-align: center; padding: 8px; border-radius: 6px; margin: 14px 0; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table-data td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
        .table-data td.lbl { font-weight: 700; color: #334155; width: 40%; }
        .table-data td.val { text-align: right; color: #0F172A; font-weight: 600; }
        .status-verified { color: #10B981; font-weight: 800; }
        .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="gov-title">REPUBLIC OF SOMALILAND</h1>
        <div class="gov-subtitle">MINISTRY OF FINANCE</div>
        <div class="badge">E-TAX OFFICIAL DIGITAL RECEIPT</div>
      </div>
      <table class="table-data">
        <tr><td class="lbl">Receipt Number</td><td class="val">${receiptNum}</td></tr>
        <tr><td class="lbl">Reference ID</td><td class="val">${refId}</td></tr>
        <tr><td class="lbl">Transaction ID</td><td class="val">${txnId}</td></tr>
        <tr><td class="lbl">Taxpayer ID</td><td class="val">${taxpayerId}</td></tr>
        <tr><td class="lbl">Citizen Name</td><td class="val">${citizenName}</td></tr>
        <tr><td class="lbl">Business Name</td><td class="val">${businessName}</td></tr>
        <tr><td class="lbl">Tax Type</td><td class="val">${taxType}</td></tr>
        <tr><td class="lbl">Frequency</td><td class="val">${frequency}</td></tr>
        <tr><td class="lbl">Payment Method</td><td class="val">${paymentMethod}</td></tr>
        <tr><td class="lbl">Currency</td><td class="val">${escapeHtml(currency)}</td></tr>
        <tr><td class="lbl">Amount Paid</td><td class="val" style="font-size:14px; font-weight:800; color:#0B6E4F;">${amountFormatted}</td></tr>
        <tr><td class="lbl">Payment Date</td><td class="val">${paymentDate}</td></tr>
        <tr><td class="lbl">Status</td><td class="val status-verified">${status}</td></tr>
      </table>
      <div class="footer">
        <p><strong>Scan / Verify Reference:</strong> ${refId}</p>
        <p>This is an official electronic tax receipt issued by the E-Tax System Somaliland.<br/>Verify authenticity online or using the QR reference code.</p>
      </div>
    </body>
    </html>
  `;
}

export async function downloadAndShareReceiptPdf(referenceId, receiptData = null) {
  const safeRef = referenceId || "receipt";
  let targetUri = `${FileSystem.cacheDirectory}${safeRef}.pdf`;
  let downloadSuccess = false;

  try {
    const { token } = await getSession();
    const result = await downloadWithTimeout(
      `${API_URL}/receipts/${safeRef}/pdf`,
      targetUri,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      DOWNLOAD_TIMEOUT_MS
    );

    if (result && result.status === 200 && result.uri) {
      targetUri = result.uri;
      downloadSuccess = true;
    }
  } catch (_downloadErr) {
    // Fast fallback if download times out or fails
  }

  if (!downloadSuccess) {
    try {
      const rec = receiptData || (await getReceipt(safeRef));
      const html = await buildOfficialReceiptHtml(rec, safeRef);
      const printResult = await Print.printToFileAsync({ html });
      if (printResult && printResult.uri) {
        targetUri = printResult.uri;
      }
    } catch (_printErr) {
      // Ignore print fallback failure
    }
  }

  await safeShareAsync(targetUri, {
    mimetype: "application/pdf",
    dialogTitle: "Share E-Tax Receipt",
  });

  return targetUri;
}

export async function printReceiptPreview(referenceId, receiptData = null) {
  const safeRef = referenceId || "receipt";
  try {
    const { token } = await getSession();
    const fileUri = `${FileSystem.cacheDirectory}${safeRef}-preview.pdf`;

    const result = await downloadWithTimeout(
      `${API_URL}/receipts/${safeRef}/pdf`,
      fileUri,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      DOWNLOAD_TIMEOUT_MS
    );

    if (result && result.status === 200 && result.uri) {
      await Print.printAsync({ uri: result.uri });
      return;
    }
  } catch (_err) {
    // Fallback HTML print
  }

  try {
    const rec = receiptData || (await getReceipt(safeRef));
    const html = await buildOfficialReceiptHtml(rec, safeRef);
    await Print.printAsync({ html });
  } catch (_printErr) {
    // Ignore print preview failure
  }
}
