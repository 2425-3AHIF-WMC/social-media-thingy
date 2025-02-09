import { Request, Response, NextFunction } from 'express';
import {getUserRole} from "../database";

export async function authHandler(req: Request, res: Response, next: NextFunction) {
    if ((req.session).user) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

export async function adminHandler(req: Request, res: Response, next: NextFunction) {
    if ((req.session).user) {
        const username = (req.session).user;
        try {
            const role = await getUserRole(username);
            if (role === 'admin') {
                next();
            } else {
                res.status(401).send('Unauthorized');
            }
        } catch (error) {
            res.status(401).send('Server Error');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
}

export async function moderatorHandler(req: Request, res: Response, next: NextFunction) {
    if ((req.session).user) {
        const username = (req.session).user;
        try {
            const role = await getUserRole(username);
            if (role === 'moderator' || role === 'admin') {
                next();
            } else {
                res.status(401).send('Unauthorized');
            }
        } catch (error) {
            res.status(401).send('Server Error');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
}