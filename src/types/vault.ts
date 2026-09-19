export interface VaultFile {
  id: string;
  folderId: string;
  uploaderId?: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  fileType?: string;
  isSelected: boolean;
  clientComment?: string;
  watermarkText?: string;
  createdAt: string;
}

export interface VaultFolder {
  id: string;
  ownerId?: string;
  bookingId: string;
  name: string;
  status: 'draft' | 'in_selection' | 'approved';
  maxSelections: number;
  approvedAt?: string;
  clientNotes?: string;
  createdAt: string;
  files: VaultFile[];
}
