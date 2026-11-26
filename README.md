# AlgoStudio — IDE d'Algorithmique & Bac Informatique

Application multi-plateforme (**Windows `.exe` · Android `.apk` · iOS `.ipa`**) pour les élèves du **Bac Informatique Tunisien** :
- Exécution en temps réel du pseudocode (convention officielle tunisienne sans bloc `Variables`), **TDO** et **Trace** automatiques
- Éditeur complet (multi-onglets, symboles `← ≠ ≤ ≥ @ À É`, conversion `Auto`, bouton activer/désactiver `Complétion`, **Caméra & Photo → Code (OCR hors-ligne)**, **Mode Clair / Mode Sombre**)
- **12 chapitres** du Guide Complet d'Algorithmique + PDF intégré
- **27 modules standards** prêts à exécuter
- **Tous les sujets Bac d'Algorithmique & Programmation (2008–2026)** : Théorique (Principale + Contrôle) & Pratique, Énoncés & Corrigés PDF directs vérifiés

---

## Télécharger AlgoStudio (Windows · Android · iOS)

Cliquez directement sur l'un des boutons ci-dessous pour télécharger la **dernière version** :

<p>
  <a href="https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Setup.exe">
    <img src="https://img.shields.io/badge/Windows-Setup_(.exe)_%E2%80%A2_Auto--Update-E50914?style=for-the-badge&logo=windows&logoColor=white" alt="Télécharger AlgoStudio Windows Setup" />
  </a>
  &nbsp;
  <a href="https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Portable.exe">
    <img src="https://img.shields.io/badge/Windows-Portable_(.exe)-1F2937?style=for-the-badge&logo=windows&logoColor=white" alt="Télécharger AlgoStudio Windows Portable" />
  </a>
  &nbsp;
  <a href="https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Android.apk">
    <img src="https://img.shields.io/badge/Android-APK_(Cam%C3%A9ra_+_OCR)-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Télécharger AlgoStudio Android APK" />
  </a>
  &nbsp;
  <a href="https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-iOS.ipa">
    <img src="https://img.shields.io/badge/iOS-IPA_(Cam%C3%A9ra_+_OCR)-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Télécharger AlgoStudio iOS IPA" />
  </a>
</p>

| Plateforme | Lien direct (toujours à jour) | Notes |
| :--- | :--- | :--- |
| **Windows — Installateur** *(Recommandé)* | [**AlgoStudio-Setup.exe**](https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Setup.exe) | Installation normale + **Mises à jour automatiques** |
| **Windows — Portable** | [**AlgoStudio-Portable.exe**](https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Portable.exe) | Sans installation (clé USB, PC lycée) |
| **Android (Caméra + OCR)** | [**AlgoStudio-Android.apk**](https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-Android.apk) | Autoriser *Sources inconnues* puis installer |
| **iOS (Caméra + OCR)** | [**AlgoStudio-iOS.ipa**](https://github.com/YassineM-Dev/algostudio/releases/latest/download/AlgoStudio-iOS.ipa) | Installer via **Sideloadly**, **AltStore**, **SideStore** ou **TrollStore** |
| **Toutes les versions** | [**GitHub Releases**](https://github.com/YassineM-Dev/algostudio/releases/latest) | Historique complet des versions |

> **Note Windows SmartScreen :** Si Windows affiche *"Windows a protégé votre ordinateur"* lors de la première ouverture, cliquez sur **Informations complémentaires** → **Exécuter quand même**.

---

## Mises à jour automatiques (Windows)

- Avec **`AlgoStudio-Setup.exe`**, chaque nouvelle version est **détectée et téléchargée automatiquement** au démarrage (ou via **Fichier → Mises à jour**), puis installée en 1 clic (**Redémarrer & Installer**).
- Sur **Android** et **iOS**, téléchargez simplement la dernière version via les liens directs ci-dessus.

---

## Pour les développeurs

### Commandes principales

```bash
npm run dev          # Lancer en mode développement (http://localhost:5173)
npm test             # Lancer les tests automatisés
npm run build        # Compiler la version web (dist/)
npm run clean        # Nettoyer dist/ et release/
npm run build:exe    # Compiler les exécutables Windows localement (release/)
npx cap sync         # Synchroniser dist/ vers Android & iOS
```

### Publier une nouvelle version (Windows + Android + iOS en automatique)

1. Incrémentez `"version"` dans `package.json` (et `android/app/build.gradle`).
2. Poussez un nouveau tag :
   ```bash
   git add .
   git commit -m "Release v1.8.0"
   git tag v1.8.0
   git push origin main --tags
   ```
3. **GitHub Actions** (`.github/workflows/release.yml`) lance les tests puis compile en parallèle **Windows (`.exe`)**, **Android (`.apk`)** et **iOS (`.ipa`)**, et publie une release publique unique.

---

<sub>© 2026 Developed by <a href="https://github.com/YassineM-Dev">Yassine</a></sub>
