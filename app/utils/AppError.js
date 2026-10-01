// app/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call the parent constructor (Error)

    this.statusCode = statusCode;
    // Determine the status based on the status code (e.g., 4xx for 'fail', 5xx for 'error')
    //this.status = ${statusCode}.startsWith('4') ? 'fail' : 'error';
    // Mark this error as operational, meaning it's intended to be communicated to the client
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;