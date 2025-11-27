# 🔐 Guide de Test - Chiffrement End-to-End (E2EE)

## ✅ Ce qui a été implémenté

Le chiffrement bout-en-bout est maintenant **FONCTIONNEL** ! Voici comment le tester.

## 🚀 Comment tester

### Prérequis
1. Tous les services doivent être en cours d'exécution :
```bash
docker-compose ps
# Vérifier que user-service, message-service, auth-service, frontend sont UP
```

2. Accéder à l'application : `http://localhost`

### Test avec 2 utilisateurs

#### Étape 1 : Créer deux comptes utilisateurs

**Utilisateur Alice :**
1. Ouvrir un navigateur (Chrome)
2. Aller sur `http://localhost`
3. S'inscrire avec :
   - Email: `alice@test.com`
   - Mot de passe: `Alice123` (au moins 8 caractères avec majuscule, minuscule et chiffre)
   - Prénom: `Alice`
   - Nom: `Dupont`

**Utilisateur Bob :**
1. Ouvrir un autre navigateur ou une fenêtre de navigation privée (Firefox/Edge)
2. Aller sur `http://localhost`
3. S'inscrire avec :
   - Email: `bob@test.com`
   - Mot de passe: `Bob12345`
   - Prénom: `Bob`
   - Nom: `Martin`

#### Étape 2 : Vérifier la génération des clés

1. Après connexion, ouvrir la **Console du navigateur** (F12)
2. Vérifier les logs :
   ```
   E2EE encryption initialized automatically
   ```
3. Vérifier dans **Application > Local Storage** :
   - `e2ee_private_key` : Clé privée (44 caractères base64)
   - `e2ee_public_key` : Clé publique (44 caractères base64)
   - `e2ee_device_id` : ID de l'appareil (22 caractères)
   - `e2ee_key_fingerprint` : Empreinte (64 caractères hex)

4. Dans le header du chat, vous devriez voir un **cadenas vert** 🔒

#### Étape 3 : Envoyer des messages chiffrés

**Depuis le compte d'Alice :**
1. Cliquer sur "+" pour créer une nouvelle conversation
2. Sélectionner "Bob Martin"
3. Envoyer un message : `"Bonjour Bob, ceci est un message chiffré !"`

**Observer :**
- Dans la console, vous devriez voir :
  ```
  [E2EE] Message chiffré envoyé par l'utilisateur 1 (appareil: xxx)
  ```
- Le message apparaît normalement dans le chat d'Alice

**Depuis le compte de Bob :**
1. La conversation avec Alice devrait apparaître
2. Cliquer sur la conversation
3. Le message devrait s'afficher **déchiffré** : `"Bonjour Bob, ceci est un message chiffré !"`

#### Étape 4 : Vérifier le chiffrement dans la base de données

**Vérifier que les messages sont réellement chiffrés en base :**

```bash
# Se connecter à MongoDB
docker-compose exec mongodb mongosh

# Dans mongosh
use messages_db
db.conversations.find().pretty()
```

**Vous devriez voir :**
```json
{
  "messages": [
    {
      "from": 1,
      "content": "[Chiffré]",
      "encrypted": true,
      "encryptedPayloads": {
        "2:device123": "base64EncryptedDataHere..."
      },
      "nonce": "randomNonceBase64...",
      "senderDeviceId": "aliceDevice123",
      "createdAt": "2025-11-25T..."
    }
  ]
}
```

**Points importants :**
- ✅ `encrypted: true` - Le message est chiffré
- ✅ `content: "[Chiffré]"` - Placeholder lisible par le serveur
- ✅ `encryptedPayloads` - Contient les données chiffrées par destinataire
- ✅ Le serveur **NE PEUT PAS** lire le contenu réel !

### Test avancé : Conversations de groupe

1. Alice crée un groupe avec Bob et Charlie (créer un 3ème compte)
2. Alice envoie : `"Message chiffré pour tout le groupe"`
3. Vérifier que Bob et Charlie peuvent tous deux déchiffrer le message
4. Dans MongoDB, vérifier qu'il y a **plusieurs encryptedPayloads** (un par destinataire)

## 🔍 Que vérifier

### ✅ Checklist de test

- [ ] **Génération des clés au login** - Vérifier localStorage
- [ ] **Badge de chiffrement** - Cadenas vert visible dans le header
- [ ] **Envoi de message chiffré** - Console log confirme le chiffrement
- [ ] **Réception et déchiffrement** - Le destinataire voit le message en clair
- [ ] **Stockage chiffré en BDD** - MongoDB montre les données chiffrées
- [ ] **Messages non-chiffrés toujours supportés** - Si un utilisateur n'a pas de clés
- [ ] **Conversations de groupe** - Chiffrement multiple fonctionne

### ❌ Problèmes connus / Limitations actuelles

1. **Édition de messages chiffrés** - Pas encore implémentée (message édité sera en clair)
2. **Recherche de messages** - Ne fonctionne que sur les messages non chiffrés
3. **Forward secrecy** - Pas encore implémenté (même clés pour tous les messages)
4. **Vérification de clés (Safety Numbers)** - UI pas encore créée
5. **Multi-device** - Chaque appareil génère sa propre clé (prévu dans le design)

## 🛠️ Debug

### Si les messages ne se déchiffrent pas :

1. **Vérifier les clés dans localStorage**
   ```javascript
   console.log(localStorage.getItem('e2ee_public_key'));
   console.log(localStorage.getItem('e2ee_private_key'));
   ```

2. **Vérifier les logs de la console**
   - Erreurs de chiffrement/déchiffrement ?
   - Clés publiques récupérées ?

3. **Vérifier les appels API**
   - Network tab > `/users/keys/bulk` devrait retourner les clés publiques
   - `/users/keys` devrait envoyer la clé publique au login

4. **Forcer la régénération des clés**
   ```javascript
   // Dans la console
   localStorage.clear();
   // Se reconnecter
   ```

### Logs utiles à surveiller :

**Frontend (Console navigateur) :**
```
E2EE encryption initialized automatically
[E2EE] Clés générées pour l'utilisateur
Clés de chiffrement non disponibles  // ⚠️ Problème !
```

**Backend (Docker logs) :**
```bash
docker-compose logs message-service -f
# Chercher :
[E2EE] Message chiffré envoyé par l'utilisateur X (appareil: Y)
```

**User Service logs :**
```bash
docker-compose logs user-service -f
# Vérifier :
User keys table initialized
```

## 📊 Métriques de sécurité

### Ce qui est sécurisé :
✅ **Contenu des messages** - Chiffré avec Curve25519
✅ **Authentification** - Signatures cryptographiques intégrées
✅ **Intégrité** - Détection automatique de falsification
✅ **Confidentialité** - Le serveur ne peut pas lire les messages

### Ce qui n'est PAS chiffré (métadonnées) :
❌ Horodatages des messages
❌ Liste des participants
❌ Réactions emoji
❌ Accusés de lecture
❌ Indicateurs de frappe

## 🎯 Prochaines améliorations recommandées

1. **Safety Numbers UI** - Interface de vérification des empreintes de clés
2. **Forward Secrecy** - Rotation automatique des clés de session
3. **Encrypted Search** - Indexation chiffrée côté client
4. **Backup/Export des clés** - Sauvegarde sécurisée
5. **Message requests** - Protection contre le spam
6. **Sealed Sender** - Anonymisation de l'expéditeur

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifier cette checklist
2. Consulter les logs Docker
3. Nettoyer localStorage et réessayer
4. Vérifier que tous les services sont UP

---

**Félicitations ! Vous avez maintenant un système de messagerie avec chiffrement bout-en-bout fonctionnel ! 🎉🔒**
