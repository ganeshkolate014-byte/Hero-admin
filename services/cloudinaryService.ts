export interface CloudinaryResponse {
  secure_url: string;
  resource_type: string;
  error?: { message: string };
}

export interface UploadOptions {
  publicId?: string;
  overwrite?: boolean;
}

// User-provided permanent values
const PERMANENT_CLOUD_NAME = 'dj5hhott5';
const PERMANENT_UPLOAD_PRESET = 'My smallest server';

export const getCloudConfig = () => ({
  cloudName: localStorage.getItem('hero_cloud_name') || PERMANENT_CLOUD_NAME,
  uploadPreset: localStorage.getItem('hero_upload_preset') || PERMANENT_UPLOAD_PRESET
});

export const setCloudConfig = (name: string, preset: string) => {
  localStorage.setItem('hero_cloud_name', name);
  localStorage.setItem('hero_upload_preset', preset);
};

export const uploadToCloudinary = async (
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryResponse> => {
  const { cloudName, uploadPreset } = getCloudConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary not configured. Please check settings.');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (options.publicId) {
    formData.append('public_id', options.publicId);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
    }

    return {
      secure_url: data.secure_url,
      resource_type: data.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};