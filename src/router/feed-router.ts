import { Router, Request, Response } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { getUserID, giveUserInformation } from '../usersDatabase';
import { getUserBoard, getPostsByBoard } from '../boardsDatabase';

const feedRouter = Router();

feedRouter.get('/feed', authHandler, async (req: Request, res: Response) => {
    try {
        // 1) Who’s logged in?
        const username = req.session.user as string;
        const userId   = await getUserID(username);
        const user     = await giveUserInformation(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';

        // 2) Which boards has the user joined?
        //    getUserBoard returns an array of { id, name, … }
        const subscribedBoards = await getUserBoard(userId);

        // 3) Gather every post from each board
        const allPostsNested = await Promise.all(
            subscribedBoards.map(board =>
                getPostsByBoard(board.id)
                    .then(raw =>
                        raw.map(p => ({
                            ...p,
                            hashtags: p.hashtags ? p.hashtags.split(',') : [],
                            boardName: board.name
                        }))
                    )
            )
        );
        // 4) Flatten into a single array
        const feedItems = allPostsNested.flat();

        // 5) Sort by creation date (newest first)
        feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 6) Render the feed.ejs template
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
