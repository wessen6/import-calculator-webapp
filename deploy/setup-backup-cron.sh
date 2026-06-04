#!/usr/bin/env bash
# Install imcalc rates backup script + daily cron (run once on VPS as root or deploy user).

set -euo pipefail

SCRIPT_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backup-rates.sh"
SCRIPT_DST="/usr/local/bin/imcalc-backup-rates.sh"
CRON_LINE='15 3 * * * /usr/local/bin/imcalc-backup-rates.sh >> /var/log/imcalc-backup.log 2>&1'

install -m 755 "$SCRIPT_SRC" "$SCRIPT_DST"
touch /var/log/imcalc-backup.log
chmod 644 /var/log/imcalc-backup.log

if crontab -l 2>/dev/null | grep -Fq "$SCRIPT_DST"; then
  echo "cron already configured for $SCRIPT_DST"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "cron added: $CRON_LINE"
fi

"$SCRIPT_DST"
echo "done — check /var/backups/imcalc and /var/log/imcalc-backup.log"
