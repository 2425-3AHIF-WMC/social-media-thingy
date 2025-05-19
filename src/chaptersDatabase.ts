import {db, init} from "./database";

export async function insertComicPage(
    postId: number,
    pageNumber: number,
    imagePath: string
) {
    await init();
    await db.run(
        `INSERT INTO ComicPages (post_id, page_number, image_path)
     VALUES (?, ?, ?)`,
        [postId, pageNumber, imagePath]
    );
}


