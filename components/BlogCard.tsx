import React from 'react';
import { BlogPost } from '@/types';
import Icon from './common/Icon';
import { Link } from 'react-router-dom';

interface BlogCardProps {
    post: BlogPost;
    featured?: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, featured = false }) => {
    // Helper to optimize Unsplash images
    const getOptimizedImageUrl = (url: string, width: number) => {
        if (url.includes('images.unsplash.com')) {
            return `${url}&w=${width}&q=80&auto=format`;
        }
        return url;
    };

    return (
        <Link
            to={`/blog/${post.id}`}
            className={`group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${featured ? 'md:col-span-2 md:flex-row h-auto md:h-96' : 'h-full'}`}
        >
            {/* Cover Image Wrapper */}
            <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${featured ? 'w-full md:w-3/5 h-64 md:h-auto' : 'w-full aspect-[16/10]'}`}>
                {post.coverImage ? (
                    <img
                        src={getOptimizedImageUrl(post.coverImage, featured ? 800 : 500)}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
                        <Icon name="image" className="w-16 h-16 opacity-50" />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>

                {/* Floating Badge */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                    {post.tags.slice(0, 2).map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm text-slate-900 dark:text-white rounded-full shadow-lg border border-white/20">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            <div className={`flex flex-col p-6 z-10 relative bg-white dark:bg-slate-900 ${featured ? 'w-full md:w-2/5 justify-center' : 'flex-1'}`}>
                {/* Author Info */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-brand-primary to-brand-secondary shrink-0">
                        <img
                            src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`}
                            alt={post.author.name}
                            loading="lazy"
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                        />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{post.author.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
                        </p>
                    </div>
                </div>

                <h3 className={`font-black text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-primary group-hover:to-brand-secondary transition-all duration-300 decoration-clone ${featured ? 'text-2xl md:text-3xl leading-tight' : 'text-xl leading-snug'}`}>
                    {post.title}
                </h3>

                <p className={`text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 ${featured ? 'text-base' : 'text-sm'}`}>
                    {post.excerpt}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            <Icon name="heart" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                            <span>{post.likes > 0 ? post.likes : <span className="hidden sm:inline">first</span>}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            <Icon name="message-circle" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                            <span>{post.commentsCount > 0 ? post.commentsCount : <span className="hidden sm:inline">0</span>}</span>
                        </span>
                    </div>

                    <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group/btn shrink-0 ml-2">
                        <span className="hidden xs:inline">Read</span>
                        <Icon name="arrow-right" className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
