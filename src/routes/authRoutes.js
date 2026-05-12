const express = require("express");

const router = express.Router();

const {
    register,
    login,
} = require("../controllers/authController");
const { uploadProfileImage } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.post("/profile-image", authMiddleware, upload.single("image"), uploadProfileImage);

module.exports = router;