import 'multer';
import { Role } from '../models/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
      boardMember?: {
        role: Role;
        boardId: string;
      };
    }
  }
}
