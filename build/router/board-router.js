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
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const boardsDatabase_1 = require("../boardsDatabase");
const usersDatabase_1 = require("../usersDatabase");
const router = (0, express_1.Router)();
/*
router.post('/create', authHandler, [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('visibility').notEmpty().withMessage('Visibility is required').isIn(['public', 'private']).withMessage('Visibility must be either public or private')
], async (req: Request, res: Response) => {
    console.log("Received request to create board:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { name, description, visibility, hashtag } = req.body;

    // Ensure hashtag are parsed correctly
    try {
        if (typeof hashtag === "string") {
            hashtag = JSON.parse(hashtag);
        }
        if (!Array.isArray(hashtag)) {
            hashtag = [];
        }
        hashtag = hashtag.slice(0, 5); // Ensure max of 5
    } catch (error) {
        console.error("❌ Error parsing hashtags:", error);
        hashtag = [];
    }

    console.log("✅ Processed Hashtags:", hashtag);

    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = await getUserID(req.session.user);

    try {
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.files) {
            const files = req.files as { [key: string]: fileUpload.UploadedFile };

            if (files.profileImage) {
                const profileImageUUID = uuidv4() + path.extname(files.profileImage.name);
                const profileImagePath = path.join(uploadsDir, profileImageUUID);
                await files.profileImage.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }

            if (files.headerImage) {
                const headerImageUUID = uuidv4() + path.extname(files.headerImage.name);
                const headerImagePath = path.join(uploadsDir, headerImageUUID);
                await files.headerImage.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }

        console.log("Saving board with hashtags:", hashtag);
        const newBoard = await createBoard(userId, name, description, profileImage, headerImage, visibility, hashtag.join(" "));
        return res.status(201).json(newBoard);

    } catch (error) {
        console.error("Error saving board:", error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
});

*/
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
router.post('/createBoard', auth_handler_1.authHandler, upload.fields([{ name: 'profileImage' }, { name: 'headerImage' }]), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('visibility')
        .notEmpty()
        .withMessage('Visibility is required')
        .isIn(['public', 'private'])
        .withMessage('Visibility must be either public or private'),
    (0, express_validator_1.body)('boardTypeId').isInt().withMessage('Board type ID must be an integer'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, visibility, hashtag = '', boardTypeId } = req.body;
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    let profileImage = 'default_profile.jpg';
    let headerImage = 'default_header.jpg';
    try {
        if (req.files) {
            const files = req.files;
            if (files.profileImage && files.profileImage[0]) {
                profileImage = `uploads/${files.profileImage[0].filename}`;
            }
            if (files.headerImage && files.headerImage[0]) {
                headerImage = `uploads/${files.headerImage[0].filename}`;
            }
        }
        const newBoard = yield (0, boardsDatabase_1.createBoard)(userId, name, description, visibility, hashtag, boardTypeId, profileImage, headerImage);
        const hashtagsArray = hashtag
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
        if (hashtagsArray.length > 0) {
            yield (0, boardsDatabase_1.addHashtagToBoard)(newBoard.id, hashtagsArray);
        }
        return res.status(201).json(newBoard);
    }
    catch (error) {
        console.error('Error creating board:', error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
}));
router.post('/createProject', auth_handler_1.authHandler, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('boardId').isInt().withMessage('Board ID must be an integer'),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, boardId } = req.body;
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    try {
        const boardOwnerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        if (userId !== boardOwnerId) {
            return res.status(403).json({ error: 'Only the board owner can create a project.' });
        }
        yield (0, boardsDatabase_1.createProject)(name, description, boardId);
        return res.redirect(`/board/${boardId}`);
    }
    catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Failed to create project' });
    }
}));
router.get('/board/:id/projects', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = parseInt(req.params.id);
    try {
        const projects = yield (0, boardsDatabase_1.getProjectsForBoard)(boardId);
        return res.status(200).json(projects);
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
    }
}));
router.get('/board/:id', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = parseInt(req.params.id, 10);
    try {
        const board = yield (0, boardsDatabase_1.getBoardById)(boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        const ownerName = yield (0, boardsDatabase_1.getBoardOwnerName)(boardId);
        const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        const currentUserId = yield (0, usersDatabase_1.getUserID)(req.session.user);
        const isMember = yield (0, boardsDatabase_1.isUserMemberOfBoard)(currentUserId, boardId);
        const isOwner = ownerId === currentUserId;
        const currentUserRecord = yield (0, usersDatabase_1.getUserById)(currentUserId);
        const userAvatar = (currentUserRecord === null || currentUserRecord === void 0 ? void 0 : currentUserRecord.profile_image) || 'uploads/default_profile.png';
        const projects = yield (0, boardsDatabase_1.getProjectsForBoard)(boardId);
        const rawPosts = yield (0, boardsDatabase_1.getPostsByBoard)(boardId);
        const posts = rawPosts.map(p => (Object.assign(Object.assign({}, p), { hashtags: p.hashtags ? p.hashtags.split(',') : [] })));
        res.render('board', {
            board,
            ownerName,
            ownerId,
            currentUserId,
            isMember,
            isOwner,
            posts,
            projects,
            user: currentUserRecord,
            userAvatar
        });
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
                (board.hashtag && board.hashtag.toLowerCase().includes(searchTerm)));
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
router.post('/join/:boardId', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    const boardId = parseInt(req.params.boardId, 10);
    try {
        const ownerId = yield (0, boardsDatabase_1.getBoardOwnerId)(boardId);
        if (ownerId === null) {
            return res.status(404).send('Board not found');
        }
        if (ownerId === userId) {
            return res.status(400).send('Owner is already a member');
        }
        if (yield (0, boardsDatabase_1.isUserMemberOfBoard)(userId, boardId)) {
            return res.status(400).send('Already a member');
        }
        yield (0, boardsDatabase_1.addBoardMember)(userId, boardId);
        return res.redirect(`/board/${boardId}`);
    }
    catch (err) {
        console.error('Error joining board:', err);
        return res.status(500).send('Server error');
    }
}));
router.get('/project/:projectId/posts', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = Number(req.params.projectId);
    try {
        const posts = yield (0, boardsDatabase_1.getPostsByProject)(projectId);
        res.json(posts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch project posts' });
    }
}));
exports.default = router;
