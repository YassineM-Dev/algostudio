# AlgoStudio — IDE d'Algorithmique & Bac Informatique

Application bureau Windows (`.exe`) pour les élèves du **Bac Informatique Tunisien** :
- Exécution en temps réel du pseudocode (convention officielle tunisienne sans bloc `Variables`), **TDO** et **Trace** automatiques
- Éditeur complet (multi-onglets, symboles `← ≠ ≤ ≥ @ À É`, conversion `Auto`, bouton activer/désactiver `Complétion`, **Mode Clair / Mode Sombre**)
- **12 chapitres** du Guide Complet d'Algorithmique + PDF intégré
- **27 modules standards** prêts à exécuter
- **921 sujets Bac officiels** (`kiteb.net`, 2006–2026)

---

## Télécharger AlgoStudio (Windows `.exe`)

Cliquez directement sur l'un des boutons ci-dessous pour télécharger la **dernière version** :

<p>
  <a href="https://github.com/King-Joyboy/algostudio/releases/latest/download/AlgoStudio-Setup.exe">
    <img src="https://img.shields.io/badge/T%C3%A9l%C3%A9charger_AlgoStudio-Setup_(.exe)_%E2%80%A2_Auto--Update-E50914?style=for-the-badge&logo=windows&logoColor=white" alt="Télécharger AlgoStudio Setup (.exe)" />
  </a>
  &nbsp;
  <a href="https://github.com/King-Joyboy/algostudio/releases/latest/download/AlgoStudio-Portable.exe">
    <img src="https://img.shields.io/badge/T%C3%A9l%C3%A9charger_AlgoStudio-Portable_(.exe)_%E2%80%A2_Sans_installation-1F2937?style=for-the-badge&logo=windows&logoColor=white" alt="Télécharger AlgoStudio Portable (.exe)" />
  </a>
</p>

| Version | Lien direct (toujours à jour) | Recommandé pour |
| :--- | :--- | :--- |
| **Installateur Windows** *(Recommandé)* | [**AlgoStudio-Setup.exe**](https://github.com/King-Joyboy/algostudio/releases/latest/download/AlgoStudio-Setup.exe) | Installation normale + **Mises à jour automatiques** |
| **Version Portable** | [**AlgoStudio-Portable.exe**](https://github.com/King-Joyboy/algostudio/releases/latest/download/AlgoStudio-Portable.exe) | Lancer sans installer (clé USB, PC lycée) |
| **Toutes les versions** | [**GitHub Releases**](https://github.com/King-Joyboy/algostudio/releases/latest) | Historique complet des versions |

> **Note Windows SmartScreen :** Si Windows affiche *"Windows a protégé votre ordinateur"* lors de la première ouverture, cliquez sur **Informations complémentaires** → **Exécuter quand même**.

---

## Mises à jour automatiques (Auto-Update)

- Si vous utilisez **`AlgoStudio-Setup.exe`**, chaque nouvelle version est **détectée et téléchargée automatiquement** au démarrage (ou manuellement depuis **Fichier → Mises à jour**), puis installée en 1 clic (**Redémarrer & Installer**).
- Si vous utilisez **`AlgoStudio-Portable.exe`**, l'application vous prévient dès qu'une nouvelle version est disponible et vous propose un bouton de téléchargement direct.

---

## Pour les développeurs

### Commandes principales

```bash
npm run dev          # Lancer en mode développement (http://localhost:5173)
npm test             # Lancer les 50 tests automatisés
npm run build        # Compiler la version web (dist/)
npm run clean        # Nettoyer dist/ et release/
npm run build:exe    # Compiler les exécutables Windows localement (release/)
```

### Publier une nouvelle version (Auto-Update + liens directs mis à jour automatiquement)

1. Incrémentez `"version"` dans `package.json` (ex : `"1.6.0"` → `"1.7.0"`).
2. Poussez un nouveau tag :
   ```bash
   git add .
   git commit -m "Release v1.7.0"
   git tag v1.7.0
   git push origin main --tags
   ```
3. **GitHub Actions** (`.github/workflows/release.yml`) lance automatiquement les tests, compile `AlgoStudio-Setup.exe`, `AlgoStudio-Portable.exe`, `.blockmap` et `latest.yml`, puis publie une release publique unique. Les boutons de téléchargement ci-dessus et l'auto-update pointent instantanément vers la nouvelle version.
