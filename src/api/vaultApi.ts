import { supabase } from './supabaseClient';
import type { VaultFolder, VaultFile } from '../types/vault';
import { bookingApi } from './bookingApi';
import { notificationApi } from './notificationApi';

const mapFile = (f: any): VaultFile => ({
  id: String(f.id),
  folderId: String(f.folder_id),
  uploaderId: f.uploader_id,
  fileName: f.file_name,
  fileUrl: f.file_url,
  fileSizeBytes: Number(f.file_size_bytes || 0),
  fileType: f.file_type || 'image/jpeg',
  isSelected: Boolean(f.is_selected),
  clientComment: f.client_comment || '',
  watermarkText: f.watermark_text || 'CAMQREW PROOF',
  createdAt: f.created_at,
});

export const vaultApi = {
  getGalleryForBooking: async (bookingId: string): Promise<VaultFolder> => {
    // 1. Check if folder exists for this booking
    let { data: folder, error: folderErr } = await supabase
      .from('vault_folders')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (folderErr && folderErr.code !== 'PGRST116') {
      throw new Error(folderErr.message);
    }

    // 2. If no folder exists, auto-initialize one
    if (!folder) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_id, professional_id, studio_id, items')
        .eq('id', bookingId)
        .single();

      const serviceTitle = booking?.items?.serviceTitle || 'Shoot';
      const owner = booking?.professional_id || booking?.studio_id || booking?.customer_id;

      const { data: newFolder, error: createErr } = await supabase
        .from('vault_folders')
        .insert([{
          booking_id: bookingId,
          owner_id: owner,
          name: `${serviceTitle} • Proof Gallery`,
          status: 'in_selection',
          max_selections: 100,
        }])
        .select()
        .single();

      if (createErr) throw new Error(createErr.message);
      folder = newFolder;
    }

    // 3. Fetch files inside this folder
    const { data: files, error: filesErr } = await supabase
      .from('vault_files')
      .select('*')
      .eq('folder_id', folder.id)
      .order('created_at', { ascending: true });

    if (filesErr) throw new Error(filesErr.message);

    return {
      id: String(folder.id),
      ownerId: folder.owner_id,
      bookingId: String(folder.booking_id),
      name: folder.name,
      status: folder.status || 'in_selection',
      maxSelections: Number(folder.max_selections || 100),
      approvedAt: folder.approved_at,
      clientNotes: folder.client_notes,
      createdAt: folder.created_at,
      files: (files || []).map(mapFile),
    };
  },

  uploadProofPhoto: async (
    folderId: string, 
    uploaderId: string, 
    photo: { fileName: string; fileUrl: string; fileSize?: number; fileType?: string }
  ): Promise<VaultFile> => {
    const { data, error } = await supabase
      .from('vault_files')
      .insert([{
        folder_id: folderId,
        uploader_id: uploaderId,
        file_name: photo.fileName,
        file_url: photo.fileUrl,
        file_size_bytes: photo.fileSize || 2500000,
        file_type: photo.fileType || 'image/jpeg',
        is_selected: false,
        watermark_text: 'CAMQREW PROOF',
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapFile(data);
  },

  togglePhotoSelection: async (fileId: string, isSelected: boolean): Promise<void> => {
    const { error } = await supabase
      .from('vault_files')
      .update({ is_selected: isSelected })
      .eq('id', fileId);

    if (error) throw new Error(error.message);
  },

  updatePhotoComment: async (fileId: string, comment: string): Promise<void> => {
    const { error } = await supabase
      .from('vault_files')
      .update({ client_comment: comment })
      .eq('id', fileId);

    if (error) throw new Error(error.message);
  },

  approveAlbumSelection: async (
    folderId: string, 
    bookingId: string, 
    clientNotes?: string
  ): Promise<{ releasedMilestone: boolean }> => {
    // 1. Mark folder status as approved
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('vault_folders')
      .update({
        status: 'approved',
        approved_at: nowIso,
        client_notes: clientNotes || '',
      })
      .eq('id', folderId);

    if (updateErr) throw new Error(updateErr.message);

    // 2. Fetch booking milestones to locate the Final Deliverables milestone
    let milestoneReleased = false;
    try {
      const { data: milestones } = await supabase
        .from('booking_milestones')
        .select('*')
        .eq('booking_id', bookingId);

      if (milestones && milestones.length > 0) {
        // Find Final Deliverables milestone or the last pending milestone
        const finalMilestone = milestones.find((m: any) => 
          m.title.toLowerCase().includes('deliverable') || 
          m.title.toLowerCase().includes('final')
        ) || milestones.filter((m: any) => m.status === 'pending').pop();

        if (finalMilestone && finalMilestone.status !== 'paid') {
          await bookingApi.releaseMilestone(bookingId, finalMilestone.id);
          milestoneReleased = true;
        }
      }
    } catch (e) {
      console.warn('Could not auto-release milestone on album approval:', e);
    }

    // 3. Notify the creator
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('professional_id, studio_id, users (name)')
        .eq('id', bookingId)
        .single();

      const recipientId = booking?.professional_id || booking?.studio_id;
      if (recipientId) {
        notificationApi.sendPushNotification(recipientId, {
          title: '🎉 Client Approved Album Selection!',
          body: `Client finalized photo selection in Camqrew Vault. Final 30% milestone has been released!`,
          targetUrl: '/dashboard?tab=bookings',
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }

    return { releasedMilestone: milestoneReleased };
  },

  deleteProofPhoto: async (fileId: string): Promise<void> => {
    const { error } = await supabase
      .from('vault_files')
      .delete()
      .eq('id', fileId);

    if (error) throw new Error(error.message);
  },

  updateGallerySettings: async (
    folderId: string, 
    settings: { maxSelections?: number; name?: string }
  ): Promise<void> => {
    const payload: any = {};
    if (settings.maxSelections !== undefined) payload.max_selections = settings.maxSelections;
    if (settings.name !== undefined) payload.name = settings.name;

    const { error } = await supabase
      .from('vault_folders')
      .update(payload)
      .eq('id', folderId);

    if (error) throw new Error(error.message);
  },
};
