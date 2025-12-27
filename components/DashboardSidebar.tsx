
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { AppMode, View } from '../types';
import { Toggle } from './ui/Toggle';
import { UserProfileData } from '../services/userService';

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; isOpen: boolean; }> = ({ icon, label, active = false, onClick, isOpen }) => (
  <button
    onClick={(e) => {
        e.preventDefault();
        onClick?.();
    }}
    className={`relative flex items-center w-full px-4 py-2.5 transition-colors duration-200 text-sm group font-medium ${
      active ? 'bg-primary/10 text-primary rounded-lg' : 'text-slate-500 hover:text-slate-800'
    } ${!isOpen && 'justify-center'}`}
    title={!isOpen ? label : undefined}
  >
    <Icon name={icon} className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'} ${isOpen ? 'mr-3' : ''}`} />
    {isOpen && <span className="truncate">{label}</span>}
    {!isOpen && (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
        {label}
      </div>
    )}
  </button>
);

interface DashboardSidebarProps {
    onSelectMode: (mode: AppMode) => void;
    onSetView: (view: View) => void;
    onStartImageEdit: () => void;
    currentView: View;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
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
    onStartImageEdit,
    currentView, 
    isOpen, 
    onOpen,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const creativeModes = [
    { label: 'Influencer', mode: AppMode.Influencer },
    { label: 'Product Photoshoot', mode: AppMode.Product },
    { label: 'Fashion Photoshoot', mode: AppMode.Fashion },
    { label: 'Amazon Catalogue', mode: AppMode.Amazon },
    { label: 'Ad Creative', mode: AppMode.AdCreative },
    { label: 'Festival Shoot', mode: AppMode.Festival },
    { label: 'Remix', mode: AppMode.Remix },
    { label: 'Background Remover', action: onStartImageEdit },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsUserMenuOpen(false);
    onClose();
  };

  const sidebarWidthClass = isOpen ? 'w-[260px]' : 'w-[92px]';

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        className={`
            fixed inset-y-0 left-0 z-50
            h-screen bg-white border-r border-border-light shadow-sm
            flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarWidthClass}
        `}
      >
        {/* Toggle Button (Desktop) */}
        <button
            onClick={onToggle}
            className="hidden lg:flex absolute top-8 -right-3 z-10 w-6 h-6 bg-white border border-border-light rounded-full items-center justify-center text-text-secondary hover:text-primary shadow-sm transition-transform hover:scale-110"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
            <Icon name="chevron-left" className={`w-3 h-3 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
        </button>

        {/* Header / Logo */}
        <div className={`flex-shrink-0 h-20 flex items-center ${isOpen ? 'px-6' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                <Icon name="logo" className="w-6 h-6 text-white" />
            </div>
            {isOpen && <h1 className="text-xl font-bold text-slate-800 ml-3 tracking-tight">KrackXai</h1>}
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 py-2 px-2 space-y-1 flex flex-col">
            <NavItem icon="home" label="Home" active={currentView === View.Dashboard} onClick={() => { onSetView(View.Dashboard); onClose(); }} isOpen={isOpen} />
        
            {/* Creative Modes Group */}
            <div className="py-1">
                <button 
                    onClick={() => isOpen && setIsModesOpen(!isModesOpen)}
                    className={`relative flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ${!isOpen && 'justify-center'}`}
                >
                    <Icon name="sparkles" className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'mr-3' : ''}`} />
                    {isOpen && <span className="flex-1 text-left">Creative Modes</span>}
                    {isOpen && <Icon name="chevron-down" className={`w-3.5 h-3.5 transition-transform duration-200 ${isModesOpen ? 'rotate-180' : ''}`} />}
                </button>
                
                {isModesOpen && isOpen && (
                    <div className="mt-1 space-y-0.5">
                        {creativeModes.map((item, idx) => (
                            <button
                                key={item.mode || `action-${idx}`}
                                onClick={() => { 
                                    if (item.mode) onSelectMode(item.mode);
                                    else if (item.action) item.action();
                                    onClose(); 
                                }}
                                className="w-full pl-12 pr-4 py-1.5 text-sm text-slate-500 hover:text-primary transition-colors text-left"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <NavItem icon="edit" label="AI Content Generator" onClick={() => { onOpenContentGenerator(); onClose(); }} isOpen={isOpen} />
            <NavItem icon="magic-wand" label="Brand Identity" onClick={() => { onOpenBrandKit(); onClose(); }} isOpen={isOpen} />
            <NavItem icon="folder" label="My Designs" active={currentView === View.MyDesigns} onClick={() => { onSetView(View.MyDesigns); onClose(); }} isOpen={isOpen} />
            <NavItem icon="lightbulb" label="Inspiration" active={currentView === View.Inspiration} onClick={() => { onSetView(View.Inspiration); onClose(); }} isOpen={isOpen} />
        </nav>

        {/* User Controls Footer */}
        <div className="flex-shrink-0 mt-auto p-2 border-t border-border-light relative" ref={userMenuRef}>
           {isUserMenuOpen && isOpen && (
              <div className="absolute bottom-full mb-2 w-[calc(100%-1rem)] left-2 bg-white rounded-xl shadow-lg border border-border-light p-1.5 z-10 animate-fade-in-scale-up">
                  <div className="space-y-1">
                      <button onClick={() => handleMenuItemClick(() => onSetView(View.Profile))} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors text-left">
                          <Icon name="settings" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Account settings</span>
                      </button>
                      <button onClick={() => handleMenuItemClick(() => onSetView(View.Inspiration))} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors text-left">
                          <Icon name="lightbulb" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Feature request</span>
                      </button>
                      <button onClick={() => handleMenuItemClick(onOpenSupport)} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors text-left">
                          <Icon name="headset" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Help Center</span>
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button onClick={() => handleMenuItemClick(onLogout)} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 hover:text-primary transition-colors text-left">
                          <Icon name="logout" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Sign out</span>
                      </button>
                  </div>
              </div>
          )}

          {user ? (
              <button 
                  onClick={() => isOpen && setIsUserMenuOpen(prev => !prev)}
                  className={`flex items-center w-full p-2 rounded-xl transition-colors ${isOpen ? 'hover:bg-slate-100' : ''} ${!isOpen && 'justify-center'}`}
                  disabled={!isOpen}
              >
                  <img 
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="User" 
                      className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 object-cover flex-shrink-0"
                  />
                  
                  {isOpen && (
                      <div className="ml-3 min-w-0 flex-1 text-left">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                      </div>
                  )}
                  
                  {isOpen && (
                      <Icon name="chevron-down" className={`w-4 h-4 text-slate-400 transition-transform duration-300 ml-2 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  )}
              </button>
          ) : (
              <div className="p-2">
                <button 
                    onClick={onLogin}
                    className={`flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md ${!isOpen && 'justify-center p-2'}`}
                >
                    <Icon name="user" className={`w-5 h-5 flex-shrink-0 ${isOpen && 'mr-2'}`} />
                    {isOpen && "Sign In"}
                </button>
              </div>
          )}
        </div>
      </aside>
    </>
  );
};
