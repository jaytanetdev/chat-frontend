import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/types/api';
import { getErrorMessage } from './error-codes';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch { /* ignore */ }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      error.response.data?.error_code !== 'AUTH_INVALID_CREDENTIALS'
    ) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const isRetryable =
      !error.response || error.response.status >= 500;

    if (isRetryable && config) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, config._retryCount - 1);
        await new Promise((r) => setTimeout(r, delay));
        return api(config);
      }
    }

    const errorCode = error.response?.data?.error_code;
    const friendlyMessage = getErrorMessage(errorCode);

    const enhanced = new Error(friendlyMessage) as Error & {
      errorCode?: string;
      statusCode?: number;
      details?: unknown;
    };
    enhanced.errorCode = errorCode;
    enhanced.statusCode = error.response?.status;
    enhanced.details = error.response?.data?.details;

    return Promise.reject(enhanced);
  },
);

export default api;
