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

    const saveData = (newData: CanvasData) => {
        setData(newData);
        onSave?.(JSON.stringify(newData, null, 2));
    };

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'none' | 'drag-node' | 'resize-node' | 'connect' | 'pan' | 'zoom'>('none');
    const [transform, setTransform] = useState({ x: 50, y: 50, scale: 0.8 });

    const activeRef = useRef<{
        startMouse: { x: number, y: number };
        initialNode?: CanvasNode;
        handle?: string;
        connectionStart?: { nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' };
        lastTouchDistance?: number;
    }>({ startMouse: { x: 0, y: 0 } });

    const [tempConnection, setTempConnection] = useState<{
        start: { x: number, y: number };
        end: { x: number, y: number };
    } | null>(null);

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

    // --- Touch Helpers ---
    const getTouchDistance = (e: React.TouchEvent) => {
        if (e.touches.length < 2) return 0;
        return Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    };

    // --- Mouse & Touch Handlers ---

    // Note: React's TouchEvent vs MouseEvent are slightly different, so we unite them or duplicate logic.
    // For simplicity, we implement separate handlers but reuse logic where possible.

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
            // Check if we are interacting with something else (selection handled via node/handle handlers)
            // If checking bubbling, node handlers stopPropagation, so here we assume Pan
            handleStart(e.touches[0].clientX, e.touches[0].clientY, 'pan');
        }
    };

    // --- Node (Drag/Select) ---

    // Mouse
    const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
        e.stopPropagation();
        if (e.button !== 0) return;
        setSelectedNodeId(node.id);
        setIsEditingText(false);
        setInteractionMode('drag-node');
        activeRef.current = {
            startMouse: { x: e.clientX, y: e.clientY },
            initialNode: { ...node }
        };
    };

    // Touch
    const handleNodeTouchStart = (e: React.TouchEvent, node: CanvasNode) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
        setIsEditingText(false);
        setInteractionMode('drag-node');
        activeRef.current = {
            startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
            initialNode: { ...node }
        };
    };

    // --- Handle (Resize/Connect) ---

    // Mouse
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

    // Touch
    const handleResizeTouchStart = (e: React.TouchEvent, handle: string) => {
        e.stopPropagation();
        // e.preventDefault(); // prevent default might kill scroll, but handled by touch-action: none
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;
        setInteractionMode('resize-node');
        activeRef.current = {
            startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
            initialNode: { ...node },
            handle
        };
    };

    // Mouse
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

    // Touch
    const handleConnectTouchStart = (e: React.TouchEvent, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left') => {
        e.stopPropagation();
        setInteractionMode('connect');
        const rect = getNodeRect(nodeId);
        const startPoint = getConnectorPoint(rect, side);
        activeRef.current = {
            startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
            connectionStart: { nodeId, side }
        };
        setTempConnection({ start: startPoint, end: startPoint });
    };

    // --- Move & Up Handlers (Common) ---

    // Helper to get clientX/Y from either event type
    // TouchMove doesn't have clientX directly on event, need e.touches[0]
    const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else {
            return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
        }
    };

    const handleMove = (clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
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
    };

    const handleUp = (e?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (interactionMode === 'drag-node' || interactionMode === 'resize-node') {
            saveData(data);
        }

        if (interactionMode === 'connect' && activeRef.current.connectionStart && e) {
            // Can't reliably use e.clientX on touchend because no touches. 
            // We rely on last known move or changedTouches[0].
            let clientX = 0, clientY = 0;
            if ('changedTouches' in e && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else if ('clientX' in e) {
                clientX = (e as React.MouseEvent).clientX;
                clientY = (e as React.MouseEvent).clientY;
            }

            const canvasRect = document.querySelector('.group')?.getBoundingClientRect(); // Hacky ref
            // Better: use activeRef or assume full screen. 
            // Actually, getting rect from event target in 'up' is hard if it fired on window.
            // We can use the last known target or just calculation.
            // For strict correctness we need proper ref.

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
                }
            }
        }

        setInteractionMode('none');
        setTempConnection(null);
        activeRef.current = { startMouse: { x: 0, y: 0 } }; // Reset
    };

    // React Events
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY, e);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
    const onMouseUp = (e: React.MouseEvent) => handleUp(e);
    const onTouchEnd = (e: React.TouchEvent) => handleUp(e);

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

    const selectedNode = data.nodes.find(n => n.id === selectedNodeId);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 bg-grid-slate-200 dark:bg-grid-slate-800 cursor-default select-none group touch-none"
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onTouchStart={handleCanvasTouchStart}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            onMouseLeave={onMouseUp}
        // onTouchCancel={onTouchEnd} 
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

                    if (node.type === 'sticker') {
                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                                onTouchStart={(e) => handleNodeTouchStart(e, node)}
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
                                {isSelected && <SelectionOverlay node={node} />}
                            </div>
                        )
                    }

                    return (
                        <div
                            key={node.id}
                            onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            onTouchStart={(e) => handleNodeTouchStart(e, node)}
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
                            {isSelected && <SelectionOverlay node={node} />}

                            {node.type === 'text' && node.text && (
                                <div className="w-full h-full p-4 text-sm prose dark:prose-invert max-w-none overflow-y-auto node-content cursor-text"
                                    onMouseDown={(e) => {
                                        if (isEditingText) {
                                            e.stopPropagation();
                                        }
                                    }}
                                    onTouchStart={(e) => {
                                        if (isEditingText) {
                                            e.stopPropagation();
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
                                            onTouchStart={e => e.stopPropagation()}
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

            {selectedNode && !interactionMode.startsWith('drag') && !interactionMode.startsWith('resize') && (
                <div
                    className="absolute z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: (selectedNode.x - minX) * transform.scale + transform.x,
                        top: (selectedNode.y - minY) * transform.scale + transform.y - 60,
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
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

            {/* Help Text - Hidden on mobile */}
            <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none hidden md:block">
                Pan: Middle Mouse or Shift+Drag<br />
                Zoom: Ctrl+Wheel<br />
                Connect: Drag from circle handles
            </div>

        </div>
    );

    function SelectionOverlay({ node }: { node: CanvasNode }) {
        return (
            <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-brand-primary cursor-nw-resize"
                    onMouseDown={e => handleResizeMouseDown(e, 'nw')}
                    onTouchStart={e => handleResizeTouchStart(e, 'nw')}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-brand-primary cursor-ne-resize"
                    onMouseDown={e => handleResizeMouseDown(e, 'ne')}
                    onTouchStart={e => handleResizeTouchStart(e, 'ne')}
                />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-brand-primary cursor-sw-resize"
                    onMouseDown={e => handleResizeMouseDown(e, 'sw')}
                    onTouchStart={e => handleResizeTouchStart(e, 'sw')}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-brand-primary cursor-se-resize"
                    onMouseDown={e => handleResizeMouseDown(e, 'se')}
                    onTouchStart={e => handleResizeTouchStart(e, 'se')}
                />

                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'top')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'top')}
                    title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'right')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'right')}
                    title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'bottom')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'bottom')}
                    title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
                <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-brand-primary cursor-crosshair opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'left')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'left')}
                    title="Connect">
                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                </div>
            </>
        )
    }
};

export default CanvasRenderer;
