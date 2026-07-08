import axios from 'axios';
import { showErrorToast } from '../utils/toastHelper.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

const isProductionResponse = (payload) => (
  payload &&
  typeof payload === 'object' &&
  !Array.isArray(payload) &&
  Object.prototype.hasOwnProperty.call(payload, 'success') &&
  (
    Object.prototype.hasOwnProperty.call(payload, 'data') ||
    Object.prototype.hasOwnProperty.call(payload, 'message') ||
    Object.prototype.hasOwnProperty.call(payload, 'meta')
  )
);

const normalizeSuccessResponse = (response) => {
  const payload = response?.data;

  // Do not unwrap file/blob responses like Excel exports.
  const responseType = response?.config?.responseType;
  if (responseType === 'blob' || responseType === 'arraybuffer') {
    return response;
  }

  if (!isProductionResponse(payload)) {
    response.apiSuccess = true;
    response.apiMessage = '';
    response.apiMeta = {};
    return response;
  }

  response.apiSuccess = payload.success;
  response.apiMessage = payload.message || '';
  response.apiMeta = payload.meta || {};
  response.rawResponse = payload;

  // Frontend components should receive the actual payload directly.
  // Backend standard format: { success, message, data, meta }
  response.data = Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : null;

  return response;
};

const getErrorPayload = (error) => error?.response?.data || {};

export const getApiData = (responseOrPayload, fallback = null) => {
  if (responseOrPayload === undefined || responseOrPayload === null) return fallback;

  const payload = responseOrPayload?.data !== undefined
    ? responseOrPayload.data
    : responseOrPayload;

  if (isProductionResponse(payload)) {
    return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : fallback;
  }

  return payload ?? fallback;
};

export const getApiList = (responseOrPayload) => {
  const data = getApiData(responseOrPayload, []);
  return Array.isArray(data) ? data : [];
};

export const getApiObject = (responseOrPayload, fallback = {}) => {
  const data = getApiData(responseOrPayload, fallback);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : fallback;
};

export const getApiMessage = (responseOrError, fallback = 'Something went wrong') => {
  const payload = responseOrError?.rawResponse || responseOrError?.response?.data || responseOrError?.data || responseOrError;

  if (payload?.message) return payload.message;
  if (payload?.error?.message) return payload.error.message;
  if (responseOrError?.apiMessage) return responseOrError.apiMessage;
  if (responseOrError?.message) return responseOrError.message;

  return fallback;
};

const getResponseMessage = (error) => (
  getErrorPayload(error)?.error?.message ||
  getErrorPayload(error)?.message ||
  error?.message ||
  'Something went wrong'
);

const showToastOnce = (error, message) => {
  if (error?.isGlobalToastShown) return;
  error.isGlobalToastShown = true;
  showErrorToast(message);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: REQUEST_TIMEOUT,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => normalizeSuccessResponse(response),
  (error) => {
    if (!error.response) {
      let message = error.code === 'ECONNABORTED'
        ? 'Unable to connect. Please check your internet connection or HRMS server.'
        : 'HRMS server is currently unavailable. Please try again later.';

      showToastOnce(error, message);
      return Promise.reject(error);
    }

    const message = getResponseMessage(error);

    if (error.response.status === 401 && !error.config?.url?.includes('/login')) {
      error.isGlobalToastShown = true;
      window.dispatchEvent(new CustomEvent('unauthorized', { detail: message }));
      return Promise.reject(error);
    }

    showToastOnce(error, message);
    return Promise.reject(error);
  }
);
