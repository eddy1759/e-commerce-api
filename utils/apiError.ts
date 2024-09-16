/**
 * Represents a general HTTP error.
 */
class HttpError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;

    /**
     * Creates a new instance of HttpError.
     * @param statusCode The HTTP status code of the error.
     * @param message The error message.
     * @param isOperational Indicates whether the error is operational.
     */
    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);

        if (!HttpError.isValidStatusCode(statusCode)) {
            throw new Error('Invalid HTTP status code');
        }

        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }

    private static isValidStatusCode(statusCode: number): boolean {
        return statusCode >= 100 && statusCode < 600;
    }
}

/**
 * Represents an API error.
 */
class ApiError extends HttpError {
    constructor(
        statusCode: number,
        message: string | Record<string, unknown>,
        isOperational = true,
        stack = ''
    ) {
        const errorMessage =
            typeof message === 'object' ? JSON.stringify(message) : message;
        super(statusCode, errorMessage, isOperational);

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static create(
        statusCode: number,
        message: string | Record<string, unknown>,
        isOperational = true
    ) {
        return new ApiError(statusCode, message, isOperational);
    }
}

export { HttpError, ApiError };