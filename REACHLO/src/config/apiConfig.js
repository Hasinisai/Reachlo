import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ======================================================
// HOW TO CONFIGURE THIS FILE:
// ======================================================
// 1. PHYSICAL DEVICE (Expo Go) — phone and laptop must be on the same WiFi (Wi-Fi IP: 192.168.1.33).
// 2. ANDROID EMULATOR — automatic mapping to 10.0.2.2.
// 3. iOS Simulator — localhost / 127.0.0.1 works.
// 4. Production — update BASE_URL to your deployed API URL.
// ======================================================

const FULL_URL_OVERRIDE = null;
const HOST_OVERRIDE = null;

const extractHost = (url) => {
  if (!url) return null;
  const match = url.match(/\/\/([^:/]+)(?::\d+)?\//);
  return match?.[1] ?? null;
};

const sanitizeHost = (host) => {
  if (!host) return '192.168.1.33';
  // Virtual network adapters (VMware VMnet1/VMnet8) on Windows break mobile network connections
  if (host.startsWith('192.168.107.') || host.startsWith('192.168.245.')) {
    return '192.168.1.33';
  }
  return host;
};

const getDevHost = () => {
  if (HOST_OVERRIDE) {
    return HOST_OVERRIDE;
  }

  // Android Emulator uses 10.0.2.2 to reach host machine
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return '10.0.2.2';
  }

  const expoHost =
    extractHost(Constants.expoConfig?.hostUri) ||
    extractHost(Constants.manifest2?.extra?.expoGo?.debuggerHost) ||
    extractHost(Constants.manifest?.debuggerHost);

  return sanitizeHost(expoHost);
};

const DEV_HOST = getDevHost();

// Production backend URL — used as fallback when EXPO_PUBLIC_API_URL is not set
const LIVE_BASE_URL = 'https://reachlo-backend.onrender.com/api';
const LIVE_MEDIA_BASE_URL = 'https://reachlo-backend.onrender.com';
const LIVE_WS_BASE_URL = 'wss://reachlo-backend.onrender.com/api';

let envApiUrl = process.env.EXPO_PUBLIC_API_URL;
if (envApiUrl && (envApiUrl.includes('192.168.107.') || envApiUrl.includes('192.168.245.'))) {
  envApiUrl = envApiUrl.replace(/192\.168\.(107|245)\.\d+/, DEV_HOST);
}

const BASE_URL = envApiUrl || (FULL_URL_OVERRIDE ? `${FULL_URL_OVERRIDE}/api` : LIVE_BASE_URL);

let MEDIA_BASE_URL = FULL_URL_OVERRIDE ? FULL_URL_OVERRIDE : LIVE_MEDIA_BASE_URL;
if (BASE_URL) {
  MEDIA_BASE_URL = BASE_URL.replace(/\/api\/?$/, '');
}

const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

if (__DEV__) {
  console.log('[REACHLO] API base URL:', BASE_URL);
}

export const API_CONFIG = {
  BASE_URL: BASE_URL,
  MEDIA_BASE_URL: MEDIA_BASE_URL,
  WS_BASE_URL: WS_BASE_URL,
  TIMEOUT: 60000,
};

/** Resolve relative upload paths (e.g. /uploads/abc.jpg) to a full URL for Image components. */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('file:') || url.startsWith('content:')) {
    return url;
  }
  return `${API_CONFIG.MEDIA_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

export default API_CONFIG;
