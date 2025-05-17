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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const usersDatabase_1 = require("../usersDatabase");
const postDatabase_1 = require("../postDatabase");
const multer_1 = __importDefault(require("multer"));
const boardsDatabase_1 = require("../boardsDatabase");
const router = (0, express_1.Router)();
// Multer configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path_1.default.resolve(__dirname, '..', 'uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = (0, uuid_1.v4)() + path_1.default.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({ storage });
// POST /createPost
router.post('/createPost', auth_handler_1.authHandler, upload.single('image'), [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('boardId').isInt().withMessage('Board ID must be an integer'),
    (0, express_validator_1.body)('type').notEmpty().withMessage('Type is required'),
    (0, express_validator_1.body)('hashtags').optional().isString().withMessage('Hashtags must be a comma-separated string')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        const boardId = parseInt(req.body.boardId);
        const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        const isMember = yield (0, boardsDatabase_1.isUserMemberOfBoard)(userId, boardId);
        if (ownerId !== userId && !isMember) {
            return res.status(403).json({ error: 'Forbidden: You must join the board to post.' });
        }
        const title = req.body.title;
        const content = req.body.content;
        const type = req.body.type;
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and Content cannot be empty' });
        }
        const imagePath = req.file ? path_1.default.join('uploads', req.file.filename) : '';
        const projectIdRaw = req.body.projectId;
        const projectId = projectIdRaw ? parseInt(projectIdRaw, 10) : null;
        const hashtagsField = req.body.hashtags || '';
        const hashtagsArray = hashtagsField
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        let post;
        if (projectId !== null) {
            post = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, type, new Date(), hashtagsArray[0] || '', imagePath, projectId);
        }
        else {
            post = yield (0, postDatabase_1.createPostWithoutProject)(title, content, userId, boardId, type, new Date(), hashtagsArray[0] || '', imagePath);
        }
        yield (0, postDatabase_1.addHashtagsToPost)(post.id, hashtagsArray);
        return res.status(201).json(post);
    }
    catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: error.message });
    }
}));
// like and unlike post
router.post('/like/:postId', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = parseInt(req.params.postId, 10);
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    try {
        yield (0, postDatabase_1.likePost)(postId, userId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error liking post:', error);
        return res.status(500).json({ error: 'Failed to like post' });
    }
}));
router.post('/unlike/:postId', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = parseInt(req.params.postId, 10);
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    try {
        yield (0, postDatabase_1.unlikePost)(postId, userId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error unliking post:', error);
        return res.status(500).json({ error: 'Failed to unlike post' });
    }
}));
exports.default = router;
