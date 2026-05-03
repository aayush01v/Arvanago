import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/canvasUtils.ts';
import Icon from './common/Icon.tsx';

// Define the Area type locally if not exported by the library
type Area = {
    x: number;
    y: number;
    width: number;
    height: number;
};

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 shadow-2xl backdrop-blur-xl flex flex-col max-h-[90dvh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(43,131,198,0.3)]">
                            <Icon name="crop" className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Adjust Image</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Icon name="x" className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {/* Cropper Container */}
                    <div className="relative h-[40dvh] min-h-[250px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner ring-1 ring-white/5 mx-auto">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                            classes={{
                                containerClassName: "rounded-2xl",
                                cropAreaClassName: "!border-2 !border-brand-primary !shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]"
                            }}
                            showGrid={true}
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 rounded-xl bg-white/5 p-4 border border-white/10">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-700 accent-brand-primary hover:bg-slate-600 transition-colors"
                            />
                            <span className="w-10 text-right text-xs font-mono text-brand-secondary">{Math.round(zoom * 100)}%</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all hover:scale-[1.02]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Icon name="check" className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageCropper;
