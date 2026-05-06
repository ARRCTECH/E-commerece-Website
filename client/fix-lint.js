import { execSync } from 'child_process';

// Common fixes with Windows-compatible paths
const fixes = [
  // Fix all auto-fixable issues
  'npx eslint --fix "src/**/*.{js,jsx}"',
  
  // Fix React specific issues
  'npx eslint --fix "src/**/*.{js,jsx}" --rule "react/react-in-jsx-scope: 0" --rule "react/prop-types: 1"',
  
  // Fix import issues
  'npx eslint --fix "src/**/*.{js,jsx}" --rule "import/order: 1"',
  
  // Fix common code style issues
  'npx eslint --fix "src/**/*.{js,jsx}" --rule "no-unused-vars: 1" --rule "semi: [2, \"always\"]" --rule "quotes: [2, \"double\"]"'
];


for (const command of fixes) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch {
    // Ignore errors and continue with next fix
    continue;
  }
}

