import { Cart as PrismaCart, Prisma } from '@prisma/client';

export class Cart implements PrismaCart {
    id: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(cart: PrismaCart) {
        this.id = cart.id;
        this.userId = cart.userId;
        this.createdAt = cart.createdAt;
        this.updatedAt = cart.updatedAt;
    }

    toJSON(): Partial<Cart> {
        return this;
    }

    static async create(data: Prisma.CartCreateInput, prisma: Prisma.CartDelegate): Promise<Cart> {
        const cart = await prisma.create({ data });
        return new Cart(cart);
    }
}