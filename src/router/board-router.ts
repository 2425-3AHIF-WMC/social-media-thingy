import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
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
        // Use absolute path
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');

        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.files) {
            if (req.files.profileImage) {
                const profileImageFile = req.files.profileImage as fileUpload.UploadedFile;
                const extension = path.extname(profileImageFile.name);
                const profileImageUUID = uuidv4() + extension;
                const profileImagePath = path.join(uploadsDir, profileImageUUID);

                await profileImageFile.mv(profileImagePath);

                // Option 1: Store original name inside the image path
                profileImage = `uploads/${profileImageUUID}#${profileImageFile.name}`;
            }

            if (req.files.headerImage) {
                const headerImageFile = req.files.headerImage as fileUpload.UploadedFile;
                const extension = path.extname(headerImageFile.name);
                const headerImageUUID = uuidv4() + extension;
                const headerImagePath = path.join(uploadsDir, headerImageUUID);

                await headerImageFile.mv(headerImagePath);

                // Option 1: Store original name inside the image path
                headerImage = `uploads/${headerImageUUID}#${headerImageFile.name}`;

                // Option 2: Store original name in a log file
                fs.appendFileSync(path.join(uploadsDir, 'image-metadata.log'),
                    `${headerImageUUID} -> ${headerImageFile.name}\n`);
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

export default router;
