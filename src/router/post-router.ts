import { Router, Request, Response } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getUserID } from '../usersDatabase';
import { createPostWithProject, createPostWithoutProject, likePost, unlikePost, addHashtagsToPost } from '../postDatabase';
import multer from 'multer';
import {getBoardOwnerId, isUserMemberOfBoard} from "../boardsDatabase";

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb ) => {
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

// POST /createPost
router.post(
    '/createPost',
    authHandler,
    upload.single('image'),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('boardId').isInt().withMessage('Board ID must be an integer'),
        body('type').notEmpty().withMessage('Type is required'),
        body('hashtags').optional().isString().withMessage('Hashtags must be a comma-separated string')
    ],
    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {

            const userId: number = await getUserID(req.session.user);
            const boardId: number = parseInt(req.body.boardId);

            const ownerId = await getBoardOwnerId(boardId);
            const isMember = await isUserMemberOfBoard(userId, boardId);
            if (ownerId !== userId && !isMember) {
                return res.status(403).json({ error: 'Forbidden: You must join the board to post.' });
            }

            const title: string = req.body.title;
            const content: string = req.body.content;
            const type: string = req.body.type;

            if (!title || !content) {
                return res.status(400).json({ error: 'Title and Content cannot be empty' });
            }

            const imagePath: string = req.file ? path.join('uploads', req.file.filename) : '';
            const projectIdRaw: string | undefined = req.body.projectId;
            const projectId: number | null = projectIdRaw ? parseInt(projectIdRaw, 10) : null;


            const hashtagsField: string = req.body.hashtags || '';
            const hashtagsArray: string[] = hashtagsField
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

            let post;
            if (projectId !== null) {
                post = await createPostWithProject(
                    title,
                    content,
                    userId,
                    boardId,
                    type,
                    new Date(),
                    hashtagsArray[0] || '',
                    imagePath,
                    projectId
                );
            } else {
                post = await createPostWithoutProject(
                    title,
                    content,
                    userId,
                    boardId,
                    type,
                    new Date(),
                    hashtagsArray[0] || '',
                    imagePath
                );
            }

            await addHashtagsToPost(post.id!, hashtagsArray);

            return res.status(201).json(post);
        } catch (error: any) {
            console.error('Error creating post:', error);
            return res.status(500).json({ error: error.message });
        }
    }
);

// like and unlike post
router.post('/like/:postId', authHandler, async (req: Request, res: Response) => {
    const postId: number = parseInt(req.params.postId, 10);
    const userId: number = await getUserID(req.session.user);
    try {
        await likePost(postId, userId);
        return res.status(204).send();
    } catch (error) {
        console.error('Error liking post:', error);
        return res.status(500).json({ error: 'Failed to like post' });
    }
});

router.post('/unlike/:postId', authHandler, async (req: Request, res: Response) => {
    const postId: number = parseInt(req.params.postId, 10);
    const userId: number = await getUserID(req.session.user);
    try {
        await unlikePost(postId, userId);
        return res.status(204).send();
    } catch (error) {
        console.error('Error unliking post:', error);
        return res.status(500).json({ error: 'Failed to unlike post' });
    }
});

export default router;