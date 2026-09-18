const encodeCursor = (value, id) => {
    const payload = JSON.stringify({
        value,
        id
    });

    return Buffer
        .from(payload)
        .toString("base64url");
};


const decodeCursor = (cursor) => {
    try {
        const decoded = Buffer
            .from(cursor, "base64url")
            .toString("utf8");

        const payload = JSON.parse(decoded);

        if (
            payload.value === undefined ||
            payload.id === undefined ||
            !Number.isInteger(Number(payload.id)) ||
            Number(payload.id) < 1
        ) {
            return null;
        }

        return {
            value: payload.value,
            id: Number(payload.id)
        };

    } catch (error) {
        return null;
    }
};


module.exports = {
    encodeCursor,
    decodeCursor
};