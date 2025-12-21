
export const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // Note: In a real app, you should use an environment variable for the API Key
    // VITE_IMGBB_API_KEY. For now, we'll try to use a provided one or throw an error.
    const API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'b86e0625f617a26ba677a2af52538183'; // Fallback demo key (often revocable)

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
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
