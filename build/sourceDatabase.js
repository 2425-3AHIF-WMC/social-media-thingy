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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCharacterDescriptions = getCharacterDescriptions;
exports.createCharacterDescription = createCharacterDescription;
exports.getProjectCredits = getProjectCredits;
exports.createProjectCredit = createProjectCredit;
const database_1 = require("./database");
function getCharacterDescriptions(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return database_1.db.all(`
    SELECT * FROM CharacterDescriptions
    WHERE project_id = ?
    ORDER BY createdAt ASC
  `, [projectId]);
    });
}
function createCharacterDescription(projectId, name, imagePath, description, spoiler) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO CharacterDescriptions
      (project_id, name, image_path, description, spoiler)
     VALUES (?, ?, ?, ?, ?)`, [projectId, name, imagePath, description, spoiler]);
        return { id: result.lastID };
    });
}
function getProjectCredits(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return database_1.db.all(`
    SELECT * FROM ProjectCredits
    WHERE project_id = ?
    ORDER BY createdAt ASC
  `, [projectId]);
    });
}
function createProjectCredit(projectId, label, url) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO ProjectCredits
      (project_id, label, url)
     VALUES (?, ?, ?)`, [projectId, label, url]);
        return { id: result.lastID };
    });
}
