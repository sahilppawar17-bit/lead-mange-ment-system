const { body } = require("express-validator");

const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("email is required")
        .bail()
        .isEmail()
        .withMessage("email must be a valid email address"),

    body("password")
        .notEmpty()
        .withMessage("password is required")
        .bail()
        .isString()
        .withMessage("password must be a string")
];

const refreshValidation = [
    body("refreshToken")
        .notEmpty()
        .withMessage("RefreshToken is required")
        .bail()
        .isString()
        .withMessage("refreshToken must be a String")
];

module.exports = {
    loginValidation,
    refreshValidation
};