import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fixWhitespace() {
  try {
    // Get all JS/JSX files
    const files = await glob('src/**/*.{js,jsx}', { cwd: __dirname });

    for (const file of files) {
      // Read file content
      const content = await readFile(file, 'utf8');

      // Replace irregular whitespace with regular space
      const fixedContent = content
        .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
        .replace(/\s+$/gm, '') // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '') // Remove trailing spaces and tabs
        .replace(/\r\n/g, '\n'); // Normalize line endings

      // Write back cleaned content
      await writeFile(file, fixedContent);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixWhitespace();
