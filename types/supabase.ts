export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string | null
                    role: 'USER' | 'ADMIN'
                    balance: number
                    subscription_status: string
                    created_at: string
                    last_login_date: string | null
                    streak: number
                    provider: string
                    avatar_url: string | null
                    avatar_locked: boolean
                    email_preferences: Json
                    theme_preference: string
                    language_preference: string
                    game_scores: Json
                    unlocked_rooms: string[]
                    unlocked_decor: string[] | null
                    birthday: string | null
                    metadata: Json
                }
                Insert: {
                    id: string
                    email: string
                    name?: string | null
                    role?: 'USER' | 'ADMIN'
                    balance?: number
                    subscription_status?: string
                    created_at?: string
                    last_login_date?: string | null
                    streak?: number
                    provider?: string
                    avatar_url?: string | null
                    avatar_locked?: boolean
                    email_preferences?: Json
                    theme_preference?: string
                    language_preference?: string
                    game_scores?: Json
                    unlocked_rooms?: string[]
                    unlocked_decor?: string[] | null
                    birthday?: string | null
                    metadata?: Json
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string | null
                    role?: 'USER' | 'ADMIN'
                    balance?: number
                    subscription_status?: string
                    created_at?: string
                    last_login_date?: string | null
                    streak?: number
                    provider?: string
                    avatar_url?: string | null
                    avatar_locked?: boolean
                    email_preferences?: Json
                    theme_preference?: string
                    language_preference?: string
                    game_scores?: Json
                    unlocked_rooms?: string[]
                    unlocked_decor?: string[] | null
                    birthday?: string | null
                    metadata?: Json
                }
            }
            user_art: {
                Row: {
                    id: string
                    user_id: string
                    image_url: string
                    title: string | null
                    prompt: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    image_url: string
                    title?: string | null
                    prompt?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    image_url?: string
                    title?: string | null
                    prompt?: string | null
                    created_at?: string
                }
            }
            journals: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    date: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    date?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    date?: string
                }
            }
            global_settings: {
                Row: {
                    id: number
                    price_per_minute: number
                    sale_mode: boolean
                    allow_signups: boolean
                    site_name: string
                    broadcast_message: string | null
                    dashboard_broadcast_message: string | null
                    max_concurrent_sessions: number
                    multilingual_mode: boolean
                    maintenance_mode: boolean
                }
            }
        }
    }
}
