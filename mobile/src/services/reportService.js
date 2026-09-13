import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { API_URL } from "../constants/config";
import { getSession } from "../storage/secureStorage";

let isReportSharingActive = false;

async function safeReportShareAsync(uri, options) {
  if (isReportSharingActive) {
    return;
  }
  isReportSharingActive = true;
  try {
    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      await Sharing.shareAsync(uri, options);
    }
  } catch (err) {
    console.log("Report sharing handled safely:", err?.message || err);
  } finally {
    isReportSharingActive = false;
  }
}

// A full CSV export is built server-side over every matching row, so this
// sits alongside the API client's own 25s ceiling (see services/api.js)
// rather than cutting real exports short.
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

export async function exportReport(type) {
  // A report is real financial/taxpayer data - if it can't be downloaded
  // from the backend, the caller must see a real error, never a fabricated
  // CSV standing in for it.
  const fileUri = `${FileSystem.cacheDirectory}${type || "report"}_export.csv`;
  const { token } = await getSession();
  const result = await downloadWithTimeout(
    `${API_URL}/reports/export?type=${type}`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    DOWNLOAD_TIMEOUT_MS
  );

  if (!result || result.status !== 200) {
    throw new Error("Unable to download this report. Please try again.");
  }

  await safeReportShareAsync(fileUri, { mimetype: "text/csv", dialogTitle: "Share Report" });
  return fileUri;
}
