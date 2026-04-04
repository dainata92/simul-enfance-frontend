# 🧪 Guide de Test - Périscolaire Paris 2026

## ✅ Status : Frontend + Backend Opérationnels

**Backend** : http://localhost:8080  
**Frontend** : http://localhost:4200

---

## 🎯 Test Complet : Périscolaire Paris

### 1️⃣ Accéder au Calculateur
1. Ouvrez : **http://localhost:4200/calculator**
2. Vous devriez voir le formulaire de calcul

---

## 📋 Scénario de Test

### Famille Test : Couple avec 2 enfants
- **Revenus annuels N-2** : 60 000€
- **Nombre de parts** : 2.5 (couple + 2 enfants)
- **QF calculé** : 60000 ÷ 12 ÷ 2.5 = **2 000€**
- **Tranche attendue** : **T07** (1901€ - 2500€)
- **Prix unitaire T07** : **5,43€**

---

## ✅ Test 1 : Forfait 1 goûter/semaine

### Étapes :
1. **Ville** : Sélectionnez **Paris (75000)**
2. **Catégorie** : Cliquez sur **Périscolaire Maternelle**
3. **Type d'accueil** : Sélectionnez **Accueil du soir**
4. **Méthode de calcul** : Cliquez sur **"Je connais mes revenus annuels"**
5. **Revenus annuels N-2** : Entrez **60000**
6. **Nombre de parts** : Entrez **2.5**
7. **Vérifiez** : Le QF calculé doit afficher **2 000€**
8. **Forfait goûter** : Cliquez sur **1** (bouton avec "1 goûter")
9. **Calculer** : Cliquez sur le bouton bleu

### Résultat Attendu :
```
✅ Tarif mensuel : 5,43€
   1 goûter/semaine (sur 10 mois)
   
✅ Catégorie tarifaire : T07
```

---

## ✅ Test 2 : Forfait 3 goûters/semaine

### Étapes :
1. **Gardez les mêmes paramètres** (QF = 2000€)
2. **Forfait goûter** : Cliquez sur **3** (bouton avec "3 goûters")
3. **Calculer** à nouveau

### Résultat Attendu :
```
✅ Tarif mensuel : 16,29€
   3 goûters/semaine (sur 10 mois)
   
✅ Catégorie tarifaire : T07
```

**Vérification** : 5,43€ × 3 = **16,29€** ✅

---

## ✅ Test 3 : QF Faible (Plancher T01)

### Étapes :
1. **Ville** : Paris
2. **Catégorie** : Périscolaire Maternelle
3. **Type** : Accueil du soir
4. **QF** : Mode "Je connais mon QF" → Entrez **200**
5. **Forfait** : **4 goûters**
6. **Calculer**

### Résultat Attendu :
```
✅ Tarif mensuel : 2,16€
   4 goûters/semaine (sur 10 mois)
   
✅ Catégorie tarifaire : T01
```

**Vérification** : 0,54€ × 4 = **2,16€** ✅

---

## ✅ Test 4 : QF Élevé (Plafond T10)

### Étapes :
1. **QF** : **6000**
2. **Forfait** : **2 goûters**
3. **Calculer**

### Résultat Attendu :
```
✅ Tarif mensuel : 12,50€
   2 goûters/semaine (sur 10 mois)
   
✅ Catégorie tarifaire : T10
```

**Vérification** : 6,25€ × 2 = **12,50€** ✅

---

## 🔍 Points à Vérifier

### ✅ Interface
- [ ] Le sélecteur de forfait (1-4 goûters) s'affiche uniquement pour **Paris + Périscolaire**
- [ ] Les 4 boutons (1, 2, 3, 4 goûters) sont cliquables et visuellement actifs/inactifs
- [ ] Le message d'aide mentionne "sur 10 mois"
- [ ] Le résultat affiche "X goûter(s)/semaine (sur 10 mois)"
- [ ] La tranche tarifaire (T01-T10) est affichée
- [ ] Le tarif change proportionnellement au nombre de goûters

### ✅ Calcul QF
- [ ] Pour **Crèche** : QF = Revenus ÷ 12 (pas de division par parts)
- [ ] Pour **Périscolaire** : QF = (Revenus ÷ 12) ÷ Parties
- [ ] Le champ "Nombre de parts" est **caché** pour crèche
- [ ] Le champ "Nombre de parts" est **visible** pour périscolaire

### ✅ Calcul Tarif
- [ ] Forfait 1 goûter = Prix unitaire × 1
- [ ] Forfait 2 goûters = Prix unitaire × 2
- [ ] Forfait 3 goûters = Prix unitaire × 3
- [ ] Forfait 4 goûters = Prix unitaire × 4

---

## 📊 Tableau de Référence des Tranches

| QF          | Tranche | Prix unitaire (1 goûter) | ×2 goûters | ×3 goûters | ×4 goûters |
|-------------|---------|--------------------------|------------|------------|------------|
| ≤ 234€      | T01     | 0,54€                    | 1,08€      | 1,62€      | 2,16€      |
| 235-384€    | T02     | 1,08€                    | 2,16€      | 3,24€      | 4,32€      |
| 385-548€    | T03     | 2,38€                    | 4,76€      | 7,14€      | 9,52€      |
| 549-959€    | T04     | 3,34€                    | 6,68€      | 10,02€     | 13,36€     |
| 960-1370€   | T05     | 4,45€                    | 8,90€      | 13,35€     | 17,80€     |
| 1371-1900€  | T06     | 4,88€                    | 9,76€      | 14,64€     | 19,52€     |
| 1901-2500€  | T07     | 5,43€                    | 10,86€     | 16,29€     | 21,72€     |
| 2501-3333€  | T08     | 5,67€                    | 11,34€     | 17,01€     | 22,68€     |
| 3334-5000€  | T09     | 5,95€                    | 11,90€     | 17,85€     | 23,80€     |
| > 5000€     | T10     | 6,25€                    | 12,50€     | 18,75€     | 25,00€     |

---

## 🐛 Dépannage

### Le forfait goûter ne s'affiche pas
➡️ Vérifiez que :
- Vous avez sélectionné **Paris** (pas Le Perreux)
- Vous avez choisi **Périscolaire Maternelle**
- Le frontend a bien redémarré (Ctrl+Shift+R pour vider le cache)

### Le calcul est incorrect
➡️ Vérifiez :
- Le QF calculé (doit être visible sous le formulaire)
- La tranche tarifaire affichée (T01-T10)
- La formule : Tarif = Prix unitaire × Nombre de goûters

### Erreur "Aucune règle active"
➡️ Le backend n'a pas appliqué la migration V5 :
```bash
cd simul-enfance-backend
# Vérifier que Flyway est désactivé dans application.properties
# Redémarrer le backend
./mvnw spring-boot:run
```

---

## ✅ Checklist Finale

- [ ] Test 1 : Forfait 1 goûter (5,43€) → ✅
- [ ] Test 2 : Forfait 3 goûters (16,29€) → ✅
- [ ] Test 3 : Plancher T01 (2,16€) → ✅
- [ ] Test 4 : Plafond T10 (12,50€) → ✅
- [ ] Interface responsive et intuitive
- [ ] Messages d'aide clairs
- [ ] Calcul QF différent crèche vs périscolaire

---

**Date de test** : 26 mars 2026  
**Versions** : Angular 18 + Spring Boot 3.x + PostgreSQL 15
