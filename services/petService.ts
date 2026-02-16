import { Lumina } from '../types';
import { supabase } from './supabaseClient';
import { logger } from './logger'; // Leaving logger logic for other methods
import { BaseService } from './baseService';

export class PetService {
    private static CACHE_KEY = 'peutic_anima';

    static async getPet(userId: string): Promise<Lumina | null> {
        try {
            const cached = localStorage.getItem(`${this.CACHE_KEY}_${userId}`);

            // USE GATEWAY for secure access
            const data = await BaseService.invokeGateway('get-pet', { userId });

            if (data) {
                // Apply time-based decay
                const decayedAnima = this.calculateDecay(data);
                localStorage.setItem(`${this.CACHE_KEY}_${userId}`, JSON.stringify(decayedAnima));
                return decayedAnima;
            }

            if (cached) return JSON.parse(cached);
            return null;
        } catch (e) {
            console.error("Pet Fetch Error", e);
            return null;
        }
    }

    static async createPet(userId: string, name: string, species: Lumina['species']): Promise<Lumina> {
        // 1. Try to create
        const { data, error } = await supabase
            .from('pocket_pets')
            .insert({
                user_id: userId,
                name,
                species,
                level: 1,
                experience: 0,
                health: 100,
                hunger: 100,
                happiness: 100,
                cleanliness: 100,
                energy: 100,
                is_sleeping: false,
                last_interaction_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            // Handle Duplicate Key (User already has a pet)
            if (error.code === '23505') {
                logger.warn("Pet already exists for user, fetching existing...");
                const existing = await this.getPet(userId);
                if (existing) return existing;
            }

            logger.error("Failed to create pet", error);
            throw error || new Error("Failed to create pet record");
        }

        if (!data) throw new Error("No data returned from pet creation");

        const newPet = this.mapAnimaBase(data);
        localStorage.setItem(`${this.CACHE_KEY}_${userId}`, JSON.stringify(newPet));
        return newPet;
    }

    static async updatePet(anima: Lumina): Promise<void> {
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

    private static calculateDecay(anima: Lumina): Lumina {
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

    private static mapAnimaBase(data: any): Lumina {
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

    private static mapAnimaToDB(anima: Lumina): any {
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
