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
const chaptersDatabase_1 = require("../chaptersDatabase");
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
const upload = (0, multer_1.default)({ storage }).fields([
    { name: 'image', maxCount: 1 }, // your existing single‐image posts
    { name: 'chapterFile', maxCount: 1 }, // for .txt/.docx/.pdf
    { name: 'comicPages', maxCount: 50 } // for multiple comic pages
]);
// POST /createPost
router.post('/createPost', auth_handler_1.authHandler, upload, [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('boardId').isInt().withMessage('Board ID must be an integer'),
    (0, express_validator_1.body)('type')
        .isIn(['text', 'image', 'chapter', 'comic'])
        .withMessage('Type must be one of text, image, chapter or comic'),
    (0, express_validator_1.body)('hashtags')
        .optional()
        .isString()
        .withMessage('Hashtags must be a comma-separated string'),
    (0, express_validator_1.body)('projectId')
        .optional()
        .isInt()
        .withMessage('Project ID, if provided, must be an integer'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // 1. Validation
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // 2. Auth & permissions
        const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        const boardId = parseInt(req.body.boardId, 10);
        const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        const member = yield (0, boardsDatabase_1.isUserMemberOfBoard)(userId, boardId);
        if (ownerId !== userId && !member) {
            return res
                .status(403)
                .json({ error: 'Forbidden: You must join the board to post.' });
        }
        // 3. Common fields
        const { title, content, type } = req.body;
        const projectId = req.body.projectId
            ? parseInt(req.body.projectId, 10)
            : null;
        const hashtags = (req.body.hashtags || '')
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t);
        let postId;
        // 4a. Chapter upload
        if (type === 'chapter') {
            const file = (_b = (_a = req.files) === null || _a === void 0 ? void 0 : _a.chapterFile) === null || _b === void 0 ? void 0 : _b[0];
            if (!file) {
                return res.status(400).json({ error: 'Chapter file required' });
            }
            const ext = path_1.default
                .extname(file.originalname)
                .slice(1)
                .toLowerCase(); // 'txt' | 'docx' | 'pdf'
            const post = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, 'chapter', new Date(), hashtags[0] || '', '', // no image
            projectId, file.path, // file_path
            ext // file_format
            );
            postId = post.id;
            // 4b. Comic upload
        }
        else if (type === 'comic') {
            const pages = req.files.comicPages;
            if (!(pages === null || pages === void 0 ? void 0 : pages.length)) {
                return res.status(400).json({ error: 'Comic pages required' });
            }
            const post = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, 'comic', new Date(), hashtags[0] || '', '', projectId);
            postId = post.id;
            for (let i = 0; i < pages.length; i++) {
                const file = pages[i];
                // **DON’T** use path.join here—build the URL path manually:
                const publicPath = `uploads/${file.filename}`;
                yield (0, chaptersDatabase_1.insertComicPage)(postId, i + 1, publicPath);
            }
        }
        else {
            const imgFile = (_d = (_c = req.files) === null || _c === void 0 ? void 0 : _c.image) === null || _d === void 0 ? void 0 : _d[0];
            const imagePath = imgFile
                ? path_1.default.join('uploads', imgFile.filename)
                : '';
            const createFn = projectId
                ? postDatabase_1.createPostWithProject
                : postDatabase_1.createPostWithoutProject;
            const post = yield createFn(title, content, userId, boardId, type, new Date(), hashtags[0] || '', imagePath, projectId);
            postId = post.id;
        }
        // 5. Attach hashtags
        if (hashtags.length) {
            yield (0, postDatabase_1.addHashtagsToPost)(postId, hashtags);
        }
        // 6. Respond
        return res.status(201).json({ id: postId });
    }
    catch (err) {
        console.error('Error creating post:', err);
        return res.status(500).json({ error: err.message });
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
