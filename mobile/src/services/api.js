import axios from "axios";
import NetInfo from "@react-native-community/netinfo";

import { API_URL } from "../constants/config";
import { clearSession, getSession } from "../storage/secureStorage";

// The API is a cloud service reached over a real mobile network, not
// localhost - a short client timeout does not make the app "feel faster",
// it just turns normal latency (cold connection, slower WiFi/4G, a
// multi-query aggregation endpoint like the dashboard) into false failures.
// Screens stay responsive via their own hasLoadedRef/background-refresh
// patterns, not by starving requests of time.
// 45s leaves headroom above Render's documented worst-case cold-start
// (30-60s after 15 minutes idle) - a GitHub Actions workflow pings the API
// every 10 minutes specifically to keep this from ever happening, but this
// timeout is the safety net if that job is ever delayed or disabled.
export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: { "Content-Type": "application/json" },
});

let onSessionExpired = null;
export function registerSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

api.interceptors.request.use(async (config) => {
  const { token } = await getSession();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Absorbs a single transient blip (cold connection, brief jitter) on safe
// (GET) requests before the user ever sees an error - see the retry check
// below, which never applies this to POST/payment requests.
const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function isTransientNetworkFailure(error) {
  return error.code === "ECONNABORTED" || !error.response;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only GET requests are safe to retry automatically - a payment POST
    // must never be silently resubmitted just because its response was
    // slow to arrive (see services/payment_service.py's own duplicate
    // check on the backend for the other half of this safety net).
    const config = error.config;
    if (config && config.method === "get" && isTransientNetworkFailure(error)) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= MAX_AUTO_RETRIES) {
        await sleep(RETRY_DELAY_MS * config._retryCount);
        return api(config);
      }
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        networkError: true,
        timeout: true,
        message: "The request timed out. Please try again.",
      });
    }

    if (!error.response) {
      // A "no response" error can mean either the device has no internet,
      // or the internet is fine but the cloud API itself is unreachable -
      // these need different messages so the user knows what to actually do.
      let hasInternet = true;
      try {
        const state = await NetInfo.fetch();
        hasInternet = state.isConnected !== false && state.isInternetReachable !== false;
      } catch (_err) {
        // If NetInfo itself fails, fall through and treat it as a server
        // problem rather than guessing.
      }

      return Promise.reject({
        networkError: true,
        offline: !hasInternet,
        message: hasInternet
          ? "E-Tax service is temporarily unavailable. Please try again later."
          : "No internet connection. Please check your connection and try again.",
      });
    }

    const { status, data } = error.response;

    if (status === 401) {
      await clearSession();
      if (onSessionExpired) {
        onSessionExpired();
      }
      return Promise.reject({
        status,
        message: "Your session has expired. Please log in again.",
        errors: data?.errors || {},
      });
    }

    if (status >= 500) {
      return Promise.reject({
        status,
        message: "E-Tax service is temporarily unavailable. Please try again later.",
        errors: data?.errors || {},
      });
    }

    return Promise.reject({
      status,
      message: data?.message || "Something went wrong.",
      errors: data?.errors || {},
    });
  }
);

export function extractErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  return err.message || fallback;
}
