import type { ReactNode } from "react";

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  return segments.flatMap((segment, index) => {
    const segmentKey = `${keyPrefix}-${index}`;
    if (/^\*\*[^*]+\*\*$/.test(segment)) {
      return (
        <strong key={segmentKey} className="font-semibold text-slate-900 dark:text-slate-100">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment.split("\n").flatMap((part, lineIndex, array) => {
      const nodes: ReactNode[] = [part];
      if (lineIndex < array.length - 1) {
        nodes.push(<br key={`${segmentKey}-${lineIndex}-br`} />);
      }
      return nodes;
    });
  });
}

function isTableSeparator(line: string): boolean {
  const cells = line
    .split("|")
    .filter((cell) => cell.trim())
    .map((cell) => cell.trim());

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .filter((cell) => cell.trim())
    .map((cell) => cell.trim());
}

export function renderAssistantMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const key = `heading-${index}`;

      if (level === 1) {
        blocks.push(
          <h1 key={key} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2">
            {renderInlineMarkdown(content, key)}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={key} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
            {renderInlineMarkdown(content, key)}
          </h2>
        );
      } else {
        blocks.push(
          <h3 key={key} className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1.5">
            {renderInlineMarkdown(content, key)}
          </h3>
        );
      }

      index += 1;
      continue;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      const tableLines: string[] = [];
      while (index < lines.length && /^\|.*\|$/.test(lines[index].trim())) {
        tableLines.push(lines[index].trim());
        index += 1;
      }

      const header = parseTableRow(tableLines[0] || "");
      const bodyStartIndex = tableLines[1] && isTableSeparator(tableLines[1]) ? 2 : 1;
      const bodyRows = tableLines.slice(bodyStartIndex).map(parseTableRow);
      const tableKey = `table-${index}`;

      blocks.push(
        <div key={tableKey} className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                {header.map((cell, cellIndex) => (
                  <th key={`table-header-${cellIndex}`} scope="col" className="px-2.5 py-1.5 text-left text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {renderInlineMarkdown(cell, `table-header-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            {bodyRows.length > 0 && (
              <tbody>
                {bodyRows.map((row, rowIndex) => (
                  <tr key={`table-row-${rowIndex}`} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    {row.map((cell, cellIndex) => (
                      <td key={`table-cell-${rowIndex}-${cellIndex}`} className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 text-xs">
                        {renderInlineMarkdown(cell, `table-cell-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      );
      continue;
    }

    if (/^- /.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const listMatch = lines[index].trim().match(/^- (.+)$/);
        if (!listMatch) break;
        items.push(listMatch[1]);
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="ml-4 list-disc space-y-0.5 marker:text-slate-300 dark:marker:text-slate-600 my-1.5">
          {items.map((item, itemIndex) => (
            <li key={`ul-item-${itemIndex}`} className="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">
              {renderInlineMarkdown(item, `ul-item-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const listMatch = lines[index].trim().match(/^\d+\. (.+)$/);
        if (!listMatch) break;
        items.push(listMatch[1]);
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`} className="ml-4 list-decimal space-y-0.5 marker:text-slate-300 dark:marker:text-slate-600 my-1.5">
          {items.map((item, itemIndex) => (
            <li key={`ol-item-${itemIndex}`} className="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">
              {renderInlineMarkdown(item, `ol-item-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (
        !current ||
        /^(#{1,3})\s+/.test(current) ||
        /^\|.*\|$/.test(current) ||
        /^- /.test(current) ||
        /^\d+\. /.test(current)
      ) {
        break;
      }
      paragraphLines.push(lines[index]);
      index += 1;
    }

    const paragraphKey = `paragraph-${index}`;
    blocks.push(
      <p key={paragraphKey} className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 my-2 whitespace-pre-wrap break-words">
        {renderInlineMarkdown(paragraphLines.join("\n"), paragraphKey)}
      </p>
    );
  }

  return blocks;
}
