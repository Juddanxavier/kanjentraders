const fs = require('fs');
const path = require('path');

// Files to update with their search/replace patterns
const filesToUpdate = [
  'src/app/api/notifications/[id]/route.ts',
  'src/app/api/notifications/mark-all-read/route.ts',
  'src/app/api/leads/route.ts',
  'src/app/api/leads/[id]/route.ts',
  'src/app/api/leads/bulk/route.ts',
  'src/app/api/leads/stats/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/users/[id]/edit/route.ts',
  'src/app/api/admin/users/create/route.ts',
  'src/app/api/admin/users/ban/route.ts',
  'src/app/api/admin/users/sessions/route.ts',
  'src/app/api/test/notifications/route.ts',
  'src/app/api/test/notifications/health/route.ts',
];

// Patterns to replace
const patterns = [
  {
    search: /import { auth } from '@\/lib\/auth\/auth';/g,
    replace: "import { getSession } from '@/lib/auth/auth-server';"
  },
  {
    search: /const session = await auth\.api\.getSession\(\{\s*headers: request\.headers,?\s*\}\);/g,
    replace: "const session = await getSession();"
  },
  {
    search: /const session = await auth\.api\.getSession\(\s*\{\s*headers:\s*request\.headers\s*\}\s*\);/g,
    replace: "const session = await getSession();"
  }
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  patterns.forEach(pattern => {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('Auth import updates completed!');
