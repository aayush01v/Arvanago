
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BlogPost } from '@/types';
import { motion, useScroll, useSpring } from 'framer-motion';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/markup';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', html);

interface BlogPostReaderProps {
    post: BlogPost;
}

const BlogPostReader: React.FC<BlogPostReaderProps> = ({ post }) => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <article className="relative max-w-4xl mx-auto bg-white dark:bg-slate-950 min-h-screen">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-brand-primary origin-left z-50"
                style={{ scaleX }}
            />

            {/* Header */}
            <header className="relative py-24 px-6 text-center overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] animate-blob" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10"
                >
                    {/* Share Button container to prevent overlap on small screens */}
                    <div className="absolute top-0 right-0 md:right-[-20px] z-20">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Link copied to clipboard!");
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-slate-800 dark:text-white transition-all shadow-sm"
                            title="Share"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4 md:mb-6 mt-8 md:mt-0"> {/* added top margin to clear share button on very small screens if needed, or wrap */}
                        {post.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs md:text-sm font-semibold tracking-wide uppercase">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight px-2">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-lg" />
                            <span className="font-medium text-lg">{post.author.name}</span>
                        </div>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span>
                            {new Date((post.createdAt as any).seconds * 1000 || Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </motion.div>
            </header>

            {/* Cover Image Parallax */}
            {post.coverImage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden rounded-3xl shadow-2xl mb-16 mx-auto max-w-[95%]"
                >
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                </motion.div>
            )}

            {/* Content */}
            <div className="px-6 pb-24">
                <div className="prose prose-lg md:prose-xl dark:prose-invert prose-slate mx-auto
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                    prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300
                    prose-a:text-brand-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8
                    prose-blockquote:border-l-4 prose-blockquote:border-brand-primary prose-blockquote:bg-brand-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                    prose-pre:bg-[#1E1E1E] prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-800 prose-pre:shadow-2xl"
                >
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : null;

                                if (!inline && language) {
                                    return (
                                        <div className="relative group rounded-xl overflow-hidden my-6 border border-slate-700 shadow-2xl">
                                            <div className="absolute top-0 left-0 right-0 h-10 bg-[#2D2D2D] border-b border-black/50 flex items-center justify-between px-4">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                                </div>
                                                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                                                    {language}
                                                </div>
                                            </div>
                                            <SyntaxHighlighter
                                                style={atomDark}
                                                language={language}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    padding: '3.5rem 1.5rem 1.5rem',
                                                    background: '#1E1E1E',
                                                    fontSize: '0.9rem',
                                                    lineHeight: '1.6',
                                                }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>

                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(String(children));
                                                    alert("Code copied!");
                                                }}
                                                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Copy Code"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                            </button>
                                        </div>
                                    );
                                }
                                return (
                                    <code className={`${className} bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-brand-primary font-bold`} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </div>
        </article>
    );
};

export default BlogPostReader;
