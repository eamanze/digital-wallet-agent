export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "MobiMoney",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  enableMocks: process.env.NEXT_PUBLIC_ENABLE_MOCKS !== "false",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com"
};

export const serverEnv = {
  gatewayUrl: process.env.BACKEND_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  adminApiUrl: process.env.ADMIN_API_URL ?? "http://localhost:3014"
};

export function assertPublicEnv() {
  if (!env.enableMocks && !env.apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be set when mocks are disabled.");
  }
}
