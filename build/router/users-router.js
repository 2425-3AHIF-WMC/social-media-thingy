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
const router = express_1.default.Router();
const usersDir = path_1.default.resolve(__dirname, '..', 'users');
if (!fs_1.default.existsSync(usersDir)) {
    fs_1.default.mkdirSync(usersDir, { recursive: true });
}
// Route to handle user profile updates
router.post("/update-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { field, value } = req.body;
        const userId = yield (0, database_1.getUserID)(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userFilePath = path_1.default.join(usersDir, `${userId}.json`);
        let userData = {}; // Allows dynamic key indexing
        if (fs_1.default.existsSync(userFilePath)) {
            userData = JSON.parse(fs_1.default.readFileSync(userFilePath, "utf-8"));
        }
        userData[field] = value;
        fs_1.default.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
        res.status(200).json({ success: true, message: "User profile updated" });
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = router;
