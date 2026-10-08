// Task 7: Test duplicate loan-account detection within one import.

const {
    createLoanAccountTracker
} = require("./services/importDuplicateTracker");

const tracker = createLoanAccountTracker();

console.log("TEST001:", tracker.checkAndAdd("TEST001"));
console.log("TEST002:", tracker.checkAndAdd("TEST002"));
console.log("TEST001 again:", tracker.checkAndAdd("TEST001"));
console.log("TEST003:", tracker.checkAndAdd("TEST003"));
console.log("TEST002 again:", tracker.checkAndAdd("TEST002"));