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