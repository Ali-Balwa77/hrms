import toast from 'react-hot-toast';

const ERROR_TOAST_ID = 'hrms-global-error';

export const showErrorToast = (message = 'Something went wrong') => {
  toast.error(message, { id: ERROR_TOAST_ID });
};

export const showSuccessToast = (message) => {
  toast.success(message);
};
