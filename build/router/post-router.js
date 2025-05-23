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
    { name: 'image', maxCount: 1 },
    { name: 'chapterFile', maxCount: 1 },
    { name: 'comicPages', maxCount: 50 }
]);
router.post('/createPost', auth_handler_1.authHandler, upload, [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Content is required'),
    (0, express_validator_1.body)('boardId').isInt().withMessage('Board ID must be an integer'),
    (0, express_validator_1.body)('type')
        .isIn(['text', 'image', 'chapter', 'comic'])
        .withMessage('Type must be one of text, image, chapter or comic'),
    (0, express_validator_1.body)('hashtags').optional().isString(),
    (0, express_validator_1.body)('projectId').optional({ checkFalsy: true }).isInt()
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    const boardId = Number(req.body.boardId);
    const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
    const isMember = yield (0, boardsDatabase_1.isUserMemberOfBoard)(userId, boardId);
    if (ownerId !== userId && !isMember) {
        return res.status(403).json({ error: 'You must join the board to post.' });
    }
    const { title, content, type } = req.body;
    const rawProj = (req.body.projectId || '').toString().trim();
    const projectId = rawProj ? Number(rawProj) : null;
    const hashtags = (req.body.hashtags || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    let postId;
    if (type === 'chapter') {
        if (projectId === null) {
            return res.status(400).json({ error: 'Chapters must belong to a project.' });
        }
        if (ownerId !== userId) {
            return res.status(403).json({ error: 'Only the board owner can post chapters.' });
        }
        const fileArr = req.files.chapterFile;
        const file = fileArr === null || fileArr === void 0 ? void 0 : fileArr[0];
        if (!file)
            return res.status(400).json({ error: 'Chapter file required.' });
        const ext = path_1.default.extname(file.originalname).slice(1).toLowerCase();
        const { id } = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, 'chapter', hashtags[0] || '', '', projectId);
        postId = id;
        yield (0, chaptersDatabase_1.createChapterFile)(postId, file.path, ext, projectId, title);
    }
    else if (type === 'comic') {
        if (projectId === null) {
            return res.status(400).json({ error: 'Comics must belong to a project.' });
        }
        if (ownerId !== userId) {
            return res.status(403).json({ error: 'Only the board owner can post comics.' });
        }
        const pages = req.files.comicPages;
        if (!(pages === null || pages === void 0 ? void 0 : pages.length))
            return res.status(400).json({ error: 'Comic pages required.' });
        const post = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, 'comic', hashtags[0] || '', '', projectId);
        postId = post.id;
        const chapterId = yield (0, chaptersDatabase_1.createChapterFile)(postId, '', 'comic', projectId, title);
        for (let i = 0; i < pages.length; i++) {
            yield (0, chaptersDatabase_1.insertComicPage)(chapterId, i + 1, `uploads/${path_1.default.basename(pages[i].path)}`);
        }
    }
    else {
        if (projectId !== null && ownerId !== userId) {
            return res.status(403).json({ error: 'Only the board owner can assign to a project.' });
        }
        const imgArr = req.files.image;
        const img = imgArr === null || imgArr === void 0 ? void 0 : imgArr[0];
        const imagePath = img ? `uploads/${path_1.default.basename(img.path)}` : '';
        if (projectId !== null) {
            const { id } = yield (0, postDatabase_1.createPostWithProject)(title, content, userId, boardId, type, hashtags.join(','), imagePath, projectId);
            postId = id;
        }
        else {
            const { id } = yield (0, postDatabase_1.createPostWithoutProject)(title, content, userId, boardId, type, hashtags.join(','), imagePath);
            postId = id;
        }
    }
    if (hashtags.length) {
        yield (0, postDatabase_1.addHashtagsToPost)(postId, hashtags);
    }
    return res.status(201).json({ id: postId });
}));
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
