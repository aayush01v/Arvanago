import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BlogPost, Comment, User } from '@/types';
import { getBlogPost, hasUserLikedBlogPost, getBlogComments, addBlogComment, toggleCommentLike, addCommentReply, pinComment, deleteBlogComment } from '@/services/firestoreService';
import { uploadToImgBB } from '@/services/imgbbService';
import Icon from '@/components/common/Icon';
import { useOutletContext } from 'react-router-dom';
import { SidebarLayoutContext } from '@/components/SidebarLayout';
import BlogPostReader from '@/components/BlogPostReader';
import { STATIC_POSTS } from '@/data/staticPosts';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@/components/SEO';

const BlogPostPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const postId = id;

    const { user } = useOutletContext<SidebarLayoutContext>();
    const navigate = useNavigate();

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyImageUrl, setReplyImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await uploadToImgBB(file);
            setImageUrl(url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await uploadToImgBB(file);
            setReplyImageUrl(url);
        } catch (error) {
            console.error("Reply upload failed", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (!postId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Try to fetch comments regardless of post source
                const fetchedComments = await getBlogComments(postId);
                setComments(fetchedComments);

                // 2. Check Static Posts
                const staticPost = STATIC_POSTS.find(p => p.id === postId || p.slug === postId);

                // 3. Check Firestore for dynamic post or override
                // We'll prioritize Firestore if it exists, otherwise fall back to static
                let finalPost: BlogPost | null = null;

                try {
                    const fetchedPost = await getBlogPost(postId);
                    if (fetchedPost) {
                        finalPost = fetchedPost;
                    }
                } catch (e) {
                    // Ignore error if not found in DB, just fallback
                }

                if (finalPost) {
                    setPost(finalPost);
                } else if (staticPost) {
                    // If using static post, we should use the REAL comment count from fetchedComments
                    setPost({
                        ...staticPost,
                        commentsCount: fetchedComments.length
                    });
                } else {
                    setError("Article not found.");
                }

            } catch (err) {
                console.error("Error fetching blog post data:", err);
                // Fallback to static if everything fails
                const staticPost = STATIC_POSTS.find(p => p.id === postId || p.slug === postId);
                if (staticPost) {
                    setPost(staticPost);
                } else {
                    setError("Failed to load article.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [postId, user?.uid]);


    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Proceed to save comment to Firestore regardless of whether post is static or dynamic
        if (!user || !postId || !newComment.trim()) return;

        try {
            setSubmittingComment(true);
            const addedComment = await addBlogComment(postId, user, newComment.trim(), imageUrl || undefined);
            setComments([addedComment, ...comments]);
            setPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
            setNewComment('');
            setImageUrl('');
        } catch (err) {
            console.error("Failed to post comment:", err);
            // alert("Failed to post comment"); // Optional: Feedback
        } finally {
            setSubmittingComment(false);
        }

        // Return early to avoid running the code below which is now duplicate or unreachable if we didn't remove it
        return;


    };

    const handleReplySubmit = async (commentId: string) => {
        if (!user || !postId || !replyText.trim()) return;

        try {
            const reply = await addCommentReply(postId, commentId, user, replyText, replyImageUrl || undefined);
            // Update local state deeply
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return { ...c, replies: [...(c.replies || []), reply] };
                }
                return c;
            }));
            setReplyingTo(null);
            setReplyText('');
            setReplyImageUrl('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        // Could show toast here
    };

    const toggleLike = async (commentId: string) => {
        if (!user || !postId) return navigate('/login');

        // Optimistic UI
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                const likes = c.likes || [];
                const hasLiked = likes.includes(user.uid);
                return {
                    ...c,
                    likes: hasLiked ? likes.filter(id => id !== user.uid) : [...likes, user.uid]
                };
            }
            return c;
        }));

        try {
            await toggleCommentLike(postId, commentId, user.uid);
        } catch (err) { }
    };

    const handlePin = async (commentId: string, currentPinStatus: boolean) => {
        if (!user || user.role !== 'admin' || !postId) return;
        try {
            await pinComment(postId, commentId, !currentPinStatus);
            // Refresh comments to re-order and sync
            const fetchedComments = await getBlogComments(postId);
            setComments(fetchedComments);
        } catch (err: any) {
            alert(err.message || "Failed to pin");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!user || user.role !== 'admin' || !postId) return;
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        try {
            await deleteBlogComment(postId, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete comment");
        }
    };



    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded px-4 w-3/4 mb-4 animate-pulse" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded px-4 w-1/2 mb-12 animate-pulse" />
                <div className="space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6 animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen pt-24 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{error || "Article not found"}</h2>
                <Link to="/blog" className="text-brand-primary hover:underline">Return to Blog</Link>
            </div>
        );
    }

    // Prepare text snippet from ReactMarkdown source if pure text needed, but excerpt is better
    const seoDescription = post.excerpt || post.content.substring(0, 160) + '...';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative">
            <SEO
                title={post.title}
                description={seoDescription}
                image={post.coverImage || 'https://edusimulate.vercel.app/default-blog-og.jpg'}
                type="article"
                keywords={post.tags}
                author={post.author.name}
                publishedTime={typeof post.createdAt === 'object' ? new Date((post.createdAt as any).seconds * 1000).toISOString() : new Date().toISOString()}
            />

            {/* Back button (Fixed) */}

            <BlogPostReader post={post} />

            {/* Interaction Bar (Floating) - Responsive Tweaks */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl flex items-center gap-4 md:gap-6 max-w-[90vw] overflow-x-auto custom-scrollbar">

                <button
                    onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-primary whitespace-nowrap"
                >
                    <Icon name="message-circle" className="w-5 h-5 md:w-6 md:h-6" />
                    {/* Show actual length if we have comments, otherwise 0. Don't show fake static count unless loading? 
                        Actually, simply showing comments.length is most honest. 
                        If it's a static post, we might have loaded 'fake' comments in strict mode, 
                        but if comments array is empty, it should say 0. 
                    */}
                    <span className="font-bold text-sm md:text-base">{comments.length}</span>
                </button>

            </div>


            {/* Comments Section */}
            <section id="comments-section" className="max-w-3xl mx-auto px-6 pb-32">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Discussion</h3>

                {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-12 flex gap-4">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all resize-y min-h-[100px]"
                                required
                            />

                            {/* Image Upload Integration */}
                            <div className="mt-2 flex items-center gap-3">
                                <label className="cursor-pointer flex items-center gap-2 text-sm text-slate-500 hover:text-brand-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <Icon name="image" className="w-5 h-5" />
                                    <span>{isUploading ? 'Uploading...' : 'Add Image'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                </label>

                                {imageUrl && (
                                    <div className="relative group">
                                        <img src={imageUrl} alt="Preview" className="h-10 w-10 rounded object-cover border border-slate-200 dark:border-slate-700" />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={submittingComment || !newComment.trim() || isUploading}
                                    className="px-6 py-2 bg-brand-primary text-white font-bold rounded-full disabled:opacity-50 hover:bg-brand-primary-dark transition-colors"
                                >
                                    {submittingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl text-center mb-12 border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-600 dark:text-slate-400 mb-4">Log in to join the discussion.</p>
                        <Link to="/login" className="text-brand-primary font-bold hover:underline">Sign In / Sign Up</Link>
                    </div>
                )}


                <div className="space-y-6">
                    <AnimatePresence>
                        {comments.map(comment => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={comment.id}
                                className={`flex gap-4 ${comment.isPinned ? 'border-l-4 border-brand-primary pl-4' : ''}`}
                            >
                                <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{comment.user.name}</span>
                                                {comment.user.isAdmin && <Icon name="check-circle" className="w-4 h-4 text-brand-primary" />}
                                                {comment.isPinned && <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">Pinned</span>}
                                                <span className="text-xs text-slate-500">
                                                    {new Date(comment.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Admin Controls (Kebab Menu) */}
                                            {user?.role === 'admin' && (
                                                <div className="relative group/menu">
                                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                        <Icon name="more-vertical" className="w-4 h-4 text-slate-400" />
                                                    </button>

                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover/menu:block z-10">
                                                        <button
                                                            onClick={() => handlePin(comment.id, comment.isPinned || false)}
                                                            className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-primary flex items-center gap-2"
                                                        >
                                                            <Icon name="pin" className="w-3 h-3" />
                                                            {comment.isPinned ? 'Unpin' : 'Pin'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                                        >
                                                            <Icon name="trash-2" className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.text}</p>

                                        {/* Comment Image */}
                                        {comment.imageUrl && (
                                            <img src={comment.imageUrl} alt="Comment attachment" className="mt-3 rounded-lg max-h-60 object-cover" />
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-3">
                                            <button
                                                onClick={() => toggleLike(comment.id)}
                                                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comment.likes?.includes(user?.uid || '') ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                                            >
                                                <Icon name="heart" className={`w-3.5 h-3.5 ${comment.likes?.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                                                {comment.likes?.length || 0}
                                            </button>

                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 ml-4 space-y-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                                            {comment.replies.map((reply, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <img src={reply.user.avatar} className="w-6 h-6 rounded-full" />
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <span className="font-bold text-sm block">{reply.user.name}</span>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{reply.text}</p>
                                                        {reply.imageUrl && (
                                                            <img src={reply.imageUrl} alt="Reply attachment" className="mt-2 rounded-lg max-h-40 object-cover" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {replyingTo === comment.id && user && (
                                        <div className="mt-3 ml-2">
                                            <div className="flex gap-2 animate-fade-in-up">
                                                <input
                                                    autoFocus
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleReplySubmit(comment.id)}
                                                    className="flex-1 px-4 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                                    placeholder="Write a reply..."
                                                />
                                                <label className="cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors self-center">
                                                    <Icon name="image" className={`w-5 h-5 text-slate-500 ${isUploading ? 'animate-pulse opacity-50' : ''}`} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleReplyImageUpload} disabled={isUploading} />
                                                </label>
                                                <button
                                                    onClick={() => handleReplySubmit(comment.id)}
                                                    disabled={!replyText.trim() || isUploading}
                                                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primary-dark transition-colors disabled:opacity-50 self-center"
                                                >
                                                    <Icon name="send" className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {replyImageUrl && (
                                                <div className="mt-2 relative inline-block">
                                                    <img src={replyImageUrl} alt="Reply preview" className="h-12 w-12 rounded object-cover border border-slate-200" />
                                                    <button
                                                        onClick={() => setReplyImageUrl('')}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
};

export default BlogPostPage;
