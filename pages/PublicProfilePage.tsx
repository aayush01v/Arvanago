import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { User, Course } from '../types';
import { getUserByUsername } from '../services/firestoreService';
import { chatService } from '../services/chatService';
import Icon from '../components/common/Icon';
import UserListModal from '../components/UserListModal';
import PostList from '../components/PostList';
import { SidebarLayoutContext } from '../components/SidebarLayout';

const PublicProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useOutletContext<SidebarLayoutContext>();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            if (!username) return;
            // If viewing own profile via public link, use context to save a read
            if (currentUser && currentUser.username === username) {
                setProfileUser(currentUser);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const user = await getUserByUsername(username);
                if (user) {
                    setProfileUser(user);
                } else {
                    setError('User not found.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [username, currentUser]);

    const handleMessage = async () => {
        if (!currentUser || !profileUser) return;
        try {
            const chatId = await chatService.getOrCreateChat(currentUser.uid, profileUser.uid);
            navigate('/chat', { state: { chatId, recipientUser: profileUser } });
        } catch (err) {
            console.error("Failed to start chat", err);
        }
    };

    const isOwner = currentUser && profileUser ? currentUser.uid === profileUser.uid : false;
    const isPrivate = profileUser?.isPublic === false;

    const [posts, setPosts] = useState<import('../types').Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [postCreating, setPostCreating] = useState(false);

    useEffect(() => {
        if (profileUser?.uid) {
            import('../services/firestoreService').then(({ getUserPosts }) => {
                getUserPosts(profileUser.uid).then(fetchedPosts => {
                    setPosts(fetchedPosts);
                    setPostsLoading(false);
                });
            });
        }
    }, [profileUser?.uid]);

    const handleCreatePost = async () => {
        if (!currentUser || !profileUser) return;
        setPostCreating(true);
        try {
            const { createPost } = await import('../services/firestoreService');
            const { uploadToImgBB } = await import('../utils/uploadToImgBB');

            let imageUrl = '';
            if (newPostImage) {
                imageUrl = await uploadToImgBB(newPostImage);
            }

            const postId = await createPost(currentUser.uid, {
                name: profileUser.name,
                username: profileUser.username || '',
                avatar: profileUser.avatar
            }, newPostContent, imageUrl);

            // Optimistic Add
            const newPost: any = {
                id: postId,
                userId: currentUser.uid,
                user: { name: profileUser.name, username: profileUser.username, avatar: profileUser.avatar },
                content: newPostContent,
                imageUrl,
                likes: 0,
                commentsCount: 0,
                createdAt: { seconds: Date.now() / 1000 } as any
            };

            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setNewPostImage(null);
        } catch (e) {
            console.error(e);
        } finally {
            setPostCreating(false);
        }
    };

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (currentUser && profileUser && !isOwner) {
            import('../services/firestoreService').then(service => {
                service.isFollowingUser(currentUser.uid, profileUser.uid).then(setIsFollowing);
            });
        }
    }, [currentUser, profileUser, isOwner]);

    const handleFollowToggle = async () => {
        if (!currentUser || !profileUser || followLoading) return;
        setFollowLoading(true);

        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        setProfileUser(prev => prev ? ({
            ...prev,
            followers: (prev.followers || 0) + (newStatus ? 1 : -1)
        }) : null);

        try {
            const { followUser, unfollowUser } = await import('../services/firestoreService');
            if (newStatus) {
                await followUser(currentUser.uid, profileUser.uid);
            } else {
                await unfollowUser(currentUser.uid, profileUser.uid);
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            setIsFollowing(!newStatus);
            setProfileUser(prev => prev ? ({
                ...prev,
                followers: (prev.followers || 0) + (newStatus ? -1 : 1)
            }) : null);
        } finally {
            setFollowLoading(false);
        }
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState<User[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    const handleOpenFollowers = async () => {
        if (!profileUser?.uid) return;
        setModalTitle('Followers');
        setModalOpen(true);
        setModalLoading(true);
        try {
            const { getFollowers } = await import('../services/firestoreService');
            const users = await getFollowers(profileUser.uid);
            setModalUsers(users);
        } catch (e) { console.error(e); }
        finally { setModalLoading(false); }
    };

    const handleOpenFollowing = async () => {
        if (!profileUser?.uid) return;
        setModalTitle('Following');
        setModalOpen(true);
        setModalLoading(true);
        try {
            const { getFollowing } = await import('../services/firestoreService');
            const users = await getFollowing(profileUser.uid);
            setModalUsers(users);
        } catch (e) { console.error(e); }
        finally { setModalLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
            </div>
        );
    }

    if (error || !profileUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full mb-4">
                    <Icon name="alert-circle" className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{error || 'Profile not found'}</h2>
                <button onClick={() => navigate(-1)} className="text-brand-primary hover:underline font-medium">Go Back</button>
            </div>
        );
    }

    if (isPrivate && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 text-slate-400">
                    <Icon name="lock" className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">This profile is private</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                    @{profileUser.username} has limited who can view their profile details.
                </p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        Return Home
                    </button>
                    <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2
                         ${isFollowing
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                                : 'bg-brand-primary text-white shadow-brand-primary/25 hover:bg-brand-secondary hover:scale-105'
                            }`}
                    >
                        {isFollowing ? (
                            <>
                                <Icon name="check" className="w-4 h-4" />
                                <span>Following</span>
                            </>
                        ) : (
                            <>
                                <Icon name="user-plus" className="w-4 h-4" />
                                <span>Follow</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
            {/* Header / Cover */}
            <div className="relative group">
                {/* 1. Cover Image */}
                <div className="h-32 md:h-64 rounded-b-none rounded-t-3xl overflow-hidden shadow-sm bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 relative z-0">
                    {profileUser.coverPhoto ? (
                        <img src={profileUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    )}
                </div>

                {/* 2. Profile Bar (Avatar + Actions) */}
                <div className="px-5 md:px-10">
                    <div className="relative flex justify-between items-start">
                        {/* Avatar - Pull up negative margin to overlap banner */}
                        <div className="relative -mt-12 md:-mt-20 z-10">
                            <div className="h-24 w-24 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800 p-1">
                                <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full rounded-full object-cover" />
                            </div>
                        </div>

                        {/* Action Buttons - Right aligned, slightly offset from top to sit nicely */}
                        <div className="mt-3 flex gap-3">
                            {!isOwner && (
                                <div className="flex gap-2 md:gap-3">
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 font-bold rounded-full md:rounded-xl shadow-lg transition-all active:scale-95 text-sm md:text-base
                                                    ${isFollowing
                                                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-xl'
                                            }`}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>

                                    <button
                                        onClick={handleMessage}
                                        className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-brand-primary text-white font-bold rounded-full md:rounded-xl shadow-lg shadow-brand-primary/25 hover:bg-brand-secondary hover:scale-105 transition-all active:scale-95 text-sm md:text-base"
                                    >
                                        <Icon name="message-circle" className="w-5 h-5" />
                                        <span className="hidden md:inline">Message</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Identity Block - Flows naturally below */}
                    <div className="mt-3 md:mt-4 space-y-1">
                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                            {profileUser.name}
                        </h1>
                        <div className="text-slate-500 font-medium text-base md:text-lg flex flex-wrap gap-2 items-center">
                            <span className="text-brand-primary">@{profileUser.username}</span>
                            {profileUser.jobTitle && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                        <Icon name="briefcase" className="w-4 h-4" />
                                        {profileUser.jobTitle}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Bio & Stats */}
                <div className="space-y-6">
                    {profileUser.bio && (
                        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-white/40 dark:border-white/5 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">About</h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{profileUser.bio}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center">
                            <div className="text-xl md:text-2xl font-black text-brand-primary">{profileUser.level || 1}</div>
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Level</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center">
                            <div className="text-xl md:text-2xl font-black text-emerald-500">{profileUser.streak || 0}</div>
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Day Streak</div>
                        </div>
                        <div onClick={handleOpenFollowers} className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="text-xl md:text-2xl font-black text-blue-500">{profileUser.followers || 0}</div>
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Followers</div>
                        </div>
                        <div onClick={handleOpenFollowing} className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="text-xl md:text-2xl font-black text-purple-500">{profileUser.following || 0}</div>
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Following</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Feed and Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Create Post Widget (Owner Only) */}
                    {isOwner && (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex gap-4">
                                <img src={profileUser.avatar} className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        placeholder="What's on your mind?"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-primary/50 resize-none h-20 text-slate-700 dark:text-gray-200"
                                    />
                                    {newPostImage && (
                                        <div className="relative inline-block">
                                            <img src={URL.createObjectURL(newPostImage)} className="h-20 w-20 object-cover rounded-xl" />
                                            <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><Icon name="x" className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <label className="cursor-pointer text-slate-500 hover:text-brand-primary transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Icon name="image" className="w-5 h-5" />
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setNewPostImage(e.target.files[0])} />
                                        </label>
                                        <button
                                            onClick={handleCreatePost}
                                            disabled={postCreating || (!newPostContent.trim() && !newPostImage)}
                                            className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {postCreating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="send" className="w-4 h-4" />}
                                            <span>Post</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Posts Feed */}
                    <div className="space-y-6">
                        <PostList
                            posts={posts}
                            isOwner={isOwner}
                            currentUserUid={currentUser ? currentUser.uid : null}
                            currentUserData={currentUser ? { name: currentUser.name, avatar: currentUser.avatar } : undefined}
                            onPostUpdate={(updated) => setPosts(posts.map(p => p.id === updated.id ? updated : p))}
                            onPostDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                            loading={postsLoading}
                            userName={profileUser.name}
                        />
                    </div>
                </div>
            </div>

            <UserListModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                users={modalUsers}
                loading={modalLoading}
            />
        </div >
    );
};

export default PublicProfilePage;
