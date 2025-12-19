import React, { useState } from 'react';
import { Post } from '../types';
import Icon from './common/Icon';
import { deletePost, updatePost } from '../services/firestoreService';

interface PostListProps {
    posts: Post[];
    isOwner: boolean;
    currentUserUid: string | null;
    onPostUpdate: (updatedPost: Post) => void;
    onPostDelete: (postId: string) => void;
    loading?: boolean;
    emptyMessage?: string;
    userName?: string;
}

const PostList: React.FC<PostListProps> = ({
    posts,
    isOwner,
    currentUserUid,
    onPostUpdate,
    onPostDelete,
    loading = false,
    emptyMessage = "No posts yet",
    userName = "User"
}) => {
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            if (!currentUserUid) return;
            await deletePost(postId, currentUserUid);
            onPostDelete(postId);
        } catch (e) { console.error(e); }
    };

    const handleUpdate = async () => {
        if (!editingPost) return;
        try {
            await updatePost(editingPost.id, editingPost.content, editingPost.imageUrl);
            onPostUpdate(editingPost);
            setEditingPost(null);
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-white/40 dark:border-white/5 shadow-sm text-center py-16">
                <Icon name="edit-3" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">{emptyMessage}</h3>
                <p className="text-slate-400 mt-2">When {userName} posts updates, they will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <img src={post.user.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover" alt={post.user.name} />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{post.user.name}</h4>
                                <p className="text-xs text-slate-500">
                                    {post.createdAt?.seconds
                                        ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
                                        : 'Just now'}
                                </p>
                            </div>
                        </div>
                        {isOwner && (
                            <div className="relative group/menu">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400">
                                    <Icon name="more-horizontal" className="w-5 h-5" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover/menu:block z-10">
                                    <button onClick={() => setEditingPost(post)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">Edit</button>
                                    <button onClick={() => handleDelete(post.id)} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-500">Delete</button>
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
                                <button onClick={handleUpdate} className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && (
                                <img src={post.imageUrl} className="w-full rounded-2xl mb-4 object-cover max-h-96" alt="Post content" />
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
            ))}
        </div>
    );
};

export default PostList;
