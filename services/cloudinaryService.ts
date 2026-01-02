export interface CloudinaryResponse {
  secure_url: string;
  resource_type: string;
  error?: { message: string };
}

export const getCloudConfig = () => ({
  cloudName: localStorage.getItem('hero_cloud_name') || '',
  uploadPreset: localStorage.getItem('hero_upload_preset') || ''
});

export const setCloudConfig = (name: string, preset: string) => {
  localStorage.setItem('hero_cloud_name', name);
  localStorage.setItem('hero_upload_preset', preset);
};

export const uploadToCloudinary = (
  file: File, 
  onProgress?: (percent: number) => void
): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    const { cloudName, uploadPreset } = getCloudConfig();

    if (!cloudName || !uploadPreset) {
      reject(new Error('Cloudinary not configured. Please check settings.'));
      return;
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    xhr.open('POST', url, true);

    // Track Upload Progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            secure_url: data.secure_url,
            resource_type: data.resource_type,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || 'Upload failed'));
        } catch (err) {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload'));
    };

    xhr.send(formData);
  });
};