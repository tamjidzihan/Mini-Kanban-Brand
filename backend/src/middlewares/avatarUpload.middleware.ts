import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';

const parseAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
}).single('avatar');

export const avatarUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  parseAvatar(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Profile image must be 5 MB or smaller.'
            : 'Invalid profile image upload.',
      });
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};
