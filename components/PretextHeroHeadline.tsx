import React, { useEffect, useMemo, useRef, useState } from 'react';
import { layoutWithLines, prepare } from '@/utils/pretextLite.ts';
import { LOGO_URL } from '@/constants.ts';

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
      <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-brand-primary shadow-sm">
        <img src={LOGO_URL} alt="Edusimulate logo" className="h-8 w-8 object-contain md:h-10 md:w-10" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] md:text-sm">Pretext Layout</span>
      </div>
      <h1
        ref={containerRef}
        className={`relative text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.08] ${className}`}
        aria-label={text}
      >
        {lines.map((line, index) => (
          <span
            key={`${line}-${index}`}
            className={`block pb-2 ${index === lines.length - 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-brand-primary to-purple-600 animate-gradient-x' : ''}`}
          >
            {line}
          </span>
        ))}
      </h1>
    </div>
  );
};

export default PretextHeroHeadline;
