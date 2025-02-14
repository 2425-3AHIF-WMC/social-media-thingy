import path from "path";
import fs from "fs";
import { Router, Request, Response } from 'express';
import { getUserID, updateUserFieldInDB, db } from "../database";

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

        const user = await db.get("SELECT username, bio, pronouns, links, badges FROM users WHERE id = ?", [userId]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;