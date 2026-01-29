import moment from 'moment-timezone';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Format date in IST
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    return moment(date).tz(TIMEZONE).format(format);
};

/**
 * Format datetime in IST
 */
export const formatDateTime = (date, format = 'DD/MM/YYYY hh:mm A') => {
    return moment(date).tz(TIMEZONE).format(format);
};

/**
 * Get current IST date
 */
export const getCurrentIST = () => {
    return moment().tz(TIMEZONE);
};

/**
 * Format for display in UI
 */
export const formatDateForDisplay = (date) => {
    return moment(date).tz(TIMEZONE).format('DD MMM YYYY');
};

/**
 * Format for datetime display
 */
export const formatDateTimeForDisplay = (date) => {
    return moment(date).tz(TIMEZONE).format('DD MMM YYYY, hh:mm A');
};

/**
 * Get start of day in IST
 */
export const getStartOfDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).startOf('day').toDate();
};

/**
 * Get end of day in IST
 */
export const getEndOfDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).endOf('day').toDate();
};
