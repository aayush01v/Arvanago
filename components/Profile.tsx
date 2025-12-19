import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import EditProfileModal from './EditProfileModal.tsx';
import ImageCropper from './ImageCropper.tsx';
import { uploadToImgBB } from "../utils/uploadToImgBB";
import { auth, db } from "../services/firebase";
import { Link } from 'react-router-dom';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedData: Partial<User>) => void;
}

import UserListModal from './UserListModal.tsx';
import { getFollowers, getFollowing } from '../services/firestoreService.ts';

interface ProfileStatProps {
  icon: string;
  value: string;
  label: string;
  color: string;
  onClick?: () => void;
}

const ProfileStat: React.FC<ProfileStatProps> = ({ icon, value, label, color, onClick }) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors' : ''}`}
  >
    <span className="text-xl font-bold text-slate-900 dark:text-white">{value}</span>
    <span className="text-sm text-slate-500 font-medium">{label}</span>
  </div>
);

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Profile' | 'Followers' | 'Friends' | 'Gallery'>('Profile');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Image Upload State
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Photo updated");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();
  const openCoverPicker = () => coverInputRef.current?.click();

  const handleOpenFollowers = async () => {
    setModalTitle('Followers');
    setModalOpen(true);
    setModalLoading(true);
    try {
      const users = await getFollowers(user.uid);
      setModalUsers(users);
    } catch (e) { console.error(e); }
    finally { setModalLoading(false); }
  };

  const handleOpenFollowing = async () => {
    setModalTitle('Following');
    setModalOpen(true);
    setModalLoading(true);
    try {
      const users = await getFollowing(user.uid);
      setModalUsers(users);
    } catch (e) { console.error(e); }
    finally { setModalLoading(false); }
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Auto-assign username if missing
  useEffect(() => {
    const assignHandle = async () => {
      if (!user.username && auth.currentUser) {
        const cleanName = user.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'User';
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newHandle = `${cleanName}_${randomSuffix}`;

        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, { username: newHandle });
          onProfileUpdate({ username: newHandle });
          // Optional: Notify user
          setToastMessage(`Your handle has been set to @${newHandle}`);
          setShowToast(true);
        } catch (error) {
          console.error("Failed to auto-assign handle:", error);
        }
      }
    };
    assignHandle();
  }, [user.username, user.name, onProfileUpdate]);

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setCropModalOpen(true);
    if (e.target) e.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    setUploading(true);
    setCropModalOpen(false);
    try {
      const imgUrl = await uploadToImgBB(croppedFile);
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { avatar: imgUrl });
        setAvatarUrl(imgUrl);
        onProfileUpdate({ avatar: imgUrl });
        setToastMessage("Profile photo updated");
        setShowToast(true);
      }
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update photo");
      setShowToast(true);
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleCoverChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For cover photo, just upload directly for now (simplified)
    setToastMessage("Uploading cover...");
    setShowToast(true);
    try {
      const imgUrl = await uploadToImgBB(file);
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { coverPhoto: imgUrl });
        onProfileUpdate({ coverPhoto: imgUrl });
        setToastMessage("Cover photo updated");
      }
    } catch (e) {
      setToastMessage("Failed to upload cover");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-0">

      {/* Cover Photo Area */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl mb-16 md:mb-20 group">
        <img
          src={user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'}
          className="w-full h-full object-cover"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
        <button onClick={openCoverPicker} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
          <Icon name="edit" className="w-5 h-5" />
        </button>
        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />

        {/* Avatar - Positioned Absolute Overlapping */}
        <div className="absolute -bottom-12 md:-bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl">
              <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </div>
            <button onClick={openFilePicker} className="absolute bottom-1 right-1 md:bottom-2 md:right-1 p-1.5 md:p-2 bg-brand-primary rounded-full text-white shadow-lg hover:bg-brand-secondary transition-colors">
              <Icon name="camera" className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-3 text-center whitespace-nowrap">{user.name}</h1>

          {/* Username Display with Copy */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">@{user.username || 'username'}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.username || '');
                setToastMessage("Username copied!");
                setShowToast(true);
              }}
              className="p-1 text-slate-400 hover:text-brand-primary transition-colors"
              title="Copy Username"
            >
              <Icon name="copy" className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium text-center mt-1">{user.jobTitle || 'Learner'}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mx-auto dark:text-gray-200">
          <ProfileStat icon="" value={user.postsCount?.toLocaleString() || "0"} label="Posts" color="" />
          <ProfileStat icon="" value={user.followers?.toLocaleString() || "0"} label="Followers" color="" onClick={handleOpenFollowers} />
          <ProfileStat icon="" value={user.following?.toLocaleString() || "0"} label="Following" color="" onClick={handleOpenFollowing} />
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">

          <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm md:text-base">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto">
        {['Profile', 'Followers', 'Friends', 'Gallery'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-4 font-semibold text-sm transition-all relative ${activeTab === tab
              ? 'text-brand-primary'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Intro */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 section-transition">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Introduction</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              {user.bio || "Hello! I love learning and building new things."}
            </p>

            <div className="space-y-4">
              {user.jobTitle && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Icon name="briefcase" className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{user.jobTitle}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Icon name="mail" className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{user.email}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Icon name="globe" className="w-4 h-4 text-slate-500" />
                </div>
                <a href="#" className="hover:text-brand-primary transition-colors">www.edusimulate.com</a>
              </div>
            </div>
          </div>

          {/* Photos Widget (Mock) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 section-transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Photos</h3>
              <button className="text-brand-primary text-sm font-semibold">View All</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i + user.uid}/200`} className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" alt="Gallery" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-2 space-y-6">

          {/* Post Input */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <textarea
              placeholder="Share your thoughts..."
              className="w-full h-24 bg-transparent border-none resize-none outline-none text-slate-700 dark:text-white placeholder:text-slate-400 text-lg"
            ></textarea>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-brand-primary"><Icon name="image" className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-blue-500"><Icon name="paperclip" className="w-5 h-5" /></button>
              </div>
              <button className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all">Post</button>
            </div>
          </div>

          {/* Sample Post */}
          {[1, 2].map(post => (
            <div key={post} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 section-transition">
              <div className="flex gap-4 mb-4">
                <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="User" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{user.name}</h4>
                  <span className="text-xs text-slate-400">15 min ago</span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Just finished the new {user.ongoingCourses[0] || 'Web Development'} module! The interactive labs are incredible. 🚀 #Learning #Tech
              </p>
              {post === 1 && (
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" className="w-full h-64 object-cover" alt="Post" />
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                  <Icon name="heart" className="w-5 h-5" /> <span className="text-sm font-semibold">24</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
                  <Icon name="message-circle" className="w-5 h-5" /> <span className="text-sm font-semibold">5</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 transition-colors ml-auto">
                  <Icon name="share-2" className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Modals */}
      {isCropModalOpen && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => { setCropModalOpen(false); setSelectedImage(null); }}
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
      <UserListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        users={modalUsers}
        loading={modalLoading}
      />
    </div>
  );
};

export default Profile;
