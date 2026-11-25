// Archive officielle Bac Informatique Tunisie — 100% Algorithmique & Programmation (2008–2026)
// Tous les liens PDF/ZIP sont directs, publics et vérifiés (HTTP 200) — Sources : reviserbac.tn & kiteb.net

export type ExamEpreuve = 'Théorique' | 'Pratique';
export type ExamSession = 'Principale' | 'Contrôle';
export type ExamKind = 'Énoncé' | 'Corrigé' | 'Ressources';

export interface BacExamItem {
  id: string;
  year: number;
  epreuve: ExamEpreuve;
  session: ExamSession;
  kind: ExamKind;
  title: string;
  subtitle: string;
  downloadUrl: string;
  source: 'reviserbac.tn' | 'kiteb.net';
}

export interface BacYearArchive {
  year: number;
  theoriqueCount: number;
  pratiqueCount: number;
  reviserbacUrl?: string;
  kitebUrl: string;
}

export const ARCHIVE_MAIN_URL =
  'https://www.reviserbac.tn/sujets/informatique/algorithmique-programmation';
export const KITEB_BASE_URL = 'https://www.kiteb.net/education/informatique/bac/';

const RB_BAC = 'https://files.reviserbac.tn/archives/bac';
const RB_PRA = 'https://files.reviserbac.tn/archives/bac-pratique';
const KITEB = 'https://www.kiteb.net/education/informatique/bac';

// Years 2009..2026 on files.reviserbac.tn (Principale & Contrôle Énoncés + available Corrigés)
const THEORIQUE_CORRIGES_P = new Set([2022, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2012, 2011, 2010, 2009]);
const THEORIQUE_CORRIGES_C = new Set([2022, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]);

function buildTheoriqueItems(): BacExamItem[] {
  const list: BacExamItem[] = [];

  for (let year = 2026; year >= 2009; year--) {
    // Session Principale — Énoncé
    list.push({
      id: `algo-th-${year}-p-enonce`,
      year,
      epreuve: 'Théorique',
      session: 'Principale',
      kind: 'Énoncé',
      title: `Bac ${year} — Session Principale — Énoncé`,
      subtitle: 'Épreuve écrite · Algorithmique & Programmation',
      downloadUrl: `${RB_BAC}/${year}/principale/informatique/algorithme.pdf`,
      source: 'reviserbac.tn',
    });

    // Session Principale — Corrigé
    if (THEORIQUE_CORRIGES_P.has(year)) {
      list.push({
        id: `algo-th-${year}-p-corrige`,
        year,
        epreuve: 'Théorique',
        session: 'Principale',
        kind: 'Corrigé',
        title: `Bac ${year} — Session Principale — Corrigé`,
        subtitle: 'Correction officielle · Algorithmique & Programmation',
        downloadUrl: `${RB_BAC}/${year}/principale/informatique/algorithme_c.pdf`,
        source: 'reviserbac.tn',
      });
    } else if (year === 2013) {
      list.push({
        id: `algo-th-2013-p-corrige`,
        year: 2013,
        epreuve: 'Théorique',
        session: 'Principale',
        kind: 'Corrigé',
        title: `Bac 2013 — Session Principale — Corrigé`,
        subtitle: 'Correction officielle · Algorithmique & Programmation',
        downloadUrl: `${KITEB}/bacinfo2013/bacalgo2013scinfo-corrige.pdf`,
        source: 'kiteb.net',
      });
    }

    // Session de Contrôle — Énoncé
    list.push({
      id: `algo-th-${year}-c-enonce`,
      year,
      epreuve: 'Théorique',
      session: 'Contrôle',
      kind: 'Énoncé',
      title: `Bac ${year} — Session de Contrôle — Énoncé`,
      subtitle: 'Épreuve écrite · Algorithmique & Programmation',
      downloadUrl: `${RB_BAC}/${year}/controle/informatique/algorithme.pdf`,
      source: 'reviserbac.tn',
    });

    // Session de Contrôle — Corrigé
    if (THEORIQUE_CORRIGES_C.has(year)) {
      list.push({
        id: `algo-th-${year}-c-corrige`,
        year,
        epreuve: 'Théorique',
        session: 'Contrôle',
        kind: 'Corrigé',
        title: `Bac ${year} — Session de Contrôle — Corrigé`,
        subtitle: 'Correction officielle · Algorithmique & Programmation',
        downloadUrl: `${RB_BAC}/${year}/controle/informatique/algorithme_c.pdf`,
        source: 'reviserbac.tn',
      });
    }
  }

  // Bac 2008 (première année du Bac Sciences de l'Informatique) — kiteb.net
  list.push(
    {
      id: 'algo-th-2008-p-enonce',
      year: 2008,
      epreuve: 'Théorique',
      session: 'Principale',
      kind: 'Énoncé',
      title: 'Bac 2008 — Session Principale — Énoncé',
      subtitle: 'Épreuve écrite · Algorithmique & Programmation',
      downloadUrl: `${KITEB}/bacinfo2008/bacalgo2008scinfo.pdf`,
      source: 'kiteb.net',
    },
    {
      id: 'algo-th-2008-p-corrige',
      year: 2008,
      epreuve: 'Théorique',
      session: 'Principale',
      kind: 'Corrigé',
      title: 'Bac 2008 — Session Principale — Corrigé',
      subtitle: 'Correction officielle · Algorithmique & Programmation',
      downloadUrl: `${KITEB}/bacinfo2008/bacalgo2008scinfo-corrige.pdf`,
      source: 'kiteb.net',
    }
  );

  return list;
}

const PRATIQUE_ITEMS: BacExamItem[] = [
  // 2026 (files.reviserbac.tn)
  {
    id: 'algo-pr-2026-8h30',
    year: 2026,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2026 — 23 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2026/sujets/bac-pratique-23052026-algo-8h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2026-8h30-res',
    year: 2026,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Ressources',
    title: 'Bac Pratique 2026 — 23 mai (8h30) — Fichiers de travail',
    subtitle: 'Archive ZIP · Interfaces & données de départ',
    downloadUrl: `${RB_PRA}/2026/ressources/bac-pratique-23052026-algo-8h30-fichiers.zip`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2026-11h30',
    year: 2026,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2026 — 23 mai (11h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2026/sujets/bac-pratique-23052026-algo-11h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2026-11h30-res',
    year: 2026,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Ressources',
    title: 'Bac Pratique 2026 — 23 mai (11h30) — Fichiers de travail',
    subtitle: 'Archive ZIP · Interfaces & données de départ',
    downloadUrl: `${RB_PRA}/2026/ressources/bac-pratique-23052026-algo-11h30-fichiers.zip`,
    source: 'reviserbac.tn',
  },

  // 2025 (files.reviserbac.tn)
  {
    id: 'algo-pr-2025-8h30',
    year: 2025,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2025 — 24 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2025/sujets/bac-pratique-24052025-algo-8h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2025-8h30-res',
    year: 2025,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Ressources',
    title: 'Bac Pratique 2025 — 24 mai (8h30) — Fichiers de travail',
    subtitle: 'Archive ZIP · Interfaces & données de départ',
    downloadUrl: `${RB_PRA}/2025/ressources/bac-pratique-24052025-algo-8h30-fichiers.zip`,
    source: 'reviserbac.tn',
  },

  // 2024 (files.reviserbac.tn)
  {
    id: 'algo-pr-2024-8h30',
    year: 2024,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2024 — 25 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2024/sujets/bac-pratique-25052024-algo-8h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2024-8h30-res',
    year: 2024,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Ressources',
    title: 'Bac Pratique 2024 — 25 mai (8h30) — Fichiers de travail',
    subtitle: 'Archive ZIP · Interfaces & données de départ',
    downloadUrl: `${RB_PRA}/2024/ressources/bac-pratique-25052024-algo-8h30-fichiers.zip`,
    source: 'reviserbac.tn',
  },

  // 2023 (files.reviserbac.tn)
  {
    id: 'algo-pr-2023-8h30',
    year: 2023,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2023 — 27 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2023/sujets/bac-pratique-27052023-algo-8h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2023-corr',
    year: 2023,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2023 — Corrigé (ZIP)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2023/corrections/bac-pratique-27052023-algo-corrige1.zip`,
    source: 'reviserbac.tn',
  },

  // 2022 (files.reviserbac.tn)
  {
    id: 'algo-pr-2022-8h30',
    year: 2022,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2022 — 28 mai (8h30) — Énoncé (FR)',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2022/sujets/bac-pratique-28052022-algo-8h30.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2022-8h30-ar',
    year: 2022,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2022 — 28 mai (8h30) — Énoncé (AR)',
    subtitle: 'Épreuve pratique · Version arabe',
    downloadUrl: `${RB_PRA}/2022/sujets/bac-pratique-28052022-algo-8h30-AR.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2022-corr-pdf',
    year: 2022,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2022 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2022/corrections/bac-pratique-28052022-algo-corrige1.pdf`,
    source: 'reviserbac.tn',
  },
  {
    id: 'algo-pr-2022-corr-zip',
    year: 2022,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2022 — Corrigé complet (ZIP)',
    subtitle: 'Code source & correction · Algorithmique & Programmation',
    downloadUrl: `${RB_PRA}/2022/corrections/bac-pratique-28052022-algo-corrige4.zip`,
    source: 'reviserbac.tn',
  },

  // 2021 (kiteb.net)
  {
    id: 'algo-pr-2021-8h30',
    year: 2021,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2021 — 5 juin (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2021/bac-pratique-05062021-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2021-corr',
    year: 2021,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2021 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2021/bac-pratique-05062021-algo-corrige2.pdf`,
    source: 'kiteb.net',
  },

  // 2020 (kiteb.net)
  {
    id: 'algo-pr-2020-8h30',
    year: 2020,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2020 — 26 juin (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2020/bac-pratique-26062020-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2020-corr',
    year: 2020,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2020 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2020/bac-pratique-26062020-algo-corrige2.pdf`,
    source: 'kiteb.net',
  },

  // 2019 (kiteb.net)
  {
    id: 'algo-pr-2019-8h30',
    year: 2019,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2019 — 1er juin (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2019/bac-pratique-01062019-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2019-corr',
    year: 2019,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2019 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2019/bac-pratique-01062019-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2018 (kiteb.net)
  {
    id: 'algo-pr-2018-8h30',
    year: 2018,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2018 — 26 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2018/bac-pratique-26052018-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2018-corr',
    year: 2018,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2018 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2018/bac-pratique-26052018-algo-corrige4.pdf`,
    source: 'kiteb.net',
  },

  // 2017 (kiteb.net)
  {
    id: 'algo-pr-2017-8h30',
    year: 2017,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2017 — 27 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2017/bac-pratique-27052017-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2017-corr',
    year: 2017,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2017 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2017/bac-pratique-27052017-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2016 (kiteb.net)
  {
    id: 'algo-pr-2016-8h30',
    year: 2016,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2016 — 21 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2016/bac-pratique-21052016-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2016-corr',
    year: 2016,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2016 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2016/bac-pratique-21052016-algo-corrige3.pdf`,
    source: 'kiteb.net',
  },

  // 2015 (kiteb.net)
  {
    id: 'algo-pr-2015-8h30',
    year: 2015,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2015 — 23 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2015/bac-pratique-23052015-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2015-corr',
    year: 2015,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2015 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2015/bac-pratique-23052015-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2014 (kiteb.net)
  {
    id: 'algo-pr-2014-8h',
    year: 2014,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2014 — 22 mai (8h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2014/bac-pratique-22052014-algo-8h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2014-10h',
    year: 2014,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2014 — 22 mai (10h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2014/bac-pratique-22052014-algo-10h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2014-14h',
    year: 2014,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2014 — 22 mai (14h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2014/bac-pratique-22052014-algo-14h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2014-corr',
    year: 2014,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2014 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2014/bac-pratique-22052014-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2013 (kiteb.net)
  {
    id: 'algo-pr-2013-8h',
    year: 2013,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2013 — 23 mai (8h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2013/bac-pratique-23052013-algo-8h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2013-10h',
    year: 2013,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2013 — 23 mai (10h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2013/bac-pratique-23052013-algo-10h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2013-14h',
    year: 2013,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2013 — 23 mai (14h00) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2013/bac-pratique-23052013-algo-14h.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2013-corr',
    year: 2013,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2013 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2013/bac-pratique-23052013-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2012 (kiteb.net)
  {
    id: 'algo-pr-2012-8h30',
    year: 2012,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2012 — 24 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2012/bac-pratique-24052012-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2012-10h30',
    year: 2012,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2012 — 24 mai (10h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2012/bac-pratique-24052012-algo-10h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2012-14h30',
    year: 2012,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2012 — 24 mai (14h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2012/bac-pratique-24052012-algo-14h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2012-corr',
    year: 2012,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2012 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2012/bac-pratique-24052012-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2011 (kiteb.net)
  {
    id: 'algo-pr-2011-8h30',
    year: 2011,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2011 — 26 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2011/bac-pratique-26052011-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2011-10h30',
    year: 2011,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2011 — 26 mai (10h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2011/bac-pratique-26052011-algo-10h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2011-14h30',
    year: 2011,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2011 — 26 mai (14h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2011/bac-pratique-26052011-algo-14h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2011-corr',
    year: 2011,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2011 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2011/bac-pratique-26052011-algo-corrige.pdf`,
    source: 'kiteb.net',
  },

  // 2010 (kiteb.net)
  {
    id: 'algo-pr-2010-8h30',
    year: 2010,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2010 — 27 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2010/bac-pratique-271052010-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2010-10h30',
    year: 2010,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2010 — 27 mai (10h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2010/bac-pratique-271052010-algo-10h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2010-14h30',
    year: 2010,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2010 — 27 mai (14h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2010/bac-pratique-271052010-algo-14h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2010-corr',
    year: 2010,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2010 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2010/bac-pratique-27052010-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2009 (kiteb.net)
  {
    id: 'algo-pr-2009-8h30',
    year: 2009,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2009 — 21 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2009/bac-pratique-21052009-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2009-10h30',
    year: 2009,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2009 — 21 mai (10h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2009/bac-pratique-21052009-algo-10h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2009-14h30',
    year: 2009,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2009 — 21 mai (14h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2009/bac-pratique-21052009-algo-14h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2009-corr',
    year: 2009,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2009 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2009/bac-pratique-21052009-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },

  // 2008 (kiteb.net)
  {
    id: 'algo-pr-2008-8h30',
    year: 2008,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2008 — 21 mai (8h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2008/bac-pratique-21052008-algo-8h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2008-10h30',
    year: 2008,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2008 — 21 mai (10h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2008/bac-pratique-21052008-algo-10h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2008-14h30',
    year: 2008,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Énoncé',
    title: 'Bac Pratique 2008 — 21 mai (14h30) — Énoncé',
    subtitle: 'Épreuve pratique · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2008/bac-pratique-21052008-algo-14h30.pdf`,
    source: 'kiteb.net',
  },
  {
    id: 'algo-pr-2008-corr',
    year: 2008,
    epreuve: 'Pratique',
    session: 'Principale',
    kind: 'Corrigé',
    title: 'Bac Pratique 2008 — Corrigé (PDF)',
    subtitle: 'Proposition de correction · Algorithmique & Programmation',
    downloadUrl: `${KITEB}/bacinfo2008/bac-pratique-21052008-algo-corrige1.pdf`,
    source: 'kiteb.net',
  },
];

// Merge and sort by year desc, Théorique before Pratique, Principale before Contrôle, Énoncé before Corrigé/Ressources
const KIND_ORDER: Record<ExamKind, number> = { 'Énoncé': 0, 'Corrigé': 1, Ressources: 2 };

export const BAC_EXAMS: BacExamItem[] = [...buildTheoriqueItems(), ...PRATIQUE_ITEMS].sort(
  (a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    if (a.epreuve !== b.epreuve) return a.epreuve === 'Théorique' ? -1 : 1;
    if (a.session !== b.session) return a.session === 'Principale' ? -1 : 1;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  }
);

export const BAC_YEAR_ARCHIVES: BacYearArchive[] = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => {
  const year = 2026 - i;
  const items = BAC_EXAMS.filter((x) => x.year === year);
  return {
    year,
    theoriqueCount: items.filter((x) => x.epreuve === 'Théorique').length,
    pratiqueCount: items.filter((x) => x.epreuve === 'Pratique').length,
    reviserbacUrl:
      year >= 2009
        ? `https://www.reviserbac.tn/sujets/informatique/algorithmique-programmation/${year}-principale`
        : undefined,
    kitebUrl: `${KITEB}/bacinfo${year}/epreuves-bac-theorique-${year}.php`,
  };
});
