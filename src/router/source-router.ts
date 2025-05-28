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
import {db, init} from "../database";

const router = Router();
const upload = multer({ dest: path.resolve(__dirname,'../uploads') });

router.get('/project/:projectId/characters', async (req, res) => {
    await init();
    const pid = Number(req.params.projectId);
    const chars = await db.all(`
    SELECT c.*, GROUP_CONCAT(ci.image_path) AS images
      FROM Characters c
 LEFT JOIN CharacterImages ci ON ci.character_id = c.id
     WHERE c.project_id = ?
  GROUP BY c.id
  `,[pid]);
    res.json(chars);
});

// --- Create or Update a character ---
router.post(
    '/project/:projectId/characters',
    upload.array('images', 5),
    async (req: Request, res: Response) => {
        await init();
        const pid = Number(req.params.projectId);
        const { id, name, description, spoiler } = req.body;
        let charId: number;

        if (id) {
            // Update existing
            await db.run(
                `UPDATE Characters 
            SET name=?, description=?, spoiler=?
          WHERE id=?`,[name,description,spoiler,Number(id)]
            );
            charId = Number(id);
        } else {
            // New
            const result = await db.run(
                `INSERT INTO Characters (project_id,name,description,spoiler)
         VALUES (?,?,?,?)`,
                [pid,name,description,spoiler]
            );
            charId = result.lastID!;
        }

        // Handle uploaded images
        for (const file of (req.files as Express.Multer.File[])) {
            const rel = path.join('uploads', path.basename(file.path));
            await db.run(
                `INSERT INTO CharacterImages (character_id, image_path, caption)
         VALUES (?,?,?)`,
                [charId, rel, file.originalname]
            );
        }

        res.json({ success:true, id: charId });
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