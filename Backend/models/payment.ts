import { Schema, model, Document } from 'mongoose';

export interface IPayment extends Document {
    userId: Schema.Types.ObjectId;
    bookingId: Schema.Types.ObjectId;
    paymentMethod: 'stripe' | 'khalti' | 'cash';
    amount: number;
    amountInPaisa: number;
    paymentStatus: 'initiated' | 'completed' | 'failed' | 'pending' | 'refunded' | 'expired';
    purchaseOrderId: string;
    pidx?: string;
    transactionId?: string;
    khaltiResponse?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    paymentMethod: { type: String, enum: ['stripe', 'khalti', 'cash'], required: true },
    amount: { type: Number, required: true },
    amountInPaisa: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['initiated', 'completed', 'failed', 'pending', 'refunded', 'expired'],
        default: 'initiated'
    },
    purchaseOrderId: { type: String, required: true, unique: true },
    pidx: { type: String },
    transactionId: { type: String },
    khaltiResponse: { type: Schema.Types.Mixed },
}, { timestamps: true });

const Payment = model<IPayment>('Payment', paymentSchema);
export default Payment;
