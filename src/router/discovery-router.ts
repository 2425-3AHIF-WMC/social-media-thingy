// src/routes/discovery-router.ts
import { Router, Request, Response } from 'express';
import { db, init } from '../database';
import { getUserID, getUserById } from '../usersDatabase';

interface Row {
    id: number;
    name: string;
    description: string;
    profile_image: string;
    header_image: string;
    board_type_id: number;
    type_name: string;
    hashtag_list: string | null;
}

const router = Router();

// 1) Discovery-Übersicht
router.get('/discovery', async (req, res) => {
    try {
        await init();
        let user = null;
        if (req.session?.user) {
            const uid = await getUserID(req.session.user as string);
            user      = await getUserById(uid);
        }

        // Alle Boards laden und nach Typ aufteilen
        const rows: Row[] = await db.all(`
      SELECT b.id, b.name, b.description, b.profile_image, b.header_image,
             b.board_type_id, bt.type_name, GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY bt.id, b.name
    `);

        // Filter nach Suchbegriff
        const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : null;
        const filtered = search
            ? rows.filter(b =>
                b.name.toLowerCase().includes(search) ||
                b.description.toLowerCase().includes(search) ||
                (b.hashtag_list?.toLowerCase() ?? '').includes(search)
            )
            : rows;

        // Aufteilen
        const artBoards     = filtered.filter(b => b.type_name.toLowerCase() === 'art');
        const writingBoards = filtered.filter(b => b.type_name.toLowerCase() === 'writing');
        const comicBoards   = filtered.filter(b => b.type_name.toLowerCase() === 'comic');
        const allBoards     = filtered.filter(b =>
            !['art','writing','comic'].includes(b.type_name.toLowerCase())
        );

        res.render('discovery', {
            user,
            currentSearch: typeof req.query.search === 'string' ? req.query.search : '',
            artBoards,
            writingBoards,
            comicBoards,
            allBoards
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// 2) Kategorie-Seite (Art, Writing, Comic oder “all” mit Hashtag-Filter)
router.get('/discovery/category/:key', async (req, res) => {
    try {
        await init();
        let user = null;
        if (req.session?.user) {
            const uid = await getUserID(req.session.user as string);
            user      = await getUserById(uid);
        }

        const key = req.params.key; // z.B. 'art', 'writing', 'comic' oder 'all-foo'

        // gleiche Basis-Query
        const rows: Row[] = await db.all(`
      SELECT b.id, b.name, b.description, b.profile_image, b.header_image,
             b.board_type_id, bt.type_name, GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY b.name
    `);

        let boards: Row[];

        if (['art','writing','comic'].includes(key)) {
            boards = rows.filter(r => r.type_name.toLowerCase() === key);
        } else if (key.startsWith('all-')) {
            // all-<slug>, slug => hashtag
            const tag = key.slice(4).replace(/-/g, ' ');
            boards = rows.filter(r =>
                (r.hashtag_list ?? '').toLowerCase().split(',').map(s=>s.trim())
                    .includes(tag.toLowerCase())
            );
        } else {
            // sonst alle “uncategorized”
            boards = rows.filter(r => !r.hashtag_list);
        }

        const title = ['art','writing','comic'].includes(key)
            ? key.charAt(0).toUpperCase() + key.slice(1)
            : key.startsWith('all-')
                ? tagCase(key.slice(4))
                : 'Others';

        res.render('discovery-category', { user, title, boards });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

function tagCase(slug: string) {
    return slug.split('-').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
}

export default router;
