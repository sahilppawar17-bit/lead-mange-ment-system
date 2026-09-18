// temporary user-seeding script

require("dotenv").config();

const pool = require("./db");
const { hashPassword } = require("./utils/password");

const createUsers = async () => {
    try {
        const users = [
            {
                email: "admin@test.com",
                password: "Admin@123",
                role: "admin",
                teamId: 1
            },
            {
                email: "lead@test.com",
                password: "Lead@123",
                role: "team_lead",
                teamId: 1
            },
            {
                email: "user@test.com",
                password: "User@123",
                role: "user",
                teamId: 2
            }
        ];

        for (const user of users) {
            const passwordHash = await hashPassword(user.password);

            await pool.query(
                `
                INSERT INTO users
                    (email, password_hash, role, team_id)
                VALUES
                    ($1, $2, $3, $4)
                ON CONFLICT (email)
                DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    role = EXCLUDED.role,
                    team_id = EXCLUDED.team_id
                `,
                [
                    user.email,
                    passwordHash,
                    user.role,
                    user.teamId
                ]
            );

            console.log(`Created/updated user: ${user.email}`);
        }

        console.log("All users created successfully.");
    } catch (error) {
        console.error("Error creating users:", error);
    } finally {
        await pool.end();
    }
};

createUsers();