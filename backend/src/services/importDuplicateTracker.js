// Task 7: Track loan account numbers seen during the current import
// so duplicate rows inside the same CSV can be rejected efficiently.

const createLoanAccountTracker = () => {
    const seenLoanAccounts = new Set();

    const checkAndAdd = (loanAccountNo) => {
        const value = String(loanAccountNo).trim();

        if (seenLoanAccounts.has(value)) {
            return false;
        }

        seenLoanAccounts.add(value);

        return true;
    };

    return {
        checkAndAdd
    };
};

module.exports = {
    createLoanAccountTracker
};