import React, { useEffect, useMemo, useRef, useState } from 'react';
import { layoutWithLines, prepare } from '@/utils/pretextLite.ts';

interface PretextHeroHeadlineProps {
  text: string;
  className?: string;
}

const PretextHeroHeadline: React.FC<PretextHeroHeadlineProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fontSpec, setFontSpec] = useState('900 64px Inter, system-ui, sans-serif');

  const prepared = useMemo(() => prepare(text, fontSpec), [fontSpec, text]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeadlineMeasurements = (entryWidth?: number) => {
      if (!containerRef.current) return;
      const computed = window.getComputedStyle(containerRef.current);
      const weight = computed.fontWeight || '900';
      const size = computed.fontSize || '64px';
      const family = computed.fontFamily || 'Inter, system-ui, sans-serif';
      setFontSpec(`${weight} ${size} ${family}`);
      setContainerWidth(entryWidth ?? containerRef.current.clientWidth);
    };

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      updateHeadlineMeasurements(nextWidth);
    });

    updateHeadlineMeasurements();
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { lines } = useMemo(() => {
    if (!containerWidth) {
      return {
        lines: [text],
        lineCount: 1,
        height: 0,
      };
    }

    return layoutWithLines(prepared, containerWidth, 80);
  }, [containerWidth, prepared, text]);

  return (
    <div className="mb-8 animate-fade-in-up">
      <h1
        ref={containerRef}
        className={`relative mx-auto max-w-5xl text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-[-0.03em] leading-[1.04] ${className}`}
        aria-label={text}
      >
        {lines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            className={`block pb-2 ${
              index === lines.length - 1
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-brand-primary to-purple-600 animate-gradient-x'
                : ''
            }`}
          >
            {line}
          </span>
        ))}
      </h1>
      <div className="mx-auto mt-3 h-px w-28 bg-gradient-to-r from-transparent via-brand-primary/70 to-transparent" />
    </div>
  );
};

export default PretextHeroHeadline;
