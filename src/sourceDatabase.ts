import { db, init } from './database';

export async function getCharacterDescriptions(projectId: number) {
    await init();
    return db.all(`
    SELECT * FROM CharacterDescriptions
    WHERE project_id = ?
    ORDER BY createdAt ASC
  `, [projectId]);
}

export async function createCharacterDescription(
    projectId: number, name: string, imagePath: string | null,
    description: string | null, spoiler: string | null
) {
    await init();
    const result = await db.run(
        `INSERT INTO CharacterDescriptions
      (project_id, name, image_path, description, spoiler)
     VALUES (?, ?, ?, ?, ?)`,
        [projectId, name, imagePath, description, spoiler]
    );
    return { id: result.lastID };
}

export async function getProjectCredits(projectId: number) {
    await init();
    return db.all(`
    SELECT * FROM ProjectCredits
    WHERE project_id = ?
    ORDER BY createdAt ASC
  `, [projectId]);
}

export async function createProjectCredit(
    projectId: number, label: string, url: string | null
) {
    await init();
    const result = await db.run(
        `INSERT INTO ProjectCredits
      (project_id, label, url)
     VALUES (?, ?, ?)`,
        [projectId, label, url]
    );
    return { id: result.lastID };
}