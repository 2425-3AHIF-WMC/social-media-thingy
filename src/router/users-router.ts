import { Router, Request, Response } from 'express';
import { getUserID, updateUserFieldInDB,updateUserProfileImage, updateProfileHeaderImage} from "../usersDatabase";
import {authHandler} from "../middleware/auth-handler";
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {db} from "../database";

const router = Router();
const usersDir = path.resolve(__dirname, '..', 'users');

if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
}

// If you already have something like this, just adjust it:
router.post('/update-user', authHandler, async (req: Request, res: Response) => {
    try {
        // 1) Identify the user making the request (via session)
        const username = req.session.user;
        if (!username) {
            return res.status(400).json({ message: 'No user in session' });
        }

        const userId = await getUserID(username);

        // 2) Extract the fields from the request body
        // e.g. { bio, pronouns, links }
        // but you can add or remove fields as needed
        const { bio, pronouns, links, badges } = req.body;

        // 3) For each field that is defined, call your existing update function
        if (bio !== undefined) {
            await updateUserFieldInDB(userId, "bio", bio);
        }
        if (pronouns !== undefined) {
            await updateUserFieldInDB(userId, "pronouns", pronouns);
        }
        if (links !== undefined) {
            await updateUserFieldInDB(userId, "links", links);
        }
        if (badges !== undefined) {
            await updateUserFieldInDB(userId, "badges", badges);
        }

        // 4) Respond with success
        return res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get("/get-user-data", async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await db.get("SELECT username, bio, pronouns, links, badges, profile_image, header_image FROM users WHERE id = ?", [userId]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/update-user-avatar", authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const profileUploads = path.resolve(__dirname, '..', 'profile_images');
        if (!fs.existsSync(profileUploads)) {
            fs.mkdirSync(profileUploads, { recursive: true });
        }

        if (!req.files || !req.files.avatar) {
            return res.status(400).json({ error: "No avatar image provided" });
        }

        const avatarImageFile = req.files.avatar as fileUpload.UploadedFile;
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

        if (!allowedMimeTypes.includes(avatarImageFile.mimetype)) {
            return res.status(400).json({ error: "Invalid file type. Only JPG, PNG, and GIF are allowed." });
        }

        const avatarImageUUID = uuidv4() + path.extname(avatarImageFile.name);
        const avatarImagePath = path.join(profileUploads, avatarImageUUID);

        await avatarImageFile.mv(avatarImagePath);
        const avatarImage = `profile_images/${avatarImageUUID}`;

        const success = await updateUserProfileImage(userId, avatarImage);
        if (!success) {
            return res.status(500).json({ error: "Failed to update avatar" });
        }

        return res.status(200).json({ success: true, message: "Avatar updated", profile_image: avatarImage });
    } catch (error) {
        console.error("Error saving avatar image:", error);
        return res.status(500).json({ error: "Failed to update avatar" });
    }
});


router.post("/update-user-header", authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const headerUploads = path.resolve(__dirname, '..', 'profile_images');
        if (!fs.existsSync(headerUploads)) {
            fs.mkdirSync(headerUploads, { recursive: true });
        }

        if (!req.files || !req.files.header) {
            return res.status(400).json({ error: "No header image provided" });
        }

        const headerImageFile = req.files.header as fileUpload.UploadedFile;
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

        if (!allowedMimeTypes.includes(headerImageFile.mimetype)) {
            return res.status(400).json({ error: "Invalid file type. Only JPG, PNG, and GIF are allowed." });
        }

        const headerImageUUID = uuidv4() + path.extname(headerImageFile.name);
        const headerImagePath = path.join(headerUploads, headerImageUUID);

        await headerImageFile.mv(headerImagePath);
        const headerImage = `profile_images/${headerImageUUID}`;

        const success = await updateProfileHeaderImage(userId, headerImage);
        if (!success) {
            return res.status(500).json({ error: "Failed to update header" });
        }

        return res.status(200).json({ success: true, message: "Header updated", header_image: headerImage });
    } catch (error) {
        console.error("Error saving header image:", error);
        return res.status(500).json({ error: "Failed to update header" });
    }
});


router.get("/get-user-avatar", authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await db.get("SELECT profile_image FROM users WHERE id = ?", [userId]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user avatar:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/get-user-header", authHandler, async (req, res) => {
    try {
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await db.get("SELECT header_image FROM users WHERE id = ?", [userId]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user header:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;