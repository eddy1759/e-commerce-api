import { Cart as PrismaCart, Prisma, CartItem as PrismaCartItem} from '@prisma/client';

export class Cart implements PrismaCart {
    id: number;
    userId: string;
    items: PrismaCartItem[]
    createdAt: Date;
    updatedAt: Date;

    constructor(cart: PrismaCart & { items?: PrismaCartItem[] }) {
        this.id = cart.id;
        this.userId = cart.userId;
        this.items = cart.items || [];
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

    static async findById(id: number, prisma: Prisma.CartDelegate): Promise<Cart | null> {
        const cart = await prisma.findUnique({
            where: { id },
            include: { items: true },
        });
        return cart ? new Cart(cart) : null;
    }

    static async findByUserId(userId: string, prisma: Prisma.CartDelegate): Promise<Cart | null> {
        const cart = await prisma.findFirst({
            where: { userId },
            include: { items: true }
        });
        return cart ? new Cart(cart) : null;
    }

    addItem(item: PrismaCartItem): void {
        const existingItem = this.items.find(i => i.productId === item.productId)
        if (existingItem) {
            existingItem.quantity += item.quantity
        } else {
            this.items.push(item)
        }
    }

    removeItem(productId: number): void {
        this.items = this.items.filter(item => item.productId !== productId)
    }

    getTotalPrice(): number {
        return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }
}
