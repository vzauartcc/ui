import ky from 'ky';
import { toastError } from './toast';

export const zauApi = ky.create({
  prefixUrl: isRunningOnDev() ? '/devapi' : '/api',
  credentials: 'include',
  retry: {
    limit: 3,
    methods: ['get'],
    statusCodes: [500, 502, 503, 504],
    backoffLimit: 30000,
  },
  hooks: {
    beforeError: [
      async (error) => {
        const silent = !!error.options.context.silent;

        if (!silent) {
          let message = 'Something went wrong, please try again later.';

          try {
            const data = await error.response.clone().json();
            if (data && typeof data.message === 'string') {
              message = data.message;
            }
          } catch {
            // Do nothing.
          }

          toastError(`Error ${error.response.status}!`, message);
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
