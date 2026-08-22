import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { designService } from '../services/designService.js';
import type { GeneratedImage } from '../types.js';
import { useAuth } from './AuthContext.js';

interface DesignsContextType {
  designs: GeneratedImage[];
  isLoading: boolean;
  hasMore: boolean;
  fetchDesigns: (reset?: boolean) => void;
  addDesign: (design: GeneratedImage) => Promise<void>;
  removeDesign: (designId: string) => Promise<void>;
  updateDesign: (design: GeneratedImage) => void;
}

const DesignsContext = createContext<DesignsContextType | undefined>(undefined);

const PAGE_SIZE = 20;

export const DesignsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchDesigns = useCallback(async (reset: boolean = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    const pageToFetch = reset ? 0 : page;
    
    try {
      const newDesigns = await designService.getSavedDesigns(pageToFetch, PAGE_SIZE);
      setDesigns(prev => reset ? newDesigns : [...prev, ...newDesigns]);
      setHasMore(newDesigns.length === PAGE_SIZE);
      setPage(pageToFetch + 1);
    } catch (error) {
      console.error("Failed to fetch designs:", error);
      // Optionally set an error state here
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  // Initial fetch when user logs in
  useEffect(() => {
    if (user) {
      fetchDesigns(true); // Reset and fetch first page
    } else {
      // Clear data on logout
      setDesigns([]);
      setPage(0);
      setHasMore(true);
    }
  }, [user]);

  const addDesign = async (design: GeneratedImage) => {
    // Optimistically add to the top of the list
    setDesigns(prev => [design, ...prev]);
    try {
      const savedDesign = await designService.saveDesign(design);
      // Replace the temporary design with the one from the server (with final ID and URLs)
      setDesigns(prev => prev.map(d => d.id === design.id ? savedDesign : d));
    } catch (error) {
      console.error("Failed to save design:", error);
      // Revert optimistic update on failure
      setDesigns(prev => prev.filter(d => d.id !== design.id));
      throw error; // Re-throw for the UI to handle (e.g., show toast)
    }
  };

  const removeDesign = async (designId: string) => {
    const originalDesigns = [...designs];
    setDesigns(prev => prev.filter(d => d.id !== designId));
    try {
      await designService.deleteDesign(designId);
    } catch (error) {
      console.error("Failed to delete design:", error);
      setDesigns(originalDesigns); // Revert on failure
      throw error;
    }
  };
  
  const updateDesign = (updatedDesign: GeneratedImage) => {
      setDesigns(prev => prev.map(d => d.id === updatedDesign.id ? updatedDesign : d));
  };

  return (
    <DesignsContext.Provider value={{ designs, isLoading, hasMore, fetchDesigns, addDesign, removeDesign, updateDesign }}>
      {children}
    </DesignsContext.Provider>
  );
};

export const useDesigns = (): DesignsContextType => {
  const context = useContext(DesignsContext);
  if (context === undefined) {
    throw new Error('useDesigns must be used within a DesignsProvider');
  }
  return context;
};
