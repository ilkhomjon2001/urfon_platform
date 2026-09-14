#!/usr/bin/env bash
# URFON zaxira nusxasi: PostgreSQL (pg_dump, custom format) + yuklangan fayllar (tar.gz) va eski nusxalarni aylantirish.
#
#   ./deploy/backup.sh                         # qoʻlda
#   crontab -e  →  30 2 * * * /opt/urfon/platforma/deploy/backup.sh >> /var/log/urfon-backup.log 2>&1
#
# Sozlamalar (ixtiyoriy, muhit oʻzgaruvchilari):
#   BACKUP_DIR     nusxalar papkasi (standart: platforma/deploy/backups)
#   KEEP_DAYS      necha kunlik nusxa saqlanadi (standart: 14)
#   RCLONE_REMOTE  masalan "s3:urfon-backup" — boʻlsa, nusxa serverdan tashqariga ham koʻchiriladi (rclone oʻrnatilgan boʻlishi kerak)
# Tiklash: deploy/README-DEPLOY.md → "Zaxiradan tiklash".
set -euo pipefail

cd "$(dirname "$0")/.."   # platforma/ — docker-compose.yml shu yerda
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/deploy/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M)"

umask 077
mkdir -p "$BACKUP_DIR"
echo "[$(date -Is)] zaxira boshlandi → $BACKUP_DIR"

# 1) Baza (audit jurnali ham ichida). -Fc: siqilgan, pg_restore bilan tiklanadi.
docker compose exec -T db pg_dump -U urfon -d urfon -Fc --no-owner > "$BACKUP_DIR/db-$STAMP.dump.tmp"
mv "$BACKUP_DIR/db-$STAMP.dump.tmp" "$BACKUP_DIR/db-$STAMP.dump"

# 2) Yuklangan fayllar (uyga vazifa audiolari, materiallar …)
docker compose exec -T app tar -czf - -C /data uploads > "$BACKUP_DIR/uploads-$STAMP.tar.gz.tmp"
mv "$BACKUP_DIR/uploads-$STAMP.tar.gz.tmp" "$BACKUP_DIR/uploads-$STAMP.tar.gz"

# 3) Aylantirish: KEEP_DAYS kundan eskilarini oʻchirish
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.tmp' -mmin +120 -delete

# 4) Ixtiyoriy: serverdan tashqariga nusxa
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --include "db-$STAMP.dump" --include "uploads-$STAMP.tar.gz"
fi

echo "[$(date -Is)] tayyor: db-$STAMP.dump ($(du -h "$BACKUP_DIR/db-$STAMP.dump" | cut -f1)), uploads-$STAMP.tar.gz ($(du -h "$BACKUP_DIR/uploads-$STAMP.tar.gz" | cut -f1))"
