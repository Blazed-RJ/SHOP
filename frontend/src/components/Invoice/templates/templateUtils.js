

export const safelyGet = (obj, path, fallback = '') => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
};

export const formatInvoiceDate = (dateString) => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};
