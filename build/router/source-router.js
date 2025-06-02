"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const sourceDatabase_1 = require("../sourceDatabase");
const auth_handler_1 = require("../middleware/auth-handler");
const database_1 = require("../database");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: path_1.default.resolve(__dirname, '../uploads') });
router.get('/project/:projectId/characters', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const pid = Number(req.params.projectId);
    const chars = yield database_1.db.all(`
    SELECT c.*, GROUP_CONCAT(ci.image_path) AS images
      FROM Characters c
 LEFT JOIN CharacterImages ci ON ci.character_id = c.id
     WHERE c.project_id = ?
  GROUP BY c.id
  `, [pid]);
    res.json(chars);
}));
router.post('/project/:projectId/characters', upload.array('images', 5), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const pid = Number(req.params.projectId);
    const { id, name, description, spoiler } = req.body;
    let charId;
    if (id) {
        yield database_1.db.run(`UPDATE Characters 
            SET name=?, description=?, spoiler=?
          WHERE id=?`, [name, description, spoiler, Number(id)]);
        charId = Number(id);
    }
    else {
        const result = yield database_1.db.run(`INSERT INTO Characters (project_id,name,description,spoiler)
         VALUES (?,?,?,?)`, [pid, name, description, spoiler]);
        charId = result.lastID;
    }
    for (const file of req.files) {
        const rel = path_1.default.join('uploads', path_1.default.basename(file.path));
        yield database_1.db.run(`INSERT INTO CharacterImages (character_id, image_path, caption)
         VALUES (?,?,?)`, [charId, rel, file.originalname]);
    }
    res.json({ success: true, id: charId });
}));
router.get('/project/:id/source', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const chars = yield (0, sourceDatabase_1.getCharacterDescriptions)(pid);
    const credits = yield (0, sourceDatabase_1.getProjectCredits)(pid);
    res.json({ characterDescriptions: chars, credits });
}));
router.post('/project/:id/source/character', auth_handler_1.authHandler, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const { name, description, spoiler } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    const entry = yield (0, sourceDatabase_1.createCharacterDescription)(pid, name, imagePath, description, spoiler);
    res.status(201).json(entry);
}));
router.post('/project/:id/source/credit', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const { label, url } = req.body;
    const entry = yield (0, sourceDatabase_1.createProjectCredit)(pid, label, url || null);
    res.status(201).json(entry);
}));
exports.default = router;
