import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

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
      className={`${block ? 'block my-3 overflow-x-auto text-center py-1' : 'inline-block px-1'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
