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
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => cb(null, path_1.default.resolve(__dirname, '..', 'uploads')),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
});
// GET source data for a project
router.get('/project/:id/source', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const chars = yield (0, sourceDatabase_1.getCharacterDescriptions)(pid);
    const credits = yield (0, sourceDatabase_1.getProjectCredits)(pid);
    res.json({ characterDescriptions: chars, credits });
}));
// POST CharacterDescription (with optional image)
router.post('/project/:id/source/character', auth_handler_1.authHandler, upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const { name, description, spoiler } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    const entry = yield (0, sourceDatabase_1.createCharacterDescription)(pid, name, imagePath, description, spoiler);
    res.status(201).json(entry);
}));
// POST Credit
router.post('/project/:id/source/credit', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pid = +req.params.id;
    const { label, url } = req.body;
    const entry = yield (0, sourceDatabase_1.createProjectCredit)(pid, label, url || null);
    res.status(201).json(entry);
}));
exports.default = router;
