import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(401, 'User not found');
    }

    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}
