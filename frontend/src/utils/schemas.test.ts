import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  orderFormSchema,
  depositSchema,
  firstFieldErrors,
} from "./schemas";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "secret" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).email).toBe("Enter a valid email address");
    }
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).password).toBe("Password is required");
    }
  });
});

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        username: "alice",
        password: "secret1",
        confirmPassword: "secret1",
      }).success
    ).toBe(true);
  });

  it("rejects a short username", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "ab",
      password: "secret1",
      confirmPassword: "secret1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).username).toBe("Username must be at least 3 characters");
    }
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "alice",
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).password).toBe("Password must be at least 6 characters");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "alice",
      password: "secret1",
      confirmPassword: "secret2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).confirmPassword).toBe("Passwords do not match");
    }
  });
});

describe("orderFormSchema", () => {
  const validLimit = {
    symbol: "BTC/USD",
    side: "buy",
    price: "48000",
    quantity: "0.5",
    orderType: "LIMIT",
  };

  it("accepts a valid limit order", () => {
    expect(orderFormSchema.safeParse(validLimit).success).toBe(true);
  });

  it("accepts a market order without a price", () => {
    expect(
      orderFormSchema.safeParse({
        ...validLimit,
        price: "",
        orderType: "MARKET",
      }).success
    ).toBe(true);
  });

  it("rejects a non-positive quantity", () => {
    const result = orderFormSchema.safeParse({ ...validLimit, quantity: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).quantity).toBe("Quantity must be greater than 0");
    }
  });

  it("rejects a limit order without a price", () => {
    const result = orderFormSchema.safeParse({ ...validLimit, price: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).price).toBe("Price must be greater than 0");
    }
  });

  it("rejects an empty symbol", () => {
    const result = orderFormSchema.safeParse({ ...validLimit, symbol: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).symbol).toBe("Symbol is required");
    }
  });

  it("rejects a non-numeric quantity", () => {
    const result = orderFormSchema.safeParse({ ...validLimit, quantity: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).quantity).toBe("Quantity must be greater than 0");
    }
  });
});

describe("depositSchema", () => {
  it("accepts a positive amount", () => {
    expect(depositSchema.safeParse({ amount: "250.50" }).success).toBe(true);
  });

  it("rejects an empty amount", () => {
    const result = depositSchema.safeParse({ amount: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = depositSchema.safeParse({ amount: "-5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error).amount).toBe("Enter an amount greater than 0");
    }
  });

  it("rejects a non-numeric amount", () => {
    const result = depositSchema.safeParse({ amount: "abc" });
    expect(result.success).toBe(false);
  });
});