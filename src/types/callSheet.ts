export interface ScheduleItem {
  id: string;
  time: string;
  event: string;
  location?: string;
  notes?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  callTime: string;
}

export interface CallSheet {
  id: string;
  bookingId: string;
  creatorId?: string;
  title: string;
  shootDate: string;
  generalCallTime: string;
  locationName: string;
  googleMapsUrl?: string;
  weatherSummary?: string;
  emergencyContact?: string;
  scheduleItems: ScheduleItem[];
  crewMembers: CrewMember[];
  notesAndRules?: string;
  createdAt: string;
  updatedAt: string;
}
