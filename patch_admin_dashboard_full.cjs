const fs = require('fs');

const dashboardFile = 'components/admin/AdminDashboard.tsx';
let code = fs.readFileSync(dashboardFile, 'utf8');

const imports = `import AdminOverview from './AdminOverview';\nimport StorageManager from './StorageManager';\n`;

if (!code.includes('AdminOverview')) {
  code = code.replace("import SubscriptionsList from './SubscriptionsList';", "import SubscriptionsList from './SubscriptionsList';\n" + imports);
}

if (code.includes("useState<'users' | 'subscriptions'>('users')")) {
  code = code.replace("useState<'users' | 'subscriptions'>('users')", "useState<'overview' | 'users' | 'subscriptions' | 'storage'>('overview')");
}

const tabsUIReplacement = `
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 space-x-6 overflow-x-auto">
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap \${activeTab === 'overview' ? 'border-blue-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap \${activeTab === 'users' ? 'border-[#00E5A0] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap \${activeTab === 'subscriptions' ? 'border-[#8B5CF6] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions
          </button>
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap \${activeTab === 'storage' ? 'border-amber-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('storage')}
          >
            Storage
          </button>
        </div>

        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'storage' && <StorageManager />}
        {activeTab === 'subscriptions' && <SubscriptionsList />}
        {activeTab === 'users' && (
`;

// Replace the old tabs UI block
const oldTabsStart = code.indexOf('<div className="flex border-b border-slate-200');
const oldTabsEnd = code.indexOf('{activeTab === \'users\' ? (');

if (oldTabsStart !== -1 && oldTabsEnd !== -1) {
   const before = code.substring(0, oldTabsStart);
   // Find the end of the conditional rendering block to replace correctly
   
   // Wait, replacing via regex or string matching might be brittle.
   // Let's just do it manually with regex.
   code = code.replace(/<div className="flex border-b border-slate-200[\s\S]*?\{activeTab === 'users' \? \(/, tabsUIReplacement);
   code = code.replace(/<\/Card>\n\s*\)\s*:\s*\(\n\s*<SubscriptionsList \/>\n\s*\)/, '</Card>\n        )');
}

fs.writeFileSync(dashboardFile, code);
console.log('Admin Dashboard fully patched');
