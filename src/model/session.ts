import session from "express-session";

interface CustomSession extends session.Session {
    user?: string;
    role?: string;
}

declare module 'express-session' {
    interface SessionData {
        user: CustomSession;
    }
}

declare module 'express-serve-static-core'{
    interface Request {
        session: CustomSession;
    }
}

export default CustomSession;