// electron-builder, après l'assemblage du dossier du jeu (afterPack) : sous Linux, l'exécutable devient un script de
// lancement qui démarre le vrai programme (legend-of-nashi.bin).
//
// Pourquoi : Chromium isole ses processus avec les espaces de noms utilisateur (user namespaces) du noyau ; s'ils sont
// interdits, il se rabat sur l'assistant chrome-sandbox, qui doit appartenir à root avec le bit setuid (4755). Ubuntu
// 24.04 et suivantes réservent ces espaces de noms aux applications qui ont un profil AppArmor, et ni le dossier du jeu
// (.tar.gz, Steam) ni l'AppImage ne peuvent donner chrome-sandbox à root : Chromium s'arrêterait au démarrage (« The
// SUID sandbox helper binary was found, but is not configured correctly »), avant même app/main.js — un réglage posé
// depuis main.js arrive trop tard, seule la ligne de commande compte. Le script ajoute donc --no-sandbox dans ce cas
// seulement ; ailleurs (Arch, SteamOS, Fedora…) le bac à sable reste actif. NASHI_NO_SANDBOX=1 le force (options de
// lancement Steam : NASHI_NO_SANDBOX=1 %command%). Le jeu n'affiche que son propre HTML et bloque toute navigation.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const launcher = bin => `#!/bin/sh
# The Legend of Nashi : lancement sous Linux (voir tools/after_pack.cjs).
here=$(dirname "$(readlink -f "$0")")
bin="$here/${bin}"
helper="$here/chrome-sandbox"
blocked=
if [ "\${NASHI_NO_SANDBOX:-}" = 1 ]; then
  blocked=1
elif [ -u "$helper" ] && [ "$(stat -c %u "$helper" 2>/dev/null)" = 0 ]; then
  blocked=
elif [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = 1 ] ||
  [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = 0 ] ||
  [ "$(cat /proc/sys/user/max_user_namespaces 2>/dev/null)" = 0 ]; then
  blocked=1
fi
if [ -n "$blocked" ]; then
  exec "$bin" --no-sandbox "$@"
fi
exec "$bin" "$@"
`;

/** @param {{ electronPlatformName: string, appOutDir: string, packager: { executableName: string } }} context */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;
  const name = context.packager.executableName,
    exe = path.join(context.appOutDir, name),
    bin = name + '.bin';
  fs.renameSync(exe, path.join(context.appOutDir, bin));
  fs.writeFileSync(exe, launcher(bin), { mode: 0o755 });
};
exports.launcher = launcher;
