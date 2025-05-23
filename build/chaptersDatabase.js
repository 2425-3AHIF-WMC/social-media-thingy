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
exports.insertComicPage = insertComicPage;
exports.createChapterFile = createChapterFile;
const database_1 = require("./database");
const path_1 = __importDefault(require("path"));
function insertComicPage(chapterId, pageNumber, imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run(`INSERT INTO ComicPages
       (chapter_id, page_number, image_path)
     VALUES (?, ?, ?)`, [chapterId, pageNumber, imagePath]);
    });
}
function createChapterFile(postId, sourceDiskPath, fileFormat, projectId, title) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const filename = path_1.default.basename(sourceDiskPath);
        const relativePath = path_1.default.join('uploads', filename);
        const result = yield database_1.db.run(`INSERT INTO Chapters 
       (post_id, project_id, title, file_type, source_path)
     VALUES (?, ?, ?, ?, ?)`, [postId, projectId, title, fileFormat, relativePath]);
        return result.lastID;
    });
}
