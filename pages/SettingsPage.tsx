import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Icon from '../components/common/Icon';
import { SidebarLayoutContext } from '../components/SidebarLayout';
import { requestAccountDeletion, updateUserProfile } from '../services/firestoreService';
import { User } from '../types';
import { uploadToImgBB } from '../utils/uploadToImgBB';
import { auth, db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

interface SettingsPageProps {
    user: User | null;
    onProfileUpdate: (userData: Partial<User>) => void;
    isDarkMode: boolean;
    onThemeToggle: (isDark: boolean) => void;
}

const SettingsPage: React.FC = () => {
    const { user, onProfileUpdate, isDarkMode, onThemeToggle } = useOutletContext<SidebarLayoutContext>();

    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'account'>('general');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Profile Form State
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [website, setWebsite] = useState(user?.website || '');
    const [publicEmail, setPublicEmail] = useState(user?.publicEmail || '');
    const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);

    // Upload State
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [coverPhoto, setCoverPhoto] = useState(user?.coverPhoto || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Sync state with user prop changes if needed (optional, depends on re-fetch behavior)
    // React.useEffect(() => {
    //     if (user) {
    //         setName(user.name);
    //         // ... other fields
    //     }
    // }, [user]);

    if (!user) return <div className="p-8 text-center text-slate-500">Please log in to manage settings.</div>;

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const imgUrl = await uploadToImgBB(file);
            setAvatar(imgUrl);
            // Auto-save avatar or wait for explicit save? 
            // Usually settings forms require explicit save, but for images immediate feedback is nice.
            // Let's change state only and let user save to persist, OR separate image upload to immediate.
            // Based on user request "Settings should be in page form not popup", usually implies a "Save Changes" button.
            // But for images, immediate upload + unsaved state is tricky. Let's do immediate visual, explicit save.
        } catch (err) {
            console.error(err);
            setError("Failed to upload image");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const imgUrl = await uploadToImgBB(file);
            setCoverPhoto(imgUrl);
        } catch (err) {
            console.error(err);
            setError("Failed to upload cover");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            // Weekly Handle Limit Check Logic moved here
            if (username !== user.username) {
                if (user.lastHandleChangeDate) {
                    const lastChange = user.lastHandleChangeDate.toMillis();
                    const now = Date.now();
                    const diffDays = Math.ceil(Math.abs(now - lastChange) / (1000 * 60 * 60 * 24));
                    if (diffDays < 7) {
                        setError(`You can only change your handle once every 7 days. Try again in ${7 - diffDays} days.`);
                        setIsLoading(false);
                        return;
                    }
                }
                // Check uniqueness
                const { getUserByUsername } = await import('../services/firestoreService');
                const existingUser = await getUserByUsername(username);
                if (existingUser) {
                    setError('Username is already taken.');
                    setIsLoading(false);
                    return;
                }
            }

            const updatedData: any = {
                name,
                username,
                jobTitle,
                bio,
                website,
                publicEmail,
                isPublic,
                avatar,
                coverPhoto
            };

            if (username !== user.username) {
                updatedData.lastHandleChangeDate = firebase.firestore.FieldValue.serverTimestamp();
            }

            await updateUserProfile(user.uid, updatedData);
            onProfileUpdate(updatedData);
            setSuccessMessage("Profile updated successfully!");

            // Clear success message after 3s
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error("Failed to save profile:", err);
            setError("Could not save changes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset to original user data
        setName(user.name);
        setUsername(user.username || '');
        setJobTitle(user.jobTitle || '');
        setBio(user.bio || '');
        setWebsite(user.website || '');
        setPublicEmail(user.publicEmail || '');
        setIsPublic(user.isPublic ?? true);
        setAvatar(user.avatar);
        setCoverPhoto(user.coverPhoto || '');
        setError('');
        setSuccessMessage('');
    };

    const handleDeleteRequest = async () => {
        setIsDeleting(true);
        try {
            await requestAccountDeletion(user.uid);
            onProfileUpdate({ deletionRequested: true });
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Failed to request deletion", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-fade-in overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Sidebar Navigation for Settings */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        {/* Mobile: Horizontal scroll tabs */}
                        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                            >
                                <Icon name="user" className="w-4 h-4" />
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('appearance')}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${activeTab === 'appearance' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                            >
                                <Icon name="moon" className="w-4 h-4" />
                                Appearance
                            </button>
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${activeTab === 'account' ? 'bg-red-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                            >
                                <Icon name="trash" className="w-4 h-4" />
                                Account
                            </button>
                        </nav>

                        {/* Desktop: Vertical nav */}
                        <nav className="hidden lg:block space-y-1 sticky top-0">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'general' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Icon name="user" className="w-5 h-5" />
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('appearance')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'appearance' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Icon name="moon" className="w-5 h-5" />
                                Appearance
                            </button>
                            <button
                                onClick={() => setActiveTab('account')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'account' ? 'bg-red-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Icon name="trash" className="w-5 h-5" />
                                Account
                            </button>
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Profile Information</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Update your public profile details.</p>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                                            <Icon name="alert-circle" className="w-5 h-5 shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 text-sm rounded-xl flex items-center gap-2">
                                            <Icon name="check" className="w-5 h-5 shrink-0" />
                                            {successMessage}
                                        </div>
                                    )}

                                    {/* Images Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo</label>
                                            <div className="flex items-center gap-6">
                                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                                                        <img src={avatar || user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Icon name="camera" className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Change Avatar
                                                    </button>
                                                    <p className="text-xs text-slate-500 mt-2">Recommended: Square, max 2MB</p>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleAvatarChange}
                                                        className="hidden"
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cover Photo</label>
                                            <div className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer group border-2 border-slate-200 dark:border-slate-700" onClick={() => coverInputRef.current?.click()}>
                                                <img
                                                    src={coverPhoto || user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'}
                                                    className="w-full h-full object-cover"
                                                    alt="Cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-medium flex items-center gap-2">
                                                        <Icon name="image" className="w-5 h-5" /> Change Cover
                                                    </span>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                ref={coverInputRef}
                                                onChange={handleCoverChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors dark:text-white"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-2.5 text-slate-400">@</span>
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors dark:text-white"
                                                    placeholder="username"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors resize-none dark:text-white"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Job Title</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-2.5 text-slate-400 flex items-center justify-center">
                                                    <Icon name="briefcase" className="w-5 h-5" />
                                                </span>
                                                <input
                                                    type="text"
                                                    value={jobTitle}
                                                    onChange={(e) => setJobTitle(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors dark:text-white"
                                                    placeholder="e.g. Software Engineer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-2.5 text-slate-400 flex items-center justify-center">
                                                    <Icon name="globe" className="w-5 h-5" />
                                                </span>
                                                <input
                                                    type="url"
                                                    value={website}
                                                    onChange={(e) => setWebsite(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors dark:text-white"
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Public Email</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-2.5 text-slate-400 flex items-center justify-center">
                                                    <Icon name="mail" className="w-5 h-5" />
                                                </span>
                                                <input
                                                    type="email"
                                                    value={publicEmail}
                                                    onChange={(e) => setPublicEmail(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors dark:text-white"
                                                    placeholder="contact@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 md:col-span-2">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPublic}
                                                    onChange={(e) => setIsPublic(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Public Profile</span>
                                                <span className="block text-xs text-slate-500">Allow others to see your profile and posts.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Theme Preferences</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Customize how the application looks.</p>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                <Icon name={isDarkMode ? 'moon' : 'sun'} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                                                <p className="text-xs text-slate-500">Toggle between light and dark themes</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isDarkMode}
                                                onChange={(e) => onThemeToggle(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20 dark:peer-focus:ring-brand-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Irreversible actions for your account.</p>

                                    <div className="p-4 border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-slate-900 dark:text-white">Delete Account</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {user.deletionRequested
                                                        ? `Deletion requested on ${user.deletionRequestedAt?.toDate().toLocaleDateString()}`
                                                        : 'Permanently hide your profile and content.'}
                                                </p>
                                            </div>
                                            {user.deletionRequested ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg">Requested</span>
                                            ) : (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Delete Account
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>



                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Account?</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                This will request your account for deletion. An admin will review and process your request. You will lose access to your account.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteRequest}
                                    disabled={isDeleting}
                                    className="px-4 py-2 font-medium bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Requesting...' : 'Confirm Deletion'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
