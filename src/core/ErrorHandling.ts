import logger from '../utils/logger';

class ErrorHandling {
    static logError(error: Error): void {
        logger.error(`[SDK Error] ${error.message}`);
    }

    static handleError(error: Error): void {
        this.logError(error);
        throw new Error(`An error occurred: ${error.message}`);
    }
}

export default ErrorHandling;
