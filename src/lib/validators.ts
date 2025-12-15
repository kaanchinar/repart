export function luhnCheck(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (sanitized.length !== 16) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function formatAZN(amount: number) {
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
