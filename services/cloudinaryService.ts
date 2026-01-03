export interface CloudinaryResponse {
  secure_url: string;
  resource_type: string;
  error?: { message: string };
}

export interface UploadOptions {
  publicId?: string;
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
  options: UploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryResponse> => {
  const { cloudName, uploadPreset } = getCloudConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary not configured. Please check settings.');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            secure_url: data.secure_url,
            resource_type: data.resource_type,
          });
        } else {
          reject(new Error(data.error?.message || `Upload failed with status ${xhr.status}`));
        }
      } catch (error) {
        reject(new Error('Failed to parse upload response.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('A network error occurred during the upload.'));
    };
    
    xhr.send(formData);
  });
};
