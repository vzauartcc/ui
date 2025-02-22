import axios from "axios";

export const zabApi = axios.create({
  baseURL: isRunningOnDev() ? "/devapi" : "/api",
  withCredentials: true,
});

export const vatusaApi = axios.create({
  baseURL: "https://api.vatusa.net/v2",
  params: {
    apikey: window.env.VITE_VATUSA_API_KEY,
  },
});

export const vatusaApiAuth = axios.create({
  baseURL: "https://api.vatusa.net/v2",
  withCredentials: true,
});

function isRunningOnDev() {
  const host = window.location.host;
  if (host.includes("localhost") || host == "staging.zauartcc.org") {
    return true;
  }

  return false;
}
