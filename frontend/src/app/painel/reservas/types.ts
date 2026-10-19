export type Amenity = {
  id: number;
  condoId: number;
  name: string;
  category: string | null;
  description: string | null;
  capacity: number | null;
  feeCents: number | null;
  depositCents: number | null;
  pricingType: string | null;
  reservationModel: string | null;
  slotDurationMinutes: number | null;
  rules: string | null;
  images: string[] | null;
  features: string[] | null;
  openTime: string | null;
  closeTime: string | null;
  daysSchedule?: Record<string, { open: string; close: string; closed: boolean }> | null;
  intervalMinutes: number | null;
  blockedDays?: string[] | null;
  maxHours: number | null;
  minAdvanceHours: number | null;
  maxAdvanceDays: number | null;
  limitPerUnit: number | null;
  limitInterval: string | null;
  cancellationDeadlineHours: number | null;
  requestGuestList: boolean | null;
  requiresApproval: boolean;
  active: boolean;
};

export type ReservationItem = {
  id: number;
  amenityId: number;
  amenityName: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number | null;
  guestList?: string[] | null;
  totalCents: number | null;
  depositCents: number | null;
  paymentStatus: string | null;
  status: string; // pendente, aprovada, rejeitada, cancelada, concluida
  rejectionReason: string | null;
  cancellationReason?: string | null;
  cancelledAt?: Date | null;
  approvedAt?: Date | null;
  rulesAccepted?: boolean | null;
  notes: string | null;
  qrToken: string | null;
  unitNumber: string | null;
  blockName: string | null;
  userName: string | null;
  userId: number | null;
  createdAt: Date;
};

export type AmenityBlock = {
  id: number;
  condoId: number;
  amenityId: number | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  recurrentDay: string | null;
  reason: string;
  createdById: number | null;
  createdAt: Date;
};

export type CurrentUser = {
  id: number;
  name: string;
  unitId: number | null;
  unitLabel: string | null;
};
