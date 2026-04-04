# 🎯 Simul'Enfance Frontend

Application web Angular pour simuler et calculer les tarifs des services périscolaires municipaux (cantine, accueil périscolaire, centre de loisirs).

## 📋 Description

Simul'Enfance permet aux familles de :
- Calculer les tarifs des services périscolaires en fonction de leur quotient familial
- Sauvegarder et gérer plusieurs simulations
- Consulter l'historique de leurs calculs
- Gérer leur profil utilisateur

## 🚀 Technologies

- **Framework** : Angular 19.2
- **UI** : TailwindCSS 4.x
- **Authentification** : JWT via intercepteurs HTTP
- **Routing** : Guards pour la protection des routes
- **Build** : Angular CLI

## 📦 Installation

### Prérequis
- Node.js 18+ et npm
- Backend Simul'Enfance lancé sur `http://localhost:8080`

### Étapes

```bash
# Cloner le repository
git clone https://github.com/dainata92/simul-enfance-frontend.git
cd simul-enfance-frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

L'application sera accessible sur `http://localhost:4200/`

## 🛠️ Scripts disponibles

```bash
npm start          # Lance le serveur de développement (ng serve)
npm run build      # Build de production dans dist/
npm test           # Exécute les tests unitaires (Karma/Jasmine)
npm run watch      # Build en mode watch
```

## 📁 Structure du projet

```
src/
├── app/
│   ├── components/        # Composants de l'application
│   │   ├── calculator/    # Calculateur de tarifs
│   │   ├── dashboard/     # Dashboard utilisateur
│   │   ├── login/         # Page de connexion
│   │   ├── signup/        # Page d'inscription
│   │   ├── admin-dashboard/ # Dashboard admin
│   │   └── user-profile/  # Profil utilisateur
│   ├── services/          # Services (API calls)
│   │   ├── auth.service.ts      # Gestion authentification JWT
│   │   └── pricing.service.ts   # API calcul tarifs
│   ├── guards/            # Guards de routing
│   │   ├── auth.guard.ts        # Vérification authentification
│   │   └── role.guard.ts        # Contrôle des rôles
│   ├── interceptors/      # Intercepteurs HTTP
│   │   └── auth.interceptor.ts  # Injection token JWT
│   └── environments/      # Configuration par environnement
└── styles.css             # Styles globaux TailwindCSS
```

## 🔐 Authentification

L'application utilise JWT (JSON Web Tokens) :
- Le token est stocké dans `localStorage`
- Un intercepteur HTTP ajoute automatiquement le header `Authorization: Bearer <token>`
- Les guards protègent les routes nécessitant une authentification

## 🌐 Endpoints API

Le frontend communique avec le backend via :
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/calculate` - Calcul de tarifs
- `GET /api/simulations` - Liste des simulations
- `POST /api/simulations` - Créer une simulation
- `GET /api/user/profile` - Profil utilisateur

## 🎨 Personnalisation TailwindCSS

Configuration dans `tailwind.config.js` :
- Couleurs personnalisées
- Typographie
- Breakpoints responsive

## 📝 Développement

### Générer un composant
```bash
ng generate component components/mon-composant
```

### Générer un service
```bash
ng generate service services/mon-service
```

## 🚢 Déploiement

### Build de production
```bash
npm run build
```

Les fichiers compilés seront dans `dist/simul-enfance-frontend/`

### Déploiement recommandé
- **Vercel** : `vercel --prod`
- **Netlify** : Drag & drop du dossier `dist/`
- **GitHub Pages** : Via Angular CLI

## 🔗 Liens

- **Backend** : [simul-enfance-backend](https://github.com/dainata92/simul-enfance-backend)
- **Documentation Angular** : https://angular.dev

## 👥 Auteur

Développé pour la soutenance - Simul'Enfance

## 📄 Licence

Projet académique

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# simul-enfance-frontend
