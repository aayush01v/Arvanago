import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import Icon from './common/Icon';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileNode[];
    note?: Note;
}

interface FileExplorerProps {
    notes: Note[];
    onSelect: (note: Note) => void;
    selectedNoteId?: string;
}

const buildFileTree = (notes: Note[]): FileNode[] => {
    const root: FileNode[] = [];
    const map: Record<string, FileNode[]> = { '': root };

    notes.forEach(note => {
        // Construct full path including filename to ensure uniqueness
        const fullPath = note.path ? `${note.path}/${note.title}` : note.title;
        const parts = fullPath.split('/');
        let currentPath = '';

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            const existingPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            // If we are at the file level
            if (isFile) {
                let parentChildren = map[existingPath] || root;
                parentChildren.push({
                    name: note.title,
                    type: 'file',
                    path: currentPath,
                    note: note
                });
            } else {
                // Folder level
                if (!map[currentPath]) {
                    const newFolder: FileNode = {
                        name: part,
                        type: 'folder',
                        path: currentPath,
                        children: []
                    };
                    map[currentPath] = newFolder.children!;
                    let parentChildren = map[existingPath] || root;

                    // Check if folder already exists in list to avoid duplicates
                    const existingFolder = parentChildren.find(c => c.type === 'folder' && c.name === part);
                    if (!existingFolder) {
                        parentChildren.push(newFolder);
                    } else {
                        // Update map reference to existing folder's children
                        map[currentPath] = existingFolder.children!;
                    }
                }
            }
        });
    });

    // Sort: Folders first, then Files. Alphabetical.
    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
        nodes.forEach(n => {
            if (n.children) sortNodes(n.children);
        });
    };
    sortNodes(root);
    return root;
};


const FileNodeItem: React.FC<{ node: FileNode; onSelect: (n: Note) => void; selectedNoteId?: string; depth: number }> = ({ node, onSelect, selectedNoteId, depth }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (node.type === 'file') {
        return (
            <div
                onClick={() => node.note && onSelect(node.note)}
                className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded mx-1 text-sm ${node.note?.id === selectedNoteId ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <Icon name="file-text" className="w-4 h-4 opacity-70" />
                <span className="truncate">{node.name.replace(/\.(md|canvas|txt)$/, '')}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded mx-1 text-sm text-slate-700 dark:text-slate-300 font-medium select-none"
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <Icon name="chevronRight" className="w-3 h-3" />
                </div>
                <Icon name="folder" className="w-4 h-4 text-indigo-400" />
                <span className="truncate">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileNodeItem key={child.path} node={child} onSelect={onSelect} selectedNoteId={selectedNoteId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ notes, onSelect, selectedNoteId }) => {
    const tree = useMemo(() => buildFileTree(notes), [notes]);

    return (
        <div className="h-full overflow-y-auto py-2">
            {tree.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No files</div>
            ) : (
                tree.map(node => (
                    <FileNodeItem key={node.path} node={node} onSelect={onSelect} selectedNoteId={selectedNoteId} depth={0} />
                ))
            )}
        </div>
    );
};

export default FileExplorer;
