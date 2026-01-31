/**
 * Custom Error Classes for Invoice Generation System
 */

export class ValidationError extends Error {
    constructor(message, field = null, value = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
    }
}

export class StockError extends Error {
    constructor(message, productId = null, requested = null, available = null) {
        super(message);
        this.name = 'StockError';
        this.productId = productId;
        this.requested = requested;
        this.available = available;
        this.statusCode = 400;
        this.code = 'INSUFFICIENT_STOCK';
    }
}

export class TransactionError extends Error {
    constructor(message, operation = null) {
        super(message);
        this.name = 'TransactionError';
        this.operation = operation;
        this.statusCode = 500;
        this.code = 'TRANSACTION_FAILED';
    }
}

export class DatabaseError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;
        this.statusCode = 500;
        this.code = 'DATABASE_ERROR';
    }
}

/**
 * Format error response for API
 */
export const formatErrorResponse = (error) => {
    const response = {
        success: false,
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR'
    };

    // Add additional context for specific error types
    if (error instanceof ValidationError && error.field) {
        response.field = error.field;
        if (error.value !== null && error.value !== undefined) {
            response.invalidValue = error.value;
        }
    }

    if (error instanceof StockError) {
        response.stockDetails = {
            productId: error.productId,
            requested: error.requested,
            available: error.available
        };
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        response.stack = error.stack;
    }

    return response;
};

/**
 * Log error with context
 */
export const logError = (error, context = {}) => {
    const logData = {
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        },
        context
    };

    console.error('[ERROR]', JSON.stringify(logData, null, 2));
};

/**
 * Handle errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logError(error, {
            method: req.method,
            path: req.path,
            userId: req.user?._id
        });

        const statusCode = error.statusCode || 500;
        res.status(statusCode).json(formatErrorResponse(error));
    });
};
