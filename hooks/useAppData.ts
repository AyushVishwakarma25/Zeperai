
import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';
import { brandService } from '../services/brandService';
import type { BrandKit, SavedModel } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useAppData = () => {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);
    const [totalCredits, setTotalCredits] = useState(100);
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) {
            setCredits(50);
            setTotalCredits(50);
            setBrandKit(null);
            setSavedModels([]);
            setIsLoading(false);
            return;
        }

        if (user.id === 'guest-user-id') {
            setCredits(50);
            setTotalCredits(50);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [creditData, userBrandKit, models] = await Promise.all([
                userService.getCredits(),
                brandService.getBrandKit(),
                userService.getSavedModels()
            ]);
            setCredits(creditData.current);
            setTotalCredits(creditData.total);
            setBrandKit(userBrandKit);
            setSavedModels(models);
        } catch (error) {
            console.error("Data load failure", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const checkAndDeductCredits = useCallback((cost: number, isAdmin: boolean): boolean => {
        if (isAdmin) return true;
        if (credits >= cost) {
            setCredits(prev => prev - cost);
            if (user && user.id !== 'guest-user-id') {
                userService.deductCredits(cost).catch(e => console.error("Credit sync failed", e));
            }
            return true;
        }
        return false;
    }, [credits, user]);

    const refundCredits = useCallback((amount: number, isAdmin: boolean) => {
        if (isAdmin) return;
        setCredits(prev => prev + amount);
        if (user && user.id !== 'guest-user-id') {
            userService.deductCredits(-amount).catch(e => console.error("Refund failed", e));
        }
    }, [user]);

    return {
        credits,
        setCredits,
        totalCredits,
        brandKit,
        setBrandKit,
        savedModels,
        setSavedModels,
        isLoading,
        loadData,
        checkAndDeductCredits,
        refundCredits
    };
};
