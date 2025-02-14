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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const database_1 = require("../database");
const database_2 = require("../database");
const database_3 = require("../database");
const router = express_1.default.Router();
const usersDir = path_1.default.resolve(__dirname, '..', 'users');
if (!fs_1.default.existsSync(usersDir)) {
    fs_1.default.mkdirSync(usersDir, { recursive: true });
}
router.post("/update-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request to update-user"); // Debugging
    try {
        let { field, value } = req.body;
        console.log("Request body:", { field, value }); // Debugging
        const userId = yield (0, database_1.getUserID)(req.session.user);
        console.log("User ID:", userId); // Debugging
        if (!userId) {
            console.error("Unauthorized request: No user ID found.");
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Map frontend field names to actual database column names
        const fieldMapping = {
            "fetchBio": "bio",
            "fetchPronouns": "pronouns",
            "fetchLinks": "links",
            "fetchBadges": "badges"
        };
        // Ensure the field exists in the mapping
        if (!(field in fieldMapping)) {
            console.error("Invalid field update attempt:", field);
            return res.status(400).json({ error: "Invalid field name" });
        }
        // Convert the field name
        field = fieldMapping[field];
        const success = yield (0, database_2.updateUserFieldInDB)(userId, field, value);
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
        const user = yield database_3.db.get("SELECT username, bio, pronouns, links, badges FROM users WHERE id = ?", [userId]);
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
exports.default = router;
