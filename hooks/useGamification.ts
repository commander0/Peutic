import { useState } from 'react';
import { User } from '../types';
import { GardenService } from '../services/gardenService';
import { useToast } from '../components/common/Toast';
import { useGlobalState } from '../contexts/GlobalStateContext';

export const useGamification = (user: User | null | undefined) => {
    const { showToast } = useToast();
    const { garden, lumina } = useGlobalState();

    const [isClipping, setIsClipping] = useState(false);

    const refreshGarden = async () => {
        console.info("V2: refreshGarden is obsolete. Realtime DB subscription active.");
    };

    const handleClipPlant = async () => {
        if (!user || isClipping) return;
        setIsClipping(true);
        const result = await GardenService.clipPlant(user.id);

        if (result.success) {
            showToast(result.message || "Clipped!", "success");
            if (result.reward) {
                showToast(`"${result.reward}"`, "info");
            }
            setTimeout(() => {
                setIsClipping(false);
            }, 2000);
        } else {
            showToast(result.message || "Cannot clip right now", "error");
            setIsClipping(false);
        }
    };

    const refreshPet = async () => {
        console.info("V2: refreshPet is obsolete. Realtime DB subscription active.");
    };

    return {
        garden,
        lumina,
        isClipping,
        refreshGarden,
        handleClipPlant,
        refreshPet
    };
};
