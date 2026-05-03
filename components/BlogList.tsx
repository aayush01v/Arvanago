
import React from 'react';
import { BlogPost } from '@/types';
import BlogCard from '@/components/BlogCard';

interface BlogListProps {
    posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
                <BlogCard key={post.id} post={post} />
            ))}
        </div>
    );
};

export default BlogList;
