import { showErrorToast } from './toastHelper.js';

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.isGlobalToastShown) return '';

  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

export const handleApiError = (error, fallback) => {
  const message = getErrorMessage(error, fallback);

  if (message) {
    showErrorToast(message);
    error.isGlobalToastShown = true;
  }

  return message;
};
