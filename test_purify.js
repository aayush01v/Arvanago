const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

const markdown = `> [!tip] Motion graphics idea
>
> Show function like a machine: input 10 and 20 -> add function -> output 30.

\`\`\`mermaid
flowchart LR
  A[Input: 10] --> F((add function))
  B[Input: 20] --> F
  F --> O[Output: 30]
  style F fill:#f9f,stroke:#333,stroke-width:2px
\`\`\`
`;

const sanitized = purify.sanitize(markdown, {
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
});

console.log("Original:", JSON.stringify(markdown));
console.log("Sanitized:", JSON.stringify(sanitized));
