/**
 * Supabase Client Configuration
 *
 * ⚠️ CE FICHIER EST UN EXEMPLE POUR LE DÉPLOIEMENT VERCEL
 *
 * Pour utiliser Supabase (déploiement cloud) :
 * 1. Renommer ce fichier en `supabase.ts`
 * 2. Installer la dépendance : npm install @supabase/supabase-js
 * 3. Configurer les variables d'environnement dans .env.local :
 *    - VITE_SUPABASE_URL=https://xxxxx.supabase.co
 *    - VITE_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * Pour Docker (développement local) :
 * Ce fichier n'est PAS nécessaire. L'API utilise les microservices.
 */

import { createClient } from '@supabase/supabase-js';

// Variables d'environnement Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Using local development mode.');
}

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'OvO-Messaging'
    }
  }
});

// Type helpers pour les tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          first_name: string | null;
          last_name: string | null;
          profile_photo_url: string | null;
          bio: string | null;
          status: 'online' | 'offline' | 'busy' | 'away';
          status_message: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          from_user_id: number;
          content: string | null;
          encrypted: boolean;
          encrypted_payloads: any | null;
          nonce: string | null;
          sender_device_id: string | null;
          reply_to_id: string | null;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
};

// Helper functions
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Database['public']['Tables']['messages']['Row']) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload: any) => {
        callback(payload.new as Database['public']['Tables']['messages']['Row']);
      }
    )
    .subscribe();
};

export const subscribeToReactions = (
  conversationId: string,
  callback: (reaction: any) => void
) => {
  return supabase
    .channel(`reactions:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      },
      (payload: any) => {
        callback(payload);
      }
    )
    .subscribe();
};

export const subscribeToUserStatus = (
  userId: number,
  callback: (user: Database['public']['Tables']['users']['Row']) => void
) => {
  return supabase
    .channel(`user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload: any) => {
        callback(payload.new as Database['public']['Tables']['users']['Row']);
      }
    )
    .subscribe();
};

// Export du client par défaut
export default supabase;
