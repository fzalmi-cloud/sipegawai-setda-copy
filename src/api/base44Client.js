import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// In development, Vite proxies /api to Base44. In a production static
// deployment (for example Cloudflare Pages), call the hosted Base44 app
// directly instead of relying on the development-only proxy.
const serverUrl = import.meta.env.PROD
  ? (appBaseUrl || '').replace(/\/+$/, '')
  : '';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl
});
