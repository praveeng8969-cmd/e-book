import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

const INLINE_MATH = /(\$[^$\n]+?\$)/g;

// Prose that mixes sentences with inline math, e.g. "Heat $Q_{in}$ is absorbed at $T_H$."
export const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;
  return (
    <span className={className}>
      {text.split(INLINE_MATH).map((part, i) =>
        part.startsWith('$') && part.endsWith('$') && part.length > 2 ? (
          <MathView key={i} math={part.slice(1, -1)} />
        ) : (
          part
        )
      )}
    </span>
  );
};

export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    if (!math) return '';
    const cleanMath = math.replace(/^\$\$?|\$\$?$/g, '').trim();
    try {
      return katex.renderToString(cleanMath, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `<code>${cleanMath}</code>`;
    }
  }, [math, block]);

  return (
    <span
      className={`${block ? 'block my-3 overflow-x-auto text-center py-1' : 'inline-block align-baseline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
