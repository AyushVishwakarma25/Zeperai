
import React from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { SubscriptionManagement } from './SubscriptionManagement';
import { View, UserActivity } from '../types';

interface UserProfile {
  id?: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
  tier?: string;
}

interface ProfilePageProps {
  user: UserProfile;
  credits: number;
  userTier: string;
  onEditProfile: () => void;
  onUpgradePlan: () => void;
  onToggleSidebar: () => void;
  onSetView: (view: View) => void;
  onOpenFeedbackModal: () => void;
  recentActivity: UserActivity[];
}

const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
};

const ProfilePage: React.FC<ProfilePageProps> = ({ 
    user, 
    credits, 
    userTier, 
    onEditProfile, 
    onUpgradePlan, 
    onToggleSidebar, 
    onSetView, 
    onOpenFeedbackModal, 
    recentActivity 
}) => {
  // Assuming standard tier limits if not passed (though ideally should be passed)
  const totalCredits = userTier === 'Agency' ? 1000 : userTier === 'Standard' ? 300 : 80;
  const usagePercentage = Math.min(100, Math.max(0, ((totalCredits - credits) / totalCredits) * 100));

  return (
    <div className="w-full h-full bg-main flex flex-col overflow-y-auto">
      <header className="flex-shrink-0 flex items-center justify-between p-3 md:p-4 border-b border-border-light bg-white">
        <div className="flex items-center min-w-0 mr-2">
            <button onClick={onToggleSidebar} className="p-1.5 mr-1.5 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden shrink-0">
                <Icon name="menu" className="w-5 h-5" />
            </button>
            <button onClick={() => onSetView(View.Dashboard)} className="p-1.5 rounded-full text-text-secondary hover:bg-gray-100 shrink-0" title="Back to Dashboard">
                <Icon name="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-text-primary ml-2 sm:ml-4 truncate">My Account</h1>
        </div>
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <button onClick={onOpenFeedbackModal} className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-text-secondary bg-white border border-border-light rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                Feedback
            </button>
            <button onClick={onUpgradePlan} className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap">
                Upgrade ✨
            </button>
        </div>
      </header>

      <main className="flex-grow p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Profile Card */}
          <div className="lg:col-span-1 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-border-light text-center flex flex-col items-center">
            <div className="relative mb-3">
              <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-primary/20" />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-border-light shadow-sm">
                  <span className="block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                      {userTier}
                  </span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
            <p className="text-xs text-text-secondary font-medium mb-3">{user.role}</p>
            <p className="text-xs text-text-secondary mb-4">{user.bio}</p>
            <Button onClick={onEditProfile} variant="dark" fullWidth className="!py-1.5 !text-sm">
              <Icon name="edit" className="w-3.5 h-3.5 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* Account Details, Stats & Subscription Management */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-border-light">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-text-primary">Account Details</h3>
                  <button onClick={onEditProfile} className="text-sm text-primary font-medium hover:underline">
                      Edit
                  </button>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Email Address</label>
                  <p className="text-text-primary text-sm font-medium break-all">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-border-light text-center flex flex-col justify-center">
                <p className="text-xs text-text-secondary font-medium">Total Generations</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{recentActivity.length}</p>
              </div>
              
              {/* Active Credits Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-3 md:p-4 rounded-2xl shadow-lg border border-slate-700 text-center relative overflow-hidden text-white group transition-transform hover:-translate-y-1">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <p className="text-[10px] sm:text-xs text-slate-300 font-medium uppercase tracking-wide">Available Credits</p>
                        <div className="flex items-baseline justify-center mt-1">
                            <p className={`text-3xl font-extrabold ${credits < 10 ? 'text-red-400' : 'text-white'}`}>
                                {credits}
                            </p>
                            <span className="text-slate-400 text-xs ml-1">/ {totalCredits}</span>
                        </div>
                    </div>
                    
                    <div className="w-full bg-slate-700 rounded-full h-1 mt-2.5 overflow-hidden">
                        <div 
                            className="bg-primary h-1 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${(credits / totalCredits) * 100}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Renews in 12 days</p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-12 h-12 bg-primary rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <Icon name="sparkles" className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 rotate-12" />
              </div>

              <div className="flex flex-col justify-center gap-2 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-border-light">
                  <p className="text-[10px] text-center text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Current Plan</p>
                  <p className="text-xl font-bold text-center text-primary mb-1">{userTier}</p>
                  <Button onClick={onUpgradePlan} className="!text-xs !py-1.5 w-full shadow-sm">
                    Top Up / Upgrade
                  </Button>
              </div>
            </div>

            {/* Subscription Management Card */}
            <SubscriptionManagement user={{ ...user, tier: userTier }} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
