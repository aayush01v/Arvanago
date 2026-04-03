import React, { useEffect, useMemo, useRef, useState } from 'react';
import { layoutWithLines, prepare } from '@/utils/pretextLite.ts';

interface PretextHeroHeadlineProps {
  text: string;
  className?: string;
}

const PretextHeroHeadline: React.FC<PretextHeroHeadlineProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const prepared = useMemo(() => prepare(text, '900 64px Inter, system-ui, sans-serif'), [text]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(nextWidth);
    });

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
    <h1
      ref={containerRef}
      className={`relative text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.08] animate-fade-in-up ${className}`}
      aria-label={text}
    >
      <span className="inline-flex items-center gap-4 mb-4">
        <img src="/logo.svg" alt="Edusimulate logo" className="h-12 w-12 md:h-16 md:w-16" />
        <span className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-brand-primary">Pretext Layout</span>
      </span>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className={`block pb-2 ${index === lines.length - 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-brand-primary to-purple-600 animate-gradient-x' : ''}`}
        >
          {line}
        </span>
      ))}
    </h1>
  );
};

export default PretextHeroHeadline;
