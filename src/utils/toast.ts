import type { ToastServiceMethods } from 'primevue';

let toastInstance: ToastServiceMethods | null = null;

export const setToastInstance = (instance: ToastServiceMethods) => {
  toastInstance = instance;
};

export function toastInfo(title: string, message: string) {
  if (!toastInstance) return;

  toastInstance.add({
    severity: 'info',
    summary: title,
    detail: message,
    life: 3000,
  });
}

export function toastSuccess(title: string, message: string) {
  if (!toastInstance) return;

  toastInstance.add({
    severity: 'success',
    summary: title,
    detail: message,
    life: 3000,
  });
}

export function toastWarning(title: string, message: string) {
  if (!toastInstance) return;

  toastInstance.add({
    severity: 'warning',
    summary: title,
    detail: message,
    life: 3000,
  });
}

export function toastError(title: string, message: string) {
  if (!toastInstance) return;

  toastInstance.add({
    severity: 'error',
    summary: title,
    detail: message,
    life: 3000,
  });
}
