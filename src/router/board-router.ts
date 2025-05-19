import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import {
    createBoard,
    getBoards,
    getUserBoard,
    getBoardById,
    getBoardOwnerName,
    getBoardOwnerId, joinBoard, isUserMemberOfBoard, addHashtagToBoard,
    createProject, getProjectsForBoard, getPostsByBoard, addBoardMember, getPostsByProject
} from '../boardsDatabase';
import {getUserById, getUserID, getUserNameById} from "../usersDatabase";
import {getPostById, getPostOwnerName, getPostsForBoard} from "../postDatabase";

const router = Router();

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


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.post(
    '/createBoard',
    authHandler,
    upload.fields([{ name: 'profileImage' }, { name: 'headerImage' }]),
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('visibility')
            .notEmpty()
            .withMessage('Visibility is required')
            .isIn(['public', 'private'])
            .withMessage('Visibility must be either public or private'),
        body('boardTypeId').isInt().withMessage('Board type ID must be an integer'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, visibility, hashtag = '', boardTypeId } = req.body;
        const userId = await getUserID(req.session.user);

        let profileImage = 'default_profile.jpg';
        let headerImage = 'default_header.jpg';

        try {

            if (req.files) {
                const files = req.files as { [fieldname: string]: Express.Multer.File[] };

                if (files.profileImage && files.profileImage[0]) {
                    profileImage = `uploads/${files.profileImage[0].filename}`;
                }

                if (files.headerImage && files.headerImage[0]) {
                    headerImage = `uploads/${files.headerImage[0].filename}`;
                }
            }

            const newBoard = await createBoard(
                userId,
                name,
                description,
                visibility,
                hashtag,
                boardTypeId,
                profileImage,
                headerImage
            );

            const hashtagsArray = hashtag
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.length > 0);

            if (hashtagsArray.length > 0) {
                await addHashtagToBoard(newBoard.id, hashtagsArray);
            }

            return res.status(201).json(newBoard);
        } catch (error) {
            console.error('Error creating board:', error);
            return res.status(500).json({ error: 'Failed to create board' });
        }
    }
);

router.post(
    '/createProject',
    authHandler,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('boardId').isInt().withMessage('Board ID must be an integer'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, boardId } = req.body;
        const userId = await getUserID(req.session.user);

        try {
            const boardOwnerId = await getBoardOwnerId(boardId);
            if (userId !== boardOwnerId) {
                return res.status(403).json({ error: 'Only the board owner can create a project.' });
            }
            await createProject(name, description, boardId);
            return res.redirect(`/board/${boardId}`);
        } catch (error) {
            console.error('Error creating project:', error);
            return res.status(500).json({ error: 'Failed to create project' });
        }
    }
);

router.get('/board/:id/projects', authHandler, async (req: Request, res: Response) => {
    const boardId = parseInt(req.params.id);

    try {
        const projects = await getProjectsForBoard(boardId);
        return res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.get('/board/:id', authHandler, async (req: Request, res: Response) => {
    const boardId = parseInt(req.params.id);
    try {
        const board = await getBoardById(boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        const ownerName = await getBoardOwnerName(boardId);
        const ownerId = await getBoardOwnerId(boardId);
        const currentUserId = await getUserID(req.session.user);
        const currentUserName = req.session.user;
        const isMember = await isUserMemberOfBoard(currentUserId, boardId);
        const isOwner = ownerId === currentUserId;
        const currentUserRecord = await getUserById(currentUserId);
        const userAvatar = currentUserRecord?.profile_image || 'uploads/default_profile.png';
        const projects = await getProjectsForBoard(boardId);

        const rawPosts = await getPostsByBoard(boardId);
        const posts = rawPosts.map(p => ({
            ...p,
            hashtags: p.hashtags ? p.hashtags.split(',') : []
        }));


        res.render('board', { board, ownerName, ownerId, currentUserId, isMember,
            posts, currentUserName,
            isOwner, userAvatar, projects, user: req.session.user });
    } catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/boards', authHandler, async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        let boards = await getBoards();

        if (search) {
            const searchTerm = search.toString().toLowerCase();
            boards = boards.filter(board =>
                board.name.toLowerCase().includes(searchTerm) ||
                board.description.toLowerCase().includes(searchTerm) ||
                (board.hashtag && board.hashtag.toLowerCase().includes(searchTerm))
            );
        }

        return res.json(boards);
    } catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({ error: 'Failed to fetch boards' });
    }
});


router.get('/user-boards', authHandler, async (req: Request, res: Response) => {
    try {
        const userId = await getUserID(req.session.user);
        const boards = await getUserBoard(userId);
        return res.json(boards);
    } catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
});

router.post('/join/:boardId', authHandler, async (req: Request, res: Response) => {
    const userId: number = await getUserID(req.session.user);
    const boardId: number = parseInt(req.params.boardId, 10);

    try {
        const ownerId = await getBoardOwnerId(boardId);
        if (ownerId === null) {
            return res.status(404).send('Board not found');
        }
        if (ownerId === userId) {
            return res.status(400).send('Owner is already a member');
        }

        if (await isUserMemberOfBoard(userId, boardId)) {
            return res.status(400).send('Already a member');
        }

        await addBoardMember(userId, boardId);
        return res.redirect(`/board/${boardId}`);
    } catch (err: any) {
        console.error('Error joining board:', err);
        return res.status(500).send('Server error');
    }
});

router.get('/project/:projectId/posts', authHandler, async (req, res) => {
    const projectId = Number(req.params.projectId);
    try {
        const posts = await getPostsByProject(projectId);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch project posts' });
    }
});


export default router;