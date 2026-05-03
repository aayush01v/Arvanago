export interface PreparedText {
  text: string;
  font: string;
  segments: string[];
  segmentWidths: number[];
  spaceWidth: number;
}

export interface LayoutResult {
  lines: string[];
  lineCount: number;
  height: number;
}

const sharedMeasureContext: CanvasRenderingContext2D | null = (() => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  return canvas.getContext('2d');
})();

const splitSegments = (text: string): string[] => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length ? normalized.split(' ') : [];
};

export const prepare = (text: string, font: string): PreparedText => {
  const segments = splitSegments(text);

  if (sharedMeasureContext) {
    sharedMeasureContext.font = font;
  }

  const segmentWidths = segments.map((segment) => sharedMeasureContext?.measureText(segment).width ?? segment.length * 10);
  const spaceWidth = sharedMeasureContext?.measureText(' ').width ?? 8;

  return {
    text,
    font,
    segments,
    segmentWidths,
    spaceWidth,
  };
};

export const layoutWithLines = (prepared: PreparedText, maxWidth: number, lineHeight: number): LayoutResult => {
  const lines: string[] = [];
  let currentLine = '';
  let currentLineWidth = 0;

  prepared.segments.forEach((segment, index) => {
    const segmentWidth = prepared.segmentWidths[index];
    const segmentWidthWithGap = currentLine.length === 0 ? segmentWidth : segmentWidth + prepared.spaceWidth;

    if (currentLineWidth + segmentWidthWithGap <= maxWidth || currentLine.length === 0) {
      currentLine = currentLine.length === 0 ? segment : `${currentLine} ${segment}`;
      currentLineWidth += segmentWidthWithGap;
      return;
    }

    lines.push(currentLine);
    currentLine = segment;
    currentLineWidth = segmentWidth;
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return {
    lines,
    lineCount: lines.length,
    height: lines.length * lineHeight,
  };
};
