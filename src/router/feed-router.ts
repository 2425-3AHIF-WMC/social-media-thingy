import { Router, Request, Response } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { getUserID, giveUserInformation } from '../usersDatabase';

import {
    getUserBoard,
    getMemberBoards,
    getPostsByBoard
} from '../boardsDatabase';

const feedRouter = Router();

feedRouter.get('/feed', authHandler, async (req: Request, res: Response) => {
    try {

        const username   = req.session.user as string;
        const userId     = await getUserID(username);
        const user       = await giveUserInformation(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';


        const ownedBoards = await getUserBoard(userId);


        const memberBoards = await getMemberBoards(userId);

        const allBoardsMap: Record<number, { id: number; name: string }> = {};
        for (const b of ownedBoards) {
            allBoardsMap[b.id] = b;
        }
        for (const b of memberBoards) {
            allBoardsMap[b.id] = b;
        }

        const allBoards = Object.values(allBoardsMap);


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

        let feedItems = allPostsNested.flat();

        feedItems.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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
