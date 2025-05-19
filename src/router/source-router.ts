import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import {
    getCharacterDescriptions,
    createCharacterDescription,
    getProjectCredits,
    createProjectCredit
} from '../sourceDatabase';
import { authHandler } from '../middleware/auth-handler';

const router = Router();
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.resolve(__dirname,'..','uploads')),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
});

// GET source data for a project
router.get('/project/:id/source', authHandler, async (req, res) => {
    const pid = +req.params.id;
    const chars = await getCharacterDescriptions(pid);
    const credits = await getProjectCredits(pid);
    res.json({ characterDescriptions: chars, credits });
});

// POST CharacterDescription (with optional image)
router.post(
    '/project/:id/source/character',
    authHandler,
    upload.single('image'),
    async (req: Request, res: Response) => {
        const pid = +req.params.id;
        const { name, description, spoiler } = req.body;
        const imagePath = req.file ? `uploads/${req.file.filename}` : null;
        const entry = await createCharacterDescription(pid, name, imagePath, description, spoiler);
        res.status(201).json(entry);
    }
);

// POST Credit
router.post(
    '/project/:id/source/credit',
    authHandler,
    async (req: Request, res: Response) => {
        const pid = +req.params.id;
        const { label, url } = req.body;
        const entry = await createProjectCredit(pid, label, url || null);
        res.status(201).json(entry);
    }
);

export default router;