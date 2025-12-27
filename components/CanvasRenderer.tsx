import { Note } from '../types';
import React, { useMemo, useState, useRef, useEffect } from 'react';
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

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ content, onNavigate, onSave, files = [] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
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
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'none' | 'drag-node' | 'resize-node' | 'connect' | 'pan' | 'zoom'>('none');
    const [transform, setTransform] = useState({ x: 50, y: 50, scale: 0.8 });

    const activeRef = useRef<{
        startMouse: { x: number, y: number };
        initialNode?: CanvasNode;
        handle?: string;
        connectionStart?: { nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' };
        lastTouchDistance?: number;
        longPressStart?: { x: number, y: number };
    }>({ startMouse: { x: 0, y: 0 } });

    // Timer for mobile long-press
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [tempConnection, setTempConnection] = useState<{
        start: { x: number, y: number };
        end: { x: number, y: number };
    } | null>(null);

    const minX = Math.min(...(data.nodes.length ? data.nodes.map(n => n.x) : [0]));
    const minY = Math.min(...(data.nodes.length ? data.nodes.map(n => n.y) : [0]));

    const getColor = (colorStr: string) => {
        // Obsidian Canvas Colors
        const colors: Record<string, string> = {
            '1': '#ff5959', // Red
            '2': '#ff9b59', // Orange
            '3': '#ffdf59', // Yellow
            '4': '#59ff59', // Green
            '5': '#59ffff', // Cyan
            '6': '#599bff', // Blue
            '7': '#b359ff', // Purple
            '8': '#ff59c8', // Pink
            '9': '#cccccc', // Grey
        };
        return colors[colorStr] || colorStr;
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
    };

    const resolveFileSrc = (filePath: string) => {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;

        // Try to find the file in the passed notes/files
        // path in canvas JSON is usually "Path/To/File.png"
        // note in list has path: "Path/To" and title: "File.png"

        const targetName = filePath.split('/').pop();
        const targetPath = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';

        // Exact match
        let found = files.find(n => n.title === targetName && (n.path === targetPath || !targetPath));

        // Loose match (just filename)
        if (!found) {
            found = files.find(n => n.title === targetName);
        }

        if (found) {
            // Check if content is a data URI
            if (found.content.startsWith('data:')) return found.content;
            // If not, it might be a text file, but we shouldn't be here for images unless stored wrong
            return found.content;
        }

        return filePath; // Fallback to original path (might be 404 but best effort)
    };

    const processNodeText = (text: string) => {
        let cleanText = text;
        let classes = "";

        // 1. Extract Frontmatter (allow optional leading whitespace)
        // Also look for cssclasses anywhere in the text if strict frontmatter fails or complements it
        const frontmatterRegex = /^\s*---\n([\s\S]*?)\n---\n/;
        const match = text.match(frontmatterRegex);

        let frontmatterContent = "";
        if (match) {
            frontmatterContent = match[1];
            cleanText = text.replace(frontmatterRegex, '');
        }

        // Look for cssclasses in frontmatter OR anywhere in the text (e.g. at the bottom)
        // This regex looks for 'cssclasses: value' 
        const cssClassesRegex = /cssclasses:\s*(.*)/;
        const classMatch = frontmatterContent.match(cssClassesRegex) || text.match(cssClassesRegex);

        if (classMatch) {
            // Handle comma-separated and bracket syntax [cls1, cls2]
            classes = classMatch[1]
                .replace(/[\[\]]/g, '') // Remove brackets
                .trim()
                .replace(/,/g, ' '); // Replace commas with spaces

            // Remove the cssclasses line from the text content so it's not visible
            // We use a global regex to catch it anywhere
            cleanText = cleanText.replace(/cssclasses:.*(\r\n|\n|\r)?/g, '');
        }

        // 2. Handle Canvas Candy Callouts (convert to HTML for rehype-raw)
        // ensure data-callout is passed. React accepts data- attributes.

        // Header
        cleanText = cleanText.replace(/>\s*\[!cc-header(-noborder)?\]\s*(.*)/g, (match, noBorder, title) => {
            const type = noBorder ? 'cc-header-noborder' : 'cc-header';
            const style = `background-color: rgba(var(--canvas-color), var(--cc-header-opacity-level)); border-bottom: ${noBorder ? 'none' : '2px solid rgba(var(--canvas-color), 1)'}; padding: 8px 16px; margin: -1rem -1rem 1rem -1rem;`;
            return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title" style="font-weight: bold;">${title}</div></div>`;
        });

        // Footer
        cleanText = cleanText.replace(/>\s*\[!cc-footer(-noborder)?\]\s*(.*)/g, (match, noBorder, title) => {
            const type = noBorder ? 'cc-footer-noborder' : 'cc-footer';
            const style = `background-color: rgba(var(--canvas-color), var(--cc-footers-opacity-level)); border-top: ${noBorder ? 'none' : '2px solid rgba(var(--canvas-color), 1)'}; padding: 8px 16px; margin: 1rem -1rem -1rem -1rem;`;
            return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title" style="font-weight: bold;">${title}</div></div>`;
        });

        // Labels
        cleanText = cleanText.replace(/>\s*\[!cc-label-(left|right)(-noborder)?\]\s*(.*)/g, (match, side, noBorder, title) => {
            const type = `cc-label-${side}${noBorder ? '-noborder' : ''}`;
            const innerTitle = title.trim() ? title : '';
            const isLeft = side === 'left';
            const style = `
                position: absolute;
                ${isLeft ? 'left: 0; transform: translateX(-100%); border-right: 2px solid rgba(var(--canvas-color), 1);' : 'right: 0; transform: translateX(100%); border-left: 2px solid rgba(var(--canvas-color), 1);'}
                top: 20px;
                background-color: rgba(var(--canvas-color), var(--cc-labels-opacity-level));
                padding: 4px 8px;
                ${noBorder ? 'border: none;' : ''}
            `;
            return `<div data-callout="${type}" class="callout" style="${style}"><div class="callout-title"><div class="callout-title-inner">${innerTitle}</div></div></div>`;
        });

        // Remove 'cc-card' marker if present
        cleanText = cleanText.replace(/\[!cc-card\]/g, '');


        // 3. Obsidan/Standard Transformations
        // Image embeds ![[path]] -> need rendering?
        cleanText = cleanText.replace(/!\[\[([^\]]+)\]\]/g, (match, p1) => {
            const src = resolveFileSrc(p1);
            if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(p1)) {
                return `<img src="${src}" alt="${p1}" class="w-full rounded-lg" />`;
            }
            return `<div class="p-2 border-l-4 border-brand-primary bg-slate-50 dark:bg-slate-800 my-2 text-sm italic">Embedded: ${p1}</div>`;
        });

        cleanText = cleanText.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, p1, p2) => {
            const label = p2 || p1;
            const target = p1;
            return `<a href="#" data-internal-link="${target}" class="text-brand-primary hover:underline">${label}</a>`;
        });
        cleanText = cleanText.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="text-brand-primary bg-brand-primary/10 px-1 rounded text-xs font-mono">#$2</span>');

        return { cleanText, classes };
    };

    // --- Toolbar Component ---
    const NodeToolbar = ({ node, onColorChange, onEdit }: { node: CanvasNode, onColorChange: (color: string) => void, onEdit: () => void }) => {
        const colors = ['1', '2', '3', '4', '5', '6']; // Red, Orange, Yellow, Green, Cyan, Blue
        return (
            <div className="absolute -top-12 left-0 h-10 bg-white dark:bg-slate-800 shadow-lg rounded-full flex items-center px-3 gap-2 border border-slate-200 dark:border-slate-700 z-[100]"
                onMouseDown={e => e.stopPropagation()} // Prevent dragging node when clicking toolbar
            >
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
    const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
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
    };

    // Touch
    const handleNodeTouchStart = (e: React.TouchEvent, node: CanvasNode) => {
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
        e.preventDefault();
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
        e.preventDefault();
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
    };

    const handleUp = (e?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
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

    const updateEdgeLabel = (text: string) => {
        if (!selectedEdgeId) return;
        const updated = data.edges.map(e => e.id === selectedEdgeId ? { ...e, label: text } : e);
        saveData({ ...data, edges: updated });
    };

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
                            {/* Hit Path (Transparent, Wide) - Click to select */}
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
                            {/* Visible Path */}
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
                {data.nodes.map(node => {
                    const { cleanText, classes } = node.text ? processNodeText(node.text) : { cleanText: '', classes: '' };
                    const isSelected = node.id === selectedNodeId;
                    const nodeColor = node.color ? getColor(node.color) : undefined;
                    const nodeRgb = nodeColor ? hexToRgb(nodeColor) : undefined;

                    const nodeStyle: any = {
                        left: node.x - minX,
                        top: node.y - minY,
                        width: node.width,
                        height: node.height,
                        // Defaults for CC variables in case CSS :root is missed
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

                    // --- Wrapper Structure for Canvas Candy ---
                    // .canvas-node > .canvas-node-container > .canvas-node-content


                    if (node.type === 'file') {
                        const isImage = node.file && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(node.file);
                        const isSticker = node.file && node.file.includes('-cc-image');

                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                                onTouchStart={(e) => handleNodeTouchStart(e, node)}
                                className={`canvas-node absolute overflow-visible flex flex-col ${isSelected ? 'z-50' : 'z-10'}`}
                                style={nodeStyle}
                            >
                                <div
                                    className={`canvas-node-container w-full h-full border rounded-lg shadow-sm bg-white dark:bg-slate-800 transition-all ${isSelected ? 'ring-2 ring-brand-primary' : isSticker ? 'border-none shadow-none bg-transparent' : 'border-slate-300 dark:border-slate-600'}`}
                                    style={isSticker ? { backgroundColor: 'transparent', border: 'none', boxShadow: 'none' } : undefined}
                                >
                                    <div className={`canvas-node-content w-full h-full flex flex-col ${isSticker ? 'bg-transparent' : ''}`}
                                        style={isSticker ? { backgroundColor: 'transparent' } : undefined}
                                    >
                                        {isSelected && <SelectionOverlay node={node} />}

                                        {isImage ? (
                                            <img
                                                src={resolveFileSrc(node.file!)}
                                                alt={node.file}
                                                // Ensure the src attribute contains the keyword so CSS selectors might also pick it up if they target img[src*="..."]
                                                // Although base64 breaks that, inline styles above fix it.
                                                data-src-path={node.file}
                                                className="w-full h-full object-contain pointer-events-none"
                                            />
                                        ) : (
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
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    if (node.type === 'sticker') {
                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                                onTouchStart={(e) => handleNodeTouchStart(e, node)}
                                className={`canvas-node absolute ${isSelected ? 'ring-2 ring-brand-primary' : 'hover:ring-1 hover:ring-brand-primary/50'}`}
                                style={nodeStyle}
                            >
                                <div className="canvas-node-container w-full h-full relative" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                                    <div className="canvas-node-content w-full h-full" style={{ backgroundColor: 'transparent' }}>
                                        <img
                                            src={resolveFileSrc(node.file || node.url || '')}
                                            alt="sticker"
                                            className="w-full h-full object-contain pointer-events-none"
                                        />
                                    </div>
                                </div>
                                {isSelected && <SelectionOverlay node={node} />}
                            </div>
                        )
                    }

                    return (
                        <div
                            key={node.id}
                            onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            onTouchStart={(e) => handleNodeTouchStart(e, node)}
                            // 'canvas-node' class is crucial for CC selectors
                            className={`canvas-node absolute overflow-visible flex flex-col ${isSelected ? 'z-50' : 'z-10'} ${classes}`}
                            style={nodeStyle}
                        >
                            {/* Container: holds the actual styled card. CC expects classes here/inside to trigger styles */}
                            <div
                                className={`canvas-node-container w-full h-full border rounded-lg shadow-sm bg-white dark:bg-slate-800 transition-all ${isSelected ? 'ring-2 ring-brand-primary' : 'border-slate-300 dark:border-slate-600'}`}
                                style={{
                                    borderColor: nodeColor,
                                    borderWidth: nodeColor ? '2px' : undefined
                                }}
                            >
                                {/* Content: where the text lives. Classes from frontmatter applied HERE so :has() on container works */}
                                <div className={`canvas-node-content w-full h-full flex flex-col ${classes}`}>
                                    {isSelected && <SelectionOverlay node={node} />}

                                    {node.type === 'text' && node.text && (
                                        <div className="w-full h-full text-sm flex flex-col node-content cursor-text overflow-hidden rounded-lg"
                                            onDoubleClick={() => setIsEditingText(true)}
                                        >
                                            <div className={`markdown-preview-view w-full flex-1 overflow-y-auto ${!(isSelected && isEditingText) ? 'p-4 prose dark:prose-invert max-w-none' : ''}`}
                                                onMouseDown={(e) => {
                                                    if (isSelected && isEditingText) {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                                onTouchStart={(e) => {
                                                    if (isSelected && isEditingText) {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                            >
                                                {isSelected && isEditingText ? (
                                                    <textarea
                                                        autoFocus
                                                        className="w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm"
                                                        value={node.text}
                                                        onChange={e => updateText(e.target.value)}
                                                        onBlur={() => setIsEditingText(false)}
                                                        onMouseDown={e => e.stopPropagation()}
                                                        onTouchStart={e => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <div className="markdown-preview-section" onClick={(e) => {
                                                        const target = e.target as HTMLElement;
                                                        const link = target.closest('a');
                                                        if (link && link.dataset.internalLink) {
                                                            e.preventDefault();
                                                            onNavigate?.(link.dataset.internalLink);
                                                        }
                                                    }}>
                                                        {/* Processed text includes generic <div>s representing callouts which CC styles */}
                                                        <ReactMarkdown
                                                            rehypePlugins={[rehypeRaw, rehypeKatex]}
                                                            remarkPlugins={[remarkGfm, remarkMath]}
                                                        >
                                                            {cleanText}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {node.type === 'group' && (
                                        <div className="w-full h-full bg-slate-100/50 dark:bg-slate-800/50 flex items-start justify-center p-2 font-bold text-slate-500">
                                            {node.label}
                                        </div>
                                    )}
                                </div>
                            </div>
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
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto"></div>
                        <button onClick={() => setIsEditingText(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Edit Text" aria-label="Edit text">
                            <Icon name="edit" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

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

            {/* Help Text - Hidden on mobile */}
            <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none hidden md:block">
                Pan: Middle Mouse or Shift+Drag<br />
                Zoom: Ctrl+Wheel<br />
                Connect: Drag from circle handles
            </div>

        </div>
    );

    const handleColorChange = (nodeId: string, color: string) => {
        setData(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, color } : n)
        }));
        saveData({ ...data, nodes: data.nodes.map(n => n.id === nodeId ? { ...n, color } : n) });
    };

    function SelectionOverlay({ node }: { node: CanvasNode }) {
        return (
            <>
                <NodeToolbar
                    node={node}
                    onColorChange={(color) => handleColorChange(node.id, color)}
                    onEdit={() => setIsEditingText(true)}
                />
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

                {/* Connection Handles */}

                {/* TOP */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center cursor-crosshair z-10`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'top')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'top')}
                    title="Connect">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-brand-primary flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-16 h-16 flex items-center justify-center cursor-crosshair z-10`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'right')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'right')}
                    title="Connect">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-brand-primary flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                    </div>
                </div>

                {/* BOTTOM */}
                <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-16 flex items-center justify-center cursor-crosshair z-10`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'bottom')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'bottom')}
                    title="Connect">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-brand-primary flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                    </div>
                </div>

                {/* LEFT */}
                <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-16 h-16 flex items-center justify-center cursor-crosshair z-10`}
                    onMouseDown={e => handleConnectMouseDown(e, node.id, 'left')}
                    onTouchStart={e => handleConnectTouchStart(e, node.id, 'left')}
                    title="Connect">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-brand-primary flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                    </div>
                </div>
            </>
        )
    }
};

export default CanvasRenderer;
