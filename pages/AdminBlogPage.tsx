
import React, { useEffect, useState } from 'react';
import { BlogPost, User } from '@/types';
import { getAllBlogPostsAdmin, createBlogPost, createBlogPostWithId, updateBlogPost, deleteBlogPost } from '@/services/firestoreService';
import Icon from '@/components/common/Icon';
// import { useOutletContext } from 'react-router-dom';
// import { SidebarLayoutContext } from '@/components/SidebarLayout';
import { serverTimestamp } from 'firebase/firestore'; // Import needed for timestamps if we construct them manually, but service handles it usually. 
// Actually service handles it.

import { STATIC_POSTS } from '@/data/staticPosts';

const AdminBlogPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Fallback or direct fetch if context not available
        // Since this page is protected by AdminRoute, user should be logged in.
        // But for "author" field we need the object. 
        // We'll rely on current auth or a quick fetch if needed.
        // For now, let's use firebase.auth().currentUser and map it to User type coarsely
        import('@/services/firebase').then(({ auth }) => {
            const unsubscribe = auth.onAuthStateChanged(u => {
                if (u) {
                    // We might want to fetch full profile from Firestore if needed
                    // for now, minimal info is enough for 'author' field
                    setUser({
                        uid: u.uid,
                        name: u.displayName || 'Admin',
                        email: u.email || '',
                        avatar: u.photoURL || '',
                        role: 'admin', // Assumed if here
                        // other fields...
                        createdCourses: [],
                        enrolledCourses: [],
                        completedLectures: [],
                        wishlist: [],
                        bio: '',
                        joinDate: '',
                        lastActive: ''
                    } as unknown as User);
                }
            });
            return () => unsubscribe();
        });
    }, []);

    // Edit/Create Mode
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const fetchedPosts = await getAllBlogPostsAdmin();

            // Merge with STATIC_POSTS
            // Eliminate duplicates if they exist in both (prioritize fetched/dynamic)
            const dynamicIds = new Set(fetchedPosts.map(p => p.id));
            const distinctStaticPosts = STATIC_POSTS.filter(p => !dynamicIds.has(p.id));

            setPosts([...fetchedPosts, ...distinctStaticPosts]);
        } catch (err) {
            console.error("Error fetching posts for admin:", err);
            setError("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setCurrentPost({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            coverImage: '',
            tags: [],
            isPublished: false,
        });
        setIsEditing(true);
    };

    const handleEdit = (post: BlogPost) => {
        setCurrentPost(post);
        setIsEditing(true);
    };

    const handleDelete = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

        try {
            await deleteBlogPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            console.error("Failed to delete post:", err);
            alert("Failed to delete post.");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPost.title || !currentPost.content) {
            alert("Title and Content are required.");
            return;
        }

        try {
            setSaveLoading(true);

            // Auto-generate slug if empty
            let slug = currentPost.slug;
            if (!slug) {
                slug = currentPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            const postData: Partial<BlogPost> = {
                title: currentPost.title,
                slug,
                content: currentPost.content,
                excerpt: currentPost.excerpt || '',
                coverImage: currentPost.coverImage || '',
                tags: Array.isArray(currentPost.tags) ? currentPost.tags : (currentPost.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean),
                isPublished: currentPost.isPublished || false,
                author: currentPost.author || {
                    uid: user?.uid || '',
                    name: user?.name || 'Admin',
                    avatar: user?.avatar || ''
                }
            };

            if (currentPost.id) {
                // Update
                try {
                    await updateBlogPost(currentPost.id, postData);
                } catch (err: any) {
                    // Check if error is "No document to update" (Static post migration)
                    if (err.message && err.message.includes("No document to update")) {
                        console.info("Migrating static post to Firestore:", currentPost.id);

                        // Sanitize createdAt to avoid "Unsupported field value: a function"
                        // because static posts have a mock object with functions
                        let validCreatedAt = serverTimestamp();
                        if (currentPost.createdAt && typeof (currentPost.createdAt as any).toDate === 'function') {
                            validCreatedAt = (currentPost.createdAt as any).toDate();
                        }

                        await createBlogPostWithId(currentPost.id, {
                            ...postData,
                            createdAt: validCreatedAt as any,
                            likes: currentPost.likes || 0,
                            commentsCount: currentPost.commentsCount || 0
                        });
                    } else {
                        throw err;
                    }
                }

                // Optimistic update
                setPosts(prev => prev.map(p => p.id === currentPost.id ? { ...p, ...postData } as BlogPost : p));
            } else {
                // Create
                const newId = await createBlogPost(postData);
                // Reload list to get full object with timestamps
                await fetchPosts();
            }

            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save post:", err);
            alert("Failed to save post: " + (err as any).message);
        } finally {
            setSaveLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-brand-primary">
                    <Icon name="arrow-left" className="w-4 h-4" />
                    Back to List
                </button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                    {currentPost.id ? 'Edit Post' : 'New Post'}
                </h1>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={currentPost.title}
                            onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
                        <input
                            type="text"
                            value={currentPost.slug}
                            onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            placeholder="Auto-generated if empty"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Excerpt</label>
                        <textarea
                            value={currentPost.excerpt}
                            onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-24"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content (Markdown supported)</label>
                        <textarea
                            value={currentPost.content}
                            onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-96 font-mono text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Image URL</label>
                        <input
                            type="text"
                            value={currentPost.coverImage}
                            onChange={(e) => setCurrentPost({ ...currentPost, coverImage: e.target.value })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={Array.isArray(currentPost.tags) ? currentPost.tags.join(', ') : currentPost.tags}
                            onChange={(e) => setCurrentPost({ ...currentPost, tags: e.target.value.split(',') })}
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={currentPost.isPublished}
                            onChange={(e) => setCurrentPost({ ...currentPost, isPublished: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 dark:text-slate-300">Publish immediately</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="px-6 py-2 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-50"
                        >
                            {saveLoading ? 'Saving...' : 'Save Post'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // List View
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Blog Management</h1>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-dark transition-colors"
                >
                    <Icon name="plus" className="w-5 h-5" />
                    New Post
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading posts...</div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">{error}</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 font-medium">No posts found. Create your first one!</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Author</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {posts.map(post => (
                                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{post.title}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-xs">{post.slug}</p>
                                        </td>
                                        <td className="p-4">
                                            {post.isPublished ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Published</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Draft</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {post.author.name}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date((post.createdAt as any).seconds * 1000).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(post)}
                                                    className="p-2 text-slate-500 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Icon name="edit-3" className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Icon name="trash-2" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogPage;
