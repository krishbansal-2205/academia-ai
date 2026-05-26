import fs from 'fs';
import path from 'path';
import { IGeneratedPaper } from '../types';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 56;
const MARGIN_TOP = 780;
const MARGIN_BOTTOM = 64;

type FontName = 'F1' | 'F2';

interface PdfLine {
  text: string;
  font: FontName;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  spacingAfter?: number;
}

function normalizeText(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
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
  return normalizeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value: string, maxChars: number): string[] {
  const normalized = normalizeText(value).trim();
  if (!normalized) {
    return [''];
  }

  const paragraphs = normalized.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

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

function textX(line: PdfLine): number {
  if (line.align !== 'center' && line.align !== 'right') {
    return MARGIN_X;
  }

  const estimatedWidth = normalizeText(line.text).length * line.fontSize * 0.46;
  if (line.align === 'center') {
    return Math.max(MARGIN_X, (PAGE_WIDTH - estimatedWidth) / 2);
  }

  return Math.max(MARGIN_X, PAGE_WIDTH - MARGIN_X - estimatedWidth);
}

function renderLine(line: PdfLine, y: number): string {
  const x = textX(line);
  return `BT /${line.font} ${line.fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(
    2
  )} Tm (${escapePdfText(line.text)}) Tj ET`;
}

function lineHeight(fontSize: number): number {
  return Math.max(fontSize + 6, fontSize * 1.45);
}

function buildDocumentLines(paper: IGeneratedPaper): PdfLine[] {
  const lines: PdfLine[] = [];

  lines.push({
    text: paper.institutionName,
    font: 'F2',
    fontSize: 20,
    align: 'center',
    spacingAfter: 2,
  });
  lines.push({
    text: `${paper.subject} | ${paper.className}`,
    font: 'F2',
    fontSize: 12,
    align: 'center',
    spacingAfter: 16,
  });
  lines.push({
    text: paper.examTitle,
    font: 'F2',
    fontSize: 18,
    align: 'center',
    spacingAfter: 14,
  });
  lines.push({
    text: `Time Allowed: ${paper.duration}`,
    font: 'F2',
    fontSize: 11,
    spacingAfter: 0,
  });
  lines.push({
    text: `Maximum Marks: ${paper.totalMarks}`,
    font: 'F2',
    fontSize: 11,
    align: 'right',
    spacingAfter: 10,
  });

  for (const instruction of wrapText(paper.generalInstructions, 78)) {
    lines.push({
      text: instruction,
      font: 'F2',
      fontSize: 11,
      spacingAfter: 0,
    });
  }

  lines.push({
    text: '',
    font: 'F1',
    fontSize: 11,
    spacingAfter: 8,
  });
  lines.push({ text: 'Name: ________________________________', font: 'F2', fontSize: 11 });
  lines.push({ text: 'Roll Number: _________________________', font: 'F2', fontSize: 11 });
  lines.push({
    text: 'Section: ______________________________',
    font: 'F2',
    fontSize: 11,
    spacingAfter: 14,
  });

  for (const section of paper.sections) {
    lines.push({
      text: section.title,
      font: 'F2',
      fontSize: 15,
      align: 'center',
      spacingAfter: 6,
    });

    for (const instruction of wrapText(section.instruction, 82)) {
      lines.push({
        text: instruction,
        font: 'F2',
        fontSize: 11,
        spacingAfter: 0,
      });
    }

    lines.push({
      text: '',
      font: 'F1',
      fontSize: 11,
      spacingAfter: 4,
    });

    for (const question of section.questions) {
      const questionPrefix = `${question.number}. `;
      const questionSuffix = ` (${question.difficulty} | ${question.marks} marks)`;
      const questionLines = wrapText(`${questionPrefix}${question.text}${questionSuffix}`, 82);

      questionLines.forEach((line, index) => {
        lines.push({
          text: line,
          font: index === 0 ? 'F2' : 'F1',
          fontSize: 11,
          spacingAfter: 0,
        });
      });

      if (question.options?.length) {
        for (const option of question.options) {
          for (const optionLine of wrapText(`- ${option}`, 76)) {
            lines.push({
              text: optionLine,
              font: 'F1',
              fontSize: 10,
              spacingAfter: 0,
            });
          }
        }
      }

      lines.push({
        text: '',
        font: 'F1',
        fontSize: 10,
        spacingAfter: 5,
      });
    }

    lines.push({
      text: '',
      font: 'F1',
      fontSize: 10,
      spacingAfter: 8,
    });
  }

  return lines;
}

function paginate(lines: PdfLine[]): string[] {
  const pages: string[] = [];
  let currentPage: string[] = [];
  let y = MARGIN_TOP;

  for (const line of lines) {
    const height = lineHeight(line.fontSize);
    if (y - height < MARGIN_BOTTOM) {
      pages.push(currentPage.join('\n'));
      currentPage = [];
      y = MARGIN_TOP;
    }

    if (line.text) {
      currentPage.push(renderLine(line, y));
    }

    y -= height + (line.spacingAfter ?? 2);
  }

  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n'));
  }

  return pages;
}

function buildPdfBuffer(pageStreams: string[]): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [0];

  const fontRegularObject = 3;
  const fontBoldObject = 4;
  const firstPageObject = 5;
  const pageCount = pageStreams.length;
  const pagesRootKids = Array.from({ length: pageCount }, (_, index) => `${firstPageObject + index * 2} 0 R`).join(
    ' '
  );

  objects[1] = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`;
  objects[2] = `2 0 obj << /Type /Pages /Count ${pageCount} /Kids [${pagesRootKids}] >> endobj`;
  objects[fontRegularObject] =
    `3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`;
  objects[fontBoldObject] =
    `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`;

  pageStreams.forEach((stream, index) => {
    const pageObjectNumber = firstPageObject + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const contentLength = Buffer.byteLength(stream, 'utf8');

    objects[pageObjectNumber] =
      `${pageObjectNumber} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> >> /Contents ${contentObjectNumber} 0 R >> endobj`;
    objects[contentObjectNumber] =
      `${contentObjectNumber} 0 obj << /Length ${contentLength} >> stream\n${stream}\nendstream endobj`;
  });

  let pdf = '%PDF-1.4\n';

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${objects[index]}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export function ensurePdfDirectory(): string {
  const outputDir = path.resolve(__dirname, '..', '..', 'generated-pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

export function createPdfForPaper(assignmentId: string, paper: IGeneratedPaper): string {
  const lines = buildDocumentLines(paper);
  const pages = paginate(lines);
  const pdfBuffer = buildPdfBuffer(pages);

  const outputDir = ensurePdfDirectory();
  const outputPath = path.join(outputDir, `${assignmentId}.pdf`);
  fs.writeFileSync(outputPath, pdfBuffer);

  return outputPath;
}
