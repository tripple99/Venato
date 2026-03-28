import {Request,Response,NextFunction} from "express";
import HttpException from "../exceptions/http.exception";
import jwt from "jsonwebtoken"
import authModel from "../resources/auths/auth.model"; // added import
import { AuthRole } from "../resources/auths/auth.interface";

export interface TokenPayload {
    id: string;
    userRole: AuthRole;
    allowedMarkets:string[];
    email: string;
    fullname: string;
    accessToken: string;
    refreshToken: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const bearerToken = req.headers.authorization;

  if (!bearerToken?.startsWith('Bearer ')) {
    throw new HttpException(401, 'error', 'Unauthorized - token not provided');
  }

  const token = bearerToken.split(' ')[1];

  try {
    const secret = process.env.ACCESS_TOKEN;
    if (!secret) throw new Error('ACCESS_TOKEN missing');

    const payload = jwt.verify(token, secret) as TokenPayload;
    req.user = payload;

   await authModel.findOneAndUpdate(
  {
    _id: payload.id,
    lastActive: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
  },
  {
    $set: {
      isActive: true,
      lastActive: new Date()
    }
  }
)

    next();
  } catch {
    throw new HttpException(401, 'error', 'Invalid or expired token');
  }
};

export const authorize = (roles?: AuthRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpException(401, 'error', 'Unauthorized access');
    }

    if (roles?.length) {
      const userRole = req.user.userRole.toLowerCase();

      const allowed = roles
        .map(role => role.toLowerCase())
        .includes(userRole);

      if (!allowed) {
        throw new HttpException(403, 'error', 'Forbidden - insufficient permissions');
      }
    }

    next();
  };
};