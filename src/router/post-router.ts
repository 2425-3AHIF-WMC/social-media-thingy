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
import {createChapterFile, insertComicPage} from "../chaptersDatabase";

const router = Router();


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
    { name: 'image', maxCount: 1 },
    { name: 'chapterFile', maxCount: 1 },
    { name: 'comicPages', maxCount: 50 }
]);


router.post(
    '/createPost',
    authHandler,
    upload,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('boardId').isInt().withMessage('Board ID must be an integer'),
        body('type')
            .isIn(['text','image','chapter','comic'])
            .withMessage('Type must be one of text, image, chapter or comic'),
        body('hashtags').optional().isString(),
        body('projectId').optional({ checkFalsy: true }).isInt()
    ],
    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const userId  = await getUserID(req.session.user!);
        const boardId = Number(req.body.boardId);
        const ownerId = await getBoardOwnerId(boardId);
        const isMember= await isUserMemberOfBoard(userId, boardId);
        if (ownerId !== userId && !isMember) {
            return res.status(403).json({ error: 'You must join the board to post.' });
        }

        const { title, content, type } = req.body as any;
        const rawProj   = (req.body.projectId || '').toString().trim();
        const projectId = rawProj ? Number(rawProj) : null;
        const hashtags = (req.body.hashtags || '')
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);

        let postId!: number | undefined;

        if (type === 'chapter') {
            if (projectId === null) {
                return res.status(400).json({ error: 'Chapters must belong to a project.' });
            }
            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Only the board owner can post chapters.' });
            }
            const fileArr = (req.files as any).chapterFile as Express.Multer.File[]|undefined;
            const file    = fileArr?.[0];
            if (!file) return res.status(400).json({ error: 'Chapter file required.' });

            const ext = path.extname(file.originalname).slice(1).toLowerCase();

            const { id } = await createPostWithProject(
                title, content, userId, boardId,
                'chapter',
                hashtags[0] || '', '', projectId
            );
            postId = id!;

            await createChapterFile(postId, file.path, ext, projectId, title);

        } else if (type === 'comic') {
            if (projectId === null) {
                return res.status(400).json({ error: 'Comics must belong to a project.' });
            }
            if (ownerId !== userId) {
                return res.status(403).json({ error: 'Only the board owner can post comics.' });
            }
            const pages = (req.files as any).comicPages as Express.Multer.File[]|undefined;
            if (!pages?.length) return res.status(400).json({ error: 'Comic pages required.' });

            const post = await createPostWithProject(
                title,
                content,
                userId,
                boardId,
                'comic',
                hashtags[0] || '',
                '',
                projectId
            );
            postId = post.id;

            const chapterId = await createChapterFile(
                postId!,
                '',
                'comic',
                projectId,
                title
            );

            for (let i = 0; i < pages.length; i++) {
                await insertComicPage(
                    chapterId!,
                    i + 1,
                    `uploads/${path.basename(pages[i].path)}`
                );
            }
        } else {
            if (projectId !== null && ownerId !== userId) {
                return res.status(403).json({ error: 'Only the board owner can assign to a project.' });
            }
            const imgArr = (req.files as any).image as Express.Multer.File[]|undefined;
            const img    = imgArr?.[0];
            const imagePath = img ? `uploads/${path.basename(img.path)}` : '';

            if (projectId !== null) {
                const { id } = await createPostWithProject(
                    title, content, userId, boardId,
                    type,
                    hashtags.join(','), imagePath,
                    projectId
                );
                postId = id!;
            } else {
                const { id } = await createPostWithoutProject(
                    title, content, userId, boardId,
                    type,
                    hashtags.join(','), imagePath
                );
                postId = id!;
            }
        }

        if (hashtags.length) {
            await addHashtagsToPost(postId, hashtags);
        }

        return res.status(201).json({ id: postId });
    }
);

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