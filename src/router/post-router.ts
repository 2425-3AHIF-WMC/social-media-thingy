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
import {insertComicPage} from "../chaptersDatabase";

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

const upload = multer({ storage }).fields([
    { name: 'image', maxCount: 1 },        // your existing single‐image posts
    { name: 'chapterFile', maxCount: 1 },  // for .txt/.docx/.pdf
    { name: 'comicPages', maxCount: 50 }   // for multiple comic pages
]);

// POST /createPost
router.post(
    '/createPost',
    authHandler,
    upload,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('boardId').isInt().withMessage('Board ID must be an integer'),
        body('type')
            .isIn(['text', 'image', 'chapter', 'comic'])
            .withMessage('Type must be one of text, image, chapter or comic'),
        body('hashtags')
            .optional()
            .isString()
            .withMessage('Hashtags must be a comma-separated string'),
        body('projectId')
            .optional()
            .isInt()
            .withMessage('Project ID, if provided, must be an integer'),
    ],
    async (req: Request, res: Response) => {
        // 1. Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // 2. Auth & permissions
            const userId = await getUserID(req.session.user!);
            const boardId = parseInt(req.body.boardId, 10);
            const ownerId = await getBoardOwnerId(boardId);
            const member = await isUserMemberOfBoard(userId, boardId);
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
                .map((t: string) => t.trim())
                .filter((t: string) => t);

            let postId: number;

            // 4a. Chapter upload
            if (type === 'chapter') {
                const file = (req.files as any)?.chapterFile?.[0];
                if (!file) {
                    return res.status(400).json({ error: 'Chapter file required' });
                }
                const ext = path
                    .extname(file.originalname)
                    .slice(1)
                    .toLowerCase(); // 'txt' | 'docx' | 'pdf'

                const post = await createPostWithProject(
                    title,
                    content,
                    userId,
                    boardId,
                    'chapter',
                    new Date(),
                    hashtags[0] || '',
                    '',          // no image
                    projectId!,
                    file.path,   // file_path
                    ext          // file_format
                );
                postId = post.id!;

                // 4b. Comic upload
            } else if (type === 'comic') {
                const pages = (req.files as any).comicPages;
                if (!pages?.length) {
                    return res.status(400).json({ error: 'Comic pages required' });
                }

                const post = await createPostWithProject(
                    title, content, userId, boardId, 'comic',
                    new Date(), hashtags[0] || '', '', projectId!
                );
                postId = post.id!;

                for (let i = 0; i < pages.length; i++) {
                    const file = pages[i];
                    // **DON’T** use path.join here—build the URL path manually:
                    const publicPath = `uploads/${file.filename}`;
                    await insertComicPage(postId, i + 1, publicPath);
                }
            } else {
                const imgFile = (req.files as any)?.image?.[0];
                const imagePath = imgFile
                    ? path.join('uploads', imgFile.filename)
                    : '';

                const createFn = projectId
                    ? createPostWithProject
                    : createPostWithoutProject;

                const post = await createFn(
                    title,
                    content,
                    userId,
                    boardId,
                    type,
                    new Date(),
                    hashtags[0] || '',
                    imagePath,
                    projectId!
                );
                postId = post.id!;
            }

            // 5. Attach hashtags
            if (hashtags.length) {
                await addHashtagsToPost(postId, hashtags);
            }

            // 6. Respond
            return res.status(201).json({ id: postId });
        } catch (err: any) {
            console.error('Error creating post:', err);
            return res.status(500).json({ error: err.message });
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