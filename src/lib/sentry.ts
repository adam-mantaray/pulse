import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return; // no-op when DSN not configured (dev without Sentry)

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    // Performance tracing
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Don't send in dev unless explicitly opted in
    enabled: !__DEV__,
    integrations: [
      Sentry.mobileReplayIntegration({ maskAllText: true, maskAllImages: true }),
    ],
    beforeSend(event) {
      // Strip any accidentally-captured auth tokens from request headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-webhook-secret'];
        delete event.request.headers['x-pulse-secret'];
      }
      return event;
    },
  });
}

/** Capture a handled exception with optional context */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/** Capture a Convex mutation/query failure */
export function captureConvexError(fnName: string, error: unknown) {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    scope.setTag('convex.function', fnName);
    scope.setTag('layer', 'convex');
    Sentry.captureException(error);
  });
}

export { Sentry };
