import {Router, Request, Response, NextFunction} from 'express';
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

const validateFileType = (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !req.files.image) {
        return next();
    }

    const file = req.files.image as fileUpload.UploadedFile;
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.name).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return next();
    } else {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and GIF files are allowed.' });
    }
};

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

export default router;