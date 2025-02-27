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
    body('description').notEmpty().withMessage('Description is required'),
    body('visibility').notEmpty().withMessage('Visibility is required').isIn(['public', 'private']).withMessage('Visibility must be either public or private')
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, visibility } = req.body;
    let hashtags = req.body.hashtags ? req.body.hashtags.trim() : "";
    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = await getUserID(req.session.user);

    try {
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.files) {
            const files = Object.fromEntries(
                Object.entries(req.files).map(([key, value]) => [key.trim(), value])
            );

            if (files.profileImage) {
                const profileImageFile = files.profileImage as fileUpload.UploadedFile;
                const profileImageUUID = uuidv4() + path.extname(profileImageFile.name);
                const profileImagePath = path.join(uploadsDir, profileImageUUID);

                await profileImageFile.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }

            if (files.headerImage) {
                const headerImageFile = files.headerImage as fileUpload.UploadedFile;
                const headerImageUUID = uuidv4() + path.extname(headerImageFile.name);
                const headerImagePath = path.join(uploadsDir, headerImageUUID);

                await headerImageFile.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }

        // Ensure hashtags are stored as a space-separated string
        if (Array.isArray(hashtags)) {
            hashtags = [...new Set(hashtags)].join(" ");
        }

        console.log("Saving board with hashtags:", hashtags); // ✅ Debugging log

        const newBoard = await createBoard(userId, name, description, profileImage, headerImage, visibility, hashtags);
        return res.status(201).json(newBoard);
    } catch (error) {
        console.error("Error saving board:", error);
        return res.status(500).json({ error: 'Failed to create board' });
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
                (board.hashtags && board.hashtags.toLowerCase().includes(searchTerm))
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
        const boards = await getBoard(userId);
        return res.json(boards);
    } catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
});

export default router;