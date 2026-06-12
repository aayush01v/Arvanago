import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';

const markdown = `
\`\`\`mermaid
flowchart LR
  subgraph Procedural [Procedural Style]
    direction TB
    D[Data (Scattered)] ~~~ F[Functions (Scattered)]
  end
  Procedural -.->|Combines into| OOP
\`\`\`
`;

const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        if (!inline && match && match[1] === 'mermaid') {
            console.log("MERMAID CHILDREN TYPE:", typeof children, Array.isArray(children));
            console.log("MERMAID CHILDREN VALUE:", JSON.stringify(children));
            console.log("STRINGIFIED:", String(children));
            return React.createElement('div', { className: 'mermaid' }, String(children));
        }
        return React.createElement('code', props, children);
    }
};

renderToString(React.createElement(ReactMarkdown, {
    components: MarkdownComponents,
    children: markdown
}));
