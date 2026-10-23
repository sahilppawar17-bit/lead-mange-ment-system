
const REQUEST_TIMEOUT_MS = Number(
    process.env.REQUEST_TIMEOUT_MS || 10000
);

const requestTimeout = (req, res, next) => {
    const timer = setTimeout(() => {
        if (res.headersSent || res.destroyed) {
            return;
        }

        res.set("Retry-After", "2");

        res.status(503).json({
            success: false,
            error: {
                code: "REQUEST_TIMEOUT",
                message: "The request took too long. Please retry."
            }
        });
    }, REQUEST_TIMEOUT_MS);

    // Stop the timer when the response finishes or the client disconnects.
    res.once("finish", () => clearTimeout(timer));
    res.once("close", () => clearTimeout(timer));

    next();
};

module.exports = requestTimeout;
