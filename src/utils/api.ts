import ky, { isHTTPError, type AfterResponseState } from 'ky';
import { toastError } from './toast';

// Statuses that are defined to carry no response body. Express discards the body
// for these, so the bytes never reach the client.
const BODYLESS_STATUSES = new Set([204, 205, 304]);

// Many API endpoints reply without a payload, either with
// `res.status(200).json()` or `res.status(204).json()`. Express emits those as a
// zero-length body, which makes `response.json()` reject with
// "Unexpected end of JSON input" and turns every successful write into a thrown
// error. Substitute a `null` body so `.json()` resolves for all endpoints.
function withParsableBody({ response }: AfterResponseState): Response | void {
  const isBodyless =
    BODYLESS_STATUSES.has(response.status) ||
    response.headers.get('content-length') === '0';

  if (!response.ok || !isBodyless) return;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');

  // A body is illegal for the statuses above, so fall back to the equivalent 200.
  return new Response('null', {
    status: BODYLESS_STATUSES.has(response.status) ? 200 : response.status,
    headers,
  });
}

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
    afterResponse: [withParsableBody],
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
