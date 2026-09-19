export const maskPhoneNumber = (phone) => {
    if (!phone) {
        return "-";
    }

    const value = String(phone);

    if (value.length <= 4) {
        return "*".repeat(value.length);
    }

    const visibleDigits = value.slice(-4);
    const maskedPart = "*".repeat(
        value.length - 4
    );

    return `${maskedPart}${visibleDigits}`;
};


export const maskCountryCode = (countryCode) => {
    if (!countryCode) {
        return "-";
    }

    const value = String(countryCode);

    return "*".repeat(value.length);
};


export const maskPhoneWithCountryCode = (
    countryCode,
    phone
) => {
    if (!phone) {
        return "-";
    }

    const maskedCountry =
        maskCountryCode(countryCode);

    const maskedPhone =
        maskPhoneNumber(phone);

    return `${maskedCountry} ${maskedPhone}`;
};


export const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) {
        return "-";
    }

    const value = String(accountNumber);

    if (value.length <= 4) {
        return "*".repeat(value.length);
    }

    return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
};


export const maskAmount = (amount) => {
    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {
        return "-";
    }

    return "******";
};