import axios from "axios";

// Function to determine if running on development or staging environment
function isRunningOnDev() {
  const host = window.location.host;
  return host.includes("localhost") || host === "staging.zauartcc.org";
}

// Create an Axios instance for the ZAB API
export const zabApi = axios.create({
  baseURL: isRunningOnDev() ? "/devapi" : "/api",
  withCredentials: true,
});

// Create an Axios instance for the VATUSA API
export const vatusaApi = axios.create({
  baseURL: "https://api.vatusa.net/v2",
  params: {
    apikey: import.meta.env.VITE_VATUSA_API_KEY,
  },
});

// Create an Axios instance for authenticated VATUSA API requests
export const vatusaApiAuth = axios.create({
  baseURL: "https://api.vatusa.net/v2",
  withCredentials: true,
});

// Export the helper functions and instances
export default {
  zabApi,
  vatusaApi,
  vatusaApiAuth,
  isRunningOnDev,
};