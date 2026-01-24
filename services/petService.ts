import { Anima } from '../types';
import { supabase } from './supabaseClient';
import { logger } from './logger';

export class PetService {
    private static CACHE_KEY = 'peutic_anima';

    static async getPet(userId: string): Promise<Anima | null> {
        try {
            const cached = localStorage.getItem(`${this.CACHE_KEY}_${userId}`);

            const { data, error } = await supabase
                .from('pocket_pets')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error("Error fetching anima:", error);
            }

            if (data) {
                const anima = this.mapAnimaBase(data);
                // Apply time-based decay
                const decayedAnima = this.calculateDecay(anima);
                localStorage.setItem(`${this.CACHE_KEY}_${userId}`, JSON.stringify(decayedAnima));
                return decayedAnima;
            }

            if (cached) return JSON.parse(cached);
            return null;
        } catch (e) {
            return null;
        }
    }

    static async createPet(userId: string, name: string, species: Anima['species']): Promise<Anima> {
        const newAnima: Partial<Anima> = {
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

        const { error } = await supabase.from('pocket_pets').insert(this.mapAnimaToDB(newAnima as Anima));
        if (error) {
            logger.error("Create Anima Failed", userId, error);
            throw error;
        }

        return newAnima as Anima;
    }

    static async updatePet(anima: Anima): Promise<void> {
        const { error } = await supabase
            .from('pocket_pets')
            .update(this.mapAnimaToDB(anima))
            .eq('id', anima.id);

        if (error) {
            logger.error("Update Anima Failed", anima.id, error);
        } else {
            localStorage.setItem(`${this.CACHE_KEY}_${anima.userId}`, JSON.stringify(anima));
        }
    }

    private static calculateDecay(anima: Anima): Anima {
        const now = new Date();
        const last = new Date(anima.lastInteractionAt);
        const diffMs = now.getTime() - last.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 5) return anima; // No decay for very short intervals

        // Decay rates per minute
        const hungerDecay = 0.1;
        const happinessDecay = 0.05;
        const cleanlinessDecay = 0.03;
        const energyDecay = anima.isSleeping ? -0.5 : 0.08; // Energy increases if sleeping

        const updatedAnima = { ...anima };
        updatedAnima.hunger = Math.max(0, anima.hunger - (diffMins * hungerDecay));
        updatedAnima.happiness = Math.max(0, anima.happiness - (diffMins * happinessDecay));
        updatedAnima.cleanliness = Math.max(0, anima.cleanliness - (diffMins * cleanlinessDecay));
        updatedAnima.energy = Math.min(100, Math.max(0, anima.energy - (diffMins * energyDecay)));

        // Critical health decay if hunger is 0
        if (updatedAnima.hunger === 0) {
            updatedAnima.health = Math.max(0, anima.health - (diffMins * 0.2));
        }

        return updatedAnima;
    }

    private static mapAnimaBase(data: any): Anima {
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

    private static mapAnimaToDB(anima: Anima): any {
        return {
            id: anima.id,
            user_id: anima.userId,
            name: anima.name,
            species: anima.species,
            level: anima.level,
            experience: anima.experience,
            health: anima.health,
            hunger: anima.hunger,
            happiness: anima.happiness,
            cleanliness: anima.cleanliness,
            energy: anima.energy,
            is_sleeping: anima.isSleeping,
            last_interaction_at: anima.lastInteractionAt,
            created_at: anima.createdAt
        };
    }
}
