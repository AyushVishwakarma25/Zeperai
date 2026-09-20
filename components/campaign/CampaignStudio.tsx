import React, { useState } from 'react';
import { View } from '../../types.js';
import { useCampaignStudioAccess } from '../../src/campaignStudio/client/useCampaignStudioAccess.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Toast } from '../ui/Toast.js';
import { CampaignList } from './CampaignList.js';
import { CampaignRunView } from './CampaignRunView.js';
import { NewCampaignForm } from './NewCampaignForm.js';

interface Props {
  onToggleSidebar: () => void;
  onSetView: (view: View) => void;
}

type Screen = { name: 'list' } | { name: 'new' } | { name: 'run'; runId: string };

/** Dashboard view for the multi-agent campaign workflow (Brand -> Research -> Strategy -> Creative -> Prompts -> Creatives). */
const CampaignStudio: React.FC<Props> = ({ onToggleSidebar, onSetView }) => {
  const access = useCampaignStudioAccess();
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; key: number } | null>(null);
  const notify = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type, key: Date.now() });

  return (
    <div className="w-full h-full bg-main flex flex-col overflow-hidden">
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="flex-shrink-0 flex items-center justify-between p-3.5 sm:p-4 md:p-6 border-b border-border-light bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center min-w-0 mr-2">
          <button onClick={onToggleSidebar} aria-label="Toggle menu" className="p-1.5 mr-1.5 sm:mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden shrink-0">
            <Icon name="menu" className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl mr-2 sm:mr-3 text-primary shrink-0">
            <Icon name="strategy" className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary truncate">Campaign Studio</h1>
            <p className="text-xs sm:text-sm text-text-secondary truncate">From brand to ready-to-post creatives, with your approval at every step.</p>
          </div>
        </div>
        <Button onClick={() => onSetView(View.Dashboard)} variant="secondary" className="!px-2.5 !py-1.5 sm:!px-3.5 sm:!py-2 !text-xs sm:!text-sm whitespace-nowrap shrink-0 font-medium">
          <Icon name="arrow-left" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </Button>
      </header>

      <main className="flex-grow overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {access.status === 'loading' && (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        )}

        {access.status === 'disabled' && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
              <Icon name="lock" className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Campaign Studio isn’t available on your account yet</h2>
            <p className="text-sm text-text-secondary mt-1">We’re rolling it out gradually. You’ll see it here as soon as it’s ready for you.</p>
          </div>
        )}

        {access.status === 'enabled' && (
          <>
            {screen.name === 'list' && <CampaignList onOpen={(runId) => setScreen({ name: 'run', runId })} onNew={() => setScreen({ name: 'new' })} notify={notify} />}
            {screen.name === 'new' && <NewCampaignForm meta={access.meta} onCreated={(runId) => setScreen({ name: 'run', runId })} onCancel={() => setScreen({ name: 'list' })} />}
            {screen.name === 'run' && <CampaignRunView key={screen.runId} runId={screen.runId} onBack={() => setScreen({ name: 'list' })} notify={notify} />}
          </>
        )}
      </main>
    </div>
  );
};

export default CampaignStudio;
