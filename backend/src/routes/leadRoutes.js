const express = require("express");

const router = express.Router();

const leadController = require("../controllers/leadController");
const asyncHandler = require("../middleware/asyncHandler");

const validateRequest = require("../middleware/ValidationResult")
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

const {
    idValidator,
    createLeadValidator,
    replaceLeadValidator,
    updateLeadValidator,
     paginationValidation
} = require("../validators/leadValidator");

router.get(
    "/",
    paginationValidation,
    validateRequest,
    asyncHandler(leadController.getAllLeads)
);


router.get(
    "/:id",
    idValidator,
    validateRequest,
    asyncHandler(leadController.getLeadById)
);


router.post(
    "/",
    createLeadValidator,
    validateRequest,
    asyncHandler(leadController.createLead)
);


router.put(
    "/:id",
    idValidator,
    replaceLeadValidator,
    validateRequest,
    asyncHandler(leadController.replaceLead)
);


router.patch(
    "/:id",
    idValidator,
    updateLeadValidator,
    validateRequest,
    asyncHandler(leadController.updateLead)
);


router.delete(
    "/:id",
    idValidator,
    validateRequest,
    asyncHandler(leadController.deleteLead)
);


module.exports = router;