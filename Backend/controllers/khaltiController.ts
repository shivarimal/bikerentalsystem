import { Request, Response } from 'express';
import { getKhaltiConfig } from '../config/khalti';
import Booking from '../models/booking';
import Bike from '../models/bike';
import Payment from '../models/payment';
import User from '../models/user';

// POST /api/payment/khalti/initiate
export const initiateKhaltiPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const khaltiConfig = getKhaltiConfig();
        if (!khaltiConfig) {
            res.status(500).json({ error: 'Khalti secret key is not configured' });
            return;
        }

        const { bookingId } = req.body;
        const userId = (req as any).user?.id || req.body.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'User is not authenticated' });
            return;
        }

        if (!bookingId) {
            res.status(400).json({ error: 'Booking ID is required' });
            return;
        }

        // Validate booking exists and belongs to the user
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }

        if (booking.userId.toString() !== userId) {
            res.status(403).json({ error: 'Booking does not belong to this user' });
            return;
        }

        // Check if booking is already paid
        if (booking.paymentStatus === 'completed') {
            res.status(400).json({ error: 'Booking is already paid' });
            return;
        }

        // Validate bike exists
        const bike = await Bike.findById(booking.bikeId);
        if (!bike) {
            res.status(404).json({ error: 'Bike not found' });
            return;
        }

        // Calculate amount in Rupees from booking times and bike price
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);
        const diffInHours = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        const amountInRupees = diffInHours * bike.pricePerHour;
        const amountInPaisa = amountInRupees * 100;

        // Get user info for Khalti customer details
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Generate unique purchase order ID
        const purchaseOrderId = `BIKE-RENTAL-${bookingId}-${Date.now()}`;

        // Create Payment record
        const payment = new Payment({
            userId,
            bookingId,
            paymentMethod: 'khalti',
            amount: amountInRupees,
            amountInPaisa,
            paymentStatus: 'initiated',
            purchaseOrderId,
        });
        await payment.save();

        // Call Khalti API to initiate payment
        const khaltiPayload = {
            return_url: `${khaltiConfig.backendUrl}/api/payment/khalti/callback`,
            website_url: khaltiConfig.frontendUrl,
            amount: amountInPaisa,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: `Bike Rental - ${bike.bikeModel}`,
            customer_info: {
                name: user.username,
                email: user.email,
                phone: user.phone || '9800000000',
            },
        };

        const khaltiResponse = await fetch(`${khaltiConfig.apiUrl}/epayment/initiate/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${khaltiConfig.secretKey}`,
            },
            body: JSON.stringify(khaltiPayload),
        });

        const rawKhaltiText = await khaltiResponse.text();
        let khaltiData: any = {};
        try {
            khaltiData = JSON.parse(rawKhaltiText);
        } catch {
            khaltiData = { error: rawKhaltiText };
        }

        if (!khaltiResponse.ok || !khaltiData.pidx) {
            // Update payment status to failed
            payment.paymentStatus = 'failed';
            payment.khaltiResponse = khaltiData;
            await payment.save();

            res.status(500).json({
                error: khaltiData.detail || khaltiData.error || 'Failed to initiate Khalti payment',
                details: khaltiData,
            });
            return;
        }

        // Update payment with pidx
        payment.pidx = khaltiData.pidx;
        payment.khaltiResponse = khaltiData;
        await payment.save();

        res.status(200).json({
            success: true,
            payment_url: khaltiData.payment_url,
            pidx: khaltiData.pidx,
            purchase_order_id: purchaseOrderId,
        });
    } catch (error: any) {
        console.error('Error initiating Khalti payment:', error);
        res.status(500).json({ error: error.message || 'Failed to initiate Khalti payment' });
    }
};

// GET /api/payment/khalti/callback
export const handleKhaltiCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const khaltiConfig = getKhaltiConfig();
        if (!khaltiConfig) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/Profile?payment=error`);
            return;
        }

        const { pidx, status, transaction_id, amount, total_amount, purchase_order_id } = req.query;

        if (!pidx || !purchase_order_id) {
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=error`);
            return;
        }

        // Find the payment record
        const payment = await Payment.findOne({ purchaseOrderId: purchase_order_id as string });
        if (!payment) {
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=error`);
            return;
        }

        // If already completed, redirect to profile (idempotent)
        if (payment.paymentStatus === 'completed') {
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=success`);
            return;
        }

        // Verify payment via Khalti lookup API (server-to-server)
        const lookupResponse = await fetch(`${khaltiConfig.apiUrl}/epayment/lookup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${khaltiConfig.secretKey}`,
            },
            body: JSON.stringify({ pidx }),
        });

        const lookupData = await lookupResponse.json();

        if (!lookupResponse.ok) {
            payment.paymentStatus = 'failed';
            payment.khaltiResponse = lookupData;
            await payment.save();
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=failed`);
            return;
        }

        // Only treat "Completed" as successful
        if (lookupData.status !== 'Completed') {
            payment.paymentStatus = lookupData.status === 'Pending' ? 'pending' : 'failed';
            payment.khaltiResponse = lookupData;
            await payment.save();
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=${lookupData.status.toLowerCase()}`);
            return;
        }

        // Verify amount matches
        const expectedPaisa = payment.amountInPaisa;
        const receivedPaisa = lookupData.total_amount || total_amount;
        if (Number(receivedPaisa) !== expectedPaisa) {
            console.error(`Amount mismatch: expected ${expectedPaisa}, got ${receivedPaisa}`);
            payment.paymentStatus = 'failed';
            payment.khaltiResponse = lookupData;
            await payment.save();
            res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=amount_mismatch`);
            return;
        }

        // Payment verified — update payment record
        payment.paymentStatus = 'completed';
        payment.transactionId = lookupData.transaction_id || transaction_id as string;
        payment.khaltiResponse = lookupData;
        await payment.save();

        // Update booking
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
            booking.paymentId = payment.pidx || '';
            booking.paymentAmount = payment.amount;
            booking.paymentStatus = 'completed';
            await booking.save();
        }

        res.redirect(`${khaltiConfig.frontendUrl}/Profile?payment=success`);
    } catch (error: any) {
        console.error('Error handling Khalti callback:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/Profile?payment=error`);
    }
};

// POST /api/payment/khalti/verify
export const verifyKhaltiPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const khaltiConfig = getKhaltiConfig();
        if (!khaltiConfig) {
            res.status(500).json({ error: 'Khalti secret key is not configured' });
            return;
        }

        const { pidx } = req.body;
        if (!pidx) {
            res.status(400).json({ error: 'pidx is required' });
            return;
        }

        // Find the payment by pidx
        const payment = await Payment.findOne({ pidx });
        if (!payment) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }

        // If already completed, return success
        if (payment.paymentStatus === 'completed') {
            res.status(200).json({
                success: true,
                status: 'completed',
                payment: {
                    purchaseOrderId: payment.purchaseOrderId,
                    amount: payment.amount,
                    transactionId: payment.transactionId,
                },
            });
            return;
        }

        // Lookup via Khalti API
        const lookupResponse = await fetch(`${khaltiConfig.apiUrl}/epayment/lookup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${khaltiConfig.secretKey}`,
            },
            body: JSON.stringify({ pidx }),
        });

        const lookupData = await lookupResponse.json();

        if (!lookupResponse.ok) {
            res.status(500).json({ error: 'Failed to verify payment', details: lookupData });
            return;
        }

        // Update payment status based on lookup
        if (lookupData.status === 'Completed') {
            // Verify amount
            if (Number(lookupData.total_amount) !== payment.amountInPaisa) {
                res.status(400).json({ error: 'Amount mismatch' });
                return;
            }

            payment.paymentStatus = 'completed';
            payment.transactionId = lookupData.transaction_id;
            payment.khaltiResponse = lookupData;
            await payment.save();

            // Update booking
            const booking = await Booking.findById(payment.bookingId);
            if (booking) {
                booking.paymentId = payment.pidx || '';
                booking.paymentAmount = payment.amount;
                booking.paymentStatus = 'completed';
                await booking.save();
            }

            res.status(200).json({
                success: true,
                status: 'completed',
                payment: {
                    purchaseOrderId: payment.purchaseOrderId,
                    amount: payment.amount,
                    transactionId: payment.transactionId,
                },
            });
        } else {
            payment.paymentStatus = lookupData.status === 'Pending' ? 'pending' : 'failed';
            payment.khaltiResponse = lookupData;
            await payment.save();

            res.status(200).json({
                success: false,
                status: lookupData.status.toLowerCase(),
                message: `Payment status: ${lookupData.status}`,
            });
        }
    } catch (error: any) {
        console.error('Error verifying Khalti payment:', error);
        res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
};
