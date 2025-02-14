import path from "path";
import fs from "fs";
import express from "express";
import {getUserID} from "../database";
import {updateUserFieldInDB} from "../database";
import {db} from "../database";

const router = express.Router();
const usersDir = path.resolve(__dirname, '..', 'users');

if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
}

router.post("/update-user", async (req, res) => {
    console.log("Received request to update-user"); // Debugging

    try {
        let { field, value } = req.body;
        console.log("Request body:", { field, value }); // Debugging

        const userId = await getUserID(req.session.user);
        console.log("User ID:", userId); // Debugging

        if (!userId) {
            console.error("Unauthorized request: No user ID found.");
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Map frontend field names to actual database column names
        const fieldMapping: Record<string, string> = {
            "fetchBio": "bio",
            "fetchPronouns": "pronouns",
            "fetchLinks": "links",
            "fetchBadges": "badges"
        };

        // Ensure the field exists in the mapping
        if (!(field in fieldMapping)) {
            console.error("Invalid field update attempt:", field);
            return res.status(400).json({ error: "Invalid field name" });
        }

        // Convert the field name
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

//Add 1: Click to edit should be shown even after the user once has written something in the field. It should be shown until the user writes something inside.
//Add 2: Make the fields see-through when the user is not editing them. Let the fields only have a little outline
//Add 3: Add Margin between fields
//Add 4: Board Type when adding board

export default router;
