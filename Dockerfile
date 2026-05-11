# ====================================
# ÉTAPE 1 : BUILD avec Node.js
# ====================================
FROM node:20-alpine AS build

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source
COPY . .

# Build de production Angular
RUN npm run build -- --configuration production

# ====================================
# ÉTAPE 2 : NGINX (Serveur web)
# ====================================
FROM nginx:alpine

# Copie des fichiers buildés depuis l'étape 1
COPY --from=build /app/dist/simul-enfance-frontend/browser /usr/share/nginx/html

# Configuration Nginx personnalisée pour Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
