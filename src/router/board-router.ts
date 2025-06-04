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
    getBoardOwnerId,
    joinBoard,
    isUserMemberOfBoard,
    addHashtagToBoard,
    createProject,
    getProjectsForBoard,
    getPostsByBoard,
    addBoardMember,
    getPostsByProject
} from '../boardsDatabase';

import {
    getUserById,
    getUserID,
    getUserNameById
} from "../usersDatabase";

import {
    getPostById,
    getPostOwnerName,
    getPostsForBoard
} from "../postDatabase";

// Import the “like” helpers:
import { getLikesCount, hasLikedPost } from "../postDatabase";

const router = Router();


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


/* ==========================
   CREATE BOARD
   ========================== */
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


/* ==========================
   CREATE PROJECT
   ========================== */
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


/* ==========================
   GET PROJECTS FOR BOARD
   ========================== */
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


/* ==========================
   GET SINGLE BOARD (with enriched posts)
   ========================== */
router.get('/board/:id', authHandler, async (req: Request, res: Response) => {
    const boardId = parseInt(req.params.id, 10);

    try {
        const board = await getBoardById(boardId);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const ownerName         = await getBoardOwnerName(boardId);
        const ownerId           = await getBoardOwnerId(boardId);
        const currentUserId     = await getUserID(req.session.user);
        const isMember          = await isUserMemberOfBoard(currentUserId, boardId);
        const isOwner           = ownerId === currentUserId;
        const currentUserRecord = await getUserById(currentUserId);
        const userAvatar        = currentUserRecord?.profile_image || 'uploads/default_profile.png';
        const projects          = await getProjectsForBoard(boardId);

        // 1) Fetch raw posts from DB
        const rawPosts = await getPostsByBoard(boardId);

        // 2) Enrich each post with likeCount + likedByCurrentUser:
        const posts = await Promise.all(
            rawPosts.map(async (p) => {
                // a) Split hashtags CSV → array
                const tagsArr = p.hashtags ? p.hashtags.split(',') : [];

                // b) Count total likes for this post
                const likeRow = await getLikesCount(p.id);
                const count   = (likeRow && likeRow.count) || 0;

                // c) Check if this user already liked this post
                const liked  = await hasLikedPost(p.id, currentUserId);

                return {
                    ...p,
                    hashtags: tagsArr,
                    likeCount: count,
                    likedByCurrentUser: liked
                };
            })
        );

        // 3) Render the EJS with enriched posts
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

    } catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/* ==========================
   LIST ALL BOARDS (for Discovery, etc.)
   ========================== */
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


/* ==========================
   GET BOARDS BELONGING TO USER
   ========================== */
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


/* ==========================
   JOIN BOARD
   ========================== */
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


/* ==========================
   GET POSTS FOR A PROJECT (unchanged)
   ========================== */
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
