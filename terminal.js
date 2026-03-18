(() => {
  'use strict';

  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PROMPT = 'noe@infra-lab:~$';
  const MAX_LINES = 20;

  const COMMANDS = [
    {
      category: 'linux',
      command: 'hostnamectl',
      output: [
        'Static hostname: infra-lab',
        'Operating System: Debian GNU/Linux 12 (bookworm)',
        'Kernel: Linux 6.1.0',
        'Architecture: x86-64'
      ]
    },
    {
      category: 'network',
      command: 'ip addr show eth0',
      output: [
        '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500',
        '    inet 192.168.10.12/24 brd 192.168.10.255 scope global eth0',
        '    valid_lft forever preferred_lft forever'
      ]
    },
    {
      category: 'network',
      command: 'ping -c 4 192.168.10.1',
      output: [
        'PING 192.168.10.1 (192.168.10.1) 56(84) bytes of data.',
        '64 bytes from 192.168.10.1: icmp_seq=1 ttl=64 time=0.91 ms',
        '64 bytes from 192.168.10.1: icmp_seq=2 ttl=64 time=0.88 ms',
        '64 bytes from 192.168.10.1: icmp_seq=3 ttl=64 time=0.95 ms',
        '64 bytes from 192.168.10.1: icmp_seq=4 ttl=64 time=0.90 ms',
        '',
        '4 packets transmitted, 4 received, 0% packet loss'
      ]
    },
    {
      category: 'services',
      command: 'systemctl status apache2 --no-pager',
      output: [
        '● apache2.service - The Apache HTTP Server',
        '   Loaded: loaded (/lib/systemd/system/apache2.service; enabled)',
        '   Active: active (running)',
        '   Docs: https://httpd.apache.org/docs/'
      ]
    },
    {
      category: 'services',
      command: 'ss -tulpn | grep -E ":80|:443|:22"',
      output: [
        'tcp   LISTEN 0      511        0.0.0.0:80      0.0.0.0:*    users:(("apache2",pid=1273))',
        'tcp   LISTEN 0      128        0.0.0.0:22      0.0.0.0:*    users:(("sshd",pid=814))',
        'tcp   LISTEN 0      511        0.0.0.0:443     0.0.0.0:*    users:(("apache2",pid=1273))'
      ]
    },
    {
      category: 'web',
      command: 'ls -la /var/www/html',
      output: [
        'total 20',
        'drwxr-xr-x 2 root root 4096 Mar 12 09:10 .',
        'drwxr-xr-x 3 root root 4096 Mar 12 08:54 ..',
        '-rw-r--r-- 1 root root 1782 Mar 12 09:10 index.html',
        '-rw-r--r-- 1 root root  912 Mar 12 09:10 intranet.html'
      ]
    },
    {
      category: 'dhcp',
      command: 'Get-DhcpServerv4Scope',
      output: [
        'ScopeId       SubnetMask      Name        State',
        '-------       ----------      ----        -----',
        '192.168.30.0  255.255.255.0   VLAN30      Active',
        '192.168.40.0  255.255.255.0   VLAN40      Active'
      ]
    },
    {
      category: 'dns',
      command: 'Resolve-DnsName serveur-fichiers.local',
      output: [
        'Name                        Type   TTL   Section    IPAddress',
        '----                        ----   ---   -------    ---------',
        'serveur-fichiers.local      A      3600  Answer     192.168.10.20'
      ]
    },
    {
      category: 'ad',
      command: 'Get-ADUser -Identity nchami -Properties Enabled',
      output: [
        'DistinguishedName : CN=Noe Chami,OU=Utilisateurs,DC=lab,DC=local',
        'Enabled           : True',
        'Name              : Noe Chami',
        'SamAccountName    : nchami'
      ]
    },
    {
      category: 'vm',
      command: 'qm list',
      output: [
        'VMID   NAME           STATUS     MEM(MB)    BOOTDISK(GB)  PID',
        '101    WIN-SRV-AD     running    4096       80.00         4432',
        '102    DEBIAN-WEB     running    2048       32.00         4518'
      ]
    },
    {
      category: 'automation',
      command: './backup-config.sh',
      output: [
        '[OK] Export configuration switch SW-CORE',
        '[OK] Sauvegarde apache2.conf',
        '[OK] Archive générée : backup-2026-03-16.tar.gz'
      ]
    },
    {
      category: 'portfolio',
      command: 'cat profil.txt',
      output: [
        'Noé Chami',
        'BTS SIO - option SISR',
        'Compétences : Windows Server, Linux, VLAN, DHCP, DNS, Apache, PowerShell',
        'Objectif : Administrateur systèmes et réseaux'
      ]
    }
  ];

  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  let previousIndex = -1;
  let cycleTimeout = null;
  let typingTimeout = null;
  let isStopped = false;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const ensureHeader = () => {
    if (terminal.dataset.enhanced === 'true') return;

    terminal.dataset.enhanced = 'true';
    terminal.setAttribute('role', 'log');
    terminal.setAttribute('aria-live', 'polite');

    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
      <span class="terminal-dot terminal-dot--red"></span>
      <span class="terminal-dot terminal-dot--yellow"></span>
      <span class="terminal-dot terminal-dot--green"></span>
      <span class="terminal-title">infra-demo.sh</span>
    `;

    terminal.appendChild(header);
  };

  const trimHistory = () => {
    const lines = [...terminal.children].filter(
      element => !element.classList.contains('terminal-header')
    );

    while (lines.length > MAX_LINES) {
      const first = lines.shift();
      if (!first) break;
      if (first.contains(cursor)) cursor.remove();
      first.remove();
    }
  };

  const pickCommand = () => {
    if (!COMMANDS.length) {
      return { category: 'default', command: 'echo "Portfolio BTS SIO"', output: [] };
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

    if (category) {
      line.dataset.category = category;
    }

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

    if (REDUCED_MOTION.matches) {
      commandSpan.textContent = entry.command;
      cursor.remove();
      line.appendChild(cursor);
      resolve();
      return;
    }

    let position = 0;

    const step = () => {
      if (isStopped) return;

      if (position < entry.command.length) {
        commandSpan.textContent += entry.command.charAt(position);
        position += 1;
        terminal.scrollTop = terminal.scrollHeight;

        const currentChar = entry.command.charAt(position - 1);
        const pause = currentChar === ' '
          ? randomBetween(35, 70)
          : randomBetween(16, 36);

        typingTimeout = window.setTimeout(step, pause);
      } else {
        cursor.remove();
        line.appendChild(cursor);
        resolve();
      }
    };

    step();
  });

  const renderOutput = (lines, category) => {
    lines.forEach((text) => {
      const outputLine = appendLine('terminal-output', category);
      outputLine.textContent = text;
      trimHistory();
    });

    terminal.scrollTop = terminal.scrollHeight;
  };

  const cycle = () => {
    if (isStopped) return;

    const entry = pickCommand();

    typeCommand(entry).then(() => {
      if (isStopped) return;

      if (Array.isArray(entry.output) && entry.output.length) {
        renderOutput(entry.output, entry.category);
      }

      const pause = REDUCED_MOTION.matches
        ? 2400
        : randomBetween(1800, 3200);

      cycleTimeout = window.setTimeout(cycle, pause);
    });
  };

  const stop = () => {
    isStopped = true;
    if (cycleTimeout) {
      window.clearTimeout(cycleTimeout);
      cycleTimeout = null;
    }
    if (typingTimeout) {
      window.clearTimeout(typingTimeout);
      typingTimeout = null;
    }
  };

  const restart = () => {
    if (!isStopped) return;
    isStopped = false;
    cycle();
  };

  ensureHeader();
  cycle();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      restart();
    }
  });
})();
