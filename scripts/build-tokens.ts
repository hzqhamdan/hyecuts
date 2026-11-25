// Regenerates src/styles/tokens.css from src/styles/tokens.json.
//   npm run tokens            write the stylesheet
//   npm run tokens -- --check exit 1 if the stylesheet is out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildTokensCss, type TokensFile } from '../src/styles/buildTokensCss.ts';

const jsonPath = fileURLToPath(new URL('../src/styles/tokens.json', import.meta.url));
const cssPath = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

const css = buildTokensCss(JSON.parse(readFileSync(jsonPath, 'utf8')) as TokensFile);

if (process.argv.includes('--check')) {
  // Git may check the file out with CRLF line endings on Windows.
  if (readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n') !== css) {
    console.error('src/styles/tokens.css is out of date. Run `npm run tokens`.');
    process.exit(1);
  }
  console.log('src/styles/tokens.css is up to date.');
} else {
  writeFileSync(cssPath, css);
  console.log('Wrote src/styles/tokens.css');
}
