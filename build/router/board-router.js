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
const boardsDatabase_1 = require("../boardsDatabase");
const usersDatabase_1 = require("../usersDatabase");
const postDatabase_1 = require("../postDatabase");
const router = (0, express_1.Router)();
router.use((0, express_fileupload_1.default)());
router.post('/create', auth_handler_1.authHandler, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('visibility').notEmpty().withMessage('Visibility is required').isIn(['public', 'private']).withMessage('Visibility must be either public or private')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request to create board:", req.body);
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let { name, description, visibility, hashtags } = req.body;
    // Ensure hashtags are parsed correctly
    try {
        if (typeof hashtags === "string") {
            hashtags = JSON.parse(hashtags);
        }
        if (!Array.isArray(hashtags)) {
            hashtags = [];
        }
        hashtags = hashtags.slice(0, 5); // Ensure max of 5
    }
    catch (error) {
        console.error("❌ Error parsing hashtags:", error);
        hashtags = [];
    }
    console.log("✅ Processed Hashtags:", hashtags);
    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    try {
        const uploadsDir = path_1.default.resolve(__dirname, '..', 'uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        if (req.files) {
            const files = req.files;
            if (files.profileImage) {
                const profileImageUUID = (0, uuid_1.v4)() + path_1.default.extname(files.profileImage.name);
                const profileImagePath = path_1.default.join(uploadsDir, profileImageUUID);
                yield files.profileImage.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }
            if (files.headerImage) {
                const headerImageUUID = (0, uuid_1.v4)() + path_1.default.extname(files.headerImage.name);
                const headerImagePath = path_1.default.join(uploadsDir, headerImageUUID);
                yield files.headerImage.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }
        console.log("Saving board with hashtags:", hashtags);
        const newBoard = yield (0, boardsDatabase_1.createBoard)(userId, name, description, profileImage, headerImage, visibility, hashtags.join(" "));
        return res.status(201).json(newBoard);
    }
    catch (error) {
        console.error("Error saving board:", error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
}));
router.get('/board/:id', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = parseInt(req.params.id);
    try {
        const board = yield (0, boardsDatabase_1.getBoardById)(boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        const ownerName = yield (0, boardsDatabase_1.getBoardOwnerName)(boardId);
        const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        const currentUserId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        const isMember = yield (0, boardsDatabase_1.isUserMemberOfBoard)(currentUserId, boardId);
        const posts = yield (0, postDatabase_1.getPostsForBoard)(boardId);
        res.render('board', { board, ownerName, ownerId, currentUserId, isMember, posts, user: req.session.user });
    }
    catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.get('/boards', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        let boards = yield (0, boardsDatabase_1.getBoards)();
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            boards = boards.filter(board => board.name.toLowerCase().includes(searchTerm) ||
                board.description.toLowerCase().includes(searchTerm) ||
                (board.hashtags && board.hashtags.toLowerCase().includes(searchTerm)));
        }
        return res.json(boards);
    }
    catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({ error: 'Failed to fetch boards' });
    }
}));
router.get('/user-boards', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        const boards = yield (0, boardsDatabase_1.getUserBoard)(userId);
        return res.json(boards);
    }
    catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
}));
router.post('/join/:id', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = parseInt(req.params.id);
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    try {
        yield (0, boardsDatabase_1.joinBoard)(boardId, userId);
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error joining board:", error);
        return res.status(500).json({ error: 'Failed to join board' });
    }
}));
exports.default = router;
