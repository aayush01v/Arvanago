import React, { useEffect, useState } from 'react';
import { BlogPost } from '@/types';
import { getBlogPosts } from '@/services/firestoreService';
import { STATIC_POSTS } from '@/data/staticPosts';
import BlogCard from '@/components/BlogCard';
import BlogList from '@/components/BlogList';
import Icon from '@/components/common/Icon';
import Header from '@/components/Header'; // Assuming we might need header if using standalone layout, but usually wrapped in App.

import SEO from '@/components/SEO';

const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const { posts: fetchedPosts } = await getBlogPosts(20);
                setPosts([...STATIC_POSTS, ...fetchedPosts]);
            } catch (err) {
                console.error("Failed to fetch blog posts", err);
                setError("Failed to load articles. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <SEO
                title="Blog"
                description="Insights, tutorials, and updates from the world of education and technology. Discover the latest trends in interactive learning."
                keywords={['blog', 'education', 'learning', 'technology', 'interactive', 'edtech']}
            />
            {/* Hero Section */}
            <div className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 sm:py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-30 dark:opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        The <span className="text-brand-primary">EduSimulate</span> Blog
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Insights, tutorials, and updates from the world of education and technology.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-96 animate-pulse border border-slate-200 dark:border-slate-800">
                                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-t-2xl"></div>
                                <div className="p-5 space-y-4">
                                    <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                        <Icon name="alert-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{error}</h3>
                        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon name="file-text" className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No articles published yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Our team is working on crafting amazing content for you. Please check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Featured Post (First Item) */}
                        {posts.length > 0 && (
                            <div className="mb-12">
                                <BlogCard post={posts[0]} featured={true} />
                            </div>
                        )}

                        {/* Recent Posts Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Icon name="clock" className="w-6 h-6 text-brand-primary" />
                                    Latest Articles
                                </h2>
                                <button className="text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors">
                                    View All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                                {posts.slice(1).map(post => (
                                    <BlogCard key={post.id} post={post} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;
