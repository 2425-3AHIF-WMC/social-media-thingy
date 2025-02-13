import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { createBoard, getBoards, getUserID } from '../database';

const router = Router();

router.use(fileUpload());

router.post('/create', authHandler, [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required')
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = await getUserID(req.session.user);

    try {

        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        if (req.files) {
            if (req.files.profileImage) {
                const profileImageFile = req.files.profileImage as fileUpload.UploadedFile;
                profileImage = `uploads/${profileImageFile.name}`;
                await profileImageFile.mv(path.join(uploadsDir, profileImageFile.name));
            }
            if (req.files.headerImage) {
                const headerImageFile = req.files.headerImage as fileUpload.UploadedFile;
                headerImage = `uploads/${headerImageFile.name}`;
                await headerImageFile.mv(path.join(uploadsDir, headerImageFile.name));
            }
        }

        const newBoard = await createBoard(userId, name, description, profileImage, headerImage);
        return res.status(201).json(newBoard);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create board' });
    }
});

router.get('/boards', authHandler, async (req: Request, res: Response) => {
    try {
        const boards = await getBoards();
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

export default router;