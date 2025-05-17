export interface Post {
    id: number;
    title: string;
    content: string;
    type: string;
    image: string | null;
    createdAt: number;
    userId: number;
    boardId: number;
    projectId: number | null;
    hashtags: string | null;
    username: string;
}