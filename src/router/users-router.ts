import path from "path";
import fs from "fs";
import express from "express";
import {getUserID} from "../database";

const router = express.Router();
const usersDir = path.resolve(__dirname, '..', 'users');

if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
}

// Route to handle user profile updates
router.post("/update-user", async (req, res) => {
    try {
        const { field, value } = req.body;
        const userId = await getUserID(req.session.user);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userFilePath = path.join(usersDir, `${userId}.json`);
        let userData: Record<string, any> = {}; // Allows dynamic key indexing


        if (fs.existsSync(userFilePath)) {
            userData = JSON.parse(fs.readFileSync(userFilePath, "utf-8"));
        }

        userData[field] = value;
        fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

        res.status(200).json({ success: true, message: "User profile updated" });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
