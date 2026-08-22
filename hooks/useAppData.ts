
import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService.js';
import { brandService } from '../services/brandService.js';
import type { BrandKit, SavedModel } from '../types.js';
import { useAuth } from '../contexts/AuthContext.js';

export const useAppData = () => {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);
    const [totalCredits, setTotalCredits] = useState(100);
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) {
            setCredits(0);
            setTotalCredits(0);
            setBrandKit(null);
            setSavedModels([]);
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
            if (user) {
                userService.deductCredits(cost).catch(e => console.error("Credit sync failed", e));
            }
            return true;
        }
        return false;
    }, [credits, user]);

    const refundCredits = useCallback((amount: number, isAdmin: boolean) => {
        if (isAdmin) return;
        setCredits(prev => prev + amount);
        if (user) {
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
