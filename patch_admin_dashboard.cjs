const fs = require('fs');

const dashboardFile = 'components/admin/AdminDashboard.tsx';
let code = fs.readFileSync(dashboardFile, 'utf8');

const importSub = "import SubscriptionsList from './SubscriptionsList';\n";

if (!code.includes('SubscriptionsList')) {
  code = code.replace("import UserDetailModal from './UserDetailModal';", importSub + "import UserDetailModal from './UserDetailModal';");
}

if (!code.includes('const [activeTab, setActiveTab] = useState')) {
  code = code.replace("const [page, setPage] = useState(1);", "const [page, setPage] = useState(1);\n  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions'>('users');");
}

if (!code.includes('<SubscriptionsList />')) {
  // Add tabs to the UI
  const tabsUI = `
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 space-x-6">
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors \${activeTab === 'users' ? 'border-[#00E5A0] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={\`pb-3 font-medium text-sm border-b-2 transition-colors \${activeTab === 'subscriptions' ? 'border-[#8B5CF6] text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions
          </button>
        </div>

        {activeTab === 'users' ? (
  `;
  
  code = code.replace("<Card className=\"p-6\">", tabsUI + "\n<Card className=\"p-6\">");
  code = code.replace("</Card>\n      </div>", "</Card>\n        ) : (\n          <SubscriptionsList />\n        )}\n      </div>");
}

fs.writeFileSync(dashboardFile, code);
console.log('patched dashboard');
