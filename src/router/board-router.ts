import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createBoard, getBoards, getUserID, getUserBoard, getBoardById } from '../database';

const router = Router();
router.use(fileUpload());

router.post('/create', authHandler, [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('visibility').notEmpty().withMessage('Visibility is required').isIn(['public', 'private']).withMessage('Visibility must be either public or private')
], async (req: Request, res: Response) => {
    console.log("Received request to create board:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { name, description, visibility, hashtags } = req.body;

    // Ensure hashtags are parsed correctly
    try {
        if (typeof hashtags === "string") {
            hashtags = JSON.parse(hashtags);
        }
        if (!Array.isArray(hashtags)) {
            hashtags = [];
        }
        hashtags = hashtags.slice(0, 5); // Ensure max of 5
    } catch (error) {
        console.error("❌ Error parsing hashtags:", error);
        hashtags = [];
    }

    console.log("✅ Processed Hashtags:", hashtags);

    let profileImage = 'default_profile.png';
    let headerImage = 'default_header.png';
    const userId = await getUserID(req.session.user);

    try {
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.files) {
            const files = req.files as { [key: string]: fileUpload.UploadedFile };

            if (files.profileImage) {
                const profileImageUUID = uuidv4() + path.extname(files.profileImage.name);
                const profileImagePath = path.join(uploadsDir, profileImageUUID);
                await files.profileImage.mv(profileImagePath);
                profileImage = `uploads/${profileImageUUID}`;
            }

            if (files.headerImage) {
                const headerImageUUID = uuidv4() + path.extname(files.headerImage.name);
                const headerImagePath = path.join(uploadsDir, headerImageUUID);
                await files.headerImage.mv(headerImagePath);
                headerImage = `uploads/${headerImageUUID}`;
            }
        }

        console.log("Saving board with hashtags:", hashtags);
        const newBoard = await createBoard(userId, name, description, profileImage, headerImage, visibility, hashtags.join(" "));
        return res.status(201).json(newBoard);

    } catch (error) {
        console.error("Error saving board:", error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
});

router.get('/board/:id', authHandler, async (req: Request, res: Response) => {
    const boardId = parseInt(req.params.id);
    try{
        const board = await getBoardById(boardId);

        if (!board){
            return res.status(404).json({ error: 'Board not found' });
        }
        res.render('board', { board });

    }catch (error){
        console.error("Error fetching board:", error);
        res.status(500).json({ error: 'Internal server error' });
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
        const boards = await getUserBoard(userId);
        return res.json(boards);
    } catch (error) {
        console.error("Error fetching user boards:", error);
        return res.status(500).json({ error: 'Failed to fetch user boards' });
    }
});

export default router;