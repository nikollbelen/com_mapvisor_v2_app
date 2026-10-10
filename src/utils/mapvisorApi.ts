const DEFAULT_API_BASE_URL = "https://mapvisor-api.mapvisor-nikoll.workers.dev";
const AUTH_TOKEN_KEY = "mapvisor_auth_token";

export const MAPVISOR_API_BASE_URL = (
  import.meta.env.VITE_MAPVISOR_API_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export const getMapvisorAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

export const setMapvisorAuthToken = (token: string | null) => {
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

type ApiOptions = RequestInit & {
  json?: unknown;
};

export async function mapvisorApi<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const token = getMapvisorAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${MAPVISOR_API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Error HTTP ${response.status}`);
  }

  return data as T;
}
