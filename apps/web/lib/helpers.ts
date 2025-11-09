/**
 * Helper to serialize BigInt values from Prisma raw queries
 * PostgreSQL BIGINT and numeric aggregates return BigInt which JSON.stringify can't handle
 */
export const serializeBigInt = (data: any): any => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | string, locale = 'de-DE'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Safe date parser
 */
export const parseDate = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date();
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
};

/**
 * Calculate invoice status based on dates and payments
 */
export const calculateInvoiceStatus = (
  dueDate: Date | null,
  totalAmount: number,
  paidAmount: number
): 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' => {
  const now = new Date();
  
  if (paidAmount >= totalAmount) return 'PAID';
  if (paidAmount > 0) return 'PARTIAL';
  if (dueDate && dueDate < now) return 'OVERDUE';
  return 'PENDING';
};

/**
 * Categorize vendor by name heuristics
 */
export const categorizeVendor = (vendorName: string): string => {
  const name = vendorName.toLowerCase();
  
  if (name.includes('tech') || name.includes('software') || name.includes('gmbh') && name.includes('cpb')) {
    return 'Technology';
  }
  if (name.includes('marketing') || name.includes('media')) {
    return 'Marketing';
  }
  if (name.includes('consulting') || name.includes('beratung')) {
    return 'Consulting';
  }
  if (name.includes('auto') || name.includes('teile')) {
    return 'Automotive';
  }
  if (name.includes('tax') || name.includes('steuer')) {
    return 'Professional Services';
  }
  
  return 'Operations';
};
