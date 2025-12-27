import { Note } from '../types';
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Icon from './common/Icon';

interface CanvasNode {
    id: string;
    type: 'text' | 'file' | 'link' | 'group' | 'sticker';
    text?: string;
    file?: string;
    url?: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
}

interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide?: 'top' | 'right' | 'bottom' | 'left';
    toNode: string;
    toSide?: 'top' | 'right' | 'bottom' | 'left';
    label?: string;
}

interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

interface CanvasRendererProps {
    content: string;
    onNavigate?: (path: string) => void;
    onSave?: (newContent: string) => void;
    files?: Note[];
}

// --- Helpers ---
const getColor = (colorStr: string) => {
    const colors: Record<string, string> = {
        '1': '#ff5959', '2': '#ff9b59', '3': '#ffdf59', '4': '#59ff59',
        '5': '#59ffff', '6': '#599bff', '7': '#b359ff', '8': '#ff59c8', '9': '#cccccc',
    };
    return colors[colorStr] || colorStr;
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

const processNodeText = (text: string) => {
    let cleanText = text;
    let classes = "";
    const frontmatterRegex = /^\s*---\n([\s\S]*?)\n---\n/;
    const match = text.match(frontmatterRegex);
    let frontmatterContent = "";
    if (match) {
        frontmatterContent = match[1];
        cleanText = text.replace(frontmatterRegex, '');
    }
    const cssClassesRegex = /cssclasses:\s*(.*)/;
    const classMatch = frontmatterContent.match(cssClassesRegex) || text.match(cssClassesRegex);
    if (classMatch) {
        classes = classMatch[1].replace(/[\[\]]/g, '').trim().replace(/,/g, ' ');
        cleanText = cleanText.replace(/cssclasses:.*(\r\n|\n|\r)?/g, '');
    }
    cleanText = cleanText.replace(/>\s*\[!cc-header(-noborder)?\]\s*(.*)/g, (match, noBorder, title) => {
        const type = noBorder ? 'cc-header-noborder' : 'cc-header';
        const style = `background-color: rgba(var(--canvas-color), var(--cc-header-opacity-level)); border-bottom: ${noBorder ? 'none' : '2px solid rgba(var(--canvas-color), 1)'}; padding: 8px 16px; margin: -1rem -1rem 1rem -1rem;`;
        return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title" style="font-weight: bold;">${title}</div></div>`;
    });
    cleanText = cleanText.replace(/>\s*\[!cc-footer(-noborder)?\]\s*(.*)/g, (match, noBorder, title) => {
        const type = noBorder ? 'cc-footer-noborder' : 'cc-footer';
        const style = `background-color: rgba(var(--canvas-color), var(--cc-footers-opacity-level)); border-top: ${noBorder ? 'none' : '2px solid rgba(var(--canvas-color), 1)'}; padding: 8px 16px; margin: 1rem -1rem -1rem -1rem;`;
        return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title" style="font-weight: bold;">${title}</div></div>`;
    });
    cleanText = cleanText.replace(/>\s*\[!cc-label-(left|right)(-noborder)?\]\s*(.*)/g, (match, side, noBorder, title) => {
        const type = `cc-label-${side}${noBorder ? '-noborder' : ''}`;
        const innerTitle = title.trim() ? title : '';
        const isLeft = side === 'left';
        const style = `position: absolute; ${isLeft ? 'left: 0; transform: translateX(-100%); border-right: 2px solid rgba(var(--canvas-color), 1);' : 'right: 0; transform: translateX(100%); border-left: 2px solid rgba(var(--canvas-color), 1);'} top: 20px; background-color: rgba(var(--canvas-color), var(--cc-labels-opacity-level)); padding: 4px 8px; ${noBorder ? 'border: none;' : ''}`;
        return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title"><div class="callout-title-inner">${innerTitle}</div></div></div>`;
    });
    cleanText = cleanText.replace(/\[!cc-card\]/g, '');
    cleanText = cleanText.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="text-brand-primary bg-brand-primary/10 px-1 rounded text-xs font-mono">#$2</span>');
    return { cleanText, classes };
};

// --- Toolbar Component ---
const NodeToolbar = ({ node, onColorChange, onEdit, onDelete }: { node: CanvasNode, onColorChange: (color: string) => void, onEdit: () => void, onDelete: () => void }) => {
    const colors = ['1', '2', '3', '4', '5', '6']; // Red, Orange, Yellow, Green, Cyan, Blue
    return (
        <div className="absolute -top-12 left-0 h-10 bg-white dark:bg-slate-800 shadow-lg rounded-full flex items-center px-3 gap-2 border border-slate-200 dark:border-slate-700 z-[100]"
            onMouseDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()} // Prevent scroll bubble from toolbar
        >
            <button onClick={onDelete} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-red-500" title="Delete">
                <Icon name="trash" className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onColorChange(c)}
                    className={`w-6 h-6 rounded-full border-2 ${node.color === c ? 'border-slate-900 dark:border-white' : 'border-transparent hover:scale-110 transition-transform'}`}
                    style={{ backgroundColor: getColor(c) }}
                />
            ))}
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
            <button onClick={onEdit} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                <Icon name="edit" className="w-4 h-4" />
            </button>
        </div>
    );
};


// --- Memoized Node Component ---
const MemoizedNode = React.memo(({
    node,
    minX,
    minY,
    isSelected,
    isEditingText,
    onMouseDown,
    onTouchStart,
    onResize,
    onConnect,
    onColorChange,
    onEdit,
    onDelete,
    resolveFileSrc,
    setText,
    updateText
}: {
    node: CanvasNode,
    minX: number,
    minY: number,
    isSelected: boolean,
    isEditingText: boolean,
    onMouseDown: (e: React.MouseEvent, node: CanvasNode) => void,
    onTouchStart: (e: React.TouchEvent, node: CanvasNode) => void,
    onResize: (e: React.MouseEvent | React.TouchEvent, handle: string) => void,
    onConnect: (e: React.MouseEvent | React.TouchEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => void,
    onColorChange: (color: string) => void,
    onEdit: () => void,
    onDelete: () => void,
    resolveFileSrc: (path: string) => string,
    setText: (text: string) => void,
    updateText: (text: string) => void
}) => {
    const { cleanText, classes } = node.text ? processNodeText(node.text) : { cleanText: '', classes: '' };
    const nodeColor = node.color ? getColor(node.color) : undefined;
    const nodeRgb = nodeColor ? hexToRgb(nodeColor) : undefined;

    // Process images in text
    const processedText = useMemo(() => {
        let text = cleanText;
        text = text.replace(/!\[\[([^\]]+)\]\]/g, (match, p1) => {
            const src = resolveFileSrc(p1);
            if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(p1)) {
                return `<img src="${src}" alt="${p1}" class="w-full rounded-lg" />`;
            }
            return `<div class="p-2 border-l-4 border-brand-primary bg-slate-50 dark:bg-slate-800 my-2 text-sm italic">Embedded: ${p1}</div>`;
        });

        text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, p1, p2) => {
            const label = p2 || p1;
            const target = p1;
            return `<a href="#" data-internal-link="${target}" class="text-brand-primary hover:underline">${label}</a>`;
        });

        return text;
    }, [cleanText, resolveFileSrc]);

    const nodeStyle: any = {
        left: node.x - minX,
        top: node.y - minY,
        width: node.width,
        height: node.height,
        // Defaults for CC variables
        '--cc-header-opacity-level': 0.2,
        '--cc-footers-opacity-level': 0.09,
        '--cc-label-width': '50px',
        '--cc-labels-opacity-level': 0.3,
        '--cc-gradient-start': 0.7,
        '--cc-gradient-end': 0.1,
    };

    if (nodeRgb) {
        nodeStyle['--canvas-color'] = nodeRgb;
    }

    return (
        <div
            className={`absolute rounded-lg border shadow-sm transition-shadow group/node flex flex-col hover:shadow-md canvas-node ${isSelected ? 'ring-2 ring-brand-primary z-50' : 'z-10'} ${classes} ${node.type === 'sticker' ? 'border-none shadow-none bg-transparent !p-0 pointer-events-none' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            style={nodeStyle}
            onMouseDown={(e) => onMouseDown(e, node)}
            onTouchStart={(e) => onTouchStart(e, node)}
            // STOP SCROLL PROPAGATION at root of node
            onWheel={(e) => e.stopPropagation()}
        >
            {isSelected && (
                <NodeToolbar
                    node={node}
                    onColorChange={onColorChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}

            {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                <div
                    key={side}
                    className={`absolute w-3 h-3 bg-brand-primary rounded-full opacity-0 group-hover/node:opacity-100 cursor-crosshair transition-opacity z-20
                        ${side === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' : ''}
                        ${side === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
                        ${side === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2' : ''}
                        ${side === 'right' ? '-right-1.5 top-1/2 -translate-y-1/2' : ''}
                    `}
                    onMouseDown={(e) => onConnect(e, node.id, side)}
                    onTouchStart={(e) => onConnect(e, node.id, side)}
                />
            ))}

            <div className="flex-1 overflow-hidden relative canvas-node-container">
                {/* Resize Handles */}
                {isSelected && (
                    <>
                        <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-20" onMouseDown={e => onResize(e, 'ne')} onTouchStart={e => onResize(e, 'ne')} />
                        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20" onMouseDown={e => onResize(e, 'se')} onTouchStart={e => onResize(e, 'se')} />
                        <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-20" onMouseDown={e => onResize(e, 'sw')} onTouchStart={e => onResize(e, 'sw')} />
                        <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-20" onMouseDown={e => onResize(e, 'nw')} onTouchStart={e => onResize(e, 'nw')} />

                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 cursor-n-resize z-20" onMouseDown={e => onResize(e, 'n')} onTouchStart={e => onResize(e, 'n')} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 cursor-s-resize z-20" onMouseDown={e => onResize(e, 's')} onTouchStart={e => onResize(e, 's')} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 cursor-w-resize z-20" onMouseDown={e => onResize(e, 'w')} onTouchStart={e => onResize(e, 'w')} />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 cursor-e-resize z-20" onMouseDown={e => onResize(e, 'e')} onTouchStart={e => onResize(e, 'e')} />
                    </>
                )}

                <div className={`p-4 h-full w-full overflow-auto canvas-node-content ${node.type === 'sticker' ? 'flex items-center justify-center !p-0 !overflow-visible' : ''} ${isEditingText ? 'cursor-text' : 'cursor-default'}`}
                    onMouseDown={e => { if (isSelected && isEditingText) e.stopPropagation(); }}
                    onTouchStart={(e) => { if (isSelected && isEditingText) e.stopPropagation(); }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {node.type === 'sticker' ? (
                        <div className="relative w-full h-full pointer-events-auto">
                            <img
                                src={resolveFileSrc(node.file || node.url || '')}
                                alt="sticker"
                                className="w-full h-full object-contain pointer-events-none select-none"
                            />
                        </div>
                    ) : (
                        isSelected && isEditingText ? (
                            <textarea
                                className="w-full h-full resize-none outline-none bg-transparent"
                                value={node.text}
                                onChange={(e) => setText(e.target.value)}
                                onBlur={() => updateText(node.text || '')}
                                autoFocus
                                onMouseDown={e => e.stopPropagation()}
                            />
                        ) : (
                            <div className="markdown-body text-sm prose dark:prose-invert max-w-none select-text">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                    components={{
                                        a: ({ node, ...props }) => <a {...props} className="text-brand-primary hover:underline cursor-pointer" onClick={(e) => {
                                            e.preventDefault();
                                            // Handle internal link navigation here if passed down
                                        }} />,
                                    }}
                                >
                                    {processedText}
                                </ReactMarkdown>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
});

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ content, onNavigate, onSave, files = [] }) => {
    const [data, setData] = useState<CanvasData>({ nodes: [], edges: [] });

    useEffect(() => {
        try {
            const parsed = JSON.parse(content);
            setData({ nodes: parsed.nodes || [], edges: parsed.edges || [] });
        } catch (e) {
            setData({ nodes: [], edges: [] });
        }
    }, [content]);

    const saveData = (newData: CanvasData) => {
        setData(newData);
        onSave?.(JSON.stringify(newData, null, 2));
    };

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'none' | 'drag-node' | 'resize-node' | 'connect' | 'pan' | 'zoom'>('none');
    const [transform, setTransform] = useState({ x: 50, y: 50, scale: 0.8 });
    const containerRef = useRef<HTMLDivElement>(null);

    const activeRef = useRef<{
        startMouse: { x: number, y: number };
        initialNode?: CanvasNode;
        handle?: string;
        connectionStart?: { nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' };
        lastTouchDistance?: number;
        longPressStart?: { x: number, y: number };
    }>({ startMouse: { x: 0, y: 0 } });

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [tempConnection, setTempConnection] = useState<{ start: { x: number, y: number }; end: { x: number, y: number }; } | null>(null);

    const minX = Math.min(...(data.nodes.length ? data.nodes.map(n => n.x) : [0]));
    const minY = Math.min(...(data.nodes.length ? data.nodes.map(n => n.y) : [0]));

    const resolveFileSrc = React.useCallback((path: string) => {
        if (path.startsWith('http')) return path;
        // Simple passthrough. In a real app, logic to find file url
        return path;
    }, []);

    const deleteSelected = () => {
        if (selectedNodeId) {
            const newNodes = data.nodes.filter(n => n.id !== selectedNodeId);
            const newEdges = data.edges.filter(e => e.fromNode !== selectedNodeId && e.toNode !== selectedNodeId);
            saveData({ nodes: newNodes, edges: newEdges });
            setSelectedNodeId(null);
        } else if (selectedEdgeId) {
            const newEdges = data.edges.filter(e => e.id !== selectedEdgeId);
            saveData({ ...data, edges: newEdges });
            setSelectedEdgeId(null);
        }
    };

    const updateText = (text: string) => {
        if (selectedNodeId) {
            const updated = data.nodes.map(n => n.id === selectedNodeId ? { ...n, text } : n);
            saveData({ ...data, nodes: updated });
        }
    };

    const setText = (text: string) => {
        if (selectedNodeId) {
            setData(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === selectedNodeId ? { ...n, text } : n) }));
        }
    };

    const getNodeRect = (nodeId: string) => {
        const node = data.nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0, w: 0, h: 0 };
        return { x: node.x - minX, y: node.y - minY, w: node.width, h: node.height };
    };

    const getConnectorPoint = (rect: { x: number, y: number, w: number, h: number }, side?: string) => {
        switch (side) {
            case 'top': return { x: rect.x + rect.w / 2, y: rect.y };
            case 'bottom': return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
            case 'left': return { x: rect.x, y: rect.y + rect.h / 2 };
            case 'right': return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
            default: return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
        }
    };

    const calculatePath = (edge: CanvasEdge) => {
        const fromRect = getNodeRect(edge.fromNode);
        const toRect = getNodeRect(edge.toNode);
        const start = getConnectorPoint(fromRect, edge.fromSide);
        const end = getConnectorPoint(toRect, edge.toSide);
        const dist = Math.hypot(end.x - start.x, end.y - start.y) * 0.5;
        let cp1 = { x: start.x, y: start.y };
        let cp2 = { x: end.x, y: end.y };
        switch (edge.fromSide) {
            case 'top': cp1.y -= dist; break;
            case 'bottom': cp1.y += dist; break;
            case 'left': cp1.x -= dist; break;
            case 'right': cp1.x += dist; break;
        }
        switch (edge.toSide) {
            case 'top': cp2.y -= dist; break;
            case 'bottom': cp2.y += dist; break;
            case 'left': cp2.x -= dist; break;
            case 'right': cp2.x += dist; break;
        }
        if (!edge.fromSide && !edge.toSide) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    };

    // --- Touch Helpers ---
    const getTouchDistance = (e: React.TouchEvent) => {
        if (e.touches.length < 2) return 0;
        return Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    };

    // --- Mouse & Touch Handlers ---

    const handleStart = (clientX: number, clientY: number, mode: typeof interactionMode) => {
        setInteractionMode(mode);
        activeRef.current.startMouse = { x: clientX, y: clientY };
    };

    // --- Canvas Background (Pan/Zoom) ---

    // Mouse
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            handleStart(e.clientX, e.clientY, 'pan');
        } else {
            if (interactionMode === 'none') {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                setIsEditingText(false);
            }
        }
    };

    // Touch
    const handleCanvasTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            setInteractionMode('zoom');
            activeRef.current.lastTouchDistance = getTouchDistance(e);
        } else if (e.touches.length === 1) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY, 'pan');
        }
    };

    // --- Node (Drag/Select) ---

    // Mouse
    // Mouse
    const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: CanvasNode) => {
        e.stopPropagation();
        if (e.button !== 0) return;
        setSelectedNodeId(node.id);
        setSelectedEdgeId(null);
        setIsEditingText(false);
        setInteractionMode('drag-node');
        activeRef.current = {
            startMouse: { x: e.clientX, y: e.clientY },
            initialNode: { ...node }
        };
    }, []);

    // Touch
    const handleNodeTouchStart = useCallback((e: React.TouchEvent, node: CanvasNode) => {
        // Do NOT stop propagation immediately to allow scrolling if user doesn't hold
        // e.stopPropagation(); 
        // e.preventDefault();

        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        // Clear any existing timer
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

        setSelectedNodeId(node.id);
        setSelectedEdgeId(null);
        setIsEditingText(false);

        // Store initial touch for tolerance check
        activeRef.current.longPressStart = { x: clientX, y: clientY };

        // Start 500ms Timer
        longPressTimerRef.current = setTimeout(() => {
            // If we are here, user held for 500ms
            setInteractionMode('drag-node');
            activeRef.current = {
                startMouse: { x: clientX, y: clientY },
                initialNode: { ...node }
            };
            // navigator.vibrate?.(50); // Haptic feedback if available (often blocked in frames but worth try)
            console.log('Long press detected - Drag mode active');
        }, 500);
    }, []); // setSelectedNodeId, setSelectedEdgeId, setIsEditingText, setInteractionMode are stable

    // --- Handle (Resize/Connect) ---

    // Mouse
    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;
        setInteractionMode('resize-node');
        activeRef.current = {
            startMouse: { x: e.clientX, y: e.clientY },
            initialNode: { ...node },
            handle
        };
    }, [data.nodes, selectedNodeId]);

    // Touch
    const handleResizeTouchStart = useCallback((e: React.TouchEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;
        setInteractionMode('resize-node');
        activeRef.current = {
            startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
            initialNode: { ...node },
            handle
        };
    }, [data.nodes, selectedNodeId]);

    // Mouse
    const handleConnectMouseDown = useCallback((e: React.MouseEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => {
        e.stopPropagation();
        e.preventDefault();
        setInteractionMode('connect');
        const rect = getNodeRect(nodeId);
        const startPoint = getConnectorPoint(rect, side);
        activeRef.current = {
            startMouse: { x: e.clientX, y: e.clientY },
            connectionStart: { nodeId, side }
        };
        setTempConnection({ start: startPoint, end: startPoint });
    }, [getNodeRect, getConnectorPoint]);

    // Touch
    const handleConnectTouchStart = useCallback((e: React.TouchEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => {
        e.stopPropagation();
        e.preventDefault();
        setInteractionMode('connect');
        const rect = getNodeRect(nodeId);
        const startPoint = getConnectorPoint(rect, side);
        activeRef.current = {
            startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
            connectionStart: { nodeId, side }
        };
        setTempConnection({ start: startPoint, end: startPoint });
    }, [getNodeRect, getConnectorPoint]);

    // --- Move & Up Handlers (Common) ---

    const handleMove = useCallback((clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
        if (interactionMode === 'none') return;

        // ZOOM Pinch
        if (interactionMode === 'zoom' && e && 'touches' in e && e.touches.length === 2 && activeRef.current.lastTouchDistance) {
            const newDist = getTouchDistance(e);
            const delta = newDist - activeRef.current.lastTouchDistance;
            const zoomSpeed = 0.005;
            setTransform(prev => ({
                ...prev,
                scale: Math.min(Math.max(0.1, prev.scale + delta * zoomSpeed), 5)
            }));
            activeRef.current.lastTouchDistance = newDist;
            return;
        }

        // Cancel Long Press if moved significantly (scrolling)
        if (longPressTimerRef.current && activeRef.current.longPressStart) {
            const dist = Math.sqrt(Math.pow(clientX - activeRef.current.longPressStart.x, 2) + Math.pow(clientY - activeRef.current.longPressStart.y, 2));
            if (dist > 10) { // 10px tolerance
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                console.log('Touch moved too much - Cancelled long press');
            }
        }

        const dx = (clientX - activeRef.current.startMouse.x) / transform.scale;
        const dy = (clientY - activeRef.current.startMouse.y) / transform.scale;

        if (interactionMode === 'pan') {
            const panDx = clientX - activeRef.current.startMouse.x;
            const panDy = clientY - activeRef.current.startMouse.y;
            setTransform(prev => ({ ...prev, x: prev.x + panDx, y: prev.y + panDy }));
            activeRef.current.startMouse = { x: clientX, y: clientY };
            return;
        }

        if (interactionMode === 'drag-node' && activeRef.current.initialNode) {
            const updated = data.nodes.map(n => {
                if (n.id === activeRef.current.initialNode!.id) {
                    return {
                        ...n,
                        x: activeRef.current.initialNode!.x + dx,
                        y: activeRef.current.initialNode!.y + dy
                    };
                }
                return n;
            });
            setData({ ...data, nodes: updated });
        }

        if (interactionMode === 'resize-node' && activeRef.current.initialNode && activeRef.current.handle) {
            const init = activeRef.current.initialNode;
            let { x, y, width, height } = init;
            const h = activeRef.current.handle;

            if (h.includes('e')) width = Math.max(50, init.width + dx);
            if (h.includes('s')) height = Math.max(50, init.height + dy);
            if (h.includes('w')) {
                const newW = Math.max(50, init.width - dx);
                x = init.x + (init.width - newW);
                width = newW;
            }
            if (h.includes('n')) {
                const newH = Math.max(50, init.height - dy);
                y = init.y + (init.height - newH);
                height = newH;
            }
            const updated = data.nodes.map(n => n.id === init.id ? { ...n, x, y, width, height } : n);
            setData({ ...data, nodes: updated });
        }

        if (interactionMode === 'connect' && tempConnection) {
            const visualStart = activeRef.current.startMouse;
            const screenDx = clientX - visualStart.x;
            const screenDy = clientY - visualStart.y;
            const scaledDx = screenDx / transform.scale;
            const scaledDy = screenDy / transform.scale;
            setTempConnection({
                ...tempConnection,
                end: {
                    x: tempConnection.start.x + scaledDx,
                    y: tempConnection.start.y + scaledDy
                }
            });
        }
    }, [interactionMode, transform.scale, data, tempConnection, setTransform, setData, setTempConnection]);

    const handleUp = useCallback((e?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (interactionMode === 'drag-node' || interactionMode === 'resize-node') {
            saveData(data);
        }

        if (interactionMode === 'connect' && activeRef.current.connectionStart && e) {
            let clientX = 0, clientY = 0;
            if ('changedTouches' in e && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else if ('clientX' in e) {
                clientX = (e as React.MouseEvent).clientX;
                clientY = (e as React.MouseEvent).clientY;
            }

            const canvasRect = containerRef.current?.getBoundingClientRect();

            if (canvasRect) {
                const mouseXRel = clientX - canvasRect.left;
                const mouseYRel = clientY - canvasRect.top;
                const logicX = (mouseXRel - transform.x) / transform.scale + minX;
                const logicY = (mouseYRel - transform.y) / transform.scale + minY;

                const targetNode = data.nodes.find(n =>
                    logicX >= n.x && logicX <= n.x + n.width &&
                    logicY >= n.y && logicY <= n.y + n.height &&
                    n.id !== activeRef.current.connectionStart!.nodeId
                );

                if (targetNode) {
                    // Connect to existing node
                    const center = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };
                    const angle = Math.atan2(logicY - center.y, logicX - center.x) * 180 / Math.PI;
                    let endSide: 'top' | 'right' | 'bottom' | 'left' = 'left';
                    if (angle >= -45 && angle < 45) endSide = 'right';
                    else if (angle >= 45 && angle < 135) endSide = 'bottom';
                    else if (angle >= -135 && angle < -45) endSide = 'top';
                    else endSide = 'left';

                    const newEdge: CanvasEdge = {
                        id: String(Date.now()),
                        fromNode: activeRef.current.connectionStart!.nodeId,
                        fromSide: activeRef.current.connectionStart!.side,
                        toNode: targetNode.id,
                        toSide: endSide
                    };
                    saveData({ ...data, edges: [...data.edges, newEdge] });
                } else {
                    // Drop on Empty Space -> Create New Node
                    const newNodeId = String(Date.now());
                    const newNode: CanvasNode = {
                        id: newNodeId,
                        type: 'text',
                        text: 'New Card',
                        x: logicX - 125, // Center around drop point (assuming width 250)
                        y: logicY - 70,  // Center around drop point (assuming height 140)
                        width: 250,
                        height: 140
                    };

                    // Determine edge side for new node
                    const fromNode = data.nodes.find(n => n.id === activeRef.current.connectionStart!.nodeId);
                    let endSide: 'top' | 'right' | 'bottom' | 'left' = 'left';

                    if (fromNode) {
                        const center = { x: newNode.x + newNode.width / 2, y: newNode.y + newNode.height / 2 };
                        const fromCenter = { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 };

                        const angle = Math.atan2(fromCenter.y - center.y, fromCenter.x - center.x) * 180 / Math.PI;
                        // Invert angle logic because we want the side facing the source
                        if (angle >= -45 && angle < 45) endSide = 'right';
                        else if (angle >= 45 && angle < 135) endSide = 'bottom';
                        else if (angle >= -135 && angle < -45) endSide = 'top';
                        else endSide = 'left';
                    }

                    const newEdge: CanvasEdge = {
                        id: String(Date.now() + 1),
                        fromNode: activeRef.current.connectionStart!.nodeId,
                        fromSide: activeRef.current.connectionStart!.side,
                        toNode: newNodeId,
                        toSide: endSide
                    };

                    saveData({
                        nodes: [...data.nodes, newNode],
                        edges: [...data.edges, newEdge]
                    });

                    // Optional: Select new node immediately
                    setSelectedNodeId(newNodeId);
                }
            }
        }

        // Clear long press timer on any up event
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        setInteractionMode('none');
        setTempConnection(null);
        activeRef.current = { startMouse: { x: 0, y: 0 } };
    }, [interactionMode, data, transform, minX, minY, saveData, setSelectedNodeId, setInteractionMode, setTempConnection]);

    // React Events
    const onMouseMove = useCallback((e: React.MouseEvent) => handleMove(e.clientX, e.clientY, e), [handleMove]);
    const onTouchMove = useCallback((e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY, e), [handleMove]);
    const onMouseUp = useCallback((e: React.MouseEvent) => handleUp(e), [handleUp]);
    const onTouchEnd = useCallback((e: React.TouchEvent) => handleUp(e), [handleUp]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation(); // Stop zoom prop
            const delta = -e.deltaY * 0.001;
            setTransform(prev => ({
                ...prev,
                scale: Math.min(Math.max(0.1, prev.scale + delta), 5)
            }));
        } else {
            e.stopPropagation(); // Stop scroll prop
            setTransform(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    }, []); // setTransform is stable

    const updateColor = useCallback((color: string) => {
        if (!selectedNodeId) return;
        const updated = data.nodes.map(n => n.id === selectedNodeId ? { ...n, color } : n);
        saveData({ ...data, nodes: updated });
    }, [selectedNodeId, data, saveData]);

    const updateEdgeLabel = useCallback((text: string) => {
        if (!selectedEdgeId) return;
        const updated = data.edges.map(e => e.id === selectedEdgeId ? { ...e, label: text } : e);
        saveData({ ...data, edges: updated });
    }, [selectedEdgeId, data, saveData]);

    const selectedNode = data.nodes.find(n => n.id === selectedNodeId);
    const selectedEdge = data.edges.find(e => e.id === selectedEdgeId);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 bg-grid-slate-200 dark:bg-grid-slate-800 cursor-default select-none group touch-none"
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onTouchStart={handleCanvasTouchStart}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            onMouseLeave={onMouseUp}
        >
            <div
                className={`absolute origin-top-left ${interactionMode === 'pan' || interactionMode.startsWith('drag') ? 'duration-0' : 'transition-transform duration-75 ease-out'}`}
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    willChange: 'transform'
                }}
            >
                {/* 1. Edges Layer */}
                <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                        </marker>
                    </defs>
                    {data.edges?.map((edge, i) => (
                        <g key={edge.id || i}>
                            <path
                                d={calculatePath(edge)}
                                stroke="transparent"
                                strokeWidth="20"
                                fill="none"
                                className="cursor-pointer pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEdgeId(edge.id);
                                    setSelectedNodeId(null);
                                }}
                            />
                            <path
                                d={calculatePath(edge)}
                                stroke={selectedEdgeId === edge.id ? '#3b82f6' : "#94a3b8"}
                                strokeWidth={selectedEdgeId === edge.id ? "3" : "2"}
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                className="pointer-events-none transition-colors"
                            />
                            {edge.label && (
                                <text
                                    x={(getNodeRect(edge.fromNode).x + getNodeRect(edge.toNode).x) / 2}
                                    y={(getNodeRect(edge.fromNode).y + getNodeRect(edge.toNode).y) / 2}
                                    fill="#64748b"
                                    fontSize="12"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    className="bg-white"
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    ))}
                    {tempConnection && (
                        <path
                            d={`M ${tempConnection.start.x} ${tempConnection.start.y} L ${tempConnection.end.x} ${tempConnection.end.y}`}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                        />
                    )}
                </svg>

                {/* 2. Nodes Layer */}
                {data.nodes.map(node => (
                    <MemoizedNode
                        key={node.id}
                        node={node}
                        minX={minX}
                        minY={minY}
                        isSelected={node.id === selectedNodeId}
                        isEditingText={node.id === selectedNodeId && isEditingText}
                        onMouseDown={handleNodeMouseDown}
                        onTouchStart={handleNodeTouchStart}
                        onResize={(e, handle) => {
                            if ('touches' in e) handleResizeTouchStart(e as React.TouchEvent, handle);
                            else handleResizeMouseDown(e as React.MouseEvent, handle);
                        }}
                        onConnect={(e, nodeId, side) => {
                            if ('touches' in e) handleConnectTouchStart(e as React.TouchEvent, nodeId, side);
                            else handleConnectMouseDown(e as React.MouseEvent, nodeId, side);
                        }}
                        onColorChange={(color) => {
                            updateColor(color);
                        }}
                        onEdit={() => setIsEditingText(true)}
                        onDelete={deleteSelected}
                        resolveFileSrc={resolveFileSrc}
                        setText={setText}
                        updateText={updateText}
                    />
                ))}
            </div>



            {selectedEdge && !interactionMode.startsWith('drag') && !interactionMode.startsWith('resize') && (
                <div
                    className="absolute z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: (getNodeRect(selectedEdge.fromNode).x + getNodeRect(selectedEdge.toNode).x) / 2 * transform.scale + transform.x,
                        top: (getNodeRect(selectedEdge.fromNode).y + getNodeRect(selectedEdge.toNode).y) / 2 * transform.scale + transform.y - 60,
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    role="toolbar"
                    aria-label="Edge actions"
                >
                    <button onClick={deleteSelected} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-red-500" title="Delete Connection">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto"></div>
                    <button
                        onClick={() => {
                            const newLabel = window.prompt("Edit Label", selectedEdge.label || "");
                            if (newLabel !== null) updateEdgeLabel(newLabel);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                        title="Edit Label"
                    >
                        <Icon name="edit" className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none hidden md:block">
                Pan: Middle Mouse or Shift+Drag<br />
                Zoom: Ctrl+Wheel<br />
                Connect: Drag from circle handles
            </div>

        </div>
    );
};

export default CanvasRenderer;
