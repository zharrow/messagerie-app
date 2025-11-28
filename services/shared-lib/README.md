# @microservices/shared-lib

Bibliothèque de code mutualisé pour l'architecture microservices.

## 📦 Installation

Cette bibliothèque est partagée entre tous les services via un lien local npm.

### Dans chaque service :

```bash
npm install file:../shared-lib
```

## 🛠️ Contenu

### Middlewares

#### `internalAuth`
Protection des routes internes (service-to-service communication).

```javascript
const { middlewares } = require('@microservices/shared-lib');

app.use('/internal', middlewares.internalAuth.internalOnly);
```

#### `logger`
Logging standardisé avec Morgan.

```javascript
const { middlewares } = require('@microservices/shared-lib');

app.use(middlewares.logger.getLogger('combined'));
```

### Utils

#### `response`
Helpers pour des réponses API standardisées.

```javascript
const { utils } = require('@microservices/shared-lib');

// Success response
utils.response.success(res, { user: userData }, 'User created', 201);

// Error response
utils.response.error(res, 'User not found', 404);

// Validation error
utils.response.validationError(res, [{ field: 'email', message: 'Invalid email' }]);
```

#### `constants`
Constantes partagées (codes HTTP, types de tokens, etc.).

```javascript
const { utils } = require('@microservices/shared-lib');

const { HTTP_STATUS, TOKEN_TYPES, USER_STATUS } = utils.constants;
```

### Validators

#### `email`
Validation et normalisation des emails.

```javascript
const { validators } = require('@microservices/shared-lib');

const result = validators.email.validateAndNormalize('Test@Example.com');
// { valid: true, email: 'test@example.com', error: null }
```

## 🎯 Avantages

- ✅ **Cohérence** : Même comportement dans tous les services
- ✅ **Maintenabilité** : Un seul endroit pour modifier le code partagé
- ✅ **DRY** : Don't Repeat Yourself - évite la duplication
- ✅ **Tests centralisés** : Tests une fois, utilisable partout
- ✅ **Évolutivité** : Facile d'ajouter de nouvelles utilitaires

## 📚 Structure

```
shared-lib/
├── middlewares/
│   ├── internalAuth.js    # Protection routes internes
│   └── logger.js          # Logging standardisé
├── utils/
│   ├── response.js        # Helpers de réponse API
│   └── constants.js       # Constantes partagées
├── validators/
│   └── email.js           # Validation emails
├── index.js               # Point d'entrée
├── package.json
└── README.md
```

## 🧪 Tests

```bash
npm test
```

## 📖 Documentation

Chaque fichier est auto-documenté avec JSDoc.
