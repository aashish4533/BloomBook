export type RentalPeriod = 'weekly' | 'monthly' | 'yearly';

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addRentalPeriod(start: Date, period: RentalPeriod): Date {
  const d = new Date(start);
  if (period === 'weekly') d.setDate(d.getDate() + 7);
  else if (period === 'monthly') d.setDate(d.getDate() + 30);
  else d.setDate(d.getDate() + 365);
  return d;
}

export function pickupDayHasArrived(pickupDateIso: string): boolean {
  const pickup = startOfDay(new Date(pickupDateIso));
  const today = startOfDay(new Date());
  return today.getTime() >= pickup.getTime();
}

export function canActivateReservedRental(data: {
  status?: string;
  borrowerReceivedBook?: boolean;
  lenderReceivedPayments?: boolean;
  pickupDate?: string;
}): boolean {
  if (data.status !== 'reserved_rent') return false;
  if (!data.borrowerReceivedBook || !data.lenderReceivedPayments) return false;
  if (!data.pickupDate) return false;
  return pickupDayHasArrived(data.pickupDate);
}

export function computeSecurityDepositHalf(referenceBookPrice: number): number {
  const n = Number(referenceBookPrice) || 0;
  return Math.round(n * 0.5 * 100) / 100;
}
