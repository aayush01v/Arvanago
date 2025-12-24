
import React, { useEffect, useState } from 'react';
import { BlogPost, User } from '@/types';
import { getAllBlogPostsAdmin, createBlogPost, createBlogPostWithId, updateBlogPost, deleteBlogPost } from '@/services/firestoreService';
import Icon from '@/components/common/Icon';
import BlogPostReader from '@/components/BlogPostReader';
import { serverTimestamp } from 'firebase/firestore';
import { STATIC_POSTS } from '@/data/staticPosts';

const AdminBlogPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        import('@/services/firebase').then(({ auth }) => {
            const unsubscribe = auth.onAuthStateChanged(u => {
                if (u) {
                    setUser({
                        uid: u.uid,
                        name: u.displayName || 'Admin',
                        email: u.email || '',
                        avatar: u.photoURL || '',
                        role: 'admin',
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
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const fetchedPosts = await getAllBlogPostsAdmin();
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
        setActiveTab('write');
        setIsEditing(true);
    };

    const handleEdit = (post: BlogPost) => {
        setCurrentPost(post);
        setActiveTab('write');
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

    const generateSlug = () => {
        if (!currentPost.title) return;
        const slug = currentPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setCurrentPost(prev => ({ ...prev, slug }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPost.title || !currentPost.content) {
            alert("Title and Content are required.");
            return;
        }

        try {
            setSaveLoading(true);

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
                try {
                    await updateBlogPost(currentPost.id, postData);
                } catch (err: any) {
                    if (err.message && err.message.includes("No document to update")) {
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
                setPosts(prev => prev.map(p => p.id === currentPost.id ? { ...p, ...postData } as BlogPost : p));
            } else {
                await createBlogPost(postData);
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

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isEditing) {
        const previewPost = {
            ...currentPost,
            id: currentPost.id || 'preview',
            author: currentPost.author || {
                uid: user?.uid || 'preview',
                name: user?.name || 'Admin',
                avatar: user?.avatar || 'https://ui-avatars.com/api/?name=Admin'
            },
            createdAt: currentPost.createdAt || { seconds: Date.now() / 1000 },
            likes: currentPost.likes || 0,
            commentsCount: currentPost.commentsCount || 0,
            tags: Array.isArray(currentPost.tags) ? currentPost.tags : [],
        } as BlogPost;

        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors self-start">
                        <Icon name="arrow-left" className="w-5 h-5" />
                        <span className="text-lg md:text-base">Back to List</span>
                    </button>
                    <div className="flex gap-3 self-end w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 md:flex-none px-4 py-3 md:py-2 rounded-xl md:rounded-lg font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 md:border-transparent text-center"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="flex-1 md:flex-none px-6 py-3 md:py-2 rounded-xl md:rounded-lg font-bold bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-50 shadow-lg shadow-brand-primary/20 text-center"
                        >
                            {saveLoading ? 'Saving...' : 'Save Post'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`pb-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors relative ${activeTab === 'write' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Write
                        {activeTab === 'write' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`pb-4 px-4 font-bold text-sm md:text-base whitespace-nowrap transition-colors relative ${activeTab === 'preview' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Preview
                        {activeTab === 'preview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full" />}
                    </button>
                </div>

                {activeTab === 'write' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={currentPost.title}
                                    onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                                    className="w-full p-4 text-base md:text-lg font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
                                    placeholder="Enter post title..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Content (Markdown)</label>
                                <div className="relative">
                                    <textarea
                                        value={currentPost.content}
                                        onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-[50vh] md:h-[600px] font-mono text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow resize-y"
                                        placeholder="# Write your masterpiece..."
                                        required
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        Markdown Supported
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <h3 className="font-bold text-slate-900 dark:text-white">Post Settings</h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Slug</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={currentPost.slug}
                                            onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                            className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                            placeholder="post-url-slug"
                                        />
                                        <button
                                            onClick={generateSlug}
                                            className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                            title="Generate from Title"
                                        >
                                            <Icon name="refresh-cw" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Excerpt</label>
                                    <textarea
                                        value={currentPost.excerpt}
                                        onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                                        className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-24 resize-none"
                                        placeholder="Short summary for SEO and cards..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cover Image URL</label>
                                    <input
                                        type="text"
                                        value={currentPost.coverImage}
                                        onChange={(e) => setCurrentPost({ ...currentPost, coverImage: e.target.value })}
                                        className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        placeholder="https://..."
                                    />
                                    {currentPost.coverImage && (
                                        <img src={currentPost.coverImage} alt="Cover Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(currentPost.tags) ? currentPost.tags.join(', ') : currentPost.tags}
                                        onChange={(e) => setCurrentPost({ ...currentPost, tags: e.target.value.split(',') })}
                                        className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        placeholder="tech, tutorial, update"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Comma separated</p>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={currentPost.isPublished}
                                        onChange={(e) => setCurrentPost({ ...currentPost, isPublished: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                                    />
                                    <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">Publish Immediately</label>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-100 dark:bg-black/50 rounded-3xl p-4 md:p-8 min-h-[80vh] border border-slate-200 dark:border-slate-800">
                        <BlogPostReader post={previewPost} />
                    </div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Blog Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage, edit, and publish your content.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-dark transition-all shadow-lg shadow-brand-primary/20"
                >
                    <Icon name="plus" className="w-5 h-5" />
                    New Post
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative max-w-md">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading posts...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">{error}</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="file-text" className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No posts found</h3>
                        <p className="text-slate-500">
                            {searchQuery ? "Try adjusting your search terms." : "Create your first post to get started!"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden grid grid-cols-1 gap-4">
                            {filteredPosts.map(post => (
                                <div key={post.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div onClick={() => handleEdit(post)} className="cursor-pointer">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1">{post.title}</h3>
                                            <p className="text-xs text-slate-400 font-mono break-all line-clamp-1">{post.slug}</p>
                                        </div>
                                        {post.isPublished ? (
                                            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500" title="Published">
                                                <Icon name="check" className="w-5 h-5" />
                                            </span>
                                        ) : (
                                            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500" title="Draft">
                                                <Icon name="clock" className="w-5 h-5" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 py-3 border-y border-slate-100 dark:border-slate-800/50">
                                        {post.author.avatar ? (
                                            <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-xs font-bold text-brand-primary">
                                                {post.author.name[0]}
                                            </div>
                                        )}
                                        <div className="text-sm">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{post.author.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {post.createdAt && (post.createdAt as any).seconds
                                                    ? new Date((post.createdAt as any).seconds * 1000).toLocaleDateString()
                                                    : 'Just now'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Icon name="edit-3" className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="w-12 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                        >
                                            <Icon name="trash-2" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <th className="p-4 pl-6">Title</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Author</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredPosts.map(post => (
                                        <tr key={post.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors cursor-pointer" onClick={() => handleEdit(post)}>{post.title}</span>
                                                    <span className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{post.slug}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {post.isPublished ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {post.author.avatar ? (
                                                        <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-xs font-bold text-brand-primary">
                                                            {post.author.name[0]}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{post.author.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {post.createdAt && (post.createdAt as any).seconds
                                                    ? new Date((post.createdAt as any).seconds * 1000).toLocaleDateString()
                                                    : 'Just now'
                                                }
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(post)}
                                                        className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit-3" className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminBlogPage;
