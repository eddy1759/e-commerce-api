import { Payment as PrismaPayment, Prisma, PaymentStatus } from '@prisma/client';

export class Payment implements PrismaPayment {
    id: string;
    userId: string;
    orderId: number;
    amount: number;
    method: string;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;

    constructor(payment: PrismaPayment) {
        this.id = payment.id;
        this.userId = payment.userId;
        this.orderId = payment.orderId;
        this.amount = payment.amount;
        this.method = payment.method;
        this.status = payment.status;
        this.createdAt = payment.createdAt;
        this.updatedAt = payment.updatedAt;
    }

    toJSON(): Partial<Payment> {
        return this;
    }

    static async create(data: Prisma.PaymentCreateInput, prisma: Prisma.PaymentDelegate): Promise<Payment> {
        const payment = await prisma.create({ data });
        return new Payment(payment);
    }

    isCompleted(): boolean {
        return this.status === PaymentStatus.COMPLETED;
    }

    isPending(): boolean {
        return this.status ===PaymentStatus.PENDING;
    }

    isFailed(): boolean {
        return this.status === PaymentStatus.FAILED;
    }
}