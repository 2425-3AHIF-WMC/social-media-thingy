import { Router, Request, Response } from 'express';
import { db, init } from '../database';
import { getUserID, getUserById } from '../usersDatabase';

const router = Router();

router.get('/discovery', async (req: Request, res: Response) => {
    try {
        await init();

        let user = null;
        if (req.session && req.session.user) {
            const username = req.session.user as string;
            const userId   = await getUserID(username);
            user           = await getUserById(userId);
        }

        const { search } = req.query;
        const lowerSearch = typeof search === 'string' ? search.toLowerCase() : null;

        const rows: Array<{
            id: number;
            name: string;
            description: string;
            profile_image: string;
            header_image: string;
            board_type_id: number;
            type_name: string;
            hashtag_list: string | null;
        }> = await db.all(`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.profile_image,
        b.header_image,
        b.board_type_id,
        bt.type_name,
        GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY bt.id, b.name
    `);

        let filtered = rows;
        if (lowerSearch) {
            filtered = rows.filter((board) => {
                const nameMatch = board.name.toLowerCase().includes(lowerSearch);
                const descMatch = board.description.toLowerCase().includes(lowerSearch);
                const hashtags  = board.hashtag_list ? board.hashtag_list.toLowerCase() : '';
                const hashMatch = hashtags.includes(lowerSearch);
                return nameMatch || descMatch || hashMatch;
            });
        }

        // 5) Gefilterte Boards nach Typ aufteilen
        const artBoards: typeof filtered = [];
        const writingBoards: typeof filtered = [];
        const comicBoards: typeof filtered = [];
        const allBoards: typeof filtered = [];

        filtered.forEach((board) => {
            const t = board.type_name.toLowerCase();
            if (t === 'art') {
                artBoards.push(board);
            } else if (t === 'writing') {
                writingBoards.push(board);
            } else if (t === 'comic') {
                comicBoards.push(board);
            } else if (t === 'all') {
                allBoards.push(board);
            }
        });

        interface AllGroup {
            hashtag: string;
            boards: typeof filtered;
        }
        const allGroupsMap: Record<string, AllGroup> = {};

        allBoards.forEach((board) => {
            if (board.hashtag_list) {
                const tags = board.hashtag_list
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t.length > 0);

                tags.forEach((tag) => {
                    if (!allGroupsMap[tag]) {
                        allGroupsMap[tag] = { hashtag: tag, boards: [] };
                    }
                    allGroupsMap[tag].boards.push(board);
                });
            } else {

                const tag = '_uncategorized';
                if (!allGroupsMap[tag]) {
                    allGroupsMap[tag] = { hashtag: 'Uncategorized', boards: [] };
                }
                allGroupsMap[tag].boards.push(board);
            }
        });

        const allGroups: AllGroup[] = Object.values(allGroupsMap).sort((a, b) => {
            if (a.hashtag === 'Uncategorized') return 1;
            if (b.hashtag === 'Uncategorized') return -1;
            return a.hashtag.localeCompare(b.hashtag);
        });

        res.render('discovery', {
            user,
            artBoards,
            writingBoards,
            comicBoards,
            allGroups,
            currentSearch: typeof search === 'string' ? search : ''
        });
    } catch (err) {
        console.error('Error rendering discovery:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
