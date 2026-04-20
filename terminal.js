(() => {
  'use strict';

  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PROMPT = 'noe@sisr-lab:~$';
  const MAX_LINES = 22;

  const COMMANDS = [
    {
      category: 'linux',
      command: 'hostnamectl',
      note: 'Environnement Linux utilisé pour mes labs système et services.',
      output: [
        'Static hostname: sisr-lab',
        'Operating System: Debian GNU/Linux 12 (bookworm)',
        'Kernel: Linux 6.1.0-amd64',
        'Architecture: x86-64'
      ]
    },
    {
      category: 'network',
      command: 'show vlan brief',
      note: 'Fait écho à mes travaux de segmentation réseau sur GSB.',
      output: [
        'VLAN Name                             Status    Ports',
        '10   ADMIN                            active    Gi0/1, Gi0/2',
        '20   SERVEURS                         active    Gi0/10, Gi0/11',
        '30   UTILISATEURS                     active    Gi0/20, Gi0/21',
        '99   MANAGEMENT                       active    Gi0/24'
      ]
    },
    {
      category: 'dhcp',
      command: 'Get-DhcpServerv4Scope',
      note: 'Commandes proches de ma réalisation DHCP + services Windows.',
      output: [
        'ScopeId       SubnetMask      Name              State',
        '-------       ----------      ----              -----',
        '192.168.30.0  255.255.255.0   VLAN30-Users      Active',
        '192.168.40.0  255.255.255.0   VLAN40-Services   Active'
      ]
    },
    {
      category: 'dns',
      command: 'Resolve-DnsName srv-fichiers.lab.local',
      note: 'Vérification DNS typique dans une mise à disposition de service.',
      output: [
        'Name                       Type   TTL   Section    IPAddress',
        '----                       ----   ---   -------    ---------',
        'srv-fichiers.lab.local     A      3600  Answer     192.168.20.15'
      ]
    },
    {
      category: 'ad',
      command: 'Get-ADUser nchami -Properties Enabled,LastLogonDate',
      note: 'Rappelle mes usages PowerShell autour d’Active Directory.',
      output: [
        'Name              : Noe Chami',
        'Enabled           : True',
        'SamAccountName    : nchami',
        'LastLogonDate     : 2026-04-18 09:12:43'
      ]
    },
    {
      category: 'ad',
      command: 'repadmin /replsummary',
      note: 'Surveillance de la réplication AD dans mes TP d’infrastructure.',
      output: [
        'Source DSA          largest delta    fails/total %%   error',
        'DC01                           00m:37s    0 /  10    0',
        'DC02                           00m:42s    0 /  10    0'
      ]
    },
    {
      category: 'services',
      command: 'systemctl status apache2 --no-pager',
      note: 'Service web mobilisé sur mes projets Linux / portfolio.',
      output: [
        '● apache2.service - The Apache HTTP Server',
        '   Loaded: loaded (/lib/systemd/system/apache2.service; enabled)',
        '   Active: active (running) since Tue 2026-04-15 08:41:22 CEST'
      ]
    },
    {
      category: 'web',
      command: 'ls -la /var/www/html/portfolio',
      note: 'Fait le lien avec l’hébergement et la structure de mon portfolio.',
      output: [
        'drwxr-xr-x 5 noe  www-data 4096 Apr 18 18:20 .',
        'drwxr-xr-x 3 root root     4096 Apr 18 08:54 ..',
        '-rw-r--r-- 1 noe  www-data 48778 Apr 18 18:20 index.html',
        '-rw-r--r-- 1 noe  www-data 13126 Apr 18 18:20 veille.html'
      ]
    },
    {
      category: 'vm',
      command: 'esxcli vm process list',
      note: 'Clin d’œil à mes manipulations de virtualisation et d’infrastructure.',
      output: [
        'WIN-SRV-AD',
        '   Process ID: 420117',
        'DEBIAN-WEB',
        '   Process ID: 420231'
      ]
    },
    {
      category: 'backup',
      command: 'veeamconfig session list',
      note: 'Cohérent avec mes tâches de sauvegarde et continuité de service.',
      output: [
        'JobName            State      Result     EndTime',
        'Backup-Infra       Stopped    Success    2026-04-17 22:14',
        'Backup-Web         Stopped    Success    2026-04-17 22:29'
      ]
    },
    {
      category: 'automation',
      command: './backup-config.sh --targets sw-core,fw-edge',
      note: 'Automatisation de sauvegardes et d’exports de configuration.',
      output: [
        '[OK] Export configuration sw-core',
        '[OK] Export configuration fw-edge',
        '[OK] Archive generated: config-backup-2026-04-18.tar.gz'
      ]
    },
    {
      category: 'security',
      command: 'nessuscli scan --policy "Audit réseau"',
      note: 'Écho à mon rapport Nessus et à la démarche d’analyse de vulnérabilités.',
      output: [
        '[INFO] Host discovered: 192.168.20.12',
        '[INFO] Service detected: UnrealIRCd 3.2.8.1',
        '[WARN] CVE identified: backdoor vulnerability',
        '[OK] Report exported: rapport-nessus.html'
      ]
    },
    {
      category: 'portfolio',
      command: 'cat profil.txt',
      note: 'Résumé direct de mon profil pour le jury.',
      output: [
        'Noé Chami',
        'BTS SIO - option SISR',
        'Compétences : Windows Server, Linux, VLAN, DHCP, DNS, Apache, PowerShell',
        'Objectif : administrateur systèmes et réseaux'
      ]
    }
  ];

  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  let previousIndex = -1;
  let cycleTimeout = null;
  let typingTimeout = null;
  let isPaused = false;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const setHint = (text) => {
    terminal.dataset.hint = text;
  };

  const ensureHeader = () => {
    if (terminal.dataset.enhanced === 'true') return;

    terminal.dataset.enhanced = 'true';
    terminal.setAttribute('role', 'log');
    terminal.setAttribute('aria-live', 'polite');
    setHint('Survole pour mettre en pause');

    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
      <span class="terminal-dot terminal-dot--red"></span>
      <span class="terminal-dot terminal-dot--yellow"></span>
      <span class="terminal-dot terminal-dot--green"></span>
      <div class="terminal-heading">
        <span class="terminal-title">portfolio-live.sh</span>
        <span class="terminal-subtitle">Commandes inspirées de mes projets SISR et de mon portfolio BTS SIO</span>
      </div>
      <span class="terminal-status">SISR</span>
      <span class="terminal-status">BTS</span>
      <span class="terminal-status">LIVE</span>
    `;

    terminal.appendChild(header);
  };

  const trimHistory = () => {
    const lines = [...terminal.children].filter((element) => !element.classList.contains('terminal-header'));
    while (lines.length > MAX_LINES) {
      const first = lines.shift();
      if (!first) break;
      if (first.contains(cursor)) cursor.remove();
      first.remove();
    }
  };

  const pickCommand = () => {
    if (!COMMANDS.length) {
      return { category: 'portfolio', command: 'echo "Portfolio BTS SIO"', output: [], note: '' };
    }

    let index = Math.floor(Math.random() * COMMANDS.length);
    if (COMMANDS.length > 1) {
      while (index === previousIndex) {
        index = Math.floor(Math.random() * COMMANDS.length);
      }
    }
    previousIndex = index;
    return COMMANDS[index];
  };

  const appendLine = (className, category = '') => {
    const line = document.createElement('div');
    line.className = className;
    if (category) line.dataset.category = category;
    terminal.appendChild(line);
    return line;
  };

  const typeCommand = (entry) => new Promise((resolve) => {
    const line = appendLine('terminal-line', entry.category);
    const promptSpan = document.createElement('span');
    promptSpan.className = 'terminal-prompt';
    promptSpan.textContent = PROMPT;

    const commandSpan = document.createElement('span');
    commandSpan.className = 'terminal-command';

    const badge = document.createElement('span');
    badge.className = 'terminal-badge';
    badge.textContent = entry.category.toUpperCase();

    line.append(promptSpan, document.createTextNode(' '), commandSpan, document.createTextNode(' '), badge, cursor);

    trimHistory();
    terminal.scrollTop = terminal.scrollHeight;

    if (reducedMotionQuery.matches) {
      commandSpan.textContent = entry.command;
      cursor.remove();
      line.appendChild(cursor);
      resolve();
      return;
    }

    let position = 0;

    const step = () => {
      if (isPaused) return;
      if (position < entry.command.length) {
        commandSpan.textContent += entry.command.charAt(position);
        position += 1;
        terminal.scrollTop = terminal.scrollHeight;

        const currentChar = entry.command.charAt(position - 1);
        const pause = currentChar === ' ' ? randomBetween(30, 60) : randomBetween(12, 28);
        typingTimeout = window.setTimeout(step, pause);
      } else {
        cursor.remove();
        line.appendChild(cursor);
        resolve();
      }
    };

    step();
  });

  const renderOutput = (entry) => {
    entry.output.forEach((text) => {
      const outputLine = appendLine('terminal-output', entry.category);
      outputLine.textContent = text;
      trimHistory();
    });

    if (entry.note) {
      const noteLine = appendLine('terminal-note', entry.category);
      noteLine.textContent = entry.note;
      trimHistory();
    }

    terminal.scrollTop = terminal.scrollHeight;
  };

  const queueNextCycle = () => {
    const pause = reducedMotionQuery.matches ? 2600 : randomBetween(1700, 3100);
    cycleTimeout = window.setTimeout(cycle, pause);
  };

  const cycle = () => {
    if (isPaused) return;
    const entry = pickCommand();
    typeCommand(entry).then(() => {
      if (isPaused) return;
      if (Array.isArray(entry.output) && entry.output.length) {
        renderOutput(entry);
      }
      queueNextCycle();
    });
  };

  const clearTimers = () => {
    if (cycleTimeout) {
      window.clearTimeout(cycleTimeout);
      cycleTimeout = null;
    }
    if (typingTimeout) {
      window.clearTimeout(typingTimeout);
      typingTimeout = null;
    }
  };

  const pauseTerminal = () => {
    if (isPaused) return;
    isPaused = true;
    terminal.dataset.paused = 'true';
    clearTimers();
  };

  const resumeTerminal = () => {
    if (!isPaused) return;
    isPaused = false;
    terminal.dataset.paused = 'false';
    queueNextCycle();
  };

  ensureHeader();
  terminal.dataset.paused = 'false';
  cycle();

  terminal.addEventListener('mouseenter', pauseTerminal);
  terminal.addEventListener('mouseleave', resumeTerminal);
  terminal.addEventListener('focusin', pauseTerminal);
  terminal.addEventListener('focusout', resumeTerminal);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseTerminal();
    } else {
      resumeTerminal();
    }
  });

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', () => {
      clearTimers();
      if (terminal.dataset.paused !== 'true') {
        queueNextCycle();
      }
    });
  }
})();
