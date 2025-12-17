import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import EditProfileModal from './EditProfileModal.tsx';
import ImageCropper from './ImageCropper.tsx';
import { uploadToImgBB } from "../utils/uploadToImgBB";
import { auth, db } from "../services/firebase";

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedData: Partial<User>) => void;
}

const ProfileStat: React.FC<{ icon: string; value: string; label: string; color: string; }> = ({ icon, value, label, color }) => (
  <div className="interactive-card flex items-center p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 shadow-lg">
    <div className={`p-4 rounded-2xl mr-5 ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 group-hover:scale-110`}>
      <Icon name={icon} className={`w-8 h-8 text-${color.replace('bg-', '')}-600 dark:text-${color.replace('bg-', '')}-400`} />
    </div>
    <div>
      <p className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm">{value}</p>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Photo updated");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedImage) URL.revokeObjectURL(selectedImage);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setCropModalOpen(true);
    if (e.target) e.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    setUploading(true);
    setCropModalOpen(false); // Close cropper immediately or keep open with loading state? Better close and show spinner on avatar.

    try {
      const imgUrl = await uploadToImgBB(croppedFile);

      const current = auth.currentUser;
      if (!current) throw new Error("User not logged in");

      const userRef = doc(db, "users", current.uid);
      await updateDoc(userRef, { avatar: imgUrl });

      setAvatarUrl(imgUrl);
      onProfileUpdate({ avatar: imgUrl });
      setToastMessage("Photo updated successfully");
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update photo");
      setShowToast(true);
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleCancelCrop = () => {
    setCropModalOpen(false);
    setSelectedImage(null);
  };

  // Calculate level progress
  const pointsForCurrentLevel = (user.level - 1) * 1000;
  const pointsForNextLevel = user.level * 1000;
  const pointsInCurrentLevel = user.points - pointsForCurrentLevel;
  const pointsNeededForLevelUp = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForLevelUp) * 100));

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-12 p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-[3rem] glass-ambient p-8 md:p-12 shadow-2xl border border-white/50 dark:border-white/10">
          {/* Decorative Background Elements */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-secondary/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
            <div className="relative group">
              <div className="relative w-40 h-40 md:w-48 md:h-48">
                <div className="absolute -inset-2 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary rounded-full animate-rotate-slow opacity-75 blur-sm"></div>

                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>

                <button
                  onClick={openFilePicker}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute bottom-1 right-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-white/20 hover:scale-110 active:scale-95 transition-all group/edit"
                >
                  {uploading ? (
                    <svg className="animate-spin h-5 w-5 text-brand-primary" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  ) : (
                    <Icon name="edit" className="h-5 w-5 text-slate-700 dark:text-white group-hover/edit:text-brand-primary" />
                  )}
                </button>
              </div>


              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0 pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h1>
                  <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium mt-2">{user.bio || `Level ${user.level} - Passionate Learner`}</p>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold shadow-sm hover:shadow-md hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all flex items-center justify-center gap-2 self-center md:self-start"
                >
                  <Icon name="edit" className="w-4 h-4" /> Edit Profile
                </button>
              </div>

              <div className="bg-white/30 dark:bg-slate-900/30 rounded-2xl p-6 backdrop-blur-sm border border-white/20 dark:border-white/5 mt-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Level Progress</span>
                  <span className="font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full text-xs">
                    {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevelUp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] relative">
                    <div className="absolute inset-0 bg-white/20 animate-pulse-bright" />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
                  <span>Level {user.level}</span>
                  <span>Level {user.level + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProfileStat icon="star" value={user.points.toLocaleString()} label="Total Points" color="bg-yellow-400" />
          <ProfileStat icon="flame" value={`${user.streak} Days`} label="Learning Streak" color="bg-red-500" />
          <ProfileStat icon="award" value={`${user.level}`} label="Current Level" color="bg-blue-500" />
          <ProfileStat icon="courses" value={`${user.ongoingCourses.length}`} label="Active Courses" color="bg-green-500" />
          <ProfileStat icon="check" value="8" label="Courses Completed" color="bg-purple-500" />
          <ProfileStat icon="leaderboard" value="#3" label="All-Time Rank" color="bg-indigo-500" />
        </div>

        {/* Achievements */}
        <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-yellow-400/10 text-yellow-500">
              <Icon name="award" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Achievements</h3>
              <p className="text-slate-500 dark:text-slate-400">Badges you've earned on your journey.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {['Scholar', 'Streak Master', 'Quick Learner', 'Top 10', 'Quantum Explorer', 'History Buff'].map(badge => (
              <div key={badge} className="group relative flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-32 text-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-yellow-400/30 cursor-pointer">
                <div className="relative p-4 mb-3">
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
                  <Icon name="award" className="w-8 h-8 text-yellow-500 relative z-10 drop-shadow-sm" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{badge}</span>
              </div>
            ))}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl w-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 opacity-50">
              <span className="text-xs font-semibold text-slate-400">More coming soon</span>
            </div>
          </div>
        </div>
      </div>


      {isCropModalOpen && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="toast-float flex items-center gap-3 rounded-full bg-white/90 px-6 py-3 text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-slate-900/90 dark:text-white dark:ring-white/10 animate-fade-in-up">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
              <Icon name="check" className="h-4 w-4" />
            </div>
            {toastMessage}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditModalOpen(false)}
          onSave={onProfileUpdate}
        />
      )}
    </>
  );
};

export default Profile;
