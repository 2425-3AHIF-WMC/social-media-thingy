import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getUserID, updateUserFieldInDB, updateUserProfileImage, updateProfileHeaderImage } from '../usersDatabase';
import { authHandler } from '../middleware/auth-handler';
import { db } from '../database';

const router = Router();
const profileUploads = path.resolve(__dirname, '..', 'profile_images');

if (!fs.existsSync(profileUploads)) {
    fs.mkdirSync(profileUploads, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileUploads);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
        }
    },
});

router.post('/update-user', authHandler, async (req: Request, res: Response) => {
    try {
        const username = req.session.user;
        if (!username) {
            return res.status(400).json({ message: 'No user in session' });
        }

        const userId = await getUserID(username);
        const { bio, pronouns, links, badges } = req.body;

        if (bio !== undefined) await updateUserFieldInDB(userId, 'bio', bio);
        if (pronouns !== undefined) await updateUserFieldInDB(userId, 'pronouns', pronouns);
        if (links !== undefined) await updateUserFieldInDB(userId, 'links', links);
        if (badges !== undefined) await updateUserFieldInDB(userId, 'badges', badges);

        return res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get-user-data', async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await db.get(
            'SELECT username, bio, pronouns, links, badges, profile_image, header_image FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/update-user-avatar', authHandler, upload.single('avatar'), async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No avatar image provided' });
        }

        const avatarImage = `profile_images/${req.file.filename}`;
        const success = await updateUserProfileImage(userId, avatarImage);

        if (!success) {
            return res.status(500).json({ error: 'Failed to update avatar' });
        }

        return res.status(200).json({ success: true, message: 'Avatar updated', profile_image: avatarImage });
    } catch (error) {
        console.error('Error saving avatar image:', error);
        return res.status(500).json({ error: 'Failed to update avatar' });
    }
});

router.post('/update-user-header', authHandler, upload.single('header'), async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No header image provided' });
        }

        const headerImage = `profile_images/${req.file.filename}`;
        const success = await updateProfileHeaderImage(userId, headerImage);

        if (!success) {
            return res.status(500).json({ error: 'Failed to update header' });
        }

        return res.status(200).json({ success: true, message: 'Header updated', header_image: headerImage });
    } catch (error) {
        console.error('Error saving header image:', error);
        return res.status(500).json({ error: 'Failed to update header' });
    }
});

router.get('/get-user-avatar', authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await db.get('SELECT profile_image FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user avatar:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/get-user-header', authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await db.get('SELECT header_image FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user header:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;