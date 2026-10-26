import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import katex from 'katex';
import type { TopicalExplanationSection } from '../../utils/topicalExplanation';
import 'katex/dist/katex.min.css';

interface TopicalExplanationSectionsProps {
  sections: TopicalExplanationSection[];
  isMcq: boolean;
  correctOption?: string;
  selectedOption?: string | null;
}

function normalizeOption(value?: string | null): string | null {
  const match = value?.match(/\b([A-E])\b/i);
  return match?.[1].toUpperCase() ?? null;
}

function renderMathExpression(expression: string, key: string): React.ReactNode {
  const normalizedExpression = expression.startsWith('\\')
    ? expression.replace(/^\\{2,}/, '\\').replace(/\\{2,}$/, '\\')
    : expression;
  const display = normalizedExpression.startsWith('$$') || normalizedExpression.startsWith('\\[');
  const delimiterLength = normalizedExpression.startsWith('$') && !display ? 1 : 2;
  const tex = normalizedExpression.slice(delimiterLength, -delimiterLength);

  return renderTex(tex, display, key, expression);
}

function renderTex(
  tex: string,
  display: boolean,
  key: string,
  fallback: string,
): React.ReactNode {
  try {
    const html = katex.renderToString(tex.trim(), {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
    });
    return display
      ? <div key={key} className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
      : <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error: unknown) {
    console.error('Could not render KaTeX in topical explanation:', error);
    return <span key={key}>{fallback}</span>;
  }
}

function renderTextWithMath(text: string, key: string): React.ReactNode[] {
  let normalizedText = text
    .replace(/\\{2,}(?=\(|\[)/g, '\\')
    .replace(/\\{2,}(?=\)|\])/g, '\\');
  const mathExpressions: React.ReactNode[] = [];
  const createMathPlaceholder = (tex: string, display: boolean) => {
    const index = mathExpressions.length;
    const expression = display ? `$$${tex}$$` : `\\(${tex}\\)`;
    mathExpressions.push(renderMathExpression(expression, `${key}-math-${index}`));
    return `MATHPLACEHOLDER${index}END`;
  };

  normalizedText = normalizedText.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex: string) =>
    createMathPlaceholder(tex, true));
  normalizedText = normalizedText.replace(/\\\[([\s\S]+?)\\\]/g, (_match, tex: string) =>
    createMathPlaceholder(tex, true));
  normalizedText = normalizedText.replace(/\\\(([\s\S]+?)\\\)/g, (_match, tex: string) =>
    createMathPlaceholder(tex, false));
  normalizedText = normalizedText.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_match, tex: string) =>
    createMathPlaceholder(tex, false));

  const segments: React.ReactNode[] = [];
  const placeholderPattern = /MATHPLACEHOLDER(\d+)END/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  while ((match = placeholderPattern.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      appendPlainText(normalizedText.slice(lastIndex, match.index), `${key}-text-${lastIndex}`, segments);
    }
    const expression = mathExpressions[Number(match[1])];
    if (expression) segments.push(expression);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < normalizedText.length) {
    appendPlainText(normalizedText.slice(lastIndex), `${key}-text-${lastIndex}`, segments);
  }
  return segments;
}

function appendPlainText(text: string, key: string, segments: React.ReactNode[]): void {
  text.split('\n').forEach((line, index) => {
    if (index > 0) segments.push(<br key={`${key}-br-${index}`} />);
    if (line) segments.push(<React.Fragment key={`${key}-text-${index}`}>{line}</React.Fragment>);
  });
}

function renderRichText(text: string, key: string): React.ReactNode[] {
  const segments: React.ReactNode[] = [];
  const markdownPattern = /\*\*[\s\S]+?\*\*|\*(?!\*)([^*\n]+?)\*(?!\*)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = markdownPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...renderTextWithMath(text.slice(lastIndex, match.index), `${key}-text-${lastIndex}`));
    }
    const token = match[0];
    const tokenKey = `${key}-markdown-${match.index}`;
    if (token.startsWith('**')) {
      segments.push(<strong key={tokenKey}>{renderRichText(token.slice(2, -2), tokenKey)}</strong>);
    } else {
      segments.push(<em key={tokenKey}>{renderRichText(token.slice(1, -1), tokenKey)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push(...renderTextWithMath(text.slice(lastIndex), `${key}-text-${lastIndex}`));
  }
  return segments;
}

function ExplanationRichText({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      {renderRichText(content.replace(/\r\n?/g, '\n'), 'explanation')}
    </div>
  );
}

const TopicalExplanationSections: React.FC<TopicalExplanationSectionsProps> = ({
  sections,
  isMcq,
  correctOption,
  selectedOption,
}) => {
  const correct = normalizeOption(correctOption);
  const selected = normalizeOption(selectedOption);
  const orderedSections = useMemo(() => {
    if (!isMcq || !correct) return sections;
    return [...sections].sort((left, right) => {
      const leftIsCorrect = normalizeOption(left.label) === correct;
      const rightIsCorrect = normalizeOption(right.label) === correct;
      return Number(rightIsCorrect) - Number(leftIsCorrect);
    });
  }, [correct, isMcq, sections]);
  const [openSections, setOpenSections] = useState<Set<number>>(() =>
    new Set(sections.flatMap((section, index) =>
      section.kind === 'answer' || section.mark ? [index] : [])),
  );

  useEffect(() => {
    if (!isMcq) return;
    setOpenSections(previous => {
      const next = new Set(previous);
      orderedSections.forEach((section, index) => {
        const option = normalizeOption(section.label);
        if (option && (option === correct || option === selected)) next.add(index);
      });
      return next;
    });
  }, [correct, isMcq, orderedSections, selected]);

  const toggleSection = (index: number) => {
    setOpenSections(previous => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/30">
      <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Explanation
      </h4>
      <div className="flex flex-col gap-2">
        {orderedSections.map((section, index) => {
          const isOpen = openSections.has(index);
          const option = isMcq ? normalizeOption(section.label) : null;
          const isCorrect = Boolean(option && option === correct);
          const isSelected = Boolean(option && option === selected);
          const title = section.kind === 'option'
            ? `Option ${section.label}`
            : section.kind === 'question'
              ? 'Question'
              : section.kind === 'part'
                ? `Part ${section.label}`
                : section.label;

          return (
            <section
              key={`${section.kind}-${section.label}-${index}`}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleSection(index)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {title}
                  {isCorrect && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-900/60 dark:text-green-200">
                      Correct answer
                    </span>
                  )}
                  {isSelected && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                      Your choice
                    </span>
                  )}
                  {section.mark && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                      {section.mark} marks
                    </span>
                  )}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-gray-200 px-3 py-3 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:text-gray-200">
                  <ExplanationRichText content={section.content} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default TopicalExplanationSections;
