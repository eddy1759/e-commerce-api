import { CartItem as PrismaCartItem, Prisma } from "@prisma/client";

export class CartItem implements PrismaCartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    price: number; 
    createdAt: Date;
    updatedAt: Date;

    constructor(cartItem: PrismaCartItem) {
        this.id = cartItem.id;
        this.cartId = cartItem.cartId;
        this.productId = cartItem.productId;
        this.quantity = cartItem.quantity;
        this.price = cartItem.price;
        this.createdAt = cartItem.createdAt;
        this.updatedAt = cartItem.updatedAt;
    }

    toJSON(): Partial<CartItem> {
        return this;
    }

    static async create(data: Prisma.CartItemCreateInput, prisma: Prisma.CartItemDelegate): Promise<CartItem> {
        const cartItem = await prisma.create({ data });
        return new CartItem(cartItem);
    }

}