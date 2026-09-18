const bcrypt = require("bcrypt");

const SALT_ROUNDS =  10;

const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
}

const comparePassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
}

module.exports = {
    hashPassword,
    comparePassword
}