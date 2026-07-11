import { z } from "zod";

export const phoneSchema = z.string().min(8, "Enter a valid phone number").max(20);
export const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");
export const transactionPinSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

export const loginSchema = z.object({
  phoneOrEmail: z.string().min(3, "Enter your phone number or email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: phoneSchema,
  password: z.string().min(10, "Use at least 10 characters")
});

export const moneyAmountSchema = z.coerce.number().positive("Amount must be greater than zero").max(5_000_000, "Amount exceeds allowed demo limit");

export const transferSchema = z.object({
  recipient: z.string().min(3, "Enter recipient phone, tag, or wallet ID"),
  amount: moneyAmountSchema,
  narration: z.string().max(120).optional(),
  transactionPin: transactionPinSchema
});

export const fundSchema = z.object({
  amount: moneyAmountSchema,
  method: z.enum(["bank_transfer", "card"])
});

export const withdrawSchema = z.object({
  bankCode: z.string().min(2),
  accountNumber: z.string().min(10).max(10),
  amount: moneyAmountSchema,
  transactionPin: transactionPinSchema
});

export const billPaymentSchema = z.object({
  biller: z.string().min(2),
  customerReference: z.string().min(3),
  amount: moneyAmountSchema,
  transactionPin: transactionPinSchema
});

export const airtimeSchema = z.object({
  network: z.enum(["mtn", "airtel", "glo", "9mobile"]),
  phone: phoneSchema,
  amount: moneyAmountSchema,
  transactionPin: transactionPinSchema
});
