import { useState } from 'react';
import { User, GardenState, Lumina } from '../types';
import { GardenService } from '../services/gardenService';
import { PetService } from '../services/petService';
import { useToast } from '../components/common/Toast';

export const useGamification = (user: User | null | undefined) => {
    const { showToast } = useToast();

    // Garden State
    const [garden, setGarden] = useState<GardenState | null>(null);
    const [isClipping, setIsClipping] = useState(false);

    // Lumina State
    const [lumina, setLumina] = useState<Lumina | null>(null);

    const refreshGarden = async () => {
        if (!user?.id) return;
        const g = await GardenService.getGarden(user.id);
        setGarden(g);
    };

    const handleClipPlant = async () => {
        if (!user || isClipping) return;
        setIsClipping(true);
        const result = await GardenService.clipPlant(user.id);

        if (result.success) {
            showToast(result.message || "Clipped!", "success");
            if (result.reward) {
                // Show Quote Toast
                showToast(`"${result.reward}"`, "info");
            }
            setTimeout(() => {
                setIsClipping(false);
                refreshGarden(); // Refresh stats if needed
            }, 2000);
        } else {
            showToast(result.message || "Cannot clip right now", "error");
            setIsClipping(false);
        }
    };

    const refreshPet = async () => {
        if (!user?.id) return;
        const p = await PetService.getPet(user.id);
        setLumina(p);
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
