const fs = require('fs');

// Read the file
const filePath = './src/lib/ai-adapters.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of the old issues pattern with the new one
const oldPattern = /dimension: \(\['Usability', 'Accessibility', 'Visual'\] as const\)\[Math\.floor\(Math\.random\(\) \* 3\)\]/g;
const newPattern = `dimension: 'Accessibility' as const`;

// Replace all single issue arrays with multiple accessibility issues
const oldIssuesPattern = /issues: \[\s*\{\s*stepHint: isFlow \? `Step \$\{i \+ 1\} Navigation` : 'Navigation area',\s*issue: isFlow \?\s*`Flow step \$\{i \+ 1\} could provide clearer next action guidance` :\s*'Menu items could have better contrast for accessibility',\s*severity: \(\['High', 'Medium', 'Low'\] as const\)\[Math\.floor\(Math\.random\(\) \* 3\)\],\s*dimension: \(\['Usability', 'Accessibility', 'Visual'\] as const\)\[Math\.floor\(Math\.random\(\) \* 3\)\],\s*principles: \['Contrast', 'Visibility'\],\s*suggestion: isFlow \?\s*`Add more prominent call-to-action for step \$\{i \+ 1\}` :\s*'Increase text contrast to meet WCAG AA standards'\s*\}\s*\]/g;

const newIssuesPattern = `issues: Array.from({ length: 3 }, (_, idx) => ({
          stepHint: isFlow ? \`Step \${i + 1} Navigation\` : \`Accessibility Issue \${idx + 1}\`,
          issue: isFlow ? 
            \`Flow step \${i + 1} could provide clearer next action guidance\` :
            \`Accessibility issue \${idx + 1}: Menu items could have better contrast for accessibility\`,
          severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
          dimension: 'Accessibility' as const,
          principles: ['Contrast', 'Visibility'],
          suggestion: isFlow ?
            \`Add more prominent call-to-action for step \${i + 1}\` :
            \`Increase text contrast to meet WCAG AA standards\`
        }))`;

// Apply replacements
content = content.replace(oldIssuesPattern, newIssuesPattern);

// Write back to file
fs.writeFileSync(filePath, content);

console.log('Fixed all adapters to generate multiple accessibility issues');
