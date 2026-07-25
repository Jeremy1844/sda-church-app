const fs = require('node:fs');
const path = require('node:path');

const FONT_DIRECTORY = path.resolve(__dirname, '..', '..', 'assets', 'fonts');
const COVERAGE_RANGES = [
  ['Basic Latin (printable)', 0x0020, 0x007e],
  ['Latin-1 Supplement', 0x00a0, 0x00ff],
  ['Latin Extended-A', 0x0100, 0x017f],
  ['Latin Extended-B', 0x0180, 0x024f],
  ['CJK Symbols and Punctuation', 0x3000, 0x303f],
  ['Hiragana', 0x3040, 0x309f],
  ['Katakana', 0x30a0, 0x30ff],
  ['CJK Unified Ideographs', 0x4e00, 0x9fff],
  ['Hangul Jamo', 0x1100, 0x11ff],
  ['Hangul Syllables', 0xac00, 0xd7af],
  ['Tibetan', 0x0f00, 0x0fff],
  ['Supplementary Private Use Area-A', 0xf0000, 0xffffd],
];

function readTableDirectory(font) {
  const numberOfTables = font.readUInt16BE(4);
  const tables = new Map();

  for (let index = 0; index < numberOfTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = font.toString('ascii', recordOffset, recordOffset + 4);
    tables.set(tag, {
      length: font.readUInt32BE(recordOffset + 12),
      offset: font.readUInt32BE(recordOffset + 8),
    });
  }

  return tables;
}

function addFormat4(font, offset, codePoints) {
  const segmentCount = font.readUInt16BE(offset + 6) / 2;
  const endCodesOffset = offset + 14;
  const startCodesOffset = endCodesOffset + segmentCount * 2 + 2;
  const deltasOffset = startCodesOffset + segmentCount * 2;
  const rangeOffsetsOffset = deltasOffset + segmentCount * 2;

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const endCode = font.readUInt16BE(endCodesOffset + segment * 2);
    const startCode = font.readUInt16BE(startCodesOffset + segment * 2);
    const delta = font.readInt16BE(deltasOffset + segment * 2);
    const rangeOffsetPosition = rangeOffsetsOffset + segment * 2;
    const rangeOffset = font.readUInt16BE(rangeOffsetPosition);

    for (let codePoint = startCode; codePoint <= endCode && codePoint !== 0xffff; codePoint += 1) {
      let glyphId;
      if (rangeOffset === 0) {
        glyphId = (codePoint + delta) & 0xffff;
      } else {
        const glyphPosition = rangeOffsetPosition + rangeOffset + (codePoint - startCode) * 2;
        glyphId = font.readUInt16BE(glyphPosition);
        if (glyphId !== 0) {
          glyphId = (glyphId + delta) & 0xffff;
        }
      }

      if (glyphId !== 0) {
        codePoints.add(codePoint);
      }
    }
  }
}

function addFormat12Or13(font, offset, codePoints, format) {
  const numberOfGroups = font.readUInt32BE(offset + 12);

  for (let group = 0; group < numberOfGroups; group += 1) {
    const groupOffset = offset + 16 + group * 12;
    const start = font.readUInt32BE(groupOffset);
    const end = font.readUInt32BE(groupOffset + 4);
    const startGlyphId = font.readUInt32BE(groupOffset + 8);

    for (let codePoint = start; codePoint <= end; codePoint += 1) {
      const glyphId = format === 12 ? startGlyphId + codePoint - start : startGlyphId;
      if (glyphId !== 0) {
        codePoints.add(codePoint);
      }
    }
  }
}

function unicodeCodePoints(fontPath) {
  const font = fs.readFileSync(fontPath);
  const cmap = readTableDirectory(font).get('cmap');
  if (!cmap) {
    throw new Error(`${path.basename(fontPath)} has no cmap table.`);
  }

  const codePoints = new Set();
  const numberOfSubtables = font.readUInt16BE(cmap.offset + 2);
  const parsedOffsets = new Set();

  for (let index = 0; index < numberOfSubtables; index += 1) {
    const recordOffset = cmap.offset + 4 + index * 8;
    const platformId = font.readUInt16BE(recordOffset);
    const encodingId = font.readUInt16BE(recordOffset + 2);
    const isUnicode = platformId === 0 || (platformId === 3 && [1, 10].includes(encodingId));
    if (!isUnicode) {
      continue;
    }

    const subtableOffset = cmap.offset + font.readUInt32BE(recordOffset + 4);
    if (parsedOffsets.has(subtableOffset)) {
      continue;
    }
    parsedOffsets.add(subtableOffset);

    const format = font.readUInt16BE(subtableOffset);
    if (format === 4) {
      addFormat4(font, subtableOffset, codePoints);
    } else if (format === 12 || format === 13) {
      addFormat12Or13(font, subtableOffset, codePoints, format);
    }
  }

  return codePoints;
}

function countRange(codePoints, start, end) {
  let count = 0;
  for (let codePoint = start; codePoint <= end; codePoint += 1) {
    if (codePoints.has(codePoint)) {
      count += 1;
    }
  }
  return count;
}

function main() {
  const fontNames = fs
    .readdirSync(FONT_DIRECTORY)
    .filter((name) => /\.(otf|ttf)$/i.test(name))
    .sort();

  console.log('| Font | Unicode cmap entries | ' + COVERAGE_RANGES.map(([name]) => name).join(' | ') + ' |');
  console.log('| --- | ---: | ' + COVERAGE_RANGES.map(() => '---:').join(' | ') + ' |');

  for (const fontName of fontNames) {
    const codePoints = unicodeCodePoints(path.join(FONT_DIRECTORY, fontName));
    const coverage = COVERAGE_RANGES.map(([, start, end]) => {
      const count = countRange(codePoints, start, end);
      return `${count}/${end - start + 1}`;
    });
    console.log(`| ${fontName} | ${codePoints.size} | ${coverage.join(' | ')} |`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Font coverage check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { countRange, unicodeCodePoints };
