import { Order as PrismaOrder, Prisma, OrderStatus } from '@prisma/client';


export class Order implements PrismaOrder {
    id: number;
    userId: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;

    constructor(order: PrismaOrder) {
        this.id = order.id;
        this.userId = order.userId;
        this.total = order.total;
        this.status = order.status;
        this.createdAt = order.createdAt;
        this.updatedAt = order.updatedAt;
    }

    toJSON(): Partial<Order> {
        return this;
    }

    static async create(data: Prisma.OrderCreateInput, prisma: Prisma.OrderDelegate): Promise<Order> {
        const order = await prisma.create({ data });
        return new Order(order);
    }
}