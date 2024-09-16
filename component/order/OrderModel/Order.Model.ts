import { Order as PrismaOrder, Prisma, OrderStatus, OrderItem as PrismaOrderItem } from '@prisma/client';

export class Order implements Omit<PrismaOrder, 'items'> {
    id: number;
    userId: string;
    total: number;
    status: OrderStatus;
    items: PrismaOrderItem[];
    createdAt: Date;
    updatedAt: Date;

    constructor(order: PrismaOrder & { items?: PrismaOrderItem[] }) {
        this.id = order.id;
        this.userId = order.userId;
        this.total = order.total;
        this.status = order.status;
        this.items = order.items || [];
        this.createdAt = order.createdAt;
        this.updatedAt = order.updatedAt;
    }

    toJSON(): Partial<Order> {
        return {
            id: this.id,
            userId: this.userId,
            total: this.total,
            status: this.status,
            items: this.items,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static async create(data: Prisma.OrderCreateInput, prisma: Prisma.OrderDelegate): Promise<Order> {
        const order = await prisma.create({ data });
        return new Order(order);
    }

    static async findById(id: number, prisma: Prisma.OrderDelegate): Promise<Order | null> {
        const order = await prisma.findUnique({
            where: { id },
            include: { items: true }, // Include related items
        });
        return order ? new Order(order) : null;
    }

    addItem(item: PrismaOrderItem): void {
        this.items.push(item);
        this.recalculateTotal();
    }

    removeItem(itemId: number): void {
        this.items = this.items.filter(item => item.id !== itemId);
        this.recalculateTotal();
    }

    private recalculateTotal(): void {
        this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
}