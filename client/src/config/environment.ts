// Environment configuration for API endpoints
// This allows the app to work in both web and mobile contexts

const isDevelopment = import.meta.env.DEV;
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

// For web development on Replit
const REPLIT_DEV_URL = window.location.origin;

// Your deployed backend URL (update this after deploying your backend)
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://choretracker-production.up.railway.app';

/**
 * Returns the base API URL based on the current environment
 */
export function getApiUrl(): string {
  // Mobile app always uses production API
  if (isCapacitor) {
    return PRODUCTION_API_URL;
  }

  // Web (both dev and prod) uses same origin to avoid CORS
  // This works because the backend and frontend are served from the same domain
  return window.location.origin;
}

/**
 * Returns the WebSocket URL based on the current environment
 */
export function getWebSocketUrl(): string {
  const apiUrl = getApiUrl();
  const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
  const urlWithoutProtocol = apiUrl.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${urlWithoutProtocol}/ws`;
}

/**
 * Check if running in mobile app context
 */
export function isMobileApp(): boolean {
  return isCapacitor;
}

// Export constants for easy access
export const API_BASE_URL = getApiUrl();
export const WS_URL = getWebSocketUrl();
