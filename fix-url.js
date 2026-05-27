import fs from 'fs';

const filePath = './src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Insert API_BASE_URL after imports
const importEndIndex = content.lastIndexOf('import ');
const nextNewLine = content.indexOf('\n', importEndIndex);

const apiBaseUrlConst = `\n\nconst API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.protocol + '//' + window.location.hostname + ':3000');\n`;

content = content.slice(0, nextNewLine + 1) + apiBaseUrlConst + content.slice(nextNewLine + 1);

// Replace string literal 'http://localhost:3000/...' with `${API_BASE_URL}/...`
// Example: 'http://localhost:3000/api/auth/login' -> `${API_BASE_URL}/api/auth/login`
content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, '`${API_BASE_URL}$1`');

// Replace template literal `http://localhost:3000/...` with `${API_BASE_URL}/...`
// Example: `http://localhost:3000/tasks/${taskId}` -> `${API_BASE_URL}/tasks/${taskId}`
content = content.replace(/`http:\/\/localhost:3000([^`]+)`/g, '`${API_BASE_URL}$1`');

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.jsx updated successfully.');
