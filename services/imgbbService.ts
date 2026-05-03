
export const uploadToImgBB = async (file: File): Promise<string> => {
    // C-2 Fix: Removed hardcoded API key fallback — it was bundled into client JS
    // and exposed to anyone viewing page source. Always require the env var.
    const API_KEY = import.meta.env.VITE_IMGBB_KEY || import.meta.env.VITE_IMGBB_API_KEY;

    if (!API_KEY) {
        throw new Error('Image upload is not configured. Please contact support.');
    }

    // H-1 Fix: Validate file size and MIME type before uploading
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    if (file.size > MAX_SIZE_BYTES) {
        throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Unsupported file type "${file.type}". Please upload a JPEG, PNG, WebP, or GIF.`);
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.display_url;
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        // H-2 Fix: Removed alert() call — it blocked the UI and leaked internal error info.
        // Errors propagate to the calling component which handles user-facing messaging.
        console.error('ImgBB Upload Error:', error);
        throw error;
    }
};
