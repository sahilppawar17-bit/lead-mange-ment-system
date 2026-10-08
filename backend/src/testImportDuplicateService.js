// Task 7: Test database lookup for existing loan account numbers.

const {
    findExistingLoanAccounts
} = require("./services/importDuplicateService");

const runTest = async () => {
    try {
        const loanAccounts = [
            "TEST002",
            "NON_EXISTENT_001"
        ];

        const existingAccounts =
            await findExistingLoanAccounts(loanAccounts);

        console.log("Existing loan accounts:");
        console.log([...existingAccounts]);
    } catch (error) {
        console.error("Duplicate service test failed:", error);
    } finally {
        process.exit(0);
    }
};

runTest();
