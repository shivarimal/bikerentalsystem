import { Request, Response } from 'express';

export const handleKhaltiPayment = async (req: Request, res: Response): Promise<void> => {
  res.status(500).json({ message: 'Khalti payment integration not configured' });
};
