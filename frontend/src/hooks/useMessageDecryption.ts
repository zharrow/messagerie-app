import { useState } from 'react';
import { encryptionService } from '@/services/encryption';
import { userApi } from '@/services/api';

interface DecryptedMessageCache {
  [messageId: string]: string;
}

interface SenderPublicKeyCache {
  [key: string]: string;
}

/**
 * Hook pour gérer le déchiffrement des messages
 * Cache les messages déchiffrés et les clés publiques
 */
export const useMessageDecryption = (userId: number | undefined) => {
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessageCache>({});
  const [senderKeys, setSenderKeys] = useState<SenderPublicKeyCache>({});

  /**
   * Récupérer la clé publique d'un expéditeur spécifique (par deviceId)
   */
  const getSenderPublicKey = async (senderId: number, senderDeviceId?: string): Promise<string | null> => {
    // Créer une clé de cache unique par userId:deviceId
    const cacheKey = senderDeviceId ? `${senderId}:${senderDeviceId}` : `${senderId}`;

    // Vérifier le cache
    if (senderKeys[cacheKey]) {
      console.log(`[E2EE] Clé publique trouvée en cache pour ${cacheKey}`);
      return senderKeys[cacheKey];
    }

    try {
      console.log(`[E2EE] Récupération de la clé publique pour user ${senderId}, device: ${senderDeviceId || 'any'}`);
      const response = await userApi.getUserPublicKeys(senderId);
      console.log(`[E2EE] Response:`, response);
      const { keys } = response;

      if (keys && keys.length > 0) {
        let publicKey: string | null = null;

        // Si on a un senderDeviceId, chercher la clé correspondante
        if (senderDeviceId) {
          const matchingKey = keys.find((k: any) => k.device_id === senderDeviceId);
          if (matchingKey) {
            publicKey = matchingKey.public_key;
            console.log(`[E2EE] ✓ Clé publique trouvée pour device ${senderDeviceId}:`, publicKey?.substring(0, 10) + '...');
          } else {
            console.warn(`[E2EE] ⚠️ Aucune clé trouvée pour device ${senderDeviceId}, utilisation de la première clé disponible`);
            publicKey = keys[0].public_key || null;
          }
        } else {
          // Pas de deviceId spécifié, prendre la première clé
          publicKey = keys[0].public_key || null;
          console.log(`[E2EE] Clé publique (première) trouvée:`, publicKey?.substring(0, 10) + '...');
        }

        if (publicKey) {
          setSenderKeys((prev: SenderPublicKeyCache) => ({ ...prev, [cacheKey]: publicKey }));
          return publicKey;
        }
      } else {
        console.error(`[E2EE] ✗ Aucune clé trouvée pour user ${senderId}. Keys:`, keys);
      }
    } catch (error) {
      console.error(`[E2EE] ✗ Erreur lors de la récupération de la clé publique pour l'utilisateur ${senderId}:`, error);
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
        console.error('[E2EE] Clés de déchiffrement non disponibles');
        const errorMsg = '[Message chiffré - Clés manquantes]';
        setDecryptedMessages((prev: DecryptedMessageCache) => ({
          ...prev,
          [message._id]: errorMsg
        }));
        return errorMsg;
      }

      // Récupérer la clé publique de l'expéditeur en utilisant son deviceId
      const senderDeviceId = message.senderDeviceId;
      console.log(`[E2EE] Déchiffrement message de user ${message.from}, device: ${senderDeviceId}`);

      const senderPublicKey = await getSenderPublicKey(message.from, senderDeviceId);
      if (!senderPublicKey) {
        console.error('[E2EE] Clé publique de l\'expéditeur introuvable');
        const errorMsg = '[Message chiffré - Clé expéditeur manquante]';
        setDecryptedMessages((prev: DecryptedMessageCache) => ({
          ...prev,
          [message._id]: errorMsg
        }));
        return errorMsg;
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
        setDecryptedMessages((prev: DecryptedMessageCache) => ({
          ...prev,
          [message._id]: decryptedContent
        }));
        return decryptedContent;
      } else {
        console.error('[E2EE] Échec du déchiffrement');
        const errorMsg = '[Message chiffré - Échec du déchiffrement]';
        setDecryptedMessages((prev: DecryptedMessageCache) => ({
          ...prev,
          [message._id]: errorMsg
        }));
        return errorMsg;
      }
    } catch (error) {
      console.error('[E2EE] Erreur lors du déchiffrement:', error);
      const errorMsg = '[Message chiffré - Erreur]';
      setDecryptedMessages((prev: DecryptedMessageCache) => ({
        ...prev,
        [message._id]: errorMsg
      }));
      return errorMsg;
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

    // Si le message est déjà déchiffré ou en erreur, le retourner
    if (decryptedMessages[message._id]) {
      return decryptedMessages[message._id];
    }

    // Sinon, déclencher le déchiffrement de manière asynchrone
    // Le cache sera mis à jour par decryptMessage (succès ou erreur)
    decryptMessage(message).then(content => {
      if (content) {
        console.log(`[E2EE] Message ${message._id} traité:`, content.substring(0, 30) + '...');
      }
    }).catch(err => {
      console.error('[E2EE] Erreur lors du déchiffrement automatique:', err);
      // Failsafe: mettre en cache si decryptMessage n'a pas pu le faire
      setDecryptedMessages((prev: DecryptedMessageCache) => ({
        ...prev,
        [message._id]: '[Message chiffré - Erreur technique]'
      }));
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
    setDecryptedMessages((prev: DecryptedMessageCache) => {
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
