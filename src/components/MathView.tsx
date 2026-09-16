import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

const MATH_REGEX = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;

// Prose that mixes sentences with inline and block math, e.g. "Heat $Q_{in}$ is absorbed at $T_H$."
export const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;
  return (
    <span className={className}>
      {text.split(MATH_REGEX).map((part, i) => {
        if (!part) return null;
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          return <MathView key={i} math={part.slice(2, -2)} block />;
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return <MathView key={i} math={part.slice(1, -1)} />;
        }
        return part;
      })}
    </span>
  );
};

export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const hasFractionOrTall = useMemo(() => {
    if (!math) return false;
    return (
      math.includes('\\frac') ||
      math.includes('\\dfrac') ||
      math.includes('\\partial') ||
      math.includes('\\int') ||
      math.includes('\\sum') ||
      math.includes('\\oint')
    );
  }, [math]);

  const html = useMemo(() => {
    if (!math) return '';
    let cleanMath = math.replace(/^\$\$?|\$\$?$/g, '').trim();
    // In inline mode, if there are fractions or tall symbols, use \displaystyle so they are not compressed into illegible micro-scripts
    if (!block && hasFractionOrTall && !cleanMath.includes('\\displaystyle')) {
      cleanMath = `\\displaystyle ${cleanMath}`;
    }
    try {
      return katex.renderToString(cleanMath, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `<code>${cleanMath}</code>`;
    }
  }, [math, block, hasFractionOrTall]);

  if (block) {
    return (
      <div
        className={`my-3 overflow-x-auto overflow-y-hidden text-center py-2.5 px-3 max-w-full scrollbar-thin ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-middle ${hasFractionOrTall ? 'my-1 px-1.5' : 'px-0.5'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
