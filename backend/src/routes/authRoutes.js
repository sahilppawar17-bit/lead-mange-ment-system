const express = require("express");
const authController = require("../controllers/authController");
const asyncHandler = require("../middleware/asyncHandler");
const { loginValidation, refreshValidation } = require("../validators/authValidator");
const validateRequest = require("../middleware/ValidationResult");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get(
    "/role-test",
    requireAuth,
    requireRole(["admin", "team_lead"]),
    (req, res) => {
        res.status(200).json({
            success: true,
            data: {
                message: "You have the required role",
                user: req.user
            }
        });
    }
);

router.post(
    "/login",
    loginValidation,
    validateRequest,
    asyncHandler(authController.login)
);

router.post(
    "/refresh",
    refreshValidation,
    validateRequest,
    asyncHandler(authController.refresh)
);

router.post(
    "/logout",
    refreshValidation,
    validateRequest,
    asyncHandler(authController.logout)
);

module.exports = router;