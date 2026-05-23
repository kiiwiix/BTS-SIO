/* ══════════════════════════════════════════════════════════════
   TERMINAL — Démo SISR animée, commandes inspirées des projets BTS
   ══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PROMPT = 'noe@sisr-lab:~$';
  const MAX_LINES = 24;

  /* ── Palette de sortie colorée (markers internes) ────── */
  const OK   = (s) => `\x1b[OK\x1b] ${s}`;
  const WARN = (s) => `\x1b[WARN\x1b] ${s}`;
  const ERR  = (s) => `\x1b[ERR\x1b] ${s}`;
  const INFO = (s) => `\x1b[INFO\x1b] ${s}`;

  /* ── Catalogue de commandes (catégorisé) ──────────────── */
  const COMMANDS = [
    /* ── Réseau ──── */
    {
      category: 'network', command: 'show vlan brief',
      note: 'Segmentation réseau GSB — VLANs métiers isolés sur Cisco 2960.',
      output: [
        'VLAN  Name                    Status    Ports',
        '10    ADMIN                   active    Gi0/1, Gi0/2',
        '20    SERVEURS                active    Gi0/10, Gi0/11',
        '30    UTILISATEURS            active    Gi0/20-23',
        '99    MANAGEMENT              active    Gi0/24'
      ]
    },
    {
      category: 'network', command: 'ip route show',
      note: "Table de routage d'un serveur Debian dans l'infra GSB.",
      output: [
        'default via 192.168.10.1 dev eth0',
        '192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.5',
        '192.168.20.0/24 via 192.168.10.1 dev eth0',
        '192.168.30.0/24 via 192.168.10.1 dev eth0'
      ]
    },
    {
      category: 'network', command: 'tcpdump -i eth0 -n port 53 -c 5',
      note: 'Capture DNS pour valider la résolution interne du domaine.',
      output: [
        '09:14:02 IP 192.168.30.42 > 192.168.20.10: UDP, DNS query A srv-fichiers.lab.local',
        '09:14:02 IP 192.168.20.10 > 192.168.30.42: UDP, DNS answer 192.168.20.15',
        '09:14:03 IP 192.168.30.43 > 192.168.20.10: UDP, DNS query A srv-mail.lab.local',
        '5 packets captured'
      ]
    },
    {
      category: 'network', command: 'show interfaces trunk',
      note: "Vérification des liens trunk 802.1Q entre commutateurs.",
      output: [
        'Port      Mode         Encapsulation  Status     Native vlan',
        'Gi0/24    on           802.1q         trunking   99',
        'Port      Vlans allowed on trunk',
        'Gi0/24    10,20,30,99',
        OK('Trunk fonctionnel — tags propagés')
      ]
    },

    /* ── DNS ──── */
    {
      category: 'dns', command: 'Resolve-DnsName srv-fichiers.lab.local',
      note: "Vérification DNS côté client dans l'AD du contexte GSB.",
      output: [
        'Name                        Type TTL  Section IPAddress',
        '----                        ---- ---  ------- ---------',
        'srv-fichiers.lab.local      A    3600 Answer  192.168.20.15'
      ]
    },
    {
      category: 'dns', command: 'nslookup dc01.swiss-galaxyB2.com 192.168.20.10',
      note: 'Contrôle de la résolution DNS intégrée à Active Directory.',
      output: [
        'Server:  dc01.swiss-galaxyB2.com',
        'Address: 192.168.20.10',
        '',
        'Name:    dc01.swiss-galaxyB2.com',
        'Address: 192.168.20.10'
      ]
    },

    /* ── DHCP ──── */
    {
      category: 'dhcp', command: 'Get-DhcpServerv4Scope',
      note: 'Périmètre DHCP des VLANs configurés sur Windows Server.',
      output: [
        'ScopeId       SubnetMask      Name              State',
        '192.168.30.0  255.255.255.0   VLAN30-Users      Active',
        '192.168.40.0  255.255.255.0   VLAN40-Services   Active'
      ]
    },
    {
      category: 'dhcp', command: 'ipconfig /all | findstr /i "dhcp\\|ip\\|gateway"',
      note: 'Vérification du bail DHCP côté client Windows — Mission 3 GSB.',
      output: [
        '   DHCP Enabled. . . . . . . . . : Yes',
        '   IPv4 Address. . . . . . . . . : 192.168.30.52',
        '   Default Gateway . . . . . . . : 192.168.30.1',
        '   DHCP Server . . . . . . . . . : 192.168.20.12'
      ]
    },

    /* ── Active Directory ──── */
    {
      category: 'ad', command: 'Get-ADUser nchami -Properties Enabled,LastLogonDate',
      note: 'Gestion utilisateur PowerShell — tâche quotidienne en SISR.',
      output: [
        'Name           : Noe Chami',
        'Enabled        : True',
        'SamAccountName : nchami',
        'LastLogonDate  : 2026-04-18 09:12:43'
      ]
    },
    {
      category: 'ad', command: 'dcdiag /test:replications /s:DC01',
      note: 'Diagnostic de réplication AD — validé lors de la Mission 3.',
      output: [
        '......DC01 passed test Replications',
        '......DC01 passed test SystemLog',
        '......DC01 passed test VerifyReferences',
        INFO('Aucune erreur de réplication détectée')
      ]
    },
    {
      category: 'ad', command: 'repadmin /replsummary',
      note: 'Surveillance de la réplication entre contrôleurs de domaine.',
      output: [
        'Source DSA          largest delta  fails/total %%  error',
        'DC01                00m:37s        0 / 10      0',
        'DC02                00m:42s        0 / 10      0',
        OK('Toutes les réplications sont à jour')
      ]
    },
    {
      category: 'ad', command: 'New-ADOrganizationalUnit -Name "Direction" -Path "DC=swiss-galaxyB2,DC=com"',
      note: "Création d'OU PowerShell pour structurer l'annuaire AD du contexte GSB.",
      output: [
        OK('OU "Direction" créée'),
        INFO('Délégation Lecture appliquée au groupe IT-Helpdesk')
      ]
    },

    /* ── Services ──── */
    {
      category: 'services', command: 'systemctl status apache2 --no-pager -l',
      note: 'Vérification du service web sur mon serveur Debian de lab.',
      output: [
        '● apache2.service - The Apache HTTP Server',
        '   Loaded: loaded (/lib/systemd/system/apache2.service; enabled)',
        '   Active: active (running) since Tue 2026-04-15 08:41:22 CEST',
        '  Process: Main PID 1842 (apache2)',
        OK('Service actif et opérationnel')
      ]
    },
    {
      category: 'services', command: 'systemctl list-units --type=service --state=running | head -8',
      note: "Vue rapide des services actifs sur le serveur d'infrastructure.",
      output: [
        'UNIT                    LOAD   ACTIVE SUB     DESCRIPTION',
        'apache2.service         loaded active running The Apache HTTP Server',
        'cron.service            loaded active running Regular background program',
        'postfix.service         loaded active running Postfix Mail Transport Agent',
        'ssh.service             loaded active running OpenBSD Secure Shell server'
      ]
    },

    /* ── Virtualisation ──── */
    {
      category: 'vm', command: 'esxcli vm process list',
      note: 'Inventaire VMs sur ESXi — cohérent avec mes usages Nutanix/VMware.',
      output: [
        'WIN-SRV-DC01',
        '   Process ID: 420117  Memory: 4096 MB',
        'DEBIAN-WEB',
        '   Process ID: 420231  Memory: 2048 MB',
        'WIN-CLIENT01',
        '   Process ID: 420388  Memory: 2048 MB'
      ]
    },
    {
      category: 'vm', command: 'esxcli storage core path list | grep "Adapter Identifier"',
      note: "Inspection des chemins de stockage — datacenter ADEFI.",
      output: [
        'Adapter Identifier: vmhba0',
        'Adapter Identifier: vmhba1',
        'Adapter Identifier: vmhba64',
        INFO('3 adaptateurs HBA détectés — multipath OK')
      ]
    },

    /* ── Firewall Stormshield ──── */
    {
      category: 'security', command: 'sfctl system status',
      note: 'Statut Stormshield — parefeu configuré lors de la Mission 2 GSB.',
      output: [
        'System status: OK',
        'Version: SNS 4.3.15',
        'Uptime: 14 days 06:22:14',
        'HA status: Active / Passive  [SYNC OK]',
        OK('Firewall opérationnel — règles NAT actives')
      ]
    },
    {
      category: 'security', command: 'sfctl network interfaces show',
      note: 'Interfaces VLAN configurées sur le Stormshield GSB.',
      output: [
        'Interface  Zone       IP Address       State',
        'IN         LAN        192.168.10.254   UP',
        'OUT        WAN        203.0.113.1      UP',
        'VLAN20     DMZ        192.168.20.254   UP',
        'VLAN30     USERS      192.168.30.254   UP'
      ]
    },

    /* ── Sauvegarde ──── */
    {
      category: 'backup', command: 'veeamconfig session list',
      note: 'Supervision des sauvegardes — tâche de ma mission chez ADEFI.',
      output: [
        'JobName            State    Result   EndTime',
        'Backup-Infra       Stopped  Success  2026-04-17 22:14',
        'Backup-Web         Stopped  Success  2026-04-17 22:29',
        'Backup-NAS         Stopped  Success  2026-04-17 23:01',
        OK('Toutes les sauvegardes terminées avec succès')
      ]
    },
    {
      category: 'backup', command: 'rsync -avz --delete /etc/ backup@nas01:/volume1/backups/etc',
      note: 'Sauvegarde incrémentielle de configuration vers le NAS Synology.',
      output: [
        'sending incremental file list',
        'etc/nginx/sites-available/portfolio.conf',
        'etc/ssh/sshd_config',
        'sent 12.4K bytes  received 142 bytes  3.32K/s',
        OK('Synchronisation terminée — 2 fichiers mis à jour')
      ]
    },

    /* ── Haute disponibilité / VRRP ──── */
    {
      category: 'network', command: 'systemctl status keepalived && ip addr show vip0',
      note: 'VRRP avec Keepalived — garantie de disponibilité du service réseau.',
      output: [
        '● keepalived.service — Keepalived High Availability',
        '   Active: active (running)',
        '   VRRP Instance: VI_1  State: MASTER',
        '2: vip0: <BROADCAST,MULTICAST,UP>',
        '   inet 192.168.10.100/24 brd 192.168.10.255',
        OK('VIP 192.168.10.100 active sur ce nœud MASTER')
      ]
    },

    /* ── Automatisation ──── */
    {
      category: 'automation', command: './backup-config.sh --targets sw-core,fw-edge',
      note: "Script d'export de configuration d'équipements réseau.",
      output: [
        INFO('Connexion SSH vers sw-core (192.168.99.2)'),
        OK('Export configuration sw-core'),
        INFO('Connexion SSH vers fw-edge (192.168.99.3)'),
        OK('Export configuration fw-edge'),
        OK('Archive générée: config-backup-2026-04-18.tar.gz')
      ]
    },
    {
      category: 'automation', command: 'ansible-playbook deploy-dns.yml --check',
      note: "Playbook Ansible pour déployer la config DNS — approche Infrastructure as Code.",
      output: [
        'PLAY [Déploiement DNS interne] *****',
        'TASK [Vérification Windows Server] *** ok: [dc01]',
        'TASK [Configuration zones DNS] *** changed: [dc01]',
        'TASK [Redémarrage service DNS] *** changed: [dc01]',
        'PLAY RECAP : dc01 ok=3 changed=2 failed=0'
      ]
    },

    /* ── Sécurité / Audit ──── */
    {
      category: 'security', command: 'nessuscli scan --policy "Audit réseau interne"',
      note: "Scan Nessus — démarche d'audit réalisée dans mon projet complémentaire.",
      output: [
        INFO('Host discovered: 192.168.20.12'),
        INFO('Service detected: UnrealIRCd 3.2.8.1'),
        WARN('CVE-2010-2075 — UnrealIRCd backdoor (Critical 10.0)'),
        OK('Report exported: rapport-nessus.html')
      ]
    },
    {
      category: 'security', command: 'ss -tlnp | grep -E "22|80|443|3389"',
      note: "Inventaire des ports ouverts sur le serveur — bonne pratique SISR.",
      output: [
        'State  Recv-Q  Send-Q  Local Address:Port',
        'LISTEN 0       128     0.0.0.0:22    (ssh)',
        'LISTEN 0       511     0.0.0.0:80    (apache2)',
        'LISTEN 0       511     0.0.0.0:443   (apache2)',
        INFO('RDP non exposé — conformité sécurité OK')
      ]
    },
    {
      category: 'security', command: 'nmap -sV -p 22,80,443,3389 192.168.10.0/24',
      note: "Scan ciblé du sous-réseau LAN — démarche apprise lors du stage 807ᵉ Cie.",
      output: [
        'Starting Nmap 7.94 ( https://nmap.org )',
        'Nmap scan report for srv-web.lab.local (192.168.10.15)',
        '22/tcp  open  ssh     OpenSSH 9.2',
        '443/tcp open  ssl/http nginx 1.24',
        OK('Scan terminé — 24 hôtes, 2 services exposés')
      ]
    },

    /* ── Profil ──── */
    {
      category: 'portfolio', command: 'cat /etc/motd',
      note: "Message d'accueil personnalisé — récapitulatif du profil BTS SIO.",
      output: [
        '╔══════════════════════════════════════╗',
        '║   Noé Chami — BTS SIO SISR           ║',
        '║   Administrateur Systèmes & Réseaux  ║',
        '║   Orléans · Lycée Benjamin Franklin  ║',
        '╚══════════════════════════════════════╝'
      ]
    },
    {
      category: 'linux', command: 'hostnamectl',
      note: 'Environnement Linux utilisé pour mes labs système et services.',
      output: [
        'Static hostname: sisr-lab',
        'Operating System: Debian GNU/Linux 12 (bookworm)',
        'Kernel: Linux 6.1.0-amd64',
        'Architecture: x86-64',
        'Virtualization: kvm'
      ]
    }
  ];

  /* ── Rendu des lignes colorées ─────────────────────── */
  const COLOR_MAP = {
    '\x1b[OK\x1b]':   { prefix: '[OK]',   cls: 'terminal-out-ok' },
    '\x1b[WARN\x1b]': { prefix: '[WARN]', cls: 'terminal-out-warn' },
    '\x1b[ERR\x1b]':  { prefix: '[ERR]',  cls: 'terminal-out-err' },
    '\x1b[INFO\x1b]': { prefix: '[INFO]', cls: 'terminal-out-info' }
  };

  const renderOutputLine = (text, parent) => {
    const div = document.createElement('div');
    div.className = 'terminal-output';
    let matched = false;
    for (const [code, { prefix, cls }] of Object.entries(COLOR_MAP)) {
      if (text.startsWith(code)) {
        div.classList.add(cls);
        const label = document.createElement('span');
        label.className = 'terminal-out-label';
        label.textContent = prefix + ' ';
        div.appendChild(label);
        div.appendChild(document.createTextNode(text.slice(code.length)));
        matched = true;
        break;
      }
    }
    if (!matched) div.textContent = text;
    parent.appendChild(div);
    return div;
  };

  /* ── Header amélioré (avec compteur, statut, hint) ──── */
  let cmdCounter = 0, counterEl = null, pauseEl = null, liveEl = null;

  const ensureHeader = () => {
    if (terminal.dataset.enhanced === 'true') return;
    terminal.dataset.enhanced = 'true';
    terminal.setAttribute('role', 'log');
    terminal.setAttribute('aria-live', 'polite');
    terminal.dataset.hint = 'Survole pour mettre en pause';

    const h = document.createElement('div');
    h.className = 'terminal-header';
    h.innerHTML = `
      <span class="terminal-dot terminal-dot--red"></span>
      <span class="terminal-dot terminal-dot--yellow"></span>
      <span class="terminal-dot terminal-dot--green"></span>
      <div class="terminal-heading">
        <span class="terminal-title">sisr-lab.sh</span>
        <span class="terminal-subtitle">Commandes inspirées de mes projets BTS SIO SISR</span>
      </div>
      <span class="terminal-status" id="ts-counter" aria-label="Commandes exécutées">⌘ 0</span>
      <span class="terminal-status terminal-status--paused" id="ts-paused" hidden>⏸ PAUSE</span>
      <span class="terminal-status" id="ts-live">● LIVE</span>
    `;
    terminal.appendChild(h);

    counterEl = h.querySelector('#ts-counter');
    pauseEl   = h.querySelector('#ts-paused');
    liveEl    = h.querySelector('#ts-live');

    /* Clignotement subtil du badge LIVE */
    setInterval(() => {
      if (!liveEl) return;
      liveEl.style.opacity = liveEl.style.opacity === '0.35' ? '1' : '0.35';
    }, 900);
  };

  const setCounter = (n) => {
    if (counterEl) counterEl.textContent = `⌘ ${n}`;
  };

  const setPausedBadge = (paused) => {
    if (!pauseEl || !liveEl) return;
    pauseEl.hidden = !paused;
    liveEl.hidden  = paused;
  };

  /* ── Anti-répétition : file glissante des N derniers ── */
  const recentIdx = [];
  const NO_REPEAT = Math.min(6, Math.max(2, COMMANDS.length - 2));

  const pick = () => {
    let attempts = 0;
    let i;
    do {
      i = Math.floor(Math.random() * COMMANDS.length);
      attempts++;
    } while (recentIdx.includes(i) && attempts < 30);
    recentIdx.push(i);
    if (recentIdx.length > NO_REPEAT) recentIdx.shift();
    return COMMANDS[i];
  };

  /* ── Logique principale ──────────────────────────────── */
  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  let cycleTO = null, typeTO = null, isPaused = false;
  const randMs = (a, b) => Math.random() * (b - a) + a;

  const trim = () => {
    const lines = [...terminal.children].filter(el => !el.classList.contains('terminal-header'));
    while (lines.length > MAX_LINES) {
      const first = lines.shift();
      if (!first) break;
      if (first.contains(cursor)) cursor.remove();
      first.remove();
    }
  };

  const append = (cls, cat = '') => {
    const el = document.createElement('div');
    el.className = cls;
    if (cat) el.dataset.category = cat;
    terminal.appendChild(el);
    return el;
  };

  const typeCmd = (entry) => new Promise(resolve => {
    const line = append('terminal-line', entry.category);
    const pSpan = document.createElement('span');
    pSpan.className = 'terminal-prompt';
    pSpan.textContent = PROMPT;
    const cSpan = document.createElement('span');
    cSpan.className = 'terminal-command';
    const badge = document.createElement('span');
    badge.className = 'terminal-badge';
    badge.textContent = entry.category.toUpperCase();
    line.append(pSpan, ' ', cSpan, ' ', badge, cursor);
    trim();
    terminal.scrollTop = terminal.scrollHeight;

    if (reducedMotion.matches) {
      cSpan.textContent = entry.command;
      cursor.remove();
      line.appendChild(cursor);
      resolve();
      return;
    }

    let pos = 0;
    const step = () => {
      if (isPaused) return;
      if (pos < entry.command.length) {
        cSpan.textContent += entry.command[pos++];
        terminal.scrollTop = terminal.scrollHeight;
        const ch = entry.command[pos - 1];
        const delay = ch === ' ' ? randMs(28, 58) : randMs(10, 24);
        typeTO = setTimeout(step, delay);
      } else {
        cursor.remove();
        line.appendChild(cursor);
        resolve();
      }
    };
    step();
  });

  const renderOutput = (entry) => {
    entry.output.forEach(text => {
      renderOutputLine(text, terminal);
      trim();
    });
    if (entry.note) {
      const n = append('terminal-note', entry.category);
      n.textContent = entry.note;
      trim();
    }
    terminal.scrollTop = terminal.scrollHeight;
  };

  const cycle = () => {
    if (isPaused) return;
    const entry = pick();
    typeCmd(entry).then(() => {
      if (isPaused) return;
      if (entry.output?.length) renderOutput(entry);
      cmdCounter++;
      setCounter(cmdCounter);
      cycleTO = setTimeout(cycle, reducedMotion.matches ? 2400 : randMs(1600, 3000));
    });
  };

  const clearTOs = () => { clearTimeout(cycleTO); clearTimeout(typeTO); cycleTO = typeTO = null; };
  const pause = () => {
    if (isPaused) return;
    isPaused = true;
    terminal.dataset.paused = 'true';
    setPausedBadge(true);
    clearTOs();
  };
  const resume = () => {
    if (!isPaused) return;
    isPaused = false;
    terminal.dataset.paused = 'false';
    setPausedBadge(false);
    cycleTO = setTimeout(cycle, randMs(300, 800));
  };

  /* ── Bootstrap ────────────────────────────────────── */
  ensureHeader();
  terminal.dataset.paused = 'false';
  cycle();

  terminal.addEventListener('mouseenter', pause);
  terminal.addEventListener('mouseleave', resume);
  terminal.addEventListener('focusin',    pause);
  terminal.addEventListener('focusout',   resume);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());

  /* Raccourci clavier : Alt+P pour pause/reprise (utile devant le jury) */
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      isPaused ? resume() : pause();
    }
  });

  const on = reducedMotion.addEventListener
    ? reducedMotion.addEventListener.bind(reducedMotion)
    : reducedMotion.addListener.bind(reducedMotion);
  on('change', () => { clearTOs(); if (terminal.dataset.paused !== 'true') cycleTO = setTimeout(cycle, 400); });
})();
