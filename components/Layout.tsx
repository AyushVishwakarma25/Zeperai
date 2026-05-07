
import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import type { UserProfileData } from '../services/userService';
import type { AppMode, View, GeneratedImage } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    currentView: View;
    onSetView: (view: View) => void;
    onSelectMode: (mode: AppMode) => void;
    onStartImageEdit: () => void;
    onOpenContentGenerator: () => void;
    onOpenSupport: () => void;
    onOpenBrandKit: () => void;
    onSetTier: (tier: 'Free' | 'PayAsYouGo') => void;
    user: UserProfileData;
    onLogout: () => void;
    onInternalImageDrop: (image: GeneratedImage, targetMode?: AppMode) => void;
    onShowDevMessage?: (feature: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    isSidebarOpen,
    setIsSidebarOpen,
    currentView,
    onSetView,
    onSelectMode,
    onStartImageEdit,
    onOpenContentGenerator,
    onOpenSupport,
    onOpenBrandKit,
    onSetTier,
    user,
    onLogout,
    onInternalImageDrop,
    onShowDevMessage
}) => {
    return (
        <div className="relative w-screen h-screen bg-main font-sans flex overflow-hidden">
            <DashboardSidebar 
                onSelectMode={onSelectMode} 
                onSetView={onSetView}
                onStartImageEdit={onStartImageEdit}
                currentView={currentView}
                isOpen={isSidebarOpen}
                onOpen={() => setIsSidebarOpen(true)}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onOpenContentGenerator={onOpenContentGenerator}
                onOpenSupport={onOpenSupport}
                onOpenBrandKit={onOpenBrandKit}
                user={user}
                onLogin={() => {}}
                onLogout={onLogout}
                onInternalImageDrop={onInternalImageDrop}
                onShowDevMessage={onShowDevMessage}
            />

            <main className="flex-1 flex flex-col overflow-hidden lg:ml-[92px]">
                {children}
            </main>
        </div>
    );
};
