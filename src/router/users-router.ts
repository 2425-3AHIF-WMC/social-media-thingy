import { Router, Request, Response } from 'express';
import { getUserID, updateUserFieldInDB,updateUserProfileImage, updateProfileHeaderImage, db } from "../database";
import {authHandler} from "../middleware/auth-handler";
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const usersDir = path.resolve(__dirname, '..', 'users');

if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
}

router.post("/update-user", async (req, res) => {
    try {
        let { field, value } = req.body;
        const userId = await getUserID(req.session.user);

        if (!userId) {
            console.error("Unauthorized request: No user ID found.");
            return res.status(401).json({ error: "Unauthorized" });
        }

        const fieldMapping: Record<string, string> = {
            "fetchBio": "bio",
            "fetchPronouns": "pronouns",
            "fetchLinks": "links",
            "fetchBadges": "badges"
        };

        if (!(field in fieldMapping)) {
            console.error("Invalid field update attempt:", field);
            return res.status(400).json({ error: "Invalid field name" });
        }

        field = fieldMapping[field];
        const success = await updateUserFieldInDB(userId, field, value);

        if (!success) {
            console.error("Failed to update database.");
            return res.status(500).json({ error: "Failed to update user field in database" });
        }

        res.status(200).json({ success: true, message: "User profile updated in DB" });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
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

        if (req.files) {
            console.log("Uploaded Files:", req.files);

            const files = Object.fromEntries(
                Object.entries(req.files).map(([key, value]) => [key.trim(), value])
            );

            if (files.avatar) {
                console.log("Avatar Image Found:", files.avatar);
                const avatarImageFile = files.avatar as fileUpload.UploadedFile;
                const avatarImageUUID = uuidv4() + path.extname(avatarImageFile.name);
                const avatarImagePath = path.join(profileUploads, avatarImageUUID);

                await avatarImageFile.mv(avatarImagePath);
                const avatarImage = `profile_images/${avatarImageUUID}`;

                const success = await updateUserProfileImage(userId, avatarImage);

                if (!success) {
                    return res.status(500).json({ error: "Failed to update avatar" });
                }
                return res.status(200).json({ success: true, message: "Avatar updated" });
            }
        }

        return res.status(400).json({ error: "No avatar image provided" });
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

        if (req.files) {
            console.log("Uploaded Files:", req.files);

            const files = Object.fromEntries(
                Object.entries(req.files).map(([key, value]) => [key.trim(), value])
            );

            if (files.header) {
                console.log("Header Image Found:", files.header);
                const headerImageFile = files.header as fileUpload.UploadedFile;
                const headerImageUUID = uuidv4() + path.extname(headerImageFile.name);
                const headerImagePath = path.join(headerUploads, headerImageUUID);

                await headerImageFile.mv(headerImagePath);
                const headerImage = `profile_images/${headerImageUUID}`;

                const success = await updateProfileHeaderImage(userId, headerImage);

                if (!success) {
                    return res.status(500).json({ error: "Failed to update header" });
                }
                return res.status(200).json({ success: true, message: "Header updated" });
            }
        }

        return res.status(400).json({ error: "No header image provided" });
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