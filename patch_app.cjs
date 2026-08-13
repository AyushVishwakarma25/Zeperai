const fs = require('fs');

const appFile = 'App.tsx';
let code = fs.readFileSync(appFile, 'utf8');

if (!code.includes('AdminDashboard')) {
  code = code.replace(
    "import { Routes, Route, Navigate } from 'react-router-dom';",
    "import { Routes, Route, Navigate } from 'react-router-dom';\nimport AdminDashboard from './components/admin/AdminDashboard';"
  );
  
  code = code.replace(
    "<Route path=\"*\" element={<Navigate to=\"/\" replace />} />",
    "<Route path=\"/admin\" element={<AdminDashboard />} />\n      <Route path=\"*\" element={<Navigate to=\"/\" replace />} />"
  );

  fs.writeFileSync(appFile, code);
  console.log('patched');
}
