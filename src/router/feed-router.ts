// src/routes/feed-router.ts

import { Router, Request, Response } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { getUserID, giveUserInformation } from '../usersDatabase';

// Vorher: getUserBoard holte nur Owner-Boards. Jetzt haben wir zusätzlich getMemberBoards.
import {
    getUserBoard,      // liefert Boards, bei denen du owner bist
    getMemberBoards,   // liefert Boards, bei denen du member bist
    getPostsByBoard
} from '../boardsDatabase';

const feedRouter = Router();

feedRouter.get('/feed', authHandler, async (req: Request, res: Response) => {
    try {
        // 1) Welcher User ist eingeloggt?
        const username   = req.session.user as string;
        const userId     = await getUserID(username);
        const user       = await giveUserInformation(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';

        // 2) Hol alle Boards, die der User besitzt (Owner)
        const ownedBoards = await getUserBoard(userId);

        // 3) Hol zusätzlich alle Boards, in denen der User Mitglied ist
        const memberBoards = await getMemberBoards(userId);

        // 4) Beide Listen zusammenführen und Duplikate entfernen (nach board.id)
        const allBoardsMap: Record<number, { id: number; name: string }> = {};
        for (const b of ownedBoards) {
            allBoardsMap[b.id] = b;
        }
        for (const b of memberBoards) {
            allBoardsMap[b.id] = b;
        }
        // Jetzt sind in allBoards nur eindeutige Boards
        const allBoards = Object.values(allBoardsMap);

        // 5) Für jedes dieser Boards alle Posts holen
        const allPostsNested = await Promise.all(
            allBoards.map(board =>
                getPostsByBoard(board.id).then(rawPosts =>
                    rawPosts.map(p => ({
                        ...p,
                        // Falls in getPostsByBoard das Feld "hashtags" noch ein CSV‐String ist:
                        hashtags: p.hashtags ? p.hashtags.split(',') : [],
                        boardName: board.name,
                        boardId: board.id,
                    }))
                )
            )
        );

        // 6) Flatten in ein einzelnes Array
        let feedItems = allPostsNested.flat();

        // 7) Nach Erstellzeit sortieren (absteigend, neueste oben)
        feedItems.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // 8) Rendern
        res.render('feed', {
            user,
            userAvatar,
            feedItems
        });
    } catch (err) {
        console.error('Error rendering feed:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default feedRouter;
