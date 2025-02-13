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
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = yield (0, database_1.getUserID)(req.session.user);
    try {
        // Use absolute path
        const uploadsDir = path_1.default.resolve(__dirname, '..', 'uploads');
        // Ensure the uploads directory exists
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        if (req.files) {
            if (req.files.profileImage) {
                const profileImageFile = req.files.profileImage;
                const extension = path_1.default.extname(profileImageFile.name);
                const profileImageUUID = (0, uuid_1.v4)() + extension;
                const profileImagePath = path_1.default.join(uploadsDir, profileImageUUID);
                yield profileImageFile.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}#${profileImageFile.name}`;
            }
            if (req.files.headerImage) {
                const headerImageFile = req.files.headerImage;
                const extension = path_1.default.extname(headerImageFile.name);
                const headerImageUUID = (0, uuid_1.v4)() + extension;
                const headerImagePath = path_1.default.join(uploadsDir, headerImageUUID);
                yield headerImageFile.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}#${headerImageFile.name}`;
                fs_1.default.appendFileSync(path_1.default.join(uploadsDir, 'image-metadata.log'), `${headerImageUUID} -> ${headerImageFile.name}\n`);
            }
        }
        const newBoard = yield (0, database_1.createBoard)(userId, name, description, profileImage, headerImage);
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
exports.default = router;
