let cleanText = `#include <iostream>
#tag1

\`\`\`cpp
#include <iostream>
#include <vector>
\`\`\`

Here is an inline tag: #inline.
Here is an inline code: \`#include <stdio.h>\`.
`;

const codeBlocks = [];
// Match ```...``` OR `...`
cleanText = cleanText.replace(/```[\s\S]*?```|`[^`]+`/g, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
});

// Replace tags
cleanText = cleanText.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="tag">#$2</span>');

// Restore code blocks
cleanText = cleanText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index, 10)];
});

console.log(cleanText);
