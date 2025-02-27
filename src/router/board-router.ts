import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createBoard, getBoards, getUserID, getBoard } from '../database';

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
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.files) {
            console.log("Uploaded Files:", req.files);

            // Normalize key names by trimming spaces
            const files = Object.fromEntries(
                Object.entries(req.files).map(([key, value]) => [key.trim(), value])
            );

            if (files.profileImage) {
                console.log("Profile Image Found:", files.profileImage);
                const profileImageFile = files.profileImage as fileUpload.UploadedFile;
                const profileImageUUID = uuidv4() + path.extname(profileImageFile.name);
                const profileImagePath = path.join(uploadsDir, profileImageUUID);

                await profileImageFile.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }

            if (files.headerImage) {
                console.log("Header Image Found:", files.headerImage);
                const headerImageFile = files.headerImage as fileUpload.UploadedFile;
                const headerImageUUID = uuidv4() + path.extname(headerImageFile.name);
                const headerImagePath = path.join(uploadsDir, headerImageUUID);

                await headerImageFile.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }

        const newBoard = await createBoard(userId, name, description, profileImage, headerImage);
        return res.status(201).json(newBoard);
    } catch (error) {
        console.error("Error saving images:", error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
});

router.get('/boards', authHandler, async (req: Request, res: Response) => {
    try {
        const boards = await getBoards();
        return res.json(boards);
    } catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

router.get('/user-boards', authHandler, async (req: Request, res: Response) => {
    try {
        const userId = await getUserID(req.session.user);
        const boards = await getBoard(userId);
        return res.json(boards);
    } catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
});

export default router;
