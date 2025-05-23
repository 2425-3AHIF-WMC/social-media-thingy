import {db, init} from "./database";
import path from "path";

export async function insertComicPage(
    chapterId: number,
    pageNumber: number,
    imagePath: string
) {
    await init();
    await db.run(
        `INSERT INTO ComicPages
       (chapter_id, page_number, image_path)
     VALUES (?, ?, ?)`,
        [chapterId, pageNumber, imagePath]
    );
}


export async function createChapterFile(
    postId: number,
    sourceDiskPath: string,
    fileFormat: string,
    projectId: number,
    title: string
): Promise<number> {
    await init();

    const filename    = path.basename(sourceDiskPath);
    const relativePath = path.join('uploads', filename);

    const result = await db.run(
        `INSERT INTO Chapters 
       (post_id, project_id, title, file_type, source_path)
     VALUES (?, ?, ?, ?, ?)`,
        [postId, projectId, title, fileFormat, relativePath]
    );

    return result.lastID!;
}