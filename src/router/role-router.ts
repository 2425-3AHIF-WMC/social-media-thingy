import { Router } from 'express';
import {getUserRole, giveModerator, removeModerator} from '../database';


const router = Router();

router.post('/admin/give-moderator', async (req, res) => {
    const { username } = req.body;
    try {
        await giveModerator(username);
        res.redirect('/admin');
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send('An unknown error occurred');
        }
    }
});

router.post('/admin/remove-moderator', async (req, res) => {
    const { username } = req.body;
    try {
        await removeModerator(username);
        res.redirect('/admin');
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send('An unknown error occurred');
        }
    }
});

router.post('/user-roles', async (req, res) => {
    const {username} = req.body;
    try{
        const users = await getUserRole(username);
        res.json({users, count: users.length});
    }
    catch (error){
        res.status(500).send('Server Error');
    }
});


export default router;