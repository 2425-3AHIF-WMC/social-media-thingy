import { Router, Request, Response } from 'express';
import { authHandler } from "../middleware/auth-handler";
import { body, validationResult } from 'express-validator';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { createBoard, getBoards } from '../database';

const router = Router();

router.use(fileUpload());


// forgot to add the userId to the board
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

    if (req.files) {
        if (req.files.profileImage) {
            const profileImageFile = req.files.profileImage as fileUpload.UploadedFile;
            profileImage = `uploads/${profileImageFile.name}`;
            profileImageFile.mv(path.join(__dirname, '..', profileImage), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to upload profile image' });
                }
            });
        }
        if (req.files.headerImage) {
            const headerImageFile = req.files.headerImage as fileUpload.UploadedFile;
            headerImage = `uploads/${headerImageFile.name}`;
            headerImageFile.mv(path.join(__dirname, '..', headerImage), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to upload header image' });
                }
            });
        }
    }

    //change the code later below so an overload cant happen when uplaoding stuff
    try {
        const newBoard = await createBoard(name, description, profileImage, headerImage);
        res.status(201).json(newBoard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create board' });
    }
});


//change later - this is a test to see if the boards are being fetched
router.get('/boards', authHandler, async (req: Request, res: Response) => {
    try {
        const boards = await getBoards();
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

export default router;