import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'No authorization token provided' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    if (req.body && typeof req.body === 'object') {
      req.body.user = decoded;
    } else {
      req.body = { user: decoded };
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};

export default authMiddleware;
