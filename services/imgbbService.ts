
export const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // Note: The environment variable name used in utils/uploadToImgBB.js is VITE_IMGBB_KEY
    // We check both just in case, prioritizing the one we know works for Profile.
    const API_KEY = import.meta.env.VITE_IMGBB_KEY || import.meta.env.VITE_IMGBB_API_KEY || 'b86e0625f617a26ba677a2af52538183';

    if (!API_KEY || API_KEY === 'b86e0625f617a26ba677a2af52538183') {
        // Warn if likely using the dead fallback or missing key completely
        console.warn("Using potentially invalid or missing ImgBB API Key. Please set VITE_IMGBB_KEY in .env");
    }

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
        console.error('ImgBB Upload Error:', error);
        // Temporary: alert to help user see what's wrong if console is hidden
        if (typeof window !== 'undefined') alert(`Upload Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        throw error;
    }
};
