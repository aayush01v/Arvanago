import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import firebase from 'firebase/compat/app';
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import { updateUserProfile } from '../services/firestoreService.ts';
import ImageCropper from './ImageCropper.tsx';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: Partial<User>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username || '');
    const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
    const [bio, setBio] = useState(user.bio || '');
    const [website, setWebsite] = useState(user.website || '');
    const [publicEmail, setPublicEmail] = useState(user.publicEmail || '');
    const [isPublic, setIsPublic] = useState(user.isPublic ?? true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [avatar, setAvatar] = useState(user.avatar);

    // Image Cropper State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hydration check
    if (typeof document === 'undefined') return null;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setAvatar(reader.result as string);
            setSelectedImage(null); // Close cropper
        };
        reader.readAsDataURL(croppedFile);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }

        // Weekly Handle Limit Check
        if (username !== user.username) {
            if (user.lastHandleChangeDate) {
                const lastChange = user.lastHandleChangeDate.toMillis();
                const now = Date.now();
                const diffTime = Math.abs(now - lastChange);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const cooldownDays = 7;

                if (diffDays < cooldownDays) {
                    setError(`You can only change your handle once every 7 days. Try again in ${cooldownDays - diffDays} days.`);
                    return;
                }
            }
        }

        setError('');
        setIsLoading(true);

        try {
            // Check if username is taken
            if (username !== user.username) {
                const { getUserByUsername } = await import('../services/firestoreService');
                const existingUser = await getUserByUsername(username);
                if (existingUser) {
                    setError('Username is already taken. Please choose another one.');
                    setIsLoading(false);
                    return;
                }
            }

            // Include avatar in the update if it changed
            const updatedData: any = {
                name,
                username,
                jobTitle,
                bio,
                website,
                publicEmail,
                isPublic,
                avatar: avatar !== user.avatar ? avatar : undefined
            };

            // If username changed, update the timestamp
            if (username !== user.username) {
                updatedData.lastHandleChangeDate = firebase.firestore.FieldValue.serverTimestamp();
            }

            if (!updatedData.avatar) delete updatedData.avatar;

            await updateUserProfile(user.uid, updatedData);

            onSave({ ...user, ...updatedData });
            onClose();
        } catch (err) {
            console.error("Failed to update profile:", err);
            setError("Could not save changes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 transition-all"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90dvh] animate-scale-in border border-slate-200 dark:border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Sticky */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-slate-900 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-6 scrollbar-hide flex-1">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-brand-primary/20">
                                <img src={avatar || user.avatar} alt="Profile" className="h-full w-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <Icon name="camera" className="h-8 w-8 text-white" />
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-brand-primary text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                                <Icon name="edit" className="h-4 w-4" />
                            </button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tap to change photo</p>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Title / Headline</label>
                        <input
                            type="text"
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Student, Software Engineer"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username (Chat Handle)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400">@</span>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                placeholder="username"
                                className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            placeholder="Tell us a little about yourself"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition resize-none dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="publicEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Public Email</label>
                        <input
                            type="email"
                            id="publicEmail"
                            value={publicEmail}
                            onChange={(e) => setPublicEmail(e.target.value)}
                            placeholder="e.g. contact@example.com"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400">
                                <Icon name="globe" className="w-5 h-5" />
                            </span>
                            <input
                                type="url"
                                id="website"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://your-website.com"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 rounded-xl outline-none transition dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Public Profile Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                <Icon name={isPublic ? 'users' : 'lock'} className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Public Profile</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isPublic ? 'Anyone on the internet can see your profile' : 'Only you can see your profile'}
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20 dark:peer-focus:ring-brand-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                        </label>
                    </div>

                </div>

                {/* Footer - Sticky */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-slate-900 z-10 flex justify-end gap-3">
                    {error && <p className="text-red-500 text-sm absolute left-6 bottom-20 max-w-[200px] truncate">{error}</p>}

                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all duration-300 shadow-lg shadow-brand-primary/25 active:scale-95 disabled:bg-gray-400 disabled:scale-100 disabled:shadow-none min-w-[100px] flex items-center justify-center"
                    >
                        {isLoading ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setSelectedImage(null)}
                />
            )}
        </div>,
        document.body
    );
};

export default EditProfileModal;
