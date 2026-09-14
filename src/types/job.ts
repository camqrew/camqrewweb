export type JobStatus = 'open' | 'reviewing' | 'booked' | 'completed' | 'cancelled';

export interface JobRequest {
  id: string;
  client_id: string;
  title: string;
  requirements: string;
  location: string;
  state?: string;
  district?: string;
  city?: string;
  budget: number;
  status: JobStatus;
  accepted_by?: string | null;
  rejected_pros?: string[];
  created_at: string;
}
