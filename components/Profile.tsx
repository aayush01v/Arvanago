import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import ImageCropper from './ImageCropper.tsx';
import { uploadToImgBB } from "../utils/uploadToImgBB";
import { auth, db } from "../services/firebase";
import { Link } from 'react-router-dom';
import { getFollowers, getFollowing, getUserPosts, createPost } from '../services/firestoreService.ts';
import PostList from './PostList.tsx';
import UserListModal from './UserListModal.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedData: Partial<User>) => void;
  isDarkMode: boolean;
  onThemeToggle: (isDark: boolean) => void;
}

interface ProfileStatProps {
  icon: string;
  value: string;
  label: string;
  onClick?: () => void;
}

const ProfileStat: React.FC<ProfileStatProps> = ({ icon, value, label, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors' : ''}`}
  >
    <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">{value}</span>
    <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
  </motion.div>
);

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate, isDarkMode }) => {
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

  // Posts State
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [postCreating, setPostCreating] = useState(false);

  // Friends State
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'Friends' && user.uid) {
      setFriendsLoading(true);
      Promise.all([
        getFollowers(user.uid),
        getFollowing(user.uid)
      ]).then(([followers, following]) => {
        // Mutuals: intersection
        const mutuals = following.filter(f1 => followers.some(f2 => f2.uid === f1.uid));
        setFriends(mutuals);
      }).catch(console.error)
        .finally(() => setFriendsLoading(false));
    }
  }, [activeTab, user.uid]);

  const postImageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openFilePicker = () => fileInputRef.current?.click();

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

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (user.uid) {
        try {
          const fetchedPosts = await getUserPosts(user.uid);
          setPosts(fetchedPosts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setPostsLoading(false);
        }
      }
    };
    fetchPosts();
  }, [user.uid]);

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !user.uid) return;
    setPostCreating(true);
    try {
      let imageUrl = '';
      if (newPostImage) {
        imageUrl = await uploadToImgBB(newPostImage);
      }

      const postId = await createPost(user.uid, {
        name: user.name,
        username: user.username || '',
        avatar: user.avatar
      }, newPostContent, imageUrl);

      // Optimistic Add
      const newPost: any = {
        id: postId,
        userId: user.uid,
        user: { name: user.name, username: user.username, avatar: user.avatar },
        content: newPostContent,
        imageUrl,
        likes: 0,
        commentsCount: 0,
        createdAt: { seconds: Date.now() / 1000 } as any
      };

      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      setToastMessage("Post created!");
      setShowToast(true);
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to create post");
      setShowToast(true);
    } finally {
      setPostCreating(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-0 min-h-screen">

      {/* Cover Photo Area with Parallax feel */}
      <div className="relative w-full aspect-[2.5/1] sm:aspect-[3/1] md:aspect-[4/1] max-h-80 rounded-[2rem] overflow-hidden shadow-2xl mb-24 md:mb-28 group">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
          src={user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'}
          className="w-full h-full object-cover"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>

        {/* Avatar - Positioned Absolute Overlapping */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-16 md:-bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
        >
          <div className="relative group/avatar">
            {/* Outer gradient border ring */}
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full p-[4px] bg-gradient-to-br from-brand-primary via-purple-500 to-pink-500 shadow-2xl">
              {/* Inner white/dark ring */}
              <div className="w-full h-full rounded-full p-[4px] bg-white dark:bg-slate-900">
                {/* Avatar image */}
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Icon name="spinner" className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Camera Icon - Upload Trigger */}
            <button
              onClick={openFilePicker}
              className="absolute bottom-2 right-2 p-3 bg-white dark:bg-slate-800 rounded-full text-slate-700 dark:text-white shadow-lg hover:text-brand-primary hover:scale-110 transition-all z-20"
            >
              <Icon name="camera" className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </motion.div>
      </div>

      {/* Name & Handle */}
      <div className="text-center mb-8 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          {user.name}
        </motion.h1>

        {/* Username Display with Copy */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">@{user.username || 'username'}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user.username || '');
              setToastMessage("Username copied!");
              setShowToast(true);
            }}
            className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-all"
            title="Copy Username"
          >
            <Icon name="copy" className="w-4 h-4" />
          </button>
        </div>

        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-2">{user.jobTitle || 'Learner'}</p>

        {/* Render Bio in Header */}
        <p className="text-slate-600 dark:text-slate-300 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
          {user.bio || "Hello! I love learning and building new things."}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-10">
        <ProfileStat icon="" value={user.postsCount?.toLocaleString() || "0"} label="Posts" />
        <ProfileStat icon="" value={user.followers?.toLocaleString() || "0"} label="Followers" onClick={handleOpenFollowers} />
        <ProfileStat icon="" value={user.following?.toLocaleString() || "0"} label="Following" onClick={handleOpenFollowing} />
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pt-4">
        <div className="flex gap-8 overflow-x-auto no-scrollbar w-full sm:w-auto px-4 justify-start sm:justify-center">
          {['Profile', 'Followers', 'Friends', 'Gallery'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 font-bold text-sm transition-colors relative whitespace-nowrap ${activeTab === tab
                ? 'text-brand-primary'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
            >
              <span className="relative z-10">{tab}</span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Intro */}
        <div className="lg:col-span-1 space-y-6">
          {(user.publicEmail || user.website) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">About</h3>

              <div className="space-y-4">
                {user.publicEmail && (
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                      <Icon name="mail" className="w-5 h-5" />
                    </div>
                    <span>{user.publicEmail}</span>
                  </div>
                )}

                {user.website && (
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                      <Icon name="globe" className="w-5 h-5" />
                    </div>
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors truncate font-medium">
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Photos Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Photos</h3>
              <button onClick={() => setActiveTab('Gallery')} className="text-brand-primary text-sm font-bold hover:underline">View All</button>
            </div>

            {posts.filter(p => p.imageUrl).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {posts.filter(p => p.imageUrl).slice(0, 6).map(post => (
                  <div
                    key={post.id}
                    onClick={() => setActiveTab('Gallery')}
                    className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={post.imageUrl}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      alt="Gallery"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                <Icon name="image" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No photos yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-2 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'Profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Post Input */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-4">
                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your learning journey..."
                      className="w-full h-24 bg-transparent border-none resize-none outline-none text-slate-700 dark:text-white placeholder:text-slate-400 text-lg"
                    />
                  </div>
                  {newPostImage && (
                    <div className="relative inline-block mb-4 ml-14">
                      <img src={URL.createObjectURL(newPostImage)} className="h-40 rounded-xl shadow-lg" alt="Preview" />
                      <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1.5 shadow-md hover:bg-red-500 transition-colors"><Icon name="x" className="w-3 h-3" /></button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-100 dark:border-slate-700 ml-14">
                    <div className="flex gap-2">
                      <button onClick={() => postImageInputRef.current?.click()} className="p-2 hover:bg-brand-primary/10 rounded-full text-brand-primary transition-colors" title="Add Image">
                        <Icon name="image" className="w-5 h-5" />
                      </button>
                      <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setNewPostImage(e.target.files[0])} />
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={postCreating || (!newPostContent.trim() && !newPostImage)}
                      className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                      {postCreating ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>

                {/* Post List */}
                <PostList
                  posts={posts}
                  isOwner={true}
                  currentUserUid={user.uid}
                  currentUserData={{ name: user.name, avatar: user.avatar }}
                  onPostUpdate={(updated) => setPosts(posts.map(p => p.id === updated.id ? updated : p))}
                  onPostDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                  loading={postsLoading}
                  userName={user.name}
                />
              </motion.div>
            )}

            {(activeTab === 'Friends' || activeTab === 'Followers') && (
              <motion.div
                key="friends-followers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'Followers' ? (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon name="users" className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manage Connections</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">View and manage the people you follow and who follow you to build your learning network.</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={handleOpenFollowers} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold hover:bg-brand-primary hover:text-white transition-all">View Followers</button>
                      <button onClick={handleOpenFollowing} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold hover:bg-brand-primary hover:text-white transition-all">View Following</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[200px]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Icon name="user-check" className="w-5 h-5 text-brand-primary" /> Mutual Friends
                    </h3>
                    {friendsLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                      </div>
                    ) : friends.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map(friend => (
                          <Link to={`/u/${friend.username}`} key={friend.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                            <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                            <div className="overflow-hidden">
                              <h4 className="font-bold text-slate-900 dark:text-white truncate">{friend.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{friend.username}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <p>No mutual friends yet.</p>
                        <p className="text-sm mt-1">Follow people who follow you back!</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gallery</h3>
                {posts.filter(p => p.imageUrl).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {posts.filter(p => p.imageUrl).map(post => (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        key={post.id}
                        className="aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all"
                      >
                        <img src={post.imageUrl} className="w-full h-full object-cover" alt="Gallery" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <Icon name="image" className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No photos shared yet.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full bg-slate-900/90 dark:bg-white/90 px-6 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-2xl backdrop-blur-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
              <Icon name="check" className="h-4 w-4" />
            </div>
            {toastMessage}
          </div>
        </motion.div>
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
