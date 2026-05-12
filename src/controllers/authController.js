const pool = require("../config/db");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            role,
            phone,
        } = req.body;

        // Check existing user
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Insert user
        const newUser = await pool.query(
            `INSERT INTO users
      (full_name, email, password, role, phone)
      
      VALUES ($1, $2, $3, $4, $5)
      
      RETURNING id, full_name, email, role`,
            [
                full_name,
                email,
                hashedPassword,
                role,
                phone,
            ]
        );

        // Generate token
        const token = jwt.sign(
            {
                userId: newUser.rows[0].id,
                role: newUser.rows[0].role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: newUser.rows[0],
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = userResult.rows[0];

        // Check if user is active
        if (user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact administration.",
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,

            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};
module.exports = {
    register,
    login,
};