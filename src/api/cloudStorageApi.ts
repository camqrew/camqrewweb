import { supabase } from './supabaseClient';

export interface UploadResponse {
  url: string;
  publicId?: string;
  success: boolean;
}

export const cloudStorageApi = {
  /**
   * Upload an image File object directly to Supabase Storage.
   * Returns the public URL of the uploaded file.
   */
  uploadImage: async (
    file: File,
    folder: 'avatars' | 'aadhaar' | 'portfolio' | 'gear' | 'chat' = 'portfolio'
  ): Promise<UploadResponse> => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = ext.replace(/[^a-z0-9]/g, '');
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${cleanExt || 'jpg'}`;
      const filePath = `${folder}/${filename}`;

      // 1. Try target bucket first
      let uploadResult = await supabase.storage
        .from(folder)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || `image/${cleanExt === 'png' ? 'png' : 'jpeg'}`,
        });

      // 2. If bucket doesn't exist or errors, try fallback to 'gear'
      if (uploadResult.error && folder !== 'gear') {
        const fallbackResult = await supabase.storage
          .from('gear')
          .upload(`portfolio/${filename}`, file, {
            upsert: true,
            contentType: file.type || `image/${cleanExt === 'png' ? 'png' : 'jpeg'}`,
          });

        if (!fallbackResult.error && fallbackResult.data) {
          const { data: pubData } = supabase.storage
            .from('gear')
            .getPublicUrl(fallbackResult.data.path);

          return {
            url: pubData.publicUrl,
            publicId: fallbackResult.data.path,
            success: true,
          };
        }
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      // 3. Get public URL
      const { data: publicData } = supabase.storage
        .from(folder)
        .getPublicUrl(uploadResult.data.path);

      return {
        url: publicData.publicUrl,
        publicId: uploadResult.data.path,
        success: true,
      };
    } catch (e: any) {
      console.error('Storage upload failed:', e.message);
      throw new Error('Image upload failed: ' + (e.message || 'Network error'));
    }
  },

  /**
   * Upload multiple files in parallel or sequence.
   */
  uploadImages: async (
    files: File[],
    folder: 'avatars' | 'aadhaar' | 'portfolio' | 'gear' | 'chat' = 'portfolio'
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const res = await cloudStorageApi.uploadImage(file, folder);
      urls.push(res.url);
    }
    return urls;
  },

  /**
   * Upload a video File object directly to Supabase Storage ('reels' bucket).
   * Returns public CDN URL of the uploaded video.
   */
  uploadVideo: async (
    file: File,
    folder: string = 'reels'
  ): Promise<UploadResponse> => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const cleanExt = ext.replace(/[^a-z0-9]/g, '');
      const filename = `reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${cleanExt || 'mp4'}`;
      const filePath = filename;

      let contentType = file.type;
      if (!contentType || contentType === 'application/octet-stream') {
        if (cleanExt === 'mov') contentType = 'video/quicktime';
        else if (cleanExt === 'webm') contentType = 'video/webm';
        else if (cleanExt === 'm4v') contentType = 'video/x-m4v';
        else if (cleanExt === 'mkv') contentType = 'video/x-matroska';
        else if (cleanExt === 'avi') contentType = 'video/x-msvideo';
        else contentType = 'video/mp4';
      }

      // 1. Try target bucket first
      let uploadResult = await supabase.storage
        .from(folder)
        .upload(filePath, file, {
          upsert: false,
          contentType,
        });

      // 2. If bucket errors, retry with fallback 'camcrew-media'
      if (uploadResult.error && folder !== 'camcrew-media') {
        console.warn(`Primary bucket '${folder}' upload error: ${uploadResult.error.message}. Trying 'camcrew-media'...`);
        const fallbackResult = await supabase.storage
          .from('camcrew-media')
          .upload(`reels/${filename}`, file, {
            upsert: false,
            contentType,
          });

        if (!fallbackResult.error && fallbackResult.data) {
          const { data: pubData } = supabase.storage
            .from('camcrew-media')
            .getPublicUrl(fallbackResult.data.path);

          return {
            url: pubData.publicUrl,
            publicId: fallbackResult.data.path,
            success: true,
          };
        }
      }

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      // Get public CDN URL
      const { data: publicData } = supabase.storage
        .from(folder)
        .getPublicUrl(uploadResult.data.path);

      return {
        url: publicData.publicUrl,
        publicId: uploadResult.data.path,
        success: true,
      };
    } catch (e: any) {
      console.error('Video upload failed:', e.message);
      throw new Error('Video upload failed: ' + (e.message || 'Network error'));
    }
  },
};
