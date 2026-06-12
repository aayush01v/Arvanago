import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownComponents: any = {
    a: ({ node, ...props }: any) => <a {...props} className="text-brand-primary hover:underline cursor-pointer" onClick={(e) => {
        e.preventDefault();
        // Handle internal link navigation here if passed down
    }} />,
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        if (!inline && match) {
            return (
                <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md my-4"
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        }
        return <code className={`${className} bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>{children}</code>;
    }
};


interface MarkdownPreviewProps {
    content: string;
    className?: string;
    onNavigate?: (path: string) => void;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = "", onNavigate }) => {

    // Helper to process text: remove frontmatter, extract classes, format callouts
    const processText = (text: string) => {
        let cleanText = text;
        let classes = "";

        // 1. Extract Frontmatter (between --- and ---)
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
        const match = text.match(frontmatterRegex);
        if (match) {
            const frontmatter = match[1];
            const classMatch = frontmatter.match(/cssclasses:\s*(.*)/);
            if (classMatch) {
                classes = classMatch[1].trim().replace(/,/g, ' ');
            }
            cleanText = text.replace(frontmatterRegex, '');
        }

        // 2. Handle Custom Callouts/Headers
        cleanText = cleanText.replace(/\[!cc-header\]\s*(.*)/g, '### $1');
        cleanText = cleanText.replace(/\[!cc-card\]/g, '');

        // Temporarily extract code blocks and inline code
        const codeBlocks: string[] = [];
        cleanText = cleanText.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
            codeBlocks.push(match);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
        });

        // 3. Handle Wiki-links [[Note Name|Alias]]
        // Replace with [Alias || Note Name](#)
        cleanText = cleanText.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, p1, p2) => {
            const label = p2 || p1;
            const target = p1;
            return `<a href="#" data-internal-link="${target}" class="text-brand-primary hover:underline">${label}</a>`;
        });

        // 4. Handle Embeds ![[Note Name]]
        cleanText = cleanText.replace(/!\[\[([^\]]+)\]\]/g, (match, p1) => {
            return `<div class="p-2 border-l-4 border-brand-primary bg-slate-50 dark:bg-slate-800 my-2 text-sm italic">Embedded: ${p1}</div>`;
        });

        // 5. Handle Tags #tag
        cleanText = cleanText.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="text-brand-primary bg-brand-primary/10 px-1 rounded text-xs font-mono">#$2</span>');

        // Restore code blocks
        cleanText = cleanText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
            return codeBlocks[parseInt(index, 10)];
        });

        return { cleanText, classes };
    };

    const { cleanText, classes } = content ? processText(content) : { cleanText: '', classes: '' };
    const sanitizedText = cleanText;

    const handleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.dataset.internalLink) {
            e.preventDefault();
            onNavigate?.(link.dataset.internalLink);
        }
    };

    return (
        <div
            className={`prose dark:prose-invert max-w-none ${classes} ${className}`}
            onClick={handleClick}
        >
            <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={MarkdownComponents}
            >
                {sanitizedText}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;
