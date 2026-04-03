import React, { useEffect, useMemo, useRef, useState } from 'react';
import { layoutWithLines, prepare } from '@/utils/pretextLite.ts';

interface PretextButtonLabelProps {
  text: string;
  className?: string;
  lineHeight?: number;
}

const PretextButtonLabel: React.FC<PretextButtonLabelProps> = ({
  text,
  className = '',
  lineHeight = 20,
}) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fontSpec, setFontSpec] = useState('700 14px Inter, system-ui, sans-serif');

  const prepared = useMemo(() => prepare(text, fontSpec), [fontSpec, text]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateMeasurements = (entryWidth?: number) => {
      if (!containerRef.current) return;
      const computed = window.getComputedStyle(containerRef.current);
      const weight = computed.fontWeight || '700';
      const size = computed.fontSize || '14px';
      const family = computed.fontFamily || 'Inter, system-ui, sans-serif';
      setFontSpec(`${weight} ${size} ${family}`);
      setContainerWidth(entryWidth ?? containerRef.current.clientWidth);
    };

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      updateMeasurements(nextWidth);
    });

    updateMeasurements();
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const lines = useMemo(() => {
    if (!containerWidth) return [text];
    return layoutWithLines(prepared, containerWidth, lineHeight).lines;
  }, [containerWidth, lineHeight, prepared, text]);

  return (
    <span ref={containerRef} className={`inline-block text-center ${className}`} aria-label={text}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block">
          {line}
        </span>
      ))}
    </span>
  );
};

export default PretextButtonLabel;
