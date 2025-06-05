"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const usersDatabase_1 = require("../usersDatabase");
const auth_handler_1 = require("../middleware/auth-handler");
const database_1 = require("../database");
const router = (0, express_1.Router)();
const profileUploads = path_1.default.resolve(__dirname, '..', 'profile_images');
// Ensure the folder exists
if (!fs_1.default.existsSync(profileUploads)) {
    fs_1.default.mkdirSync(profileUploads, { recursive: true });
}
// Multer storage config → writes files into “profile_images/…”
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileUploads);
    },
    filename: (req, file, cb) => {
        // unique name = uuid + original extension
        const uniqueName = (0, uuid_1.v4)() + path_1.default.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
        }
    }
});
// ─── Update arbitrary user fields (bio, pronouns, etc.) ───
router.post('/update-user', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.session.user;
        if (!username) {
            return res.status(400).json({ message: 'No user in session' });
        }
        const userId = yield (0, usersDatabase_1.getUserID)(username);
        const { bio, pronouns, links, badges } = req.body;
        if (bio !== undefined)
            yield (0, usersDatabase_1.updateUserFieldInDB)(userId, 'bio', bio);
        if (pronouns !== undefined)
            yield (0, usersDatabase_1.updateUserFieldInDB)(userId, 'pronouns', pronouns);
        if (links !== undefined)
            yield (0, usersDatabase_1.updateUserFieldInDB)(userId, 'links', links);
        if (badges !== undefined)
            yield (0, usersDatabase_1.updateUserFieldInDB)(userId, 'badges', badges);
        return res.json({ message: 'Profile updated successfully' });
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}));
// ─── Get all user‐data (including current avatar & header) ───
router.get('/get-user-data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = yield database_1.db.get('SELECT username, bio, pronouns, links, badges, profile_image, header_image FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
// ─── Update avatar (Multer expects form‐field “avatar”) ───
router.post('/update-user-avatar', auth_handler_1.authHandler, upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No avatar image provided' });
        }
        // Compose the relative URL that you'll store in the DB
        const avatarImage = `profile_images/${req.file.filename}`;
        const success = yield (0, usersDatabase_1.updateUserProfileImage)(userId, avatarImage);
        if (!success) {
            return res.status(500).json({ error: 'Failed to update avatar' });
        }
        return res
            .status(200)
            .json({ success: true, message: 'Avatar updated', profile_image: avatarImage });
    }
    catch (error) {
        console.error('Error saving avatar image:', error);
        return res.status(500).json({ error: 'Failed to update avatar' });
    }
}));
// ─── Update header (Multer expects form‐field “header”) ───
router.post('/update-user-header', auth_handler_1.authHandler, upload.single('header'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No header image provided' });
        }
        const headerImage = `profile_images/${req.file.filename}`;
        const success = yield (0, usersDatabase_1.updateProfileHeaderImage)(userId, headerImage);
        if (!success) {
            return res.status(500).json({ error: 'Failed to update header' });
        }
        return res
            .status(200)
            .json({ success: true, message: 'Header updated', header_image: headerImage });
    }
    catch (error) {
        console.error('Error saving header image:', error);
        return res.status(500).json({ error: 'Failed to update header' });
    }
}));
// ─── Get just profile_image (if needed) ───
router.get('/get-user-avatar', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = yield database_1.db.get('SELECT profile_image FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user avatar:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
// ─── Get just header_image (if needed) ───
router.get('/get-user-header', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = yield database_1.db.get('SELECT header_image FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user header:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
exports.default = router;
