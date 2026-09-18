const { body, param, query } = require("express-validator");

// ID Validation
const idValidator = [
    param("id")
        .isInt({ min: 1})
        .withMessage("Id must be a positive integer")
        .toInt()
];

// GET /api/leads  Query Validation

const listLeadsValidator = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100})
        .withMessage("limit must be an integer between 1 and 100")
        .toInt(),

    query("offset")
        .optional()
        .isInt({ min: 0})
        .withMessage("offset must be a non-negative Integer")
        .toInt(),

    // SORTING 
    query("sort")
        .optional()
        .isIn([
            "id",
            "date_entered",
            "lead_status",
            "branch_code",
            "campaign_id"
        ])
        .withMessage("Invalid sort column"),

    query("order")
        .optional()
        .isIn(["ASC", "DESC", "asc", "desc"])
        .withMessage("order must be ASC or DESC")
];

//POST validation

const createLeadValidator = [
    body("full_name")
        .exists()
        .withMessage("full_name is required")
        .bail()
        .isString()
        .withMessage("full_name must be a String")
        .bail()
        .trim()
        .isLength({ min: 2, max: 150})
        .withMessage("full_name must be between 2 and 150 characters"),

    body("age")
        .exists()
        .withMessage("Age is required")
        .bail()
        .isInt({ min: 1, max: 100})
        .withMessage("Age must be an integer between 1 and 100")
        .toInt(),

    body("phone_mobile")
    .notEmpty()
    .withMessage("phone_mobile is required")
    .isString()
    .withMessage("phone_mobile must be a string")
    .matches(/^\d{10}$/)
    .withMessage("phone_mobile must be exactly 10 digits"), 

    body("country_code")
        .exists()
        .withMessage("country_code is required")
        .bail()
        .isString()
        .withMessage("country_code must be a string")
        .bail()
        .trim()
        .isLength({ min: 1,max: 7})
        .withMessage("country_code must be between 1 and 7 characters"),

    body("lead_status")
        .exists()
        .withMessage("Lead_status is required")
        .bail()
        .isIn(["High", "Medium", "Low"])
        .withMessage("lead_status must be High, Medium, or Low")
];


// PUT Validation

const replaceLeadValidator = [...createLeadValidator];


// PATCH Validation

const updateLeadValidator = [
    body()
        .custom((value, { req }) => {
            const allowedFields = [
                "full_name",
                "age",
                "phone_mobile",
                "country_code",
                "lead_status"
            ];

            const suppliedFields = Object.keys(req.body);

            if(suppliedFields.length === 0){
                throw new Error("At least one field is required for PATCH");
            }

            const unknownFields = suppliedFields.filter(
                field => !allowedFields.includes(field)
            );

            if(unknownFields.length > 0){
                throw new Error(`Unknown fields: ${unknownFields.join(", ")}`
            );
            }
             return true;
        }
       
    ),

    body("full_name")
        .optional()
        .isString()
        .withMessage("full_name must be a String")
        .bail()
        .trim()
        .isLength({ min: 2, max: 150})
        .withMessage("full_name must be between 2 and 150 characters"),

    body("age")
        .optional()
        .isInt({ min: 1, max: 60})
        .withMessage("age must be an integer between 1 and 60")
        .toInt(),
     body("phone_mobile")
    .notEmpty()
    .withMessage("phone_mobile is required")
    .isString()
    .withMessage("phone_mobile must be a string")
    .matches(/^\d{10}$/)
    .withMessage("phone_mobile must be exactly 10 digits"),

    body("country_code")
        .optional()
        .isString()
        .withMessage("country_code must be a string")
        .bail()
        .trim()
        .isLength({ min: 1,max: 7})
        .withMessage("country_code must be between 1 and 7 characters"),

    body("lead_status")
        .optional()
        .isIn(["High", "Medium", "Low"])
        .withMessage("lead_status must be High, Medium, or Low")
];

const paginationValidation = [

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("page must be a positive integer")
        .toInt()
        .custom((value, { req }) => {
            if (req.query.after !== undefined) {
                throw new Error(
                    "page and after cannot be used together"
                );
            }

            return true;
        }),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("limit must be between 1 and 50")
        .toInt(),

    query("after")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("after must be a valid cursor"),

    query("status")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("status must not be empty"),

    query("branch_code")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("branch_code must not be empty"),

    query("campaign_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("campaign_id must be a positive integer")
        .toInt(),

    query("date_from")
        .optional()
        .isISO8601()
        .withMessage("date_from must be a valid date"),

    query("date_to")
        .optional()
        .isISO8601()
        .withMessage("date_to must be a valid date"),

    query("sort")
        .optional()
        .isIn([
            "id",
            "date_entered",
            "lead_status",
            "branch_code",
            "campaign_id"
        ])
        .withMessage("Invalid sort column"),

    query("order")
        .optional()
        .isIn(["ASC", "DESC", "asc", "desc"])
        .withMessage("order must be ASC or DESC")
];
module.exports = {
    idValidator,
    listLeadsValidator,
    createLeadValidator,
    replaceLeadValidator,
    updateLeadValidator,
    paginationValidation,
};