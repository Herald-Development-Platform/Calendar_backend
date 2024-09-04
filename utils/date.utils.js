function timeDifference(input) {
    let targetDate;
    if (input instanceof Date) {
        targetDate = input;
    } else if (typeof input === 'string' || typeof input === 'number') {
        targetDate = new Date(input);
    } else {
        throw new Error("Invalid input type. Expected a Date, string, or number.");
    }

    if (isNaN(targetDate)) {
        throw new Error("Invalid date format.");
    }

    const currentDate = new Date();
    const diffMs = targetDate - currentDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const pluralize = (value, unit) => value === 1 ? unit : `${unit}s`;

    if (diffMs < 0) {
        if (diffYears !== 0) return `${Math.abs(diffYears)} ${pluralize(Math.abs(diffYears), 'year')} ago`;
        if (diffMonths !== 0) return `${Math.abs(diffMonths)} ${pluralize(Math.abs(diffMonths), 'month')} ago`;
        if (diffDays !== 0) return `${Math.abs(diffDays)} ${pluralize(Math.abs(diffDays), 'day')} ago`;
        if (diffHours !== 0) return `${Math.abs(diffHours)} ${pluralize(Math.abs(diffHours), 'hour')} ago`;
        if (diffMinutes !== 0) return `${Math.abs(diffMinutes)} ${pluralize(Math.abs(diffMinutes), 'minute')} ago`;
        return `${Math.abs(diffSeconds)} ${pluralize(Math.abs(diffSeconds), 'second')} ago`;
    } else {
        if (diffYears !== 0) return `in ${diffYears} ${pluralize(diffYears, 'year')}`;
        if (diffMonths !== 0) return `in ${diffMonths} ${pluralize(diffMonths, 'month')}`;
        if (diffDays !== 0) return `in ${diffDays} ${pluralize(diffDays, 'day')}`;
        if (diffHours !== 0) return `in ${diffHours} ${pluralize(diffHours, 'hour')}`;
        if (diffMinutes !== 0) return `in ${diffMinutes} ${pluralize(diffMinutes, 'minute')}`;
        return `in ${diffSeconds} ${pluralize(diffSeconds, 'second')}`;
    }
}

function convertExcelDateToJSDate(excelDate) {
    if (typeof excelDate === "string") {
        excelDate = parseFloat(excelDate);
    }
    if (!excelDate) {
        return null;
    }
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
    return jsDate;
}

module.exports = {
    timeDifference,
    convertExcelDateToJSDate,
};
