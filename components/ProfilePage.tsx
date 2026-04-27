
import React from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { View, UserActivity } from '../types';

interface UserProfile {
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  avatarUrl: string;
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
      <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center">
            <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                <Icon name="menu" className="w-6 h-6" />
            </button>
            <button onClick={() => onSetView(View.Dashboard)} className="p-2 rounded-full text-text-secondary hover:bg-gray-100">
                <Icon name="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-text-primary ml-4">My Account</h1>
        </div>
        <div className='flex items-center space-x-2 md:space-x-4'>
            <button onClick={onOpenFeedbackModal} className="px-3 py-2 text-xs sm:text-sm font-semibold text-text-secondary bg-white border border-border-light rounded-lg hover:bg-gray-50 transition-colors">
                Feedback
            </button>
            <button onClick={onUpgradePlan} className="px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg hover:opacity-90 transition-opacity shadow-md">
                Upgrade Plan ✨
            </button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-border-light text-center flex flex-col items-center">
            <div className="relative mb-4">
              <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/20" />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-border-light shadow-sm">
                  <span className="block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                      {userTier}
                  </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">{user.name}</h2>
            <p className="text-sm text-text-secondary font-medium mb-4">{user.role}</p>
            <p className="text-sm text-text-secondary mb-6">{user.bio}</p>
            <Button onClick={onEditProfile} variant="dark" fullWidth>
              <Icon name="edit" className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          {/* Account Details & Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-light">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Account Details</h3>
                  <button onClick={onEditProfile} className="text-sm text-primary font-medium hover:underline">
                      Edit
                  </button>
              </div>
              <div className="grid grid-cols-1 gap-6 text-sm">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Email Address</label>
                  <p className="text-text-primary font-medium break-all">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-light text-center flex flex-col justify-center">
                <p className="text-sm text-text-secondary font-medium">Total Generations</p>
                <p className="text-4xl font-bold text-text-primary mt-2">{recentActivity.length}</p>
              </div>
              
              {/* Active Credits Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 text-center relative overflow-hidden text-white group transition-transform hover:-translate-y-1">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <p className="text-sm text-slate-300 font-medium uppercase tracking-wide">Available Credits</p>
                        <div className="flex items-baseline justify-center mt-2">
                            <p className={`text-5xl font-extrabold ${credits < 10 ? 'text-red-400' : 'text-white'}`}>
                                {credits}
                            </p>
                            <span className="text-slate-400 ml-1">/ {totalCredits}</span>
                        </div>
                    </div>
                    
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-4 overflow-hidden">
                        <div 
                            className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${(credits / totalCredits) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Renews in 12 days</p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-primary rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <Icon name="sparkles" className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
              </div>

              <div className="flex flex-col justify-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-border-light">
                  <p className="text-xs text-center text-text-secondary uppercase tracking-wider font-semibold mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-center text-primary mb-2">{userTier}</p>
                  <Button onClick={onUpgradePlan} className="!text-sm w-full shadow-sm">
                    Top Up / Upgrade
                  </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section Removed */}
      </main>
    </div>
  );
};

export default ProfilePage;
