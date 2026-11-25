# AlgoStudio — IDE d'Algorithmique & Bac Informatique

Application bureau Windows (`.exe`) et Web pour les élèves du Bac Informatique (convention officielle tunisienne sans bloc `Variables`, TDO automatique, 12 chapitres du Guide, 27 modules prêts à exécuter, et 921 sujets Bac officiels de `kiteb.net` 2006–2026).

---

## Commandes principales

```bash
npm run dev          # Lancer en mode développement (http://localhost:5173)
npm test             # Lancer les 50 tests automatisés
npm run build        # Compiler la version web (dist/)
npm run clean        # Nettoyer dist/ et release/
npm run build:exe    # Compiler les exécutables Windows (release/)
```

---

## Comment activer les Mises à Jour Automatiques (Auto-Update)

AlgoStudio intègre **`electron-updater`** : une fois configuré, **chaque utilisateur ayant installé `AlgoStudio-Setup-*.exe` reçoit automatiquement toutes vos nouvelles versions** au démarrage sans que vous ayez à renvoyer un nouveau `.exe`.

### Configuration (1 seule fois)
1. Créez un dépôt GitHub public (ex : `github.com/VOTRE_COMPTE/algostudio`).
2. Dans `package.json`, remplacez `"VOTRE_COMPTE_GITHUB"` par votre vrai nom d'utilisateur GitHub :
   ```json
   "publish": [
     {
       "provider": "github",
       "owner": "VOTRE_COMPTE_GITHUB",
       "repo": "algostudio"
     }
   ]
   ```
3. Envoyez le projet sur GitHub (`git push`).

### Publier une nouvelle mise à jour pour tout le monde
À chaque modification :
1. Incrémentez `"version"` dans `package.json` (ex : `"1.4.0"` → `"1.5.0"`).
2. Créez un tag et poussez-le :
   ```bash
   git add .
   git commit -m "Release v1.5.0"
   git tag v1.5.0
   git push origin main --tags
   ```
3. **GitHub Actions** (`.github/workflows/release.yml`) compile automatiquement `AlgoStudio-Setup-1.5.0.exe`, `.blockmap` et `latest.yml` puis publie la release.
4. À l'ouverture suivante, **l'application AlgoStudio de tous vos utilisateurs détecte, télécharge et propose automatiquement l'installation en 1 clic** !

> **Astuce :** Vous pouvez aussi héberger le dossier `dist/` sur Vercel, Netlify ou Cloudflare Pages pour une version Web toujours à jour instantanément.
