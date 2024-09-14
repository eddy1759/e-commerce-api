import { User as PrismaUser, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export class User implements PrismaUser {
    id: string;
    email: string;
    password: string;
    name: string | null; // Handle nullable name
    role: Role; // Use the Role enum from Prisma
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(user: PrismaUser) {
        this.id = user.id;
        this.email = user.email;
        this.password = user.password;
        this.name = user.name; // Nullable field
        this.role = user.role; // Use Prisma Role enum
        this.isAdmin = user.isAdmin;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    static async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    toJSON(): Partial<User> {
        const { password, ...user } = this;
        return user;
    }

    static async create(data: Prisma.UserCreateInput, prisma: Prisma.UserDelegate): Promise<User> {
        const hashedPassword = await User.hashPassword(data.password);
        const user = await prisma.create({ 
            data: {
                ...data,
                password: hashedPassword
            }
         });
        return new User(user);
    }
}
