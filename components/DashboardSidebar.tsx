
import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { AppMode, View } from '../types';
import { Toggle } from './ui/Toggle';
import { UserProfileData } from '../services/userService';

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; isOpen: boolean; hasIndicator?: boolean; }> = ({ icon, label, active = false, onClick, isOpen, hasIndicator }) => (
  <a
    href="#"
    onClick={(e) => {
        e.preventDefault();
        onClick?.();
    }}
    className={`relative flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-sm group transform ${
      active ? 'bg-primary/10 text-primary font-semibold' : 'text-text-secondary hover:bg-gray-100'
    } ${!isOpen && 'justify-center'} ${isOpen ? 'hover:translate-x-1' : 'hover:scale-110'}`}
    title={!isOpen ? label : undefined}
  >
    <Icon name={icon} className={`w-5 h-5 flex-shrink-0 transition-all ${isOpen && 'mr-4'}`} />
    {isOpen && <span className="truncate">{label}</span>}
    {hasIndicator && active && (
        <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full"></div>
    )}
    {!isOpen && (
      <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-slate-900 text-white text-xs invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
        {label}
      </div>
    )}
  </a>
);


interface DashboardSidebarProps {
    onSelectMode: (mode: AppMode) => void;
    onSetView: (view: View) => void;
    currentView: View;
    isOpen: boolean;
    onClose: () => void; // For mobile overlay closing
    onToggle: () => void; // For desktop collapse/expand
    onOpenContentGenerator: () => void;
    onOpenSupport: () => void;
    onOpenBrandKit: () => void;
    isAdmin?: boolean;
    onToggleAdmin?: () => void;
    user: UserProfileData | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
    onSelectMode, 
    onSetView, 
    currentView, 
    isOpen, 
    onClose, 
    onToggle, 
    onOpenContentGenerator, 
    onOpenSupport,
    onOpenBrandKit,
    isAdmin = false,
    onToggleAdmin,
    user,
    onLogin,
    onLogout
}) => {
  const [isModesOpen, setIsModesOpen] = useState(true);
  
  const creativeModes = [
    { label: 'Influencer', mode: AppMode.Influencer },
    { label: 'Product Photoshoot', mode: AppMode.Product },
    { label: 'Fashion Photoshoot', mode: AppMode.Fashion },
    { label: 'Amazon Catalogue', mode: AppMode.Amazon },
    { label: 'Ad Creative', mode: AppMode.AdCreative },
    { label: 'Youtube Thumbnail', mode: AppMode.Youtube },
    { label: 'Banner', mode: AppMode.Banner },
    { label: 'Remix', mode: AppMode.Remix },
  ];

  return (
    <aside className={`relative fixed lg:static inset-y-0 left-0 z-50 bg-sidebar-light h-screen flex flex-col p-4 border-r border-border-light transform transition-all duration-300 ease-in-out ${isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
      <button
          onClick={onToggle}
          className="absolute top-6 -right-3 z-10 p-1.5 bg-white border border-border-light rounded-full text-text-secondary hover:bg-gray-100 hover:scale-110 shadow-sm transition-all duration-300 hidden lg:block"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
          <Icon name="chevron-left" className={`w-4 h-4 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
      </button>

      <div className="px-2 py-4 mb-8">
        <div className={`flex items-center ${!isOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="logo" className="w-6 h-6 text-white" />
            </div>
            {isOpen && <h1 className="text-xl font-bold text-text-primary ml-3 truncate">KrackXai</h1>}
        </div>
      </div>
      
      <nav className="flex-grow flex flex-col justify-between">
        <div className="space-y-1">
            <NavItem icon="home" label="Home" active={currentView === View.Dashboard} onClick={() => onSetView(View.Dashboard)} isOpen={isOpen} />
            <div>
                <button 
                    onClick={() => setIsModesOpen(!isModesOpen)}
                    className={`flex items-center w-full px-4 py-2.5 rounded-xl transition-colors text-text-secondary hover:bg-gray-100 ${!isOpen && 'justify-center'}`}
                >
                    <Icon name="sparkles" className={`w-5 h-5 flex-shrink-0 ${isOpen && 'mr-4'}`} />
                    {isOpen && <span className="text-sm">Creative Modes</span>}
                    {isOpen && <Icon name="chevron-down" className={`w-4 h-4 ml-auto transition-transform ${isModesOpen ? 'rotate-180' : ''}`} />}
                </button>
                {isModesOpen && isOpen && (
                    <div className="pl-8 mt-1 space-y-1">
                        {creativeModes.map(item => (
                            <a
                                key={item.mode}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onSelectMode(item.mode);
                                }}
                                className="block text-sm py-1.5 px-3 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <NavItem icon="edit" label="AI Content Generator" onClick={() => onOpenContentGenerator()} isOpen={isOpen} />
            <NavItem icon="magic-wand" label="Brand Identity" onClick={() => onOpenBrandKit()} isOpen={isOpen} />
            <NavItem icon="folder" label="My Designs" active={currentView === View.MyDesigns} onClick={() => onSetView(View.MyDesigns)} isOpen={isOpen} />
            <NavItem icon="lightbulb" label="Inspiration" active={currentView === View.Inspiration} onClick={() => onSetView(View.Inspiration)} isOpen={isOpen} />
        </div>
        
        {/* Bottom Nav Items */}
        <div className="pt-4 border-t border-border-light space-y-1">
             <NavItem icon="user" label="Profile" active={currentView === View.Profile} onClick={() => onSetView(View.Profile)} isOpen={isOpen} />
             <NavItem icon="headset" label="Support" onClick={() => onOpenSupport()} isOpen={isOpen} />
             
             {onToggleAdmin && isOpen && user && (
                 <div className="px-4 py-2 mt-2">
                    <Toggle 
                        label="Admin Mode" 
                        enabled={isAdmin} 
                        onChange={onToggleAdmin} 
                        className="text-xs"
                    />
                 </div>
             )}
             
             {user ? (
                 <NavItem icon="logout" label="Logout" onClick={onLogout} isOpen={isOpen} />
             ) : (
                 <button 
                    onClick={onLogin}
                    className={`flex items-center w-full px-4 py-2.5 mt-2 rounded-xl transition-all duration-200 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 ${!isOpen && 'justify-center p-2'}`}
                 >
                    <Icon name="user" className={`w-5 h-5 flex-shrink-0 ${isOpen && 'mr-2'}`} />
                    {isOpen && "Sign In"}
                 </button>
             )}
        </div>
      </nav>
    </aside>
  );
};
