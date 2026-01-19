import { PocketPet } from '../types';
import { supabase } from './supabaseClient';
import { logger } from './logger';

export class PetService {
    private static CACHE_KEY = 'peutic_pocket_pet';

    static async getPet(userId: string): Promise<PocketPet | null> {
        try {
            const cached = localStorage.getItem(`${this.CACHE_KEY}_${userId}`);

            const { data, error } = await supabase
                .from('pocket_pets')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error("Error fetching pet:", error);
            }

            if (data) {
                const pet = this.mapPet(data);
                // Apply time-based decay
                const decayedPet = this.calculateDecay(pet);
                localStorage.setItem(`${this.CACHE_KEY}_${userId}`, JSON.stringify(decayedPet));
                return decayedPet;
            }

            if (cached) return JSON.parse(cached);
            return null;
        } catch (e) {
            return null;
        }
    }

    static async createPet(userId: string, name: string, species: PocketPet['species']): Promise<PocketPet> {
        const newPet: Partial<PocketPet> = {
            id: crypto.randomUUID(),
            userId,
            name,
            species,
            level: 1,
            experience: 0,
            health: 100,
            hunger: 100,
            happiness: 100,
            cleanliness: 100,
            energy: 100,
            isSleeping: false,
            lastInteractionAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        const { error } = await supabase.from('pocket_pets').insert(this.mapPetToDB(newPet as PocketPet));
        if (error) {
            logger.error("Create Pet Failed", userId, error);
            throw error;
        }

        return newPet as PocketPet;
    }

    static async updatePet(pet: PocketPet): Promise<void> {
        const { error } = await supabase
            .from('pocket_pets')
            .update(this.mapPetToDB(pet))
            .eq('id', pet.id);

        if (error) {
            logger.error("Update Pet Failed", pet.id, error);
        } else {
            localStorage.setItem(`${this.CACHE_KEY}_${pet.userId}`, JSON.stringify(pet));
        }
    }

    private static calculateDecay(pet: PocketPet): PocketPet {
        const now = new Date();
        const last = new Date(pet.lastInteractionAt);
        const diffMs = now.getTime() - last.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 5) return pet; // No decay for very short intervals

        // Decay rates per minute
        const hungerDecay = 0.1;
        const happinessDecay = 0.05;
        const cleanlinessDecay = 0.03;
        const energyDecay = pet.isSleeping ? -0.5 : 0.08; // Energy increases if sleeping

        const updatedPet = { ...pet };
        updatedPet.hunger = Math.max(0, pet.hunger - (diffMins * hungerDecay));
        updatedPet.happiness = Math.max(0, pet.happiness - (diffMins * happinessDecay));
        updatedPet.cleanliness = Math.max(0, pet.cleanliness - (diffMins * cleanlinessDecay));
        updatedPet.energy = Math.min(100, Math.max(0, pet.energy - (diffMins * energyDecay)));

        // Critical health decay if hunger is 0
        if (updatedPet.hunger === 0) {
            updatedPet.health = Math.max(0, pet.health - (diffMins * 0.2));
        }

        return updatedPet;
    }

    private static mapPet(data: any): PocketPet {
        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            species: data.species,
            level: data.level,
            experience: data.experience,
            health: data.health,
            hunger: data.hunger,
            happiness: data.happiness,
            cleanliness: data.cleanliness,
            energy: data.energy,
            isSleeping: data.is_sleeping,
            lastInteractionAt: data.last_interaction_at,
            createdAt: data.created_at
        };
    }

    private static mapPetToDB(pet: PocketPet): any {
        return {
            id: pet.id,
            user_id: pet.userId,
            name: pet.name,
            species: pet.species,
            level: pet.level,
            experience: pet.experience,
            health: pet.health,
            hunger: pet.hunger,
            happiness: pet.happiness,
            cleanliness: pet.cleanliness,
            energy: pet.energy,
            is_sleeping: pet.isSleeping,
            last_interaction_at: pet.lastInteractionAt,
            created_at: pet.createdAt
        };
    }
}
