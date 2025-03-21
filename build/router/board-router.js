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
const auth_handler_1 = require("../middleware/auth-handler");
const express_validator_1 = require("express-validator");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.use((0, express_fileupload_1.default)());
router.post('/create', auth_handler_1.authHandler, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('visibility').notEmpty().withMessage('Visibility is required').isIn(['public', 'private']).withMessage('Visibility must be either public or private')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, visibility } = req.body;
    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = yield (0, database_1.getUserID)(req.session.user);
    try {
        const uploadsDir = path_1.default.resolve(__dirname, '..', 'uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        if (req.files) {
            console.log("Uploaded Files:", req.files);
            // Normalize key names by trimming spaces
            const files = Object.fromEntries(Object.entries(req.files).map(([key, value]) => [key.trim(), value]));
            if (files.profileImage) {
                console.log("Profile Image Found:", files.profileImage);
                const profileImageFile = files.profileImage;
                const profileImageUUID = (0, uuid_1.v4)() + path_1.default.extname(profileImageFile.name);
                const profileImagePath = path_1.default.join(uploadsDir, profileImageUUID);
                yield profileImageFile.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }
            if (files.headerImage) {
                console.log("Header Image Found:", files.headerImage);
                const headerImageFile = files.headerImage;
                const headerImageUUID = (0, uuid_1.v4)() + path_1.default.extname(headerImageFile.name);
                const headerImagePath = path_1.default.join(uploadsDir, headerImageUUID);
                yield headerImageFile.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }
        const newBoard = yield (0, database_1.createBoard)(userId, name, description, profileImage, headerImage, visibility);
        return res.status(201).json(newBoard);
    }
    catch (error) {
        console.error("Error saving images:", error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
}));
router.get('/boards', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const boards = yield (0, database_1.getBoards)();
        return res.json(boards);
    }
    catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({ error: 'Failed to fetch boards' });
    }
}));
router.get('/user-boards', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, database_1.getUserID)(req.session.user);
        const boards = yield (0, database_1.getBoard)(userId);
        return res.json(boards);
    }
    catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
}));
exports.default = router;
