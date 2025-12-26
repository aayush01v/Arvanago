import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
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
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ content, onNavigate, onSave }) => {
    // We maintain local state for editing, initialized from props
    // We use a useEffect to sync if content prop changes drastically (e.g. navigation), 
    // but we generally rely on local state for interactions.
    const [data, setData] = useState<CanvasData>({ nodes: [], edges: [] });

    useEffect(() => {
        try {
            const parsed = JSON.parse(content);
            setData({
                nodes: parsed.nodes || [],
                edges: parsed.edges || []
            });
        } catch (e) {
            setData({ nodes: [], edges: [] });
        }
    }, [content]);

    // Save helper
    const saveData = (newData: CanvasData) => {
        setData(newData);
        onSave?.(JSON.stringify(newData, null, 2));
    };

    // Selection
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Editing Text
    const [isEditingText, setIsEditingText] = useState(false);

    // --- Interaction States ---
    const [interactionMode, setInteractionMode] = useState<'none' | 'drag-node' | 'resize-node' | 'connect' | 'pan'>('none');

    // Transform (Pan/Zoom)
    const [transform, setTransform] = useState({ x: 50, y: 50, scale: 0.8 });

    // Drag/Resize references
    const activeRef = useRef<{
        startMouse: { x: number, y: number };
        initialNode?: CanvasNode;
        handle?: string; // for resize (e.g. 'se', 'nw')
        connectionStart?: { nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' };
    }>({ startMouse: { x: 0, y: 0 } });

    // Temp connection line
    const [tempConnection, setTempConnection] = useState<{
        start: { x: number, y: number };
        end: { x: number, y: number };
    } | null>(null);


    // --- Helpers ---
    const minX = Math.min(...(data.nodes.length ? data.nodes.map(n => n.x) : [0]));
    const minY = Math.min(...(data.nodes.length ? data.nodes.map(n => n.y) : [0]));

    const getColor = (color?: string) => {
        const map: Record<string, string> = {
            '1': '#ef4444',
            '2': '#f97316',
            '3': '#eab308',
            '4': '#22c55e',
            '5': '#06b6d4',
            '6': '#8b5cf6',
        };
        return map[color || ''] || '#ffffff';
    };

    const processNodeText = (text: string) => {
        let cleanText = text;
        let classes = "";
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
        cleanText = cleanText.replace(/\[!cc-header\]\s*(.*)/g, '### $1');
        cleanText = cleanText.replace(/\[!cc-card\]/g, '');
        cleanText = cleanText.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, p1, p2) => {
            const label = p2 || p1;
            const target = p1;
            return `<a href="#" data-internal-link="${target}" class="text-brand-primary hover:underline">${label}</a>`;
        });
        cleanText = cleanText.replace(/!\[\[([^\]]+)\]\]/g, (match, p1) => {
            return `<div class="p-2 border-l-4 border-brand-primary bg-slate-50 dark:bg-slate-800 my-2 text-sm italic">Embedded: ${p1}</div>`;
        });
        cleanText = cleanText.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="text-brand-primary bg-brand-primary/10 px-1 rounded text-xs font-mono">#$2</span>');
        return { cleanText, classes };
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

    // --- Inputs ---

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setInteractionMode('pan');
            activeRef.current.startMouse = { x: e.clientX, y: e.clientY };
        } else {
            // Deselect if clicking blank, unless we are already in another mode (like resize)
            if (interactionMode === 'none') {
                setSelectedNodeId(null);
                setIsEditingText(false);
            }
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
        e.stopPropagation();
        if (e.button !== 0) return; // Only left click for select/drag

        setSelectedNodeId(node.id);
        setIsEditingText(false); // Reset edit mode on new selection

        setInteractionMode('drag-node');
        activeRef.current = {
            startMouse: { x: e.clientX, y: e.clientY },
            initialNode: { ...node }
        };
    };

    const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
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
    };

    const handleConnectMouseDown = (e: React.MouseEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => {
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
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (interactionMode === 'none') return;

        const dx = (e.clientX - activeRef.current.startMouse.x) / transform.scale;
        const dy = (e.clientY - activeRef.current.startMouse.y) / transform.scale;

        if (interactionMode === 'pan') {
            const panDx = e.clientX - activeRef.current.startMouse.x;
            const panDy = e.clientY - activeRef.current.startMouse.y;
            setTransform(prev => ({ ...prev, x: prev.x + panDx, y: prev.y + panDy }));
            activeRef.current.startMouse = { x: e.clientX, y: e.clientY };
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
            setData({ ...data, nodes: updated }); // Optimistic update, no save yet
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
            // Need mouse pos relative to canvas origin (taking zoom/pan into account)
            // Can't easily use clientX/Y directly for end coordinate without reverse transform
            // HACK: Calculate visual offset from start visual pos
            const visualStart = activeRef.current.startMouse; // Screen coords of start click
            const screenDx = e.clientX - visualStart.x;
            const screenDy = e.clientY - visualStart.y;

            // Scaled delta
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
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (interactionMode === 'drag-node' || interactionMode === 'resize-node') {
            saveData(data); // Commit change
        }

        if (interactionMode === 'connect' && activeRef.current.connectionStart) {
            // Check if we dropped on a node
            // Simple hit testing: find node under mouse
            // We need to reverse transform the mouse coordinates to get logic coordinates
            const canvasRect = e.currentTarget.getBoundingClientRect();
            const mouseXRel = e.clientX - canvasRect.left;
            const mouseYRel = e.clientY - canvasRect.top;

            // Logic coords:
            const logicX = (mouseXRel - transform.x) / transform.scale + minX;
            const logicY = (mouseYRel - transform.y) / transform.scale + minY;

            const targetNode = data.nodes.find(n =>
                logicX >= n.x && logicX <= n.x + n.width &&
                logicY >= n.y && logicY <= n.y + n.height &&
                n.id !== activeRef.current.connectionStart!.nodeId // No self connect for now
            );

            if (targetNode) {
                // Determine side based on relative pos (rough approx)
                const center = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };
                const angle = Math.atan2(logicY - center.y, logicX - center.x) * 180 / Math.PI;
                // -45 to 45 = right, 45 to 135 = bottom, 135 to -135 = left, -135 to -45 = top
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
            }
        }

        setInteractionMode('none');
        setTempConnection(null);
        activeRef.current = {};
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            setTransform(prev => ({
                ...prev,
                scale: Math.min(Math.max(0.1, prev.scale + delta), 5)
            }));
        } else {
            setTransform(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const deleteSelected = () => {
        if (!selectedNodeId) return;
        const newNodes = data.nodes.filter(n => n.id !== selectedNodeId);
        const newEdges = data.edges.filter(e => e.fromNode !== selectedNodeId && e.toNode !== selectedNodeId);
        saveData({ nodes: newNodes, edges: newEdges });
        setSelectedNodeId(null);
    };

    const updateColor = (color: string) => {
        if (!selectedNodeId) return;
        const updated = data.nodes.map(n => n.id === selectedNodeId ? { ...n, color } : n);
        saveData({ ...data, nodes: updated });
    };

    const updateText = (text: string) => {
        if (!selectedNodeId) return;
        const updated = data.nodes.map(n => n.id === selectedNodeId ? { ...n, text } : n);
        saveData({ ...data, nodes: updated });
    };

    // Render Logic
    const selectedNode = data.nodes.find(n => n.id === selectedNodeId);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 bg-grid-slate-200 dark:bg-grid-slate-800 cursor-default select-none group"
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="absolute transition-transform duration-75 ease-out origin-top-left"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
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
                                stroke="#94a3b8"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
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
                {data.nodes.map(node => {
                    const { cleanText, classes } = node.text ? processNodeText(node.text) : { cleanText: '', classes: '' };
                    const isSelected = node.id === selectedNodeId;

                    // Sticker
                    if (node.type === 'sticker') {
                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                                className={`absolute ${isSelected ? 'ring-2 ring-brand-primary' : 'hover:ring-1 hover:ring-brand-primary/50'}`}
                                style={{
                                    left: node.x - minX,
                                    top: node.y - minY,
                                    width: node.width,
                                    height: node.height,
                                }}
                            >
                                <img
                                    src={node.file || node.url}
                                    alt="sticker"
                                    className="w-full h-full object-contain pointer-events-none"
                                />
                                {/* Sticker Selection Overlay */}
                                {isSelected && <SelectionOverlay node={node} />}
                            </div>
                        )
                    }

                    return (
                        <div
                            key={node.id}
                            onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            className={`absolute border rounded-lg shadow-sm bg-white dark:bg-slate-800 overflow-visible flex flex-col ${classes} ${isSelected ? 'ring-2 ring-brand-primary z-50' : 'border-slate-300 dark:border-slate-600'}`}
                            style={{
                                left: node.x - minX,
                                top: node.y - minY,
                                width: node.width,
                                height: node.height,
                                borderColor: node.color ? getColor(node.color) : undefined,
                                borderWidth: node.color ? '2px' : undefined
                            }}
                        >
                            {/* Selection Overlay */}
                            {isSelected && <SelectionOverlay node={node} />}

                            {node.type === 'text' && node.text && (
                                <div className="w-full h-full p-4 text-sm prose dark:prose-invert max-w-none overflow-y-auto node-content cursor-text"
                                    onMouseDown={(e) => {
                                        // If we are editing, allow default to select text
                                        if (isEditingText) {
                                            e.stopPropagation();
                                        } else {
                                            // Pass through to node drag, but maybe distinguish double click?
                                        }
                                    }}
                                    onDoubleClick={() => setIsEditingText(true)}
                                >
                                    {isEditingText ? (
                                        <textarea
                                            autoFocus
                                            className="w-full h-full bg-transparent resize-none focus:outline-none"
                                            value={node.text}
                                            onChange={e => updateText(e.target.value)}
                                            onBlur={() => setIsEditingText(false)}
                                            onMouseDown={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div onClick={(e) => {
                                            const target = e.target as HTMLElement;
                                            const link = target.closest('a');
                                            if (link && link.dataset.internalLink) {
                                                e.preventDefault();
                                                onNavigate?.(link.dataset.internalLink);
                                            }
                                        }}>
                                            <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}
                            {node.type === 'file' && (
                                <div
                                    className="p-4 h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    onDoubleClick={(e) => {
                                        if (node.file) onNavigate?.(node.file);
                                    }}
                                >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                                        {node.file}
                                    </span>
                                    <span className="text-xs text-slate-500">Double click to open</span>
                                </div>
                            )}
                            {node.type === 'group' && (
                                <div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/50 flex items-start justify-center p-2 font-bold text-slate-500">
                                    {node.label}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* UI Overlay (Editor / Toolbar) */}
            {selectedNode && !interactionMode.startsWith('drag') && !interactionMode.startsWith('resize') && (
                <div
                    className="absolute z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: (selectedNode.x - minX) * transform.scale + transform.x,
                        top: (selectedNode.y - minY) * transform.scale + transform.y - 60, // Above node
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    role="toolbar"
                    aria-label="Node actions"
                >
                    <button onClick={deleteSelected} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-red-500" title="Delete" aria-label="Delete node">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto"></div>
                    <div className="flex gap-1" role="group" aria-label="Color selection">
                        {['1', '2', '3', '4', '5', '6'].map((c, i) => (
                            <button
                                key={c}
                                onClick={() => updateColor(c)}
                                className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                                style={{ backgroundColor: getColor(c) }}
                                aria-label={`Color ${i + 1}`}
                            />
                        ))}
                        <button onClick={() => updateColor('')} className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center" aria-label="Remove color">
                            <span className="block w-6 h-px bg-red-500 transform rotate-45"></span>
                        </button>
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none">
                Pan: Middle Mouse or Shift+Drag<br />
                Zoom: Ctrl+Wheel<br />
                Connect: Drag from circle handles
            </div>

        </div>
    );

    // Subcomponents
    function SelectionOverlay({ node }: { node: CanvasNode }) {
        return (
            <>
                {/* Resize Handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-brand-primary cursor-nw-resize" onMouseDown={e => handleResizeMouseDown(e, 'nw')} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-brand-primary cursor-ne-resize" onMouseDown={e => handleResizeMouseDown(e, 'ne')} />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-brand-primary cursor-sw-resize" onMouseDown={e => handleResizeMouseDown(e, 'sw')} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-brand-primary cursor-se-resize" onMouseDown={e => handleResizeMouseDown(e, 'se')} />

                {/* Connection Handles (Top, Right, Bottom, Left) */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'top')} title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'right')} title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'bottom')} title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'left')} title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
            </>
        )
    }
};

export default CanvasRenderer;
