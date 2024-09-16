import { User as PrismaUser, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export class User implements PrismaUser {
    id: string;
    email: string;
    password: string;
    name: string | null;
    role: Role; 
    createdAt: Date;
    updatedAt: Date;

    constructor(user: PrismaUser) {
        this.id = user.id;
        this.email = user.email;
        this.password = user.password;
        this.name = user.name; 
        this.role = user.role; 
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    isAdmin(): boolean {
        return this.role === Role.ADMIN;
    }

    isSeller(): boolean {
        return this.role === Role.SELLER;
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