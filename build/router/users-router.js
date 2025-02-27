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
const database_1 = require("../database");
const auth_handler_1 = require("../middleware/auth-handler");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const usersDir = path_1.default.resolve(__dirname, '..', 'users');
if (!fs_1.default.existsSync(usersDir)) {
    fs_1.default.mkdirSync(usersDir, { recursive: true });
}
router.post("/update-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { field, value } = req.body;
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            console.error("Unauthorized request: No user ID found.");
            return res.status(401).json({ error: "Unauthorized" });
        }
        const fieldMapping = {
            "fetchBio": "bio",
            "fetchPronouns": "pronouns",
            "fetchLinks": "links",
            "fetchBadges": "badges"
        };
        if (!(field in fieldMapping)) {
            console.error("Invalid field update attempt:", field);
            return res.status(400).json({ error: "Invalid field name" });
        }
        field = fieldMapping[field];
        const success = yield (0, database_1.updateUserFieldInDB)(userId, field, value);
        if (!success) {
            console.error("Failed to update database.");
            return res.status(500).json({ error: "Failed to update user field in database" });
        }
        res.status(200).json({ success: true, message: "User profile updated in DB" });
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.get("/get-user-data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = yield database_1.db.get("SELECT username, bio, pronouns, links, badges FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.post("/update-user-avatar", auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const profileUploads = path_1.default.resolve(__dirname, '..', 'profile_images');
        if (!fs_1.default.existsSync(profileUploads)) {
            fs_1.default.mkdirSync(profileUploads, { recursive: true });
        }
        if (req.files) {
            console.log("Uploaded Files:", req.files);
            const files = Object.fromEntries(Object.entries(req.files).map(([key, value]) => [key.trim(), value]));
            if (files.avatar) {
                console.log("Avatar Image Found:", files.avatar);
                const avatarImageFile = files.avatar;
                const avatarImageUUID = (0, uuid_1.v4)() + path_1.default.extname(avatarImageFile.name);
                const avatarImagePath = path_1.default.join(profileUploads, avatarImageUUID);
                yield avatarImageFile.mv(avatarImagePath);
                const avatarImage = `profile_images/${avatarImageUUID}`;
                const success = yield (0, database_1.updateUserProfileImage)(userId, avatarImage);
                if (!success) {
                    return res.status(500).json({ error: "Failed to update avatar" });
                }
                return res.status(200).json({ success: true, message: "Avatar updated" });
            }
        }
        return res.status(400).json({ error: "No avatar image provided" });
    }
    catch (error) {
        console.error("Error saving avatar image:", error);
        return res.status(500).json({ error: "Failed to update avatar" });
    }
}));
router.post("/update-user-header", auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const headerUploads = path_1.default.resolve(__dirname, '..', 'profile_images');
        if (!fs_1.default.existsSync(headerUploads)) {
            fs_1.default.mkdirSync(headerUploads, { recursive: true });
        }
        if (req.files) {
            console.log("Uploaded Files:", req.files);
            const files = Object.fromEntries(Object.entries(req.files).map(([key, value]) => [key.trim(), value]));
            if (files.header) {
                console.log("Header Image Found:", files.header);
                const headerImageFile = files.header;
                const headerImageUUID = (0, uuid_1.v4)() + path_1.default.extname(headerImageFile.name);
                const headerImagePath = path_1.default.join(headerUploads, headerImageUUID);
                yield headerImageFile.mv(headerImagePath);
                const headerImage = `profile_images/${headerImageUUID}`;
                const success = yield (0, database_1.updateProfileHeaderImage)(userId, headerImage);
                if (!success) {
                    return res.status(500).json({ error: "Failed to update header" });
                }
                return res.status(200).json({ success: true, message: "Header updated" });
            }
        }
        return res.status(400).json({ error: "No header image provided" });
    }
    catch (error) {
        console.error("Error saving header image:", error);
        return res.status(500).json({ error: "Failed to update header" });
    }
}));
router.get("/get-user-avatar", auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = yield database_1.db.get("SELECT profile_image FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user avatar:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.get("/get-user-header", auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = yield database_1.db.get("SELECT header_image FROM users WHERE id = ?", [userId]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user header:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
