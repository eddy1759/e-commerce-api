import { OrderItem as PrismaOrderItem, Prisma } from "@prisma/client";

export class OrderItem implements PrismaOrderItem {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;

    constructor(orderItem: PrismaOrderItem) {
        this.id = orderItem.id;
        this.orderId = orderItem.orderId;
        this.productId = orderItem.productId;
        this.quantity = orderItem.quantity;
        this.price = orderItem.price;
    }

    toJSON(): Partial<OrderItem> {
        return this;
    }

    static async create(data: Prisma.OrderItemCreateInput, prisma: Prisma.OrderItemDelegate): Promise<OrderItem> {
        const orderItem = await prisma.create({ data });
        return new OrderItem(orderItem);
    }
}