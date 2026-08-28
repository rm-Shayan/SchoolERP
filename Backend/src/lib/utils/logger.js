import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Production-grade logging strategy (12-factor + Docker friendly):
 *
 * 1. STDOUT (hamesha ON) — Docker ka json-file driver isi ko collect karta hai.
 *    Rotation compose ke `logging.options` (max-size/max-file) se hoti hai.
 *    Container me `docker compose logs -f backend` se dekho.
 *
 * 2. FILE (opt-in: LOG_TO_FILE=true) — VM/bare-metal deploys ke liye.
 *    winston-daily-rotate-file roz nayi file banata hai aur maxFiles se
 *    purani files KHUD delete kar deta hai — koi cron job ki zaroorat nahi.
 */

const SERVICE_NAME = process.env.SERVICE_NAME || 'school-erp-api';
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const LOG_DIR = process.env.LOG_DIR || 'logs';
const FILE_RETENTION = process.env.LOG_FILE_RETENTION_DAYS || '14d';

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, service }) => {
        return `[${timestamp}] ${level} [${service}]: ${message}`;
    })
);

// Rotating file format — JSON rehta hai taake log tools (Loki/ELK) parse kar saken.
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

function buildTransports() {
    const transports = [new winston.transports.Console({ format: consoleFormat })];

    if (LOG_TO_FILE) {
        transports.push(
            new DailyRotateFile({
                dirname: LOG_DIR,
                filename: 'error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: FILE_RETENTION,
                level: 'error',
                zippedArchive: true,
                format: fileFormat,
            }),
            new DailyRotateFile({
                dirname: LOG_DIR,
                filename: 'combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: FILE_RETENTION,
                zippedArchive: true,
                format: fileFormat,
            }),
        );
    }

    return transports;
}

/**
 * Ek hi shared winston logger (singleton) — har module child logger leta hai
 * apne `service` label ke saath. Pehle har `new Logger()` alag winston instance
 * banata tha (25+ instances, sab same files pe) — ab sirf ek transport set hai.
 */
const baseLogger = winston.loggers.get(SERVICE_NAME, {
    level: LOG_LEVEL,
    transports: buildTransports(),
});

class Logger {
    constructor(serviceName = 'app-service') {
        // Child logger: same transports share karta hai, sirf metadata add karta hai.
        this.logger = baseLogger.child({ service: serviceName });
    }

    // Morgan middleware ke sath integrate karne ke liye stream handler
    get stream() {
        return {
            write: (message) => {
                this.logger.info(message.trim());
            },
        };
    }

    // Direct passthroughs — naye code me `logger.info(...)` likhna kaafi hai.
    info(message, meta) { this.logger.info(message, meta); }
    warn(message, meta) { this.logger.warn(message, meta); }
    error(message, meta) { this.logger.error(message, meta); }
    debug(message, meta) { this.logger.debug(message, meta); }
}

export default Logger;
