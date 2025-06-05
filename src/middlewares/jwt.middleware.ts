import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../controllers/auth.controller'; // Or from a shared types file
import { LoginUserData } from '../interfaces/user.interface'; // Adjust path as needed

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided or incorrect format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as LoginUserData; // Cast to your JWT payload type
    req.user = decoded; // Attach user information to the request object
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }    
    return res.status(401).json({ message: 'Unauthorized: Token verification failed' });
  }
}; 