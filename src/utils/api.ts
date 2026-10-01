import ky, { isHTTPError } from 'ky';
import { toastError } from './toast';

export const zauApi = ky.create({
  prefix: isRunningOnDev() ? '/devapi' : '/api',
  credentials: 'include',
  retry: {
    limit: 3,
    methods: ['get'],
    statusCodes: [500, 502, 503, 504],
    backoffLimit: 30000,
  },
  hooks: {
    beforeError: [
      async ({ options, error }) => {
        const silent = !!options.context.silent;

        if (!silent) {
          let message = 'Something went wrong, please try again later.';

          if (isHTTPError(error)) {
            if (
              typeof error.data === 'object' &&
              error.data !== null &&
              'message' in error.data &&
              typeof error.data.message === 'string'
            ) {
              message = error.data.message;
            }

            toastError(`Error ${error.response.status}!`, message);
          } else {
            toastError('Error!', message);
          }
        }

        return error;
      },
    ],
  },
});

function isRunningOnDev() {
  const host = window.location.host;
  return host.includes('localhost') || host === 'staging.zauartcc.org';
}
