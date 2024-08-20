const logger = require('../utils/logger');

class ErrorHandling {
    static logError(error) {
        logger.error(`[SDK Error] ${error.message}`);
    }

    static handleError(error) {
        this.logError(error);
        throw new Error(`An error occurred: ${error.message}`);
    }
}

module.exports = ErrorHandling;
