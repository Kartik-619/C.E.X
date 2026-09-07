import { z } from "zod";

export const MAX_ORDER_PRICE = 1000000;
export const MAX_ORDER_QUANTITY = 1000000;
export const MAX_DEPOSIT_AMOUNT = 1000000;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.email("Enter a valid email address"),
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const orderFormSchema = z
  .object({
    symbol: z.string().trim().min(1, "Symbol is required"),
    side: z.enum(["buy", "sell"], { message: "Invalid side" }),
    price: z.string(),
    quantity: z.string(),
    orderType: z.enum(["LIMIT", "MARKET"], { message: "Invalid order type" }),
  })
  .superRefine((data, ctx) => {
    const quantity = Number(data.quantity);
    if (data.quantity.trim() === "" || !Number.isFinite(quantity) || quantity <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity must be greater than 0",
        path: ["quantity"],
      });
    } else if (quantity > MAX_ORDER_QUANTITY) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity exceeds maximum",
        path: ["quantity"],
      });
    }

    if (data.orderType === "LIMIT") {
      const price = Number(data.price);
      if (data.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Price must be greater than 0",
          path: ["price"],
        });
      } else if (price > MAX_ORDER_PRICE) {
        ctx.addIssue({
          code: "custom",
          message: "Price exceeds maximum",
          path: ["price"],
        });
      }
    }
  });

export const depositSchema = z.object({
  amount: z.string().refine((value) => {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_DEPOSIT_AMOUNT;
  }, "Enter an amount greater than 0"),
});

export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}