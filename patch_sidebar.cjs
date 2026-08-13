const fs = require('fs');

const sidebarFile = 'components/DashboardSidebar.tsx';
let code = fs.readFileSync(sidebarFile, 'utf8');

// Insert the admin button after "Support" but before "Sign out"
if (!code.includes("View.Admin")) {
  const adminCode = `
                      <button onClick={() => window.location.href='/admin'} className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-left">
                        <Icon name="shield" className="w-4 h-4 mr-3" /> Admin Panel
                      </button>`;
  
  code = code.replace(
    "<button onClick={() => handleMenuItemClick(onLogout)}",
    adminCode + "\n                      <button onClick={() => handleMenuItemClick(onLogout)}"
  );
  
  fs.writeFileSync(sidebarFile, code);
  console.log('patched');
}
