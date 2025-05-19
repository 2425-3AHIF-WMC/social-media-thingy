// routes/read-router.ts
import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import { db, init } from '../database';

const router = Router();

async function getAdjacentPost(
    projectId: number,
    createdAt: string,
    direction: 'prev' | 'next'
): Promise<{ id: number; type: string } | null> {
    const op   = direction === 'next' ? '>'  : '<';
    const ord  = direction === 'next' ? 'ASC': 'DESC';
    const row = await db.get<any>(
        `SELECT id, type
     FROM Posts
     WHERE project_id = ?
       AND datetime(createdAt) ${op} datetime(?)
     ORDER BY datetime(createdAt) ${ord}
     LIMIT 1`,
        [projectId, createdAt]
    );
    return row || null;
}

// GET /chapter/:id
router.get('/chapter/:id', async (req, res) => {
    await init();
    const postId = parseInt(req.params.id, 10);
    const post = await db.get<any>(
        `SELECT * FROM Posts WHERE id = ? AND type = 'chapter'`,
        [postId]
    );
    if (!post) return res.status(404).send('Chapter not found');

    let html: string | null = null;
    const fp = post.file_path;
    const fmt = post.file_format;

    try {
        if (fmt === 'txt') {
            const txt = await fs.promises.readFile(fp, 'utf8');
            html = txt
                .split('\n\n')
                .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                .join('');
        } else if (fmt === 'docx') {
            const result = await mammoth.convertToHtml({ path: fp });
            html = result.value;
        }
        // if pdf, we'll let the EJS template handle PDF.js
    } catch (e) {
        console.error('Error converting chapter file:', e);
        return res.status(500).send('Failed to load chapter');
    }

    const projectId = post.project_id;
    const prev = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'next')
        : null;

    res.render('chapter', { post, html, prev, next });
});

router.get('/comic/:id', async (req, res) => {
    await init();
    const postId = +req.params.id;
    const post   = await db.get<any>(`SELECT * FROM Posts WHERE id = ? AND type = 'comic'`, [postId]);
    if (!post) return res.status(404).send('Not found');

    const pages = await db.all<any>(
        `SELECT page_number, image_path 
     FROM ComicPages 
     WHERE post_id = ? 
     ORDER BY page_number`, [postId]
    );

    const projectId = post.project_id;
    const prev = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'next')
        : null;

    res.render('comic', { post, pages, prev, next });
});
export default router;
