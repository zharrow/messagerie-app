import { useState } from 'react';
import { encryptionService } from '@/services/encryption';
import { userApi } from '@/services/api';

interface DecryptedMessageCache {
  [messageId: string]: string;
}

interface SenderPublicKeyCache {
  [userId: number]: string;
}

/**
 * Hook pour gérer le déchiffrement des messages
 * Cache les messages déchiffrés et les clés publiques
 */
export const useMessageDecryption = (userId: number | undefined) => {
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessageCache>({});
  const [senderKeys, setSenderKeys] = useState<SenderPublicKeyCache>({});

  /**
   * Récupérer la clé publique d'un expéditeur
   */
  const getSenderPublicKey = async (senderId: number): Promise<string | null> => {
    // Vérifier le cache
    if (senderKeys[senderId]) {
      return senderKeys[senderId];
    }

    try {
      const { keys } = await userApi.getUserPublicKeys(senderId);
      if (keys && keys.length > 0) {
        const publicKey = keys[0].public_key;
        setSenderKeys(prev => ({ ...prev, [senderId]: publicKey }));
        return publicKey;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération de la clé publique pour l'utilisateur ${senderId}:`, error);
    }

    return null;
  };

  /**
   * Déchiffrer un message
   */
  const decryptMessage = async (message: any): Promise<string | null> => {
    if (!message.encrypted || !userId) {
      return message.content; // Message non chiffré
    }

    // Vérifier le cache
    if (decryptedMessages[message._id]) {
      return decryptedMessages[message._id];
    }

    try {
      // Récupérer les clés de l'utilisateur actuel
      const keyPair = encryptionService.loadKeyPair();
      if (!keyPair) {
        console.error('Clés de déchiffrement non disponibles');
        return '[Message chiffré - Clés manquantes]';
      }

      // Récupérer la clé publique de l'expéditeur
      const senderPublicKey = await getSenderPublicKey(message.from);
      if (!senderPublicKey) {
        console.error('Clé publique de l\'expéditeur introuvable');
        return '[Message chiffré - Clé expéditeur manquante]';
      }

      // Déchiffrer le message
      const decryptedContent = encryptionService.decryptMessage(
        message,
        userId,
        keyPair.deviceId,
        keyPair.privateKey,
        senderPublicKey
      );

      if (decryptedContent) {
        // Mettre en cache
        setDecryptedMessages(prev => ({
          ...prev,
          [message._id]: decryptedContent
        }));
        return decryptedContent;
      } else {
        console.error('Échec du déchiffrement');
        return '[Message chiffré - Échec du déchiffrement]';
      }
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      return '[Message chiffré - Erreur]';
    }
  };

  /**
   * Déchiffrer plusieurs messages
   */
  const decryptMessages = async (messages: any[]): Promise<Map<string, string>> => {
    const results = new Map<string, string>();

    for (const message of messages) {
      const content = await decryptMessage(message);
      if (content) {
        results.set(message._id, content);
      }
    }

    return results;
  };

  /**
   * Obtenir le contenu d'un message (déchiffré ou non)
   * Déclenche le déchiffrement automatiquement si nécessaire
   */
  const getMessageContent = (message: any): string => {
    if (!message.encrypted) {
      return message.content;
    }

    // Si le message est déjà déchiffré, le retourner
    if (decryptedMessages[message._id]) {
      return decryptedMessages[message._id];
    }

    // Sinon, déclencher le déchiffrement de manière asynchrone
    decryptMessage(message).then(content => {
      if (content && content !== decryptedMessages[message._id]) {
        // Le résultat sera mis en cache et déclenchera un re-render
        console.log(`Message ${message._id} déchiffré:`, content.substring(0, 50));
      }
    }).catch(err => {
      console.error('Erreur lors du déchiffrement automatique:', err);
    });

    return '[Déchiffrement en cours...]';
  };

  /**
   * Nettoyer le cache
   */
  const clearCache = () => {
    setDecryptedMessages({});
    setSenderKeys({});
  };

  /**
   * Invalider le cache d'un message spécifique
   * Utile lors de l'édition d'un message
   */
  const invalidateMessageCache = (messageId: string) => {
    setDecryptedMessages(prev => {
      const newCache = { ...prev };
      delete newCache[messageId];
      return newCache;
    });
  };

  return {
    decryptMessage,
    decryptMessages,
    getMessageContent,
    clearCache,
    invalidateMessageCache,
    decryptedMessages,
  };
};

export default useMessageDecryption;
