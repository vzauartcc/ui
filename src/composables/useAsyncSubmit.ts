import { ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

interface UseAsyncSubmitOptions {
  blockNavigation?: boolean;
  onStart?: () => void;
  onFinish?: () => void;
}

export function useAsyncSubmit(
  options: UseAsyncSubmitOptions = { blockNavigation: true },
) {
  const isSubmitting = ref(false);
  let navigationBlocked = false;

  const execute = async <T>(
    handler: () => Promise<T>,
  ): Promise<T | undefined> => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    options.onStart?.();

    if (options.blockNavigation) {
      navigationBlocked = true;
    }

    try {
      return await handler();
    } finally {
      isSubmitting.value = false;
      options.onFinish?.();
      navigationBlocked = false;
    }
  };

  if (options.blockNavigation) {
    onBeforeRouteLeave((_to, _from, next) => {
      if (navigationBlocked) {
        next(false);
      } else {
        next();
      }
    });
  }

  return { isSubmitting, execute };
}
