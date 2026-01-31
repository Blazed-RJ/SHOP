import mongoose from 'mongoose';

const log = (msg) => {
    // Debug logging disabled
    // console.log(msg); 
};

const TRANSACTION_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

/**
 * Runs a function within a MongoDB transaction if supported.
 * Falls back to normal execution without transaction for standalone instances.
 * 
 * @param {Function} action - Async function(session) to execute.
 * @param {Object} options - Optional configuration { timeout, retries }
 * @returns {Promise<any>} - Result of the action.
 */
export const runInTransaction = async (action, options = {}) => {
    const timeout = options.timeout || TRANSACTION_TIMEOUT;
    const maxRetries = options.retries !== undefined ? options.retries : MAX_RETRIES;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            log(`Retrying transaction (attempt ${attempt + 1}/${maxRetries + 1})...`);
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }

        let session = null;
        let timeoutId = null;

        try {
            // Start session
            session = await mongoose.startSession();

            // Try to start transaction - this will fail immediately if not supported
            session.startTransaction();

            const isTransactional = session.inTransaction();
            log(`Transaction started: ${isTransactional ? 'YES' : 'NO'}`);

            // Set timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Transaction timeout after ${timeout}ms`));
                }, timeout);
            });

            // Run action with timeout protection
            const actionPromise = action(session);
            const result = await Promise.race([actionPromise, timeoutPromise]);

            // Clear timeout
            if (timeoutId) clearTimeout(timeoutId);

            // Commit transaction if it was successful
            if (isTransactional) {
                await session.commitTransaction();
                log('Transaction committed successfully');
            }

            return result;

        } catch (error) {
            // Clear timeout on error
            if (timeoutId) clearTimeout(timeoutId);

            // Check if this is a transaction support error
            if (isTransactionNotSupportedError(error)) {
                log('MongoDB Transactions not supported. Falling back to standalone mode.');

                // Abort and cleanup
                if (session) {
                    try {
                        if (session.inTransaction()) {
                            await session.abortTransaction();
                        }
                    } catch (abortError) {
                        log('Error aborting transaction: ' + abortError.message);
                    }
                    session.endSession();
                }

                // Run without session (no retry needed for this case)
                return await action(null);
            }

            // Transaction error - abort if active
            if (session && session.inTransaction()) {
                try {
                    await session.abortTransaction();
                    log('Transaction aborted due to error');
                } catch (abortError) {
                    log('Error aborting transaction: ' + abortError.message);
                }
            }

            lastError = error;

            // Check if this is a transient error that should be retried
            if (isTransientError(error) && attempt < maxRetries) {
                log(`Transient error detected: ${error.message}. Will retry...`);
                continue; // Retry
            }

            // Non-transient error or max retries reached - rethrow
            throw error;

        } finally {
            // Always end session
            if (session) {
                session.endSession();
            }
        }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Transaction failed after maximum retries');
};

/**
 * Check if error indicates transaction not supported
 */
function isTransactionNotSupportedError(error) {
    const message = error.message || '';
    return (
        message.includes('Transaction numbers are only allowed on a replica set member') ||
        message.includes('Transactions are not supported') ||
        message.includes('This MongoDB deployment does not support retryable writes')
    );
}

/**
 * Check if error is transient and should be retried
 */
function isTransientError(error) {
    const message = error.message || '';
    const code = error.code;

    // MongoDB transient error codes
    const transientCodes = [
        112, // WriteConflict
        117, // NetworkTimeout  
        189, // PrimarySteppedDown
        262, // ExceededTimeLimit
        11600, // InterruptedAtShutdown
        11602, // InterruptedDueToReplStateChange
        13436, // NotPrimaryOrSecondary
        13435, // NotPrimaryNoSecondaryOk
    ];

    return (
        transientCodes.includes(code) ||
        message.includes('connection') ||
        message.includes('network') ||
        message.includes('timeout')
    );
}
