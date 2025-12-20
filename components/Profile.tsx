import React, { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { User } from '../types.ts';
import Icon from './common/Icon.tsx';
import ImageCropper from './ImageCropper.tsx';
import { uploadToImgBB } from "../utils/uploadToImgBB";
import { auth, db } from "../services/firebase";
import { Link } from 'react-router-dom';
import { getFollowers, getFollowing, getUserPosts, createPost, requestAccountDeletion } from '../services/firestoreService.ts';
import PostList from './PostList.tsx';
import UserListModal from './UserListModal.tsx';

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

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate, isDarkMode, onThemeToggle }) => {
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

  // Close settings on click outside






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



  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-0">

      {/* Cover Photo Area */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1] max-h-80 rounded-[2rem] md:rounded-[2.5rem] overflow-visible shadow-2xl mb-0 group">
        <div className="w-full h-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
          <img
            src={user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'}
            className="w-full h-full object-cover"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"></div>
        </div>

        {/* Avatar - Positioned Absolute Overlapping */}
        <div className="absolute -bottom-20 md:-bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <div className="relative">
            {/* Outer gradient border ring */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-br from-brand-primary via-purple-500 to-pink-500 shadow-2xl">
              {/* Inner white/dark ring */}
              <div className="w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-900">
                {/* Avatar image */}
                <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-slate-800/50">
                  <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                </div>
              </div>
            </div>
            {/* Camera Icon - Upload Trigger */}
            <button onClick={openFilePicker} className="absolute bottom-2 right-2 md:bottom-3 md:right-3 p-2.5 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all ring-2 ring-white dark:ring-slate-900">
              <Icon name="edit-3" className="w-4 h-4" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          {/* Name & Handle */}

        </div>
      </div>

      {/* Name & Handle */}
      <div className="mt-24 md:mt-28 text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap">{user.name}</h1>

        {/* Username Display with Copy */}
        <div className="flex items-center justify-center gap-2 mt-1">
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

        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-2">{user.jobTitle || 'Learner'}</p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 md:p-6 mb-6 border border-slate-100 dark:border-slate-700">
        <div className="flex flex-row w-full md:w-auto justify-around gap-2 md:gap-12 mx-auto dark:text-gray-200">
          <ProfileStat icon="" value={user.postsCount?.toLocaleString() || "0"} label="Posts" color="" />
          <ProfileStat icon="" value={user.followers?.toLocaleString() || "0"} label="Followers" color="" onClick={handleOpenFollowers} />
          <ProfileStat icon="" value={user.following?.toLocaleString() || "0"} label="Following" color="" onClick={handleOpenFollowing} />
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          {user.deletionRequested && (
            <span className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-semibold border border-red-200">Deletion Requested</span>
          )}
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Bio</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              {user.bio || "Hello! I love learning and building new things."}
            </p>

            <div className="space-y-4">
              {user.jobTitle && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Icon name="briefcase" className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{user.jobTitle}</span>
                </div>
              )}

              {user.publicEmail && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Icon name="mail" className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{user.publicEmail}</span>
                </div>
              )}

              {user.website && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <Icon name="globe" className="w-4 h-4 text-slate-500" />
                  </div>
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors truncate">
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Photos Widget (Mock) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 section-transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Photos</h3>
              <button onClick={() => setActiveTab('Gallery')} className="text-brand-primary text-sm font-semibold hover:underline">View All</button>
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
              <div className="text-center py-8 text-slate-400">
                <Icon name="image" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No photos yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-2 space-y-6">

          {activeTab === 'Profile' && (
            <>
              {/* Post Input */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full h-24 bg-transparent border-none resize-none outline-none text-slate-700 dark:text-white placeholder:text-slate-400 text-lg"
                ></textarea>
                {newPostImage && (
                  <div className="relative inline-block mb-4">
                    <img src={URL.createObjectURL(newPostImage)} className="h-20 rounded-xl" alt="Preview" />
                    <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Icon name="x" className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex gap-2">
                    <button onClick={() => postImageInputRef.current?.click()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-brand-primary">
                      <Icon name="image" className="w-5 h-5" />
                    </button>
                    <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setNewPostImage(e.target.files[0])} />
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={postCreating || (!newPostContent.trim() && !newPostImage)}
                    className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            </>
          )}

          {(activeTab === 'Friends' || activeTab === 'Followers') && activeTab === 'Followers' ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
              <Icon name="users" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Connections</h3>
              <p className="text-slate-400 mt-2">Manage your followers and friends in the connections modal.</p>
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={handleOpenFollowers} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600">View Followers</button>
                <button onClick={handleOpenFollowing} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600">View Following</button>
              </div>
            </div>
          ) : activeTab === 'Friends' ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Friends (Mutuals)</h3>
              {friendsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                </div>
              ) : friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map(friend => (
                    <Link to={`/profile/${friend.username}`} key={friend.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
                  <Icon name="users" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No mutual friends yet.</p>
                  <p className="text-sm mt-1">Follow people who follow you back!</p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'Gallery' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gallery</h3>
              {posts.filter(p => p.imageUrl).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {posts.filter(p => p.imageUrl).map(post => (
                    <div key={post.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={post.imageUrl} className="w-full h-full object-cover" alt="Gallery" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Icon name="image" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No photos shared yet.</p>
                </div>
              )}
            </div>
          )}

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
