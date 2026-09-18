import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const initMonitoring = () => {
    const dsn = process.env.SENTRY_DSN;

    // Sentry is optional — don't crash the application if DSN is missing.
    if (!dsn) {
        console.warn('SENTRY_DSN is not configured. Sentry monitoring is disabled.');
        return;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    Sentry.init({
        dsn,

        integrations: [
            nodeProfilingIntegration(),
        ],

        // Performance monitoring
        tracesSampleRate: isProduction ? 0.2 : 1.0,

        // Profiling
        profileSessionSampleRate: isProduction ? 0.1 : 1.0,
        profileLifecycle: 'trace',

        // Privacy
        sendDefaultPii: false,

        // Environment information
        environment: process.env.NODE_ENV || 'development',

        // Optional: identify the application/version
        release: process.env.APP_VERSION,

        // Reduce noisy events in production if needed
        beforeSend(event) {
            return event;
        },
    });

    console.log(
        `Sentry monitoring initialized (${process.env.NODE_ENV || 'development'})`
    );
};

export default initMonitoring;
