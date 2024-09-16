import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import httpStatus from 'http-status';
import { Role } from '../model/enum';
import { ApiError } from '../utils/apiError';
import { logger } from '../config/logger';
import { redisService } from '../services/redis.service'; // Assume Redis is set up for token blacklisting

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    }
}

const verifyToken = async (token: string): Promise<string | jwt.JwtPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
            if (err) reject(err);
            resolve(decoded!);
        });
    });
};

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Authorization token missing');
        }

        const [scheme, token] = authHeader.split(' ');
        if (!token || scheme.toLowerCase() !== 'bearer') {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authorization format');
        }

        // Check if token is blacklisted
        const isBlacklisted = await redisService.get(`bl_${token}`);
        if (isBlacklisted) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been revoked');
        }

        const decoded = await verifyToken(token) as { id: string };
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.id },
            select: { id: true, role: true } // Only select necessary fields
        });

        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
        }
        if (error instanceof jwt.TokenExpiredError) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error('Unknown error occurred during authentication');
        logger.error((error as Error).message, error as Error);
        next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
    }
};

const roleMiddleware = (allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role as Role)) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions'));
        }
        next();
    };
};

export const authMiddleServices = {
    authMiddleware,
    roleMiddleware,
    authAdminMiddleware: [authMiddleware, roleMiddleware([Role.ADMIN])],
    authSellerMiddleware: [authMiddleware, roleMiddleware([Role.SELLER])],
    authCustomerMiddleware: [authMiddleware, roleMiddleware([Role.CUSTOMER])],
    authSellerOrAdminMiddleware: [authMiddleware, roleMiddleware([Role.SELLER, Role.ADMIN])],
    authCustomerOrAdminMiddleware: [authMiddleware, roleMiddleware([Role.CUSTOMER, Role.ADMIN])],
    authSellerOrCustomerMiddleware: [authMiddleware, roleMiddleware([Role.SELLER, Role.CUSTOMER])],
    authAllRolesMiddleware: [authMiddleware, roleMiddleware([Role.ADMIN, Role.SELLER, Role.CUSTOMER])]
};