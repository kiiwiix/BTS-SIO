# Portfolio BTS SIO – option SISR

Portfolio professionnel de **Noé Chami**, étudiant en BTS SIO option SISR (Solutions d'Infrastructure, Systèmes et Réseaux) au Lycée Benjamin Franklin d'Orléans, en vue des épreuves **E4 — Support et mise à disposition de services informatiques**, **E5 — Administration des systèmes et des réseaux** et **E6 — Cybersécurité des services informatiques**.

🌐 **Portfolio en ligne :** <https://kiiwiix.github.io/BTS-SIO/>

---

## Sommaire

1. [Présentation](#présentation)
2. [Compétences couvertes](#compétences-couvertes)
3. [Réalisations professionnelles](#réalisations-professionnelles)
4. [Stages et immersions](#stages-et-immersions)
5. [Certifications](#certifications)
6. [Veille technologique](#veille-technologique)
7. [Structure du dépôt](#structure-du-dépôt)
8. [Démarrage local](#démarrage-local)
9. [Contact](#contact)

---

## Présentation

- **Nom — Prénom :** Chami — Noé
- **Formation :** BTS SIO option SISR (2024 – 2026)
- **Établissement :** Lycée Benjamin Franklin, Orléans
- **Projet professionnel :** Intégrer l'École nationale des sous-officiers d'active (ENSOA) de Saint-Maixent-l'École, puis l'École des transmissions, en vue d'une carrière d'opérateur réseaux et systèmes au sein de l'Armée de Terre.
- 📄 [CV interactif (imprimable A4)](./cv.html)
- 📎 [Attestation ANSSI SecNumacadémie](./Documents/attestation-anssi.pdf)
- 🔗 [Profil LinkedIn](https://www.linkedin.com/in/nchami45/)

---

## Compétences couvertes

Le portfolio cartographie chaque réalisation aux compétences du référentiel SISR :

| Bloc | Intitulé |
|------|----------|
| **B1.1** | Gérer le patrimoine informatique |
| **B1.2** | Répondre aux incidents et demandes d'assistance |
| **B1.4** | Travailler en mode projet |
| **B1.5** | Mettre à disposition des utilisateurs un service informatique |
| **B1.6** | Organiser son développement professionnel |
| **B2.1** | Concevoir une solution d'infrastructure réseau |
| **B2.2** | Installer l'infrastructure réseau |
| **B2.3** | Exploiter l'infrastructure réseau |
| **B2.4** | Garantir la disponibilité, l'intégrité et la confidentialité des données |

Un tableau de synthèse interactif est disponible directement sur la page d'accueil du portfolio.

---

## Réalisations professionnelles

| Projet | Contexte | Technologies | Livrables |
|--------|----------|--------------|-----------|
| **Mission 1 GSB** – Segmentation réseau & sécurisation switch | Atelier de professionnalisation | Cisco 2960, VLAN, SSH | Rapport, schéma VLAN, fiche de recette, procédure |
| **Mission 2 GSB** – Interconnexion VLAN & pare-feu | Atelier de professionnalisation | Stormshield, NAT, routage | Rapport, schéma VLAN, plan d'adressage |
| **Mission 3 GSB** – Active Directory, DNS, DHCP | Atelier de professionnalisation | Windows Server 2019, AD DS, DNS, DHCP | Rapport, captures de validation (ipconfig, nslookup, dcdiag) |
| **Audit Nessus – UnrealIRCd** | Travail orienté cybersécurité | Nessus Essentials, Linux | Rapport d'analyse, contre-mesures |
| **DHCP sous Windows Server (WAMP)** | Déploiement services réseau | Windows Server, DHCP | Rapport HTML + PDF, captures de validation client |

Chaque projet suit une trame professionnelle : **problème → solution → outils → résultat → preuves**.

---

## Stages et immersions

| Période | Structure | Mission |
|---------|-----------|---------|
| **2026** | ADEFI – Meung-sur-Loire | Administration réseau & systèmes, stockage, ESXi, sauvegardes — 2ᵉ année |
| **2025** | ADEFI – Meung-sur-Loire | Support, switches Zyxel, segmentation, NAS Synology — 1ʳᵉ année |
| **2024** | 807ᵉ Compagnie des Transmissions – Rennes | Étude cybersécurité MITRE ATT&CK (environnement classifié) |
| **2022** | Base aérienne 123 – Orléans-Bricy | Immersion opérations réseaux en infrastructure critique |
| **2020** | Domaine national de Chambord | Découverte du support utilisateur et gestion de parc |

---

## Certifications

| Émetteur | Intitulé | Durée |
|----------|----------|-------|
| **ANSSI** | SecNumacadémie – Sensibilisation SSI | ~10 h |
| **OpenClassrooms** | Administrez un système Linux | 10 h |
| **OpenClassrooms** | Administrez une architecture réseau avec Cisco | 10 h |
| **OpenClassrooms** | Déployez vos systèmes et réseaux dans le cloud avec AWS | 10 h |
| **OpenClassrooms** | Optimisez votre déploiement avec Docker | 10 h |

---

## Veille technologique

Veille mensuelle menée de **septembre 2025 à mai 2026** sur les thématiques infrastructure, sécurité et cloud. Articles consultables via la page [veille.html](./veille.html) avec sources, dates et synthèse personnelle. Axes traités : cloud hybride, virtualisation, identités, durcissement, supervision et automatisation.

---

## Structure du dépôt

```
.
├── index.html                  # Page d'accueil du portfolio
├── cv.html                     # CV interactif (impression A4 prête)
├── veille.html                 # Veille technologique (sept. 2025 → mai 2026)
├── style.css                   # Styles du terminal d'animation
├── background.css              # Fond animé (code rain, brume)
├── animations.css              # Animations utilitaires
├── enhancements.css            # Système de design (cartes, hero, contact…)
├── cv.css                      # Mise en page CV
├── enhancements.js             # Reveal, compteurs, retour en haut
├── terminal.js                 # Simulation de terminal d'infra
├── matrix.js / akatsuki.js     # Effets visuels (désactivés par défaut)
├── README.md                   # Présent fichier
├── LICENSE
│
├── Documents/                  # Pièces officielles (CV PDF, attestations, rapports)
│   ├── attestation-anssi.pdf
│   ├── DHCPavecWAMP.pdf
│   ├── GSB Contexte.pdf
│   ├── Rapport Final Mission1 GSB.pdf
│   ├── Mission Mise en place de infrastructure Segmentation reseau.pdf
│   ├── Plan Cablage VLAN Ports GSB.docx
│   ├── Fiche Procedure MUTLAB VLAN SSH.docx
│   └── Fiche Recette MUTLAB VLAN SSH.docx
│
├── assets/                     # Médias, rapports HTML, captures de preuve
│   ├── stage-adefi-1ere-annee.html
│   ├── stage-adefi-2eme-annee.html
│   ├── certif-anssi.html / certif-linux.html / certif-cisco.html / certif-aws.html / certif-docker.html
│   ├── fiche-justification-croix.html
│   └── captures techniques (.png) : AD, DNS, DHCP, VLAN, RAID, etc.
│
├── Projet/                     # Rapports projets autonomes
│   ├── gsb_mission1_portfolio_files/   # VLAN & SSH (Cisco)
│   ├── gsb_mission2_portfolio_files/   # Stormshield (NAT, routage)
│   ├── gsb_mission3_portfolio_files/   # AD DS + DNS + DHCP
│   ├── dhcp_wamp_portfolio_files/      # DHCP sous Windows Server
│   └── rapport_nessus_ameliore/        # Audit de vulnérabilités
│
└── screen/                     # Captures de validation (ipconfig, nslookup, vlan…)
```

---

## Démarrage local

Le portfolio est entièrement statique : aucun build, aucune dépendance.

```bash
# Cloner le dépôt
git clone https://github.com/kiiwiix/BTS-SIO.git
cd BTS-SIO

# Lancer un serveur statique (au choix)
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Le mode clair est appliqué par défaut. Un bouton dans la barre latérale permet de basculer en mode sombre ; le choix est mémorisé via `localStorage`.

---

## Compatibilité

- Navigateurs modernes (Chromium, Firefox, Safari, Edge récents)
- Responsive : sidebar transformée en bandeau sous 1080 px de large
- Mode impression optimisé pour produire un PDF A4 à transmettre au jury
- Préférence `prefers-reduced-motion` respectée lorsque les animations sont désactivées

---

## Contact

- ✉️ **chaminoe0@gmail.com**
- 🔗 **LinkedIn :** [Noé Chami](https://www.linkedin.com/in/nchami45/)
- 💻 **GitHub :** [kiiwiix](https://github.com/kiiwiix)
- 📍 Orléans · Centre-Val de Loire

---

## Licence

Code source publié sous licence MIT — voir [LICENSE](./LICENSE).
Les pièces justificatives (attestations, captures, rapports d'entreprise) restent la propriété de leurs auteurs respectifs et ne peuvent être réutilisées sans autorisation.
