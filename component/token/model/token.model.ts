import { Token as PrismaToken, Prisma, TokenType } from '@prisma/client';

export class Token implements PrismaToken {
    id: number;
    userId: string;
    token: string;
    type: TokenType
    expiresAt: Date;
    createdAt: Date;

    constructor(token: PrismaToken) {
        this.id = token.id;
        this.userId = token.userId;
        this.token = token.token;
        this.type = token.type;
        this.expiresAt = token.expiresAt;
        this.createdAt = token.createdAt;
    }

    toJSON(): Partial<Token> {
        return this;
    }

    static async create(data: Prisma.TokenCreateInput, prisma: Prisma.TokenDelegate): Promise<Token> {
        const token = await prisma.create({ data });
        return new Token(token);
    }
}