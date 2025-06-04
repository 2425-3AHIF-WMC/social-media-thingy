import { Router, Request, Response } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { getUserID, giveUserInformation } from '../usersDatabase';

import {
    getUserBoard,
    getMemberBoards,
    getPostsByBoard
} from '../boardsDatabase';

// Import the “like” helpers:
import { getLikesCount, hasLikedPost } from '../postDatabase';

const feedRouter = Router();

feedRouter.get('/feed', authHandler, async (req: Request, res: Response) => {
    try {
        // 1) Identify the current user
        const username   = req.session.user as string;
        const userId     = await getUserID(username);
        const user       = await giveUserInformation(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';

        // 2) Gather all boards this user owns or belongs to
        const ownedBoards   = await getUserBoard(userId);
        const memberBoards  = await getMemberBoards(userId);

        // 3) Build a quick map so we don’t double-count the same board
        const allBoardsMap: Record<number, { id: number; name: string }> = {};
        for (const b of ownedBoards) {
            allBoardsMap[b.id] = b;
        }
        for (const b of memberBoards) {
            allBoardsMap[b.id] = b;
        }
        const allBoards = Object.values(allBoardsMap);

        // 4) Fetch every post from each board, and tag it with boardName & boardId
        const allPostsNested = await Promise.all(
            allBoards.map(board =>
                getPostsByBoard(board.id).then(rawPosts =>
                    rawPosts.map(p => ({
                        ...p,
                        hashtags: p.hashtags ? p.hashtags.split(',') : [],
                        boardName: board.name,
                        boardId: board.id,
                    }))
                )
            )
        );

        // 5) Flatten into a single array
        let feedItems = allPostsNested.flat();

        // 6) Sort by newest
        feedItems.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // 7) Enrich each feedItem with likeCount + likedByCurrentUser
        const enrichedFeedItems = await Promise.all(
            feedItems.map(async (item) => {
                // a) Count how many total likes this post has
                const likeRow = await getLikesCount(item.id);
                const count   = (likeRow && likeRow.count) || 0;

                // b) Check if this userId has already liked this post
                const liked  = await hasLikedPost(item.id, userId);

                return {
                    ...item,
                    likeCount: count,
                    likedByCurrentUser: liked
                };
            })
        );

        // 8) Render “feed.ejs” with the enriched data
        res.render('feed', {
            user,
            userAvatar,
            feedItems: enrichedFeedItems
        });
    } catch (err) {
        console.error('Error rendering feed:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default feedRouter;
