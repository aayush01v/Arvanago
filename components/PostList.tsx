import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '../types';
import Icon from './common/Icon';
import {
    deletePost,
    updatePost,
    toggleLikePost,
    addComment,
    getComments,
    hasUserLikedPost,
    PostComment,
    deleteComment
} from '../services/firestoreService';

interface PostListProps {
    posts: Post[];
    isOwner: boolean;
    currentUserUid: string | null;
    currentUserData?: { name: string; avatar: string };
    onPostUpdate: (updatedPost: Post) => void;
    onPostDelete: (postId: string) => void;
    loading?: boolean;
    emptyMessage?: string;
    userName?: string;
}

const PostItem: React.FC<{
    post: Post;
    isOwner: boolean;
    currentUserUid: string | null;
    currentUserData?: { name: string; avatar: string };
    onUpdate: (post: Post) => void;
    onDelete: (postId: string) => void;
}> = ({ post, isOwner, currentUserUid, currentUserData, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    // Interaction State
    const [likesCount, setLikesCount] = useState(post.likes || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const [comments, setComments] = useState<PostComment[]>([]);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Sync props to state if they change externally
    useEffect(() => {
        setLikesCount(post.likes || 0);
        setCommentsCount(post.commentsCount || 0);
    }, [post.likes, post.commentsCount]);

    // Check if liked by current user
    useEffect(() => {
        let mounted = true;
        if (currentUserUid) {
            hasUserLikedPost(post.id, currentUserUid).then(liked => {
                if (mounted) setIsLiked(liked);
            });
        }
        return () => { mounted = false; };
    }, [post.id, currentUserUid]);

    // Load comments when opened
    useEffect(() => {
        if (showComments && comments.length === 0) {
            setCommentsLoading(true);
            getComments(post.id)
                .then(fetchedComments => setComments(fetchedComments))
                .catch(console.error)
                .finally(() => setCommentsLoading(false));
        }
    }, [showComments, post.id]); // Removed comments.length to avoid loops, explicit load needed if count > 0 but empty locally? Logic is fine for open-once.

    const handleVote = async () => {
        if (!currentUserUid || likeLoading) return;

        // Optimistic Update
        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousLiked);
        setLikesCount(prev => previousLiked ? prev - 1 : prev + 1);
        setLikeLoading(true);

        try {
            const resultIsLiked = await toggleLikePost(post.id, currentUserUid);
            setIsLiked(resultIsLiked); // Sync with server result
            // Count handles itself via optimistic, usually accurate enough
        } catch (error) {
            // Revert
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
            console.error(error);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || !currentUserUid || !currentUserData) return;

        setSubmittingComment(true);
        try {
            const comment = await addComment(post.id, currentUserUid, currentUserData, newCommentText.trim());
            setComments(prev => [...prev, comment]);
            setCommentsCount(prev => prev + 1);
            setNewCommentText('');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            await deleteComment(post.id, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setCommentsCount(prev => prev - 1);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveEdit = async () => {
        if (editContent.trim() === post.content) {
            setIsEditing(false);
            return;
        }
        try {
            await updatePost(post.id, editContent);
            onUpdate({ ...post, content: editContent });
            setIsEditing(false);
        } catch (e) { console.error(e); }
    };

    const handleDeletePost = async () => {
        if (!confirm('Delete this post?')) return;
        try {
            if (!currentUserUid) return;
            await deletePost(post.id, currentUserUid);
            onDelete(post.id);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in-up transition-all hover:shadow-md">
            {/* Header */}
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
                            <button onClick={() => setIsEditing(true)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">Edit</button>
                            <button onClick={handleDeletePost} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-500">Delete</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-primary/50 resize-none h-24 text-slate-700 dark:text-gray-200"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium">Save</button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                    {post.imageUrl && (
                        <div className="mb-4">
                            <img src={post.imageUrl} className="w-full rounded-2xl object-cover max-h-96" alt="Post content" loading="lazy" />
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                    onClick={handleVote}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                >
                    <Icon name="heart" className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-sm font-medium">{likesCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 transition-colors ${showComments ? 'text-brand-primary' : 'text-slate-400 hover:text-brand-primary'}`}
                >
                    <Icon name="message-square" className="w-5 h-5" />
                    <span className="text-sm font-medium">{commentsCount}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                    {/* Comment Form */}
                    <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
                        <img
                            src={currentUserData?.avatar || 'https://i.pravatar.cc/150'}
                            className="w-8 h-8 rounded-full bg-slate-100 object-cover flex-shrink-0"
                            alt="Your avatar"
                        />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-full py-2 px-4 focus:ring-1 focus:ring-brand-primary text-sm text-slate-800 dark:text-white pr-10"
                                disabled={submittingComment}
                            />
                            <button
                                type="submit"
                                disabled={!newCommentText.trim() || submittingComment}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-primary disabled:opacity-50 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <Icon name="send" className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    {commentsLoading ? (
                        <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <img src={comment.user.avatar} className="w-8 h-8 rounded-full bg-slate-100 object-cover flex-shrink-0" alt={comment.user.name} />
                                        <div className="flex-1">
                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-2 inline-block max-w-full">
                                                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white">{comment.user.name}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {comment.createdAt?.seconds
                                                            ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString()
                                                            : 'Just now'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{comment.text}</p>
                                            </div>
                                            {(currentUserUid === comment.userId || isOwner) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="block mt-1 text-[10px] text-slate-400 hover:text-red-500 font-medium ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-slate-400 py-4 italic">No comments yet. Be the first!</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PostList: React.FC<PostListProps> = ({
    posts,
    isOwner,
    currentUserUid,
    currentUserData,
    onPostUpdate,
    onPostDelete,
    loading = false,
    emptyMessage = "No posts yet",
    userName = "User"
}) => {
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
                <PostItem
                    key={post.id}
                    post={post}
                    isOwner={isOwner || post.userId === currentUserUid} // Allow post owner to edit even if not profile owner (though typically same)
                    currentUserUid={currentUserUid}
                    currentUserData={currentUserData}
                    onUpdate={onPostUpdate}
                    onDelete={onPostDelete}
                />
            ))}
        </div>
    );
};

export default PostList;
