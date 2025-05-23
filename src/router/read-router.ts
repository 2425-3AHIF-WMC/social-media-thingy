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
    const op  = direction === 'next' ? '>'  : '<';
    const ord = direction === 'next' ? 'ASC': 'DESC';
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

router.get('/chapter/:id', async (req, res) => {
    await init();
    const postId = Number(req.params.id);

    const post = await db.get<any>(
        `SELECT id, title, createdAt, project_id
       FROM Posts
      WHERE id = ? AND type = 'chapter'`,
        [postId]
    );
    if (!post) return res.status(404).send('Chapter not found');

    const chapter = await db.get<any>(
        `SELECT source_path, file_type
       FROM Chapters
      WHERE post_id = ?`,
        [postId]
    );
    if (!chapter) return res.status(404).send('Chapter metadata missing');

    const absPath = path.resolve(__dirname, '..', chapter.source_path);

    let html = '';
    try {
        if (chapter.file_type === 'txt') {
            const txt = await fs.promises.readFile(absPath, 'utf8');
            html = txt
                .split('\n\n')
                .map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`)
                .join('');
        } else if (chapter.file_type === 'docx') {
            const result = await mammoth.convertToHtml({ path: absPath });
            html = result.value;
        }
    } catch (err) {
        console.error('Error converting chapter file:', err);
        return res.status(500).send('Failed to load chapter content');
    }

    const projectId = post.project_id;
    const prev = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? await getAdjacentPost(projectId, post.createdAt, 'next')
        : null;

    res.render('chapter', {
        post,
        html,
        prev,
        next
    });
});

router.get('/comic/:id', async (req, res) => {
    await init();
    const postId = +req.params.id;

    const post = await db.get<any>(
        `SELECT * FROM Posts WHERE id = ? AND type = 'comic'`,
        [postId]
    );
    if (!post) return res.status(404).send('Post nicht gefunden');

    const chapter = await db.get<any>(
        `SELECT id, project_id, created_at
       FROM Chapters
      WHERE post_id = ?`,
        [postId]
    );
    if (!chapter) return res.status(404).send('Comic-Kapitel nicht gefunden');

    const pages = await db.all<any>(
        `SELECT page_number, image_path
       FROM ComicPages
      WHERE chapter_id = ?
      ORDER BY page_number`,
        [chapter.id]
    );

    const prev = chapter.project_id
        ? await getAdjacentPost(chapter.project_id, chapter.created_at, 'prev')
        : null;
    const next = chapter.project_id
        ? await getAdjacentPost(chapter.project_id, chapter.created_at, 'next')
        : null;

    res.render('comic', {
        post,
        pages,
        prev,
        next
    });
});


export default router;
