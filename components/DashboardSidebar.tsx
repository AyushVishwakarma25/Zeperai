
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { AppMode, View, GeneratedImage } from '../types';
import { Toggle } from './ui/Toggle';
import { UserProfileData } from '../services/userService';

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; isOpen: boolean; }> = ({ icon, label, active = false, onClick, isOpen }) => (
  <button
    onClick={(e) => {
        e.preventDefault();
        onClick?.();
    }}
    className={`relative flex items-center w-full transition-colors duration-200 text-sm group font-medium ${
      isOpen ? 'px-4 py-3 rounded-lg' : 'h-12 w-12 mx-auto rounded-xl justify-center'
    } ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/40' 
        : (isOpen ? 'text-slate-600 hover:bg-slate-100' : '')
    }`}
    title={!isOpen ? label : undefined}
  >
    <Icon name={icon} className={`w-5 h-5 flex-shrink-0 transition-colors ${isOpen ? 'mr-4' : ''} ${active ? 'text-white' : `text-slate-400 ${isOpen ? 'group-hover:text-slate-600' : 'group-hover:text-primary'}`}`} />
    {isOpen && <span className="truncate">{label}</span>}
    {!isOpen && (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
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
    onInternalImageDrop?: (image: GeneratedImage, targetMode?: AppMode) => void;
}

const DashboardSidebarComponent: React.FC<DashboardSidebarProps> = ({ 
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
    onLogout,
    onInternalImageDrop
}) => {
  const [isModesOpen, setIsModesOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dragOverMode, setDragOverMode] = useState<AppMode | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const creativeModes = [
    { label: 'Influencer', mode: AppMode.Influencer },
    { label: 'Product Photoshoot', mode: AppMode.Product },
    { label: 'Fashion Photoshoot', mode: AppMode.Fashion },
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

  const handleDragEnter = (e: React.DragEvent, mode: AppMode) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverMode(mode);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverMode(null);
  };

  const handleDrop = (e: React.DragEvent, mode: AppMode) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverMode(null);
      const data = e.dataTransfer.getData('application/x-krackx-image');
      if (data && onInternalImageDrop) {
          try {
              const image = JSON.parse(data);
              onInternalImageDrop(image, mode);
          } catch (err) {
              console.error("Drop error", err);
          }
      } else {
          onSelectMode(mode);
      }
  };

  const sidebarWidthClass = isOpen ? 'w-[260px]' : 'w-[92px]';

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        className={`
            fixed inset-y-0 left-0 z-40
            h-[100dvh] lg:h-screen bg-white border-r border-border-light shadow-sm
            flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarWidthClass}
        `}
      >
        {/* Header / Logo */}
        <div className={`flex-shrink-0 h-20 flex items-center ${isOpen ? 'px-6' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                <Icon name="logo" className="w-6 h-6 text-white" />
            </div>
            {isOpen && <h1 className="text-2xl font-bold text-slate-900 ml-3 tracking-tight">ZeperAi</h1>}
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 space-y-1 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <NavItem icon="home" label="Home" active={currentView === View.Dashboard} onClick={() => { onSetView(View.Dashboard); onClose(); }} isOpen={isOpen} />
        
            {/* Creative Modes Group */}
            <div className="py-1">
                <button 
                    onClick={() => isOpen && setIsModesOpen(!isModesOpen)}
                    className={`relative flex items-center w-full transition-colors duration-200 text-sm group font-medium ${
                      isOpen ? 'text-slate-600 hover:bg-slate-100 px-4 py-3 rounded-lg' : 'h-12 w-12 mx-auto rounded-xl justify-center'
                    }`}
                    title={!isOpen ? "Creative Modes" : undefined}
                >
                    <Icon name="sparkles" className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'mr-4' : ''} text-slate-400 ${isOpen ? 'group-hover:text-slate-600' : 'group-hover:text-primary'}`} />
                    {isOpen && <span className="flex-1 text-left">Creative Modes</span>}
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
                                onDragEnter={(e) => item.mode && handleDragEnter(e, item.mode)}
                                onDragLeave={handleDragLeave}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => item.mode && handleDrop(e, item.mode)}
                                className={`w-full pl-12 pr-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-left flex justify-between items-center ${
                                    dragOverMode === item.mode 
                                    ? 'bg-primary text-white scale-105 shadow-md' 
                                    : 'text-slate-600 hover:text-primary hover:bg-primary/10'
                                }`}
                            >
                                <span>{item.label}</span>
                                {dragOverMode === item.mode && <Icon name="plus-circle" className="w-4 h-4 text-white animate-pulse" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <NavItem icon="edit" label="AI Content Writer" onClick={() => { onOpenContentGenerator(); onClose(); }} isOpen={isOpen} />
            <NavItem icon="magic-wand" label="Brand Identity" onClick={() => { onOpenBrandKit(); onClose(); }} isOpen={isOpen} />
            <NavItem icon="folder" label="My Designs" active={currentView === View.MyDesigns} onClick={() => { onSetView(View.MyDesigns); onClose(); }} isOpen={isOpen} />
            <NavItem icon="lightbulb" label="Inspiration" active={currentView === View.Inspiration} onClick={() => { onSetView(View.Inspiration); onClose(); }} isOpen={isOpen} />
            
            <div className="mt-auto pt-2 border-t border-border-light" />
        </nav>

        {/* User Controls Footer */}
        <div className="flex-shrink-0 p-2 relative" ref={userMenuRef}>
           {isUserMenuOpen && isOpen && (
              <div className="absolute bottom-full mb-2 w-[calc(100%-1rem)] left-2 bg-white rounded-xl shadow-lg border border-border-light p-1.5 z-10 animate-fade-in-scale-up">
                  <div className="space-y-1">
                      <button onClick={() => handleMenuItemClick(() => onSetView(View.Profile))} className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-left">
                          <Icon name="settings" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Account settings</span>
                      </button>
                      <button onClick={() => handleMenuItemClick(onOpenSupport)} className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-left">
                          <Icon name="headset" className="w-5 h-5 mr-3 text-slate-400" />
                          <span>Help Center</span>
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button onClick={() => handleMenuItemClick(onLogout)} className="w-full flex items-center px-3 py-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left">
                          <Icon name="logout" className="w-5 h-5 mr-3" />
                          <span>Sign out</span>
                      </button>
                  </div>
              </div>
          )}

          {user ? (
              <div className="flex flex-col">
                <button 
                    onClick={() => isOpen && setIsUserMenuOpen(prev => !prev)}
                    className={`flex items-center w-full transition-colors duration-200 ${
                        isOpen 
                        ? 'px-4 py-2 rounded-lg bg-primary text-white shadow-lg shadow-primary/40' 
                        : 'h-12 w-12 mx-auto rounded-xl justify-center bg-primary shadow-lg shadow-primary/40'
                    }`}
                    disabled={!isOpen}
                    title={!isOpen ? user.name : undefined}
                >
                    <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt="User" 
                        className={`object-cover flex-shrink-0 rounded-full w-10 h-10 ${
                            isOpen 
                            ? 'border-2 border-white/50' 
                            : ''
                        }`}
                    />
                    
                    {isOpen && (
                        <div className="ml-3 min-w-0 flex-1 text-left">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/80 truncate">{user.role}</p>
                        </div>
                    )}
                    
                    {isOpen && (
                        <Icon name="dots-horizontal" className={`w-5 h-5 text-white/80 ml-2`} />
                    )}
                </button>
                
                {isOpen && onToggleAdmin && (
                    <button 
                        onClick={onToggleAdmin} 
                        className={`mt-2 text-[10px] uppercase font-bold tracking-wider py-1 px-2 rounded hover:bg-slate-100 transition-colors ${isAdmin ? 'text-green-600 bg-green-50' : 'text-slate-300'}`}
                    >
                        {isAdmin ? 'Admin Mode ON' : 'Admin Mode OFF'}
                    </button>
                )}
              </div>
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

export const DashboardSidebar = React.memo(DashboardSidebarComponent);
