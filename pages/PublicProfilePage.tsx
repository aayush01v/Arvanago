import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Course } from '../types';
import { getUserByUsername } from '../services/firestoreService';
import { chatService } from '../services/chatService';
import Icon from '../components/common/Icon';
import { auth } from '../services/firebase';
import UserListModal from '../components/UserListModal';

const PublicProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUserUid(user ? user.uid : null);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!username) return;
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
    }, [username]);

    const handleMessage = async () => {
        if (!currentUserUid || !profileUser) return;
        try {
            const chatId = await chatService.getOrCreateChat(currentUserUid, profileUser.uid);
            navigate('/chat', { state: { chatId, recipientUser: profileUser } });
        } catch (err) {
            console.error("Failed to start chat", err);
        }
    };

    const isOwner = currentUserUid && profileUser ? currentUserUid === profileUser.uid : false;
    const isPrivate = profileUser?.isPublic === false;

    const [posts, setPosts] = useState<import('../types').Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [postCreating, setPostCreating] = useState(false);
    const [editingPost, setEditingPost] = useState<import('../types').Post | null>(null);

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
        if (!currentUserUid || !profileUser) return;
        setPostCreating(true);
        try {
            const { createPost } = await import('../services/firestoreService');
            const { uploadToImgBB } = await import('../utils/uploadToImgBB');

            let imageUrl = '';
            if (newPostImage) {
                imageUrl = await uploadToImgBB(newPostImage);
            }

            const postId = await createPost(currentUserUid, {
                name: profileUser.name,
                username: profileUser.username || '',
                avatar: profileUser.avatar
            }, newPostContent, imageUrl);

            // Optimistic Add (simplified, real app should allow server time)
            const newPost: any = {
                id: postId,
                userId: currentUserUid,
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

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const { deletePost } = await import('../services/firestoreService');
            await deletePost(postId, currentUserUid!);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (e) { console.error(e); }
    };

    const handleUpdatePost = async () => {
        if (!editingPost) return;
        try {
            const { updatePost } = await import('../services/firestoreService');
            await updatePost(editingPost.id, editingPost.content, editingPost.imageUrl);
            setPosts(posts.map(p => p.id === editingPost.id ? editingPost : p));
            setEditingPost(null);
        } catch (e) { console.error(e); }
    };

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (currentUserUid && profileUser && !isOwner) {
            import('../services/firestoreService').then(service => {
                service.isFollowingUser(currentUserUid, profileUser.uid).then(setIsFollowing);
            });
        }
    }, [currentUserUid, profileUser, isOwner]);

    const handleFollowToggle = async () => {
        if (!currentUserUid || !profileUser || followLoading) return;
        setFollowLoading(true);

        // Optimistic Update
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        setProfileUser(prev => prev ? ({
            ...prev,
            followers: (prev.followers || 0) + (newStatus ? 1 : -1)
        }) : null);

        try {
            const { followUser, unfollowUser } = await import('../services/firestoreService');
            if (newStatus) {
                await followUser(currentUserUid, profileUser.uid);
            } else {
                await unfollowUser(currentUserUid, profileUser.uid);
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            // Revert on failure
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
                <div className="h-48 md:h-64 rounded-3xl overflow-hidden shadow-sm bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 relative">
                    {profileUser.coverPhoto ? (
                        <img src={profileUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    )}
                </div>

                <div className="absolute -bottom-16 left-8 md:left-12 flex items-end">
                    <div className="relative">
                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800 p-1">
                            <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {!isOwner && (
                    <div className="absolute -bottom-16 right-4 md:right-8 flex gap-3 pb-4 md:pb-0">
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl shadow-lg transition-all active:scale-95
                             ${isFollowing
                                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-xl'
                                }`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        <button
                            onClick={handleMessage}
                            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/25 hover:bg-brand-secondary hover:scale-105 transition-all active:scale-95"
                        >
                            <Icon name="message-circle" className="w-5 h-5" />
                            <span>Message</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-20 px-4 md:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{profileUser.name}</h1>
                        <p className="text-brand-primary font-medium text-lg">@{profileUser.username}</p>
                        {profileUser.jobTitle && <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2"><Icon name="briefcase" className="w-4 h-4" /> {profileUser.jobTitle}</p>}
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
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center">
                                <div className="text-2xl font-black text-brand-primary">{profileUser.level || 1}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Level</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center">
                                <div className="text-2xl font-black text-emerald-500">{profileUser.streak || 0}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Day Streak</div>
                            </div>
                            <div onClick={handleOpenFollowers} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <div className="text-2xl font-black text-blue-500">{profileUser.followers || 0}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Followers</div>
                            </div>
                            <div onClick={handleOpenFollowing} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <div className="text-2xl font-black text-purple-500">{profileUser.following || 0}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Following</div>
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
                            {postsLoading ? (
                                <div className="text-center py-10"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div></div>
                            ) : posts.length === 0 ? (
                                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-white/40 dark:border-white/5 shadow-sm text-center py-16">
                                    <Icon name="edit-3" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-400">No posts yet</h3>
                                    <p className="text-slate-400 mt-2">When {profileUser.name} posts updates, they will appear here.</p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <img src={post.user.avatar} className="w-10 h-10 rounded-full bg-slate-100" />
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{post.user.name}</h4>
                                                    <p className="text-xs text-slate-500">{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                                                </div>
                                            </div>
                                            {isOwner && (
                                                <div className="relative group/menu">
                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><Icon name="more-horizontal" className="w-5 h-5" /></button>
                                                    <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover/menu:block z-10">
                                                        <button onClick={() => setEditingPost(post)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">Edit</button>
                                                        <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-500">Delete</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Mode */}
                                        {editingPost?.id === post.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editingPost.content}
                                                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-primary/50 resize-none h-24 text-slate-700 dark:text-gray-200"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingPost(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                                                    <button onClick={handleUpdatePost} className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                                                {post.imageUrl && (
                                                    <img src={post.imageUrl} className="w-full rounded-2xl mb-4 object-cover max-h-96" />
                                                )}
                                            </>
                                        )}

                                        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                            <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors group">
                                                <Icon name="heart" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-medium">{post.likes}</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                <Icon name="message-square" className="w-5 h-5" />
                                                <span className="text-sm font-medium">{post.commentsCount}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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
        </div>
    );
};

export default PublicProfilePage;
