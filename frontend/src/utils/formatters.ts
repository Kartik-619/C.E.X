export function formatPrice(price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBalance(amount: number): string {
  if (amount === 0) return "0.00";
  if (Math.abs(amount) >= 1) {
    return amount.toFixed(2);
  }
  return amount.toPrecision(4);
}

export function validatePrice(price: number): string | null {
  if (price <= 0) return "Price must be greater than 0";
  if (price > 1000000) return "Price exceeds maximum";
  return null;
}

export function validateQuantity(quantity: number): string | null {
  if (quantity <= 0) return "Quantity must be greater than 0";
  if (quantity > 1000000) return "Quantity exceeds maximum";
  return null;
}

export function validateOrderRequest(
  request: { price: number; quantity: number; side: string }
): string | null {
  const priceError = validatePrice(request.price);
  if (priceError) return priceError;
  const quantityError = validateQuantity(request.quantity);
  if (quantityError) return quantityError;
  if (!["buy", "sell"].includes(request.side)) return "Invalid side";
  return null;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${formatBalance(amount)} ${currency}`;
}