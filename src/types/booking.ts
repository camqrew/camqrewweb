export type BookingStatus = 'pending' | 'accepted' | 'confirmed' | 'escrow_held' | 'completed' | 'cancelled';

export interface Milestone {
  id: string;
  title: string;
  percentage?: number;
  amount: number;
  status: 'held' | 'released';
}

export interface Review {
  id: string;
  bookingId?: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  professionalId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: {
    professionalName: string;
    comment: string;
    createdAt: string;
  };
}

export interface Booking {
  id: string;
  professionalId?: string;
  studioId?: string;
  professionalName: string;
  professionalAvatar?: string;
  professionalTitle?: string;
  customerId: string;
  customerName: string;
  serviceTitle: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  daysCount: number;
  location: string;
  notes?: string;
  status: BookingStatus;
  ratePerDay: number;
  totalAmount: number;
  createdAt: string;
  contractSignature?: string;
  contractTermsText?: string;
  contractSignedAt?: string;
  milestones?: Milestone[];
}
