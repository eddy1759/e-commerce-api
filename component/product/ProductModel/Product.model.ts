import { Product as PrismaProduct, Prisma } from '@prisma/client';

export class Product implements PrismaProduct {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    sellerId: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(product: PrismaProduct) {
        this.id = product.id;
        this.name = product.name;
        this.description = product.description;
        this.price = product.price;
        this.stock = product.stock;
        this.sellerId = product.sellerId;
        this.createdAt = product.createdAt;
        this.updatedAt = product.updatedAt;
    }

    isInStock(): boolean {
        return this.stock > 0;
    }

    toJSON(): Partial<Product> {
        return this;
    }

    static async create(data: Prisma.ProductCreateInput, prisma: Prisma.ProductDelegate): Promise<Product> {
        const product = await prisma.create({ data });
        return new Product(product);
    }

    calculateDiscountedPrice(discountPercentage: number): number {
        return this.price * (1 - (discountPercentage /100));
    }
}