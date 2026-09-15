import React, { useState, useMemo } from 'react';
import { Chapter, QuickFormula } from '../types';
import { MathView } from './MathView';
import { FormulaCard } from './FormulaCard';
import {
  PistonCylinderSim,
  ThermalEquilibriumSim,
  EnergyBalanceSim,
  CarnotCycleSim,
  EntropyGenerationSim,
  ExergyDeadStateSim,
  GasMixtureSim,
  PhaseChangeDomeSim,
  JouleThomsonSim,
  SystemBoundarySim,
  PVDomainSim,
  SteadyFlowDevicesSim,
} from './simulations';

import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface EBookReaderProps {
  chapter: Chapter;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  hasNextChapter: boolean;
  hasPrevChapter: boolean;
}

export const EBookReader: React.FC<EBookReaderProps> = ({
  chapter,
  onNextChapter,
  onPrevChapter,
  hasNextChapter,
  hasPrevChapter,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Helper to normalize latex for comparison
  const normalizeLatex = (str: string) => {
    return str
      .replace(/\\,/g, '')
      .replace(/\\;/g, '')
      .replace(/\\quad/g, '')
      .replace(/\\qquad/g, '')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  };

  // Find matching QuickFormula from chapter or any keyFormulas across all sections
  const findMatchingFormula = (latexStr: string): QuickFormula | null => {
    if (!latexStr || !chapter.quickFormulas) return null;
    const cleanMath = normalizeLatex(latexStr);

    // 1. Direct exact or substring match in quickFormulas
    for (const qf of chapter.quickFormulas) {
      const qfClean = normalizeLatex(qf.latex);
      if (qfClean === cleanMath || qfClean.includes(cleanMath) || cleanMath.includes(qfClean)) {
        return qf;
      }
    }

    // 2. Check if any section's keyFormulas maps to a quickFormula
    for (const sec of chapter.sections) {
      if (sec.keyFormulas) {
        for (const kf of sec.keyFormulas) {
          const kfClean = normalizeLatex(kf.formula);
          if (kfClean === cleanMath || kfClean.includes(cleanMath) || cleanMath.includes(kfClean)) {
            const match = chapter.quickFormulas.find(
              (qf) =>
                qf.name.toLowerCase().includes(kf.label.toLowerCase()) ||
                kf.label.toLowerCase().includes(qf.name.toLowerCase()) ||
                normalizeLatex(qf.latex).includes(kfClean)
            );
            if (match) return match;
          }
        }
      }
    }

    return null;
  };

  // Calculate search match counts in total
  const totalMatchesInChapter = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return 0;

    let count = 0;
    chapter.sections.forEach((sec) => {
      if (sec.title.toLowerCase().includes(q)) count += 2;
      sec.content.forEach((p) => {
        const pLower = p.toLowerCase();
        let pos = 0;
        while ((pos = pLower.indexOf(q, pos)) !== -1) {
          count++;
          pos += q.length;
        }
      });
    });
    return count;
  }, [chapter.sections, searchQuery]);

  // Highlight matched substrings in plain text
  const highlightSearchText = (text: string) => {
    const q = searchQuery.trim();
    if (!q || !text) return text;

    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    if (parts.length === 1) return text;

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-amber-300 dark:bg-amber-500/35 text-slate-950 dark:text-amber-200 font-semibold px-0.5 rounded-xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Inline formatting helper for math, bold, italic, and symbols
  const renderFormattedLine = (text: string) => {
    if (!text) return null;
    // Regex matches $$...$$ (block math), $...$ (inline math)
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const parts = text.split(mathRegex);

    return (
      <React.Fragment>
        {parts.map((part, idx) => {
          if (!part) return null;
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2).trim();
            const matched = findMatchingFormula(math);
            if (matched) {
              return (
                <div key={idx} className="my-4">
                  <FormulaCard formula={matched} badge="FORMULA" />
                </div>
              );
            }
            return (
              <span
                key={idx}
                className="block my-2 text-center py-2 px-3 bg-white/70 dark:bg-white/[0.06] backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-white/10 text-cyan-800 dark:text-cyan-300 font-mono overflow-x-auto shadow-xs"
              >
                <MathView math={math} block />
              </span>
            );
          }
          if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1).trim();
            return (
              <span
                key={idx}
                className="inline-block px-1.5 py-0.5 mx-0.5 bg-white/70 dark:bg-white/[0.08] backdrop-blur-xs rounded-md border border-slate-200/80 dark:border-white/10 font-mono text-cyan-700 dark:text-cyan-300 font-medium"
              >
                <MathView math={math} />
              </span>
            );
          }

          // Handle **bold**
          const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={idx}>
              {boldParts.map((bPart, bIdx) => {
                if (bPart.startsWith('**') && bPart.endsWith('**')) {
                  const cleanBold = bPart.slice(2, -2).replace(/[*$#]/g, '');
                  return (
                    <strong key={bIdx} className="font-bold text-slate-900 dark:text-white">
                      {highlightSearchText(cleanBold)}
                    </strong>
                  );
                }

                // Handle *italic*
                const italicParts = bPart.split(/(\*[^*]+\*)/g);
                return (
                  <span key={bIdx}>
                    {italicParts.map((iPart, iIdx) => {
                      if (iPart.startsWith('*') && iPart.endsWith('*')) {
                        const cleanItalic = iPart.slice(1, -1).replace(/[*$#]/g, '');
                        return (
                          <em key={iIdx} className="italic text-slate-700 dark:text-slate-300">
                            {highlightSearchText(cleanItalic)}
                          </em>
                        );
                      }
                      // Remove any stray unparsed '*', '$', or '#'
                      const cleanText = iPart.replace(/[*$#]/g, '');
                      return highlightSearchText(cleanText);
                    })}
                  </span>
                );
              })}
            </span>
          );
        })}
      </React.Fragment>
    );
  };

  // Helper to chunk section content into typed blocks (headings, formulas, tables, lists/paragraphs)
  type ParsedBlock =
    | { type: 'heading'; level: number; text: string }
    | { type: 'formula'; math: string }
    | { type: 'table'; lines: string[] }
    | { type: 'text'; lines: string[] };

  const parseSectionBlocks = (rawItems: string[]): ParsedBlock[] => {
    const blocks: ParsedBlock[] = [];
    let i = 0;

    while (i < rawItems.length) {
      const item = rawItems[i];
      const trimmed = item.trim();

      // 1. Heading check
      if (/^#{1,6}\s+/.test(trimmed) && !trimmed.includes('\n')) {
        const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
        const level = match ? match[1].length : 3;
        const text = match ? match[2] : trimmed.replace(/^#{1,6}\s*/, '');
        blocks.push({ type: 'heading', level, text });
        i++;
        continue;
      }

      // 2. Block formula check
      if (
        (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
        (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 2 && !trimmed.slice(1, -1).includes('$'))
      ) {
        const math = trimmed.replace(/^\$\$?|\$\$?$/g, '').trim();
        blocks.push({ type: 'formula', math });
        i++;
        continue;
      }

      // 3. Table lines check (consecutive items starting with '|')
      if (trimmed.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < rawItems.length && rawItems[i].trim().startsWith('|')) {
          const subLines = rawItems[i].split('\n').map((l) => l.trim()).filter(Boolean);
          if (subLines.every((l) => l.startsWith('|'))) {
            tableLines.push(...subLines);
            i++;
          } else {
            break;
          }
        }
        if (tableLines.length >= 2) {
          blocks.push({ type: 'table', lines: tableLines });
        } else {
          blocks.push({ type: 'text', lines: tableLines });
        }
        continue;
      }

      // 4. Multiline item with embedded markdown table
      if (item.includes('\n') && (item.includes('| ---') || item.includes('|:---') || item.includes('| :---'))) {
        const lines = item.split('\n');
        const beforeTable: string[] = [];
        const tableLines: string[] = [];
        const afterTable: string[] = [];
        let state: 'before' | 'table' | 'after' = 'before';

        for (const line of lines) {
          const tLine = line.trim();
          if (state === 'before') {
            if (tLine.startsWith('|')) {
              state = 'table';
              tableLines.push(tLine);
            } else {
              beforeTable.push(line);
            }
          } else if (state === 'table') {
            if (tLine.startsWith('|')) {
              tableLines.push(tLine);
            } else {
              state = 'after';
              afterTable.push(line);
            }
          } else {
            afterTable.push(line);
          }
        }

        if (beforeTable.length > 0) {
          blocks.push({ type: 'text', lines: beforeTable });
        }
        if (tableLines.length >= 2) {
          blocks.push({ type: 'table', lines: tableLines });
        } else if (tableLines.length > 0) {
          blocks.push({ type: 'text', lines: tableLines });
        }
        if (afterTable.length > 0) {
          blocks.push({ type: 'text', lines: afterTable });
        }
        i++;
        continue;
      }

      // 5. Default text / list block
      blocks.push({ type: 'text', lines: item.split('\n') });
      i++;
    }

    return blocks;
  };

  // Render markdown table as semantic React HTML <table> with <thead>, <tbody>, <tr>, <th>, and <td>
  const renderTable = (lines: string[], keyPrefix: number | string) => {
    const validLines = lines.map((l) => l.trim()).filter((l) => l.startsWith('|'));
    if (validLines.length < 2) return null;

    const headerLine = validLines[0];
    // Check if second line is a separator line (e.g. |:---|---:| or |---|)
    const isSeparatorLine =
      validLines.length > 1 && /^\|(\s*:?-+:?\s*\|)+$/.test(validLines[1].replace(/\s+/g, ''));
    const alignLine = isSeparatorLine ? validLines[1] : '';
    const rowLines = isSeparatorLine ? validLines.slice(2) : validLines.slice(1);

    const headers = headerLine
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((h) => h.trim());

    // Parse alignment (:---: = center, ---: = right, :--- = left)
    const alignments = alignLine
      ? alignLine
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((a) => {
            const trimmed = a.trim();
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'text-center';
            if (trimmed.endsWith(':')) return 'text-right';
            if (trimmed.startsWith(':')) return 'text-left';
            return 'text-left';
          })
      : [];

    return (
      <div
        key={keyPrefix}
        className="overflow-x-auto my-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/70 shadow-sm dark:shadow-md"
      >
        <table className="w-full text-xs sm:text-sm text-left border-collapse">
          <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-900 dark:text-cyan-300 font-mono tracking-wide border-b border-slate-200 dark:border-slate-800">
            <tr>
              {headers.map((h, hIdx) => {
                const alignClass = alignments[hIdx] || 'text-left';
                return (
                  <th
                    key={hIdx}
                    className={`px-4 py-3.5 font-bold ${alignClass} border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0`}
                  >
                    {renderFormattedLine(h)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {rowLines.map((r, rIdx) => {
              const cells = r
                .trim()
                .replace(/^\||\|$/g, '')
                .split('|')
                .map((c) => c.trim());

              return (
                <tr
                  key={rIdx}
                  className="hover:bg-teal-500/[0.04] dark:hover:bg-cyan-400/[0.04] transition-colors even:bg-slate-50/50 dark:even:bg-slate-900/30"
                >
                  {cells.map((cell, cIdx) => {
                    const alignClass = alignments[cIdx] || 'text-left';
                    return (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 text-slate-800 dark:text-slate-200 ${alignClass} border-r border-slate-100 dark:border-slate-800/40 last:border-r-0 leading-relaxed`}
                      >
                        {renderFormattedLine(cell)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to render interactive simulation labs inside chapter sections
  const renderSectionSimulation = (sectionId: string, chapterId: number) => {
    let simComponent: React.ReactNode = null;

    // Chapter 1: Basic Concepts -> Piston-Cylinder Simulator (in 1.1) & System Boundary (in 1.2)
    if (chapterId === 1 && (sectionId === '1-1-definition-systems' || sectionId.includes('1-1'))) {
      simComponent = <PistonCylinderSim />;
    } else if (chapterId === 1 && (sectionId === '1-2-types-of-systems' || sectionId.includes('1-2'))) {
      simComponent = <SystemBoundarySim />;
    }

    // Chapter 2: Zeroth Law -> Thermal Equilibrium Lab (in 2.1), Thermal Equilibrium (in 2.3), Piston-Cylinder for Gas Laws (in 2.4)
    else if (chapterId === 2 && (sectionId === '2-1-zeroth-law-statement' || sectionId.includes('2-1'))) {
      simComponent = <ThermalEquilibriumSim />;
    } else if (chapterId === 2 && (sectionId === '2-3-temperature-scales' || sectionId.includes('2-3'))) {
      simComponent = <ThermalEquilibriumSim />;
    } else if (chapterId === 2 && (sectionId === '2-4-gas-laws' || sectionId.includes('2-4'))) {
      simComponent = <PistonCylinderSim />;
    }

    // Chapter 3: First Law -> Piston-Cylinder for Work concept (in 3.1), P-V Work (in 3.2), Energy Balance (in 3.3), SFEE (in 3.4)
    else if (chapterId === 3 && (sectionId === '3-1-work-definition' || sectionId.includes('3-1'))) {
      simComponent = <PistonCylinderSim />;
    } else if (chapterId === 3 && (sectionId === '3-2-closed-system-work' || sectionId.includes('3-2'))) {
      simComponent = <PVDomainSim />;
    } else if (chapterId === 3 && (sectionId === '3-3-first-law-closed-systems' || sectionId.includes('3-3'))) {
      simComponent = <EnergyBalanceSim />;
    } else if (chapterId === 3 && (sectionId === '3-4-sfee-open-systems' || sectionId.includes('3-4'))) {
      simComponent = <SteadyFlowDevicesSim />;
    }

    // Chapter 4: Second Law -> Carnot Cycle for context (in 4.1), Carnot Cycle Simulator (in 4.2)
    else if (chapterId === 4 && (sectionId === '4-1-need-and-statements' || sectionId.includes('4-1'))) {
      simComponent = <CarnotCycleSim />;
    } else if (chapterId === 4 && (sectionId === '4-2-carnot-cycle-and-theorem' || sectionId.includes('4-2'))) {
      simComponent = <CarnotCycleSim />;
    }

    // Chapter 5: Entropy -> Entropy Generation Lab (in 5.2), Entropy Generation for Tds context (in 5.3)
    else if (chapterId === 5 && (sectionId === '5-2-increase-of-entropy' || sectionId.includes('5-2'))) {
      simComponent = <EntropyGenerationSim />;
    } else if (chapterId === 5 && (sectionId === '5-3-tds-equations' || sectionId.includes('5-3'))) {
      simComponent = <EntropyGenerationSim />;
    }

    // Chapter 6: Exergy -> Exergy & Dead State Visualizer (in 6.1), Exergy for Availability (in 6.2), Entropy Gen for Gouy-Stodola (in 6.3)
    else if (chapterId === 6 && (sectionId === '6-1-available-unavailable-energy' || sectionId.includes('6-1'))) {
      simComponent = <ExergyDeadStateSim />;
    } else if (chapterId === 6 && (sectionId === '6-2-availability-functions' || sectionId.includes('6-2'))) {
      simComponent = <ExergyDeadStateSim />;
    } else if (chapterId === 6 && (sectionId === '6-3-gouy-stodola-theorem' || sectionId.includes('6-3'))) {
      simComponent = <EntropyGenerationSim />;
    }

    // Chapter 7: Gas Mixtures -> Dalton's Law Chamber (in 7.1)
    else if (chapterId === 7 && (sectionId === '7-1-composition-dalton' || sectionId.includes('7-1'))) {
      simComponent = <GasMixtureSim />;
    }

    // Chapter 8: Pure Substances -> Phase Dome Lab (in 8.1)
    else if (chapterId === 8 && (sectionId === '8-1-phase-transformation' || sectionId.includes('8-1'))) {
      simComponent = <PhaseChangeDomeSim />;
    }

    // Chapter 9: Thermodynamic Relations -> Joule-Thomson Throttling Valve (in 9.3)
    else if (chapterId === 9 && (sectionId === '9-3-joule-thomson-clapeyron' || sectionId.includes('9-3'))) {
      simComponent = <JouleThomsonSim />;
    }

    if (!simComponent) return null;

    return (
      <div className="my-8 rounded-3xl border border-teal-500/30 bg-slate-50/80 dark:bg-slate-950/70 p-4 sm:p-6 md:p-7 shadow-lg dark:shadow-2xl overflow-hidden backdrop-blur-xs">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-teal-500/20 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
          <span>Interactive Thermodynamics Lab & Visual Simulator</span>
        </div>
        {simComponent}
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Chapter Banner with Integrated Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm dark:shadow-2xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-[#14B8A6] dark:text-[#0F172A] border border-teal-200 dark:border-teal-500">
                Chapter {chapter.id}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC] heading-title tracking-tight">
              {chapter.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              {chapter.subtitle}
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic, equation, parameter, or keyword in this chapter..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
          />
          {searchQuery ? (
            <div className="absolute right-2.5 flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                {totalMatchesInChapter} {totalMatchesInChapter === 1 ? 'match' : 'matches'}
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Chapter Content: All Sections in One Continuous View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm dark:shadow-xl space-y-10">
        {chapter.sections.map((section, secIdx) => (
          <article
            key={section.id}
            id={`section-${section.id}`}
            className="space-y-6 pt-8 first:pt-0 border-t border-slate-200/70 dark:border-slate-800/80 first:border-t-0"
          >
            {/* Section Header */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                {renderFormattedLine(section.title)}
              </h2>
            </div>

            {/* Section Content Elements */}
            <div className="space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm md:text-base">
              {parseSectionBlocks(section.content).map((block, bIdx) => {
                // Check if heading
                if (block.type === 'heading') {
                  if (block.level <= 3) {
                    return (
                      <h3
                        key={bIdx}
                        className="text-base md:text-lg font-bold accent-heading pt-4 border-t border-slate-100 dark:border-slate-800/60 first:border-t-0 first:pt-0"
                      >
                        {renderFormattedLine(block.text)}
                      </h3>
                    );
                  }
                  return (
                    <h4
                      key={bIdx}
                      className="text-sm md:text-base font-bold text-slate-900 dark:text-[#F8FAFC] pt-3 pb-1"
                    >
                      {renderFormattedLine(block.text)}
                    </h4>
                  );
                }

                // Check if block latex
                if (block.type === 'formula') {
                  const matched = findMatchingFormula(block.math);
                  if (matched) {
                    return (
                      <FormulaCard key={bIdx} formula={matched} badge="FORMULA" />
                    );
                  }
                  return (
                    <div
                      key={bIdx}
                      className="bg-white/70 dark:bg-white/[0.06] backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center overflow-x-auto my-4 shadow-xs text-cyan-900 dark:text-cyan-300"
                    >
                      <MathView math={block.math} block />
                    </div>
                  );
                }

                // Check if table
                if (block.type === 'table') {
                  return renderTable(block.lines, bIdx);
                }

                // Bullet points or normal text
                return (
                  <div key={bIdx} className="space-y-1.5">
                    {block.lines.map((line, lIdx) => {
                      const trimmedLine = line.trim();
                      if (/^#{1,6}\s*/.test(trimmedLine)) {
                        return (
                          <h4 key={lIdx} className="font-bold text-slate-900 dark:text-[#F8FAFC] pt-3 pb-1 text-sm md:text-base">
                            {renderFormattedLine(trimmedLine.replace(/^#{1,6}\s*/, ''))}
                          </h4>
                        );
                      }
                      if (trimmedLine.startsWith('- ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2.5 pl-2 py-0.5">
                            <span className="text-teal-600 dark:text-[#5EEAD4] mt-1 font-bold text-sm shrink-0">•</span>
                            <span className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed">
                              {renderFormattedLine(trimmedLine.slice(2))}
                            </span>
                          </div>
                        );
                      }
                      if (trimmedLine.startsWith('* ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2.5 pl-6 py-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 mt-1 font-bold text-xs shrink-0">◦</span>
                            <span className="flex-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                              {renderFormattedLine(trimmedLine.slice(2))}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={lIdx} className="leading-relaxed text-slate-800 dark:text-slate-200">
                          {renderFormattedLine(line)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Embedded Interactive Thermodynamic Simulation */}
            {renderSectionSimulation(section.id, chapter.id)}
          </article>
        ))}
      </div>

      {/* Chapter Pagination Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          disabled={!hasPrevChapter}
          onClick={onPrevChapter}
          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Chapter</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          Chapter {chapter.id} of 9
        </span>

        <button
          disabled={!hasNextChapter}
          onClick={onNextChapter}
          className="px-5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-600 dark:bg-teal-500/20 dark:hover:bg-teal-500/30 dark:border-teal-400/80 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs"
        >
          <span className="text-teal-950 dark:text-white">Next Chapter</span>
          <ChevronRight className="w-4 h-4 text-teal-800 dark:text-white" />
        </button>
      </div>
    </div>
  );
};
