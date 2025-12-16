# End-to-End Encryption (E2EE) - Documentation

## 🔐 Vue d'ensemble

Cette application utilise le chiffrement de bout en bout (E2EE) pour sécuriser les messages. Seuls l'expéditeur et le(s) destinataire(s) peuvent lire le contenu des messages.

## 🛠️ Architecture technique

### Technologies
- **Bibliothèque** : TweetNaCl (NaCl - Networking and Cryptography library)
- **Algorithme** : Curve25519 (elliptic curve cryptography)
- **Chiffrement** : NaCl box (authenticated public-key encryption)
- **Taille de clés** : 256 bits (32 bytes, 44 caractères en base64)

### Composants
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   User Service   │────▶│   PostgreSQL    │
│  (Browser)      │     │  (Public Keys)   │     │  (user_keys)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │ Encrypted
        ▼
┌─────────────────┐     ┌─────────────────────────────────────────┐
│ Message Service │────▶│            MongoDB                      │
│  (Store only)   │     │  (encrypted messages + metadata)        │
└─────────────────┘     └─────────────────────────────────────────┘
```

## 🔑 Gestion des clés

### Génération (lors du premier login)
1. Une paire de clés est générée **côté client** (navigateur)
2. **Clé privée** : Stockée dans `localStorage` (ne quitte JAMAIS le navigateur)
3. **Clé publique** : Envoyée au User Service et stockée en BDD
4. **Device ID** : Identifiant unique pour chaque navigateur/device

### Multi-device
Chaque appareil/navigateur a son propre triplet : `(deviceId, publicKey, privateKey)`

**Exemple** :
- Safari sur Mac : `deviceId: "abc123"`
- Chrome sur Mac : `deviceId: "def456"`
- Firefox sur Windows : `deviceId: "ghi789"`

## 📨 Flux de chiffrement

### Envoi d'un message

```javascript
// 1. Récupérer TOUTES les clés publiques des participants
const recipientKeys = {
  "4": [  // User ID 4
    {device_id: "safari123", public_key: "ABC..."},
    {device_id: "chrome456", public_key: "DEF..."}
  ],
  "7": [  // User ID 7
    {device_id: "firefox789", public_key: "GHI..."}
  ]
}

// 2. Chiffrer le message POUR CHAQUE device
encryptedPayloads: {
  "4:safari123": "encrypted_data_for_safari",
  "4:chrome456": "encrypted_data_for_chrome",
  "7:firefox789": "encrypted_data_for_firefox"
}

// 3. Envoyer au serveur (qui ne peut PAS déchiffrer)
```

### Réception d'un message

```javascript
// 1. Récupérer le payload pour MON device
const myPayload = encryptedPayloads[`${userId}:${myDeviceId}`];

// 2. Récupérer la clé publique de l'expéditeur (par son deviceId)
const senderPublicKey = await getUserPublicKey(senderId, senderDeviceId);

// 3. Déchiffrer avec MA clé privée + clé publique de l'expéditeur
const decrypted = nacl.box.open(
  encryptedPayload,
  nonce,
  senderPublicKey,
  myPrivateKey
);
```

## ⚠️ Limitations connues

### 1. Historique sur nouveaux devices
**Comportement** : Les nouveaux devices ne peuvent pas lire les anciens messages.

**Pourquoi ?**
- Un message est chiffré pour les devices existants **au moment de l'envoi**
- Un nouveau device n'a pas de payload dans les anciens messages
- C'est identique à Signal/WhatsApp/Telegram

**Solution** : Les nouveaux messages seront lisibles automatiquement.

### 2. Recherche limitée
**Limitation** : Le serveur ne peut pas indexer les messages chiffrés.

**Impact** : La recherche full-text ne fonctionne que sur les messages non chiffrés.

**Alternative** : Recherche côté client (plus lent, mais fonctionne).

### 3. Métadonnées non chiffrées
**Non chiffré** :
- Timestamps des messages
- Réactions (emojis)
- Read receipts
- Typing indicators
- Noms de groupes

**Pourquoi ?** : Nécessaire pour le fonctionnement de l'UI et les notifications.

## 🔧 Choix techniques justifiés

### Pourquoi TweetNaCl ?
✅ **Audité** : Bibliothèque crypto réputée et auditée
✅ **Simple** : API claire et difficile à mal utiliser
✅ **Performant** : Optimisé pour JavaScript
✅ **Léger** : ~7KB minifié

### Pourquoi stocker les clés privées dans localStorage ?
✅ **Persistence** : Évite de régénérer les clés à chaque session
✅ **Standard web** : Pas besoin de backend supplémentaire
⚠️ **Risque** : Vulnérable aux XSS (mais c'est un risque accepté)

**Alternative** : IndexedDB (plus complexe, mêmes risques XSS).

### Pourquoi chiffrer pour chaque device ?
✅ **Forward secrecy** : La compromission d'un device n'affecte pas les autres
✅ **Révocation** : On peut désactiver un device compromis
✅ **Scalabilité** : Support natif de N devices par utilisateur

## 🚀 Améliorations futures

### Court terme
- [ ] Indicateur visuel de chiffrement (🔒 badge)
- [ ] Safety numbers (vérification des clés entre utilisateurs)
- [ ] Gestion des devices (liste + révocation)

### Moyen terme
- [ ] Chiffrement des fichiers attachés
- [ ] Recherche côté client pour messages chiffrés
- [ ] Rotation des clés

### Long terme
- [ ] Backup chiffré (export/import des clés)
- [ ] Perfect Forward Secrecy (Double Ratchet Algorithm comme Signal)
- [ ] Synchronisation sécurisée entre devices

## 📝 Maintenance

### Base de données

**Table : `user_keys`**
```sql
CREATE TABLE user_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,          -- 44 caractères base64
  key_fingerprint VARCHAR(255) NOT NULL,  -- 64 caractères hex
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);
```

**Nettoyage recommandé** :
- Désactiver les devices inactifs > 90 jours
- Supprimer les clés désactivées > 1 an

### localStorage

**Clés stockées** :
- `e2ee_private_key` : Clé privée (44 caractères)
- `e2ee_public_key` : Clé publique (44 caractères)
- `e2ee_device_id` : Device ID (22 caractères)
- `e2ee_key_fingerprint` : Empreinte (64 caractères hex)

**⚠️ Ne JAMAIS logger ou exposer `e2ee_private_key` !**

## 🐛 Debugging

### Logs de diagnostic
Tous les logs E2EE commencent par `[E2EE]` ou `[DECRYPT]`.

**Activer les logs détaillés** (déjà présents) :
- Chargement des clés
- Chiffrement/déchiffrement
- Longueur des clés (validation)
- Erreurs détaillées

### Problèmes courants

**Message reste "[Déchiffrement en cours...]"**
- Vérifier dans la console : erreur de clé publique introuvable
- Solution : Régénérer les clés (déconnexion puis reconnexion)

**"Decryption failed - authentication failed"**
- Cause : Clé publique de l'expéditeur incorrecte
- Vérifier que `senderDeviceId` correspond à une clé en BDD
- Vérifier les logs `[DECRYPT]` pour voir les payloads disponibles

## 📚 Références

- [NaCl Crypto Library](https://nacl.cr.yp.to/)
- [TweetNaCl.js](https://github.com/dchest/tweetnacl-js)
- [Signal Protocol](https://signal.org/docs/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
