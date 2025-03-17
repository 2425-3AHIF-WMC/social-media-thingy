import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {getUserID} from "../usersDatabase";
import {createPost, likePost, unlikePost} from "../postDatabase";

const router = Router();
router.use(fileUpload());


//create post
router.put('/createPost',
    authHandler,
    [
        body('title').isString().notEmpty().withMessage('Title is required'),
        body('content').isString().notEmpty().withMessage('Content is required'),
        body('userId').isInt().withMessage('User ID must be an integer'),
        body('boardId').isInt().withMessage('Board ID must be an integer'),
        body('type').isString().notEmpty().withMessage('Type is required'),
        body('createdAt').isISO8601().toDate().withMessage('Created At must be a valid date'),
        body('hashtag').optional().isString(),
        body('image').optional().isString()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, userId, boardId, type, createdAt, hashtag, image } = req.body;

        try {
            const post = await createPost(title, content, userId, boardId, type, createdAt, hashtag, image);
            return res.status(201).json(post);
        } catch (error) {
            console.error("Error creating post:", error);
            return res.status(500).json({ error: 'Failed to create post' });
        }
    }
);

//get all posts for certain board

//get all posts



//like and unlike post
router.post('/like/:postId', authHandler, async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId);
    const userId = await getUserID(req.session.user);
    try {
        await likePost(postId, userId);
        return res.status(204).send();
    } catch (error) {
        console.error("Error liking post:", error);
        return res.status(500).json({ error: 'Failed to like post' });
    }
});

router.post('/unlike/:postId', authHandler, async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId);
    const userId = await getUserID(req.session.user);
    try {
        await unlikePost(postId, userId);
        return res.status(204).send();
    } catch (error) {
        console.error("Error unliking post:", error);
        return res.status(500).json({ error: 'Failed to unlike post' });
    }
});