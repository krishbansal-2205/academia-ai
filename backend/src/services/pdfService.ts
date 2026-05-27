import fs from 'fs';
import path from 'path';
import { IGeneratedPaper } from '../types';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 56;
const MARGIN_TOP = 780;
const MARGIN_BOTTOM = 64;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;   // ≈ 483 pt usable width

type FontName = 'F1' | 'F2';

interface PdfLine {
  text: string;
  font: FontName;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  spacingAfter?: number;
  indent?: number;          // extra left indent in points
}

// ── Text normalisation ────────────────────────────────────────────────────────

function normalizeText(value: string): string {
  return value
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/•/g, '-')
    .replace(/…/g, '...')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\u00A0/g, ' ')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\n]/g, '');
}

function escapePdfText(value: string): string {
  return normalizeText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Wrap `value` to lines that fit within `maxPt` points at `fontSize`. */
function wrapTextPt(value: string, fontSize: number, maxPt: number, indentPt = 0): string[] {
  const charWidth = fontSize * 0.5;          // rough char width for Helvetica
  const maxChars = Math.floor((maxPt - indentPt) / charWidth);
  return wrapTextChars(value, Math.max(20, maxChars));
}

function wrapTextChars(value: string, maxChars: number): string[] {
  const normalized = normalizeText(value).trim();
  if (!normalized) return [''];

  const paragraphs = normalized.split(/\n+/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(''); continue; }

    let current = words[0];
    for (const word of words.slice(1)) {
      const next = `${current} ${word}`;
      if (next.length <= maxChars) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

function lineHeight(fontSize: number): number {
  return Math.ceil(fontSize * 1.5);
}

function renderLine(line: PdfLine, y: number): string {
  const indent = line.indent ?? 0;
  let x = MARGIN_X + indent;

  if (line.align === 'center' || line.align === 'right') {
    const estWidth = normalizeText(line.text).length * line.fontSize * 0.5;
    if (line.align === 'center') x = Math.max(MARGIN_X, (PAGE_WIDTH - estWidth) / 2);
    else x = Math.max(MARGIN_X, PAGE_WIDTH - MARGIN_X - estWidth);
  }

  return `BT /${line.font} ${line.fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(line.text)}) Tj ET`;
}

/** Render two strings side-by-side (left-aligned left, right-aligned right). */
function renderTwoColumn(leftText: string, rightText: string, font: FontName, fontSize: number, y: number): string {
  const lx = MARGIN_X;
  const rx = PAGE_WIDTH - MARGIN_X - rightText.length * fontSize * 0.5;
  const ly = `BT /${font} ${fontSize} Tf 1 0 0 1 ${lx.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(leftText)}) Tj ET`;
  const ry = `BT /${font} ${fontSize} Tf 1 0 0 1 ${Math.max(lx + 200, rx).toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(rightText)}) Tj ET`;
  return `${ly}\n${ry}`;
}

/** Horizontal rule */
function renderHRule(y: number): string {
  return `0.6 w 0.7 0.7 0.7 RG ${MARGIN_X} ${y.toFixed(2)} m ${(PAGE_WIDTH - MARGIN_X).toFixed(2)} ${y.toFixed(2)} l S`;
}

// ── Document builder ──────────────────────────────────────────────────────────

interface RenderCommand {
  type: 'line' | 'twoCol' | 'hRule' | 'blank';
  line?: PdfLine;
  leftText?: string;
  rightText?: string;
  font?: FontName;
  fontSize?: number;
  spacingAfter?: number;
}

function buildDocumentCommands(paper: IGeneratedPaper): RenderCommand[] {
  const cmds: RenderCommand[] = [];

  const push = (line: PdfLine) => cmds.push({ type: 'line', line });
  const twoCol = (l: string, r: string, font: FontName, fs: number, sa = 4) =>
    cmds.push({ type: 'twoCol', leftText: l, rightText: r, font, fontSize: fs, spacingAfter: sa });
  const hRule = (sa = 8) => cmds.push({ type: 'hRule', spacingAfter: sa });
  const blank = (sa = 6) => cmds.push({ type: 'blank', spacingAfter: sa });

  // ── Header ──
  push({ text: paper.institutionName,        font: 'F2', fontSize: 18, align: 'center', spacingAfter: 3 });
  push({ text: paper.examTitle,              font: 'F2', fontSize: 14, align: 'center', spacingAfter: 3 });
  push({ text: `${paper.subject}   |   Class: ${paper.className}`, font: 'F1', fontSize: 11, align: 'center', spacingAfter: 6 });
  hRule(6);

  // ── Time & Marks row ──
  twoCol(`Time Allowed: ${paper.duration}`, `Maximum Marks: ${paper.totalMarks}`, 'F2', 11, 6);
  hRule(8);

  // ── General instructions ──
  for (const instructionLine of wrapTextPt(paper.generalInstructions, 10, TEXT_WIDTH)) {
    push({ text: instructionLine, font: 'F1', fontSize: 10, spacingAfter: 1 });
  }
  blank(10);

  // ── Student info ──
  push({ text: 'Name: ___________________________________________________', font: 'F2', fontSize: 11, spacingAfter: 4 });
  push({ text: 'Roll No.: _______________________   Section: _______________', font: 'F2', fontSize: 11, spacingAfter: 12 });
  hRule(12);

  // ── Sections ──
  for (const section of paper.sections) {
    push({ text: section.title, font: 'F2', fontSize: 14, align: 'center', spacingAfter: 4 });

    for (const instrLine of wrapTextPt(section.instruction, 11, TEXT_WIDTH)) {
      push({ text: instrLine, font: 'F1', fontSize: 11, spacingAfter: 1 });
    }
    blank(6);

    for (const question of section.questions) {
      const prefix = `${question.number}.  `;
      const suffix = `  [${question.marks} mark${question.marks > 1 ? 's' : ''}]  (${question.difficulty})`;
      const fullText = `${prefix}${question.text}${suffix}`;

      // Wrap with indent for continuation lines
      const INDENT = 16;
      const allWrapped = wrapTextPt(fullText, 11, TEXT_WIDTH, 0);
      allWrapped.forEach((lineText, idx) => {
        push({
          text: idx === 0 ? lineText : `     ${lineText}`,
          font: 'F2',
          fontSize: 11,
          indent: idx === 0 ? 0 : INDENT,
          spacingAfter: 1,
        });
      });

      // MCQ options — two per row using twoCol where possible
      if (question.options?.length) {
        const letters = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)'];
        const opts = question.options;
        const OPTION_INDENT = 20;

        for (let i = 0; i < opts.length; i += 2) {
          const leftOpt = `${letters[i] ?? `(${i})`}  ${normalizeText(opts[i])}`;
          if (i + 1 < opts.length) {
            const rightOpt = `${letters[i + 1] ?? `(${i + 1})`}  ${normalizeText(opts[i + 1])}`;
            cmds.push({
              type: 'twoCol',
              leftText: `${' '.repeat(4)}${leftOpt}`,
              rightText: rightOpt,
              font: 'F1',
              fontSize: 10.5,
              spacingAfter: 2,
            });
          } else {
            push({ text: `${' '.repeat(4)}${leftOpt}`, font: 'F1', fontSize: 10.5, indent: OPTION_INDENT, spacingAfter: 2 });
          }
        }
      }

      blank(4);
    }

    blank(6);
  }

  push({ text: '*** End of Question Paper ***', font: 'F2', fontSize: 11, align: 'center', spacingAfter: 0 });

  return cmds;
}

// ── Pagination ────────────────────────────────────────────────────────────────

function paginate(cmds: RenderCommand[]): string[] {
  const pages: string[] = [];
  const currentPage: string[] = [];
  let y = MARGIN_TOP;

  const flushPage = () => {
    pages.push(currentPage.join('\n'));
    currentPage.length = 0;
    y = MARGIN_TOP;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) flushPage();
  };

  for (const cmd of cmds) {
    if (cmd.type === 'blank') {
      y -= cmd.spacingAfter ?? 6;
      continue;
    }

    if (cmd.type === 'hRule') {
      const needed = 2 + (cmd.spacingAfter ?? 8);
      ensureSpace(needed);
      currentPage.push(renderHRule(y));
      y -= needed;
      continue;
    }

    if (cmd.type === 'twoCol') {
      const fs = cmd.fontSize ?? 11;
      const needed = lineHeight(fs) + (cmd.spacingAfter ?? 4);
      ensureSpace(needed);
      currentPage.push(renderTwoColumn(cmd.leftText!, cmd.rightText!, cmd.font ?? 'F1', fs, y));
      y -= needed;
      continue;
    }

    if (cmd.type === 'line' && cmd.line) {
      const { line } = cmd;
      const fs = line.fontSize;
      const lh = lineHeight(fs);
      const sa = line.spacingAfter ?? 2;
      ensureSpace(lh + sa);
      currentPage.push(renderLine(line, y));
      y -= lh + sa;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage.join('\n'));
  return pages;
}

// ── PDF binary builder ────────────────────────────────────────────────────────

function buildPdfBuffer(pageStreams: string[]): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [0];

  const fontRegularObject = 3;
  const fontBoldObject = 4;
  const firstPageObject = 5;
  const pageCount = pageStreams.length;
  const pagesRootKids = Array.from({ length: pageCount }, (_, i) => `${firstPageObject + i * 2} 0 R`).join(' ');

  objects[1] = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`;
  objects[2] = `2 0 obj << /Type /Pages /Count ${pageCount} /Kids [${pagesRootKids}] >> endobj`;
  objects[fontRegularObject] = `3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`;
  objects[fontBoldObject]    = `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`;

  pageStreams.forEach((stream, idx) => {
    const pageObj    = firstPageObject + idx * 2;
    const contentObj = pageObj + 1;
    const len        = Buffer.byteLength(stream, 'utf8');

    objects[pageObj] =
      `${pageObj} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> >> ` +
      `/Contents ${contentObj} 0 R >> endobj`;
    objects[contentObj] =
      `${contentObj} 0 obj << /Length ${len} >> stream\n${stream}\nendstream endobj`;
  });

  let pdf = '%PDF-1.4\n';
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${objects[i]}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

// ── Public API ────────────────────────────────────────────────────────────────

export function ensurePdfDirectory(): string {
  const outputDir = path.resolve(__dirname, '..', '..', 'generated-pdfs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

export function createPdfForPaper(assignmentId: string, paper: IGeneratedPaper): string {
  const cmds  = buildDocumentCommands(paper);
  const pages = paginate(cmds);
  const buf   = buildPdfBuffer(pages);

  const outputDir  = ensurePdfDirectory();
  const outputPath = path.join(outputDir, `${assignmentId}.pdf`);
  fs.writeFileSync(outputPath, buf);

  return outputPath;
}
