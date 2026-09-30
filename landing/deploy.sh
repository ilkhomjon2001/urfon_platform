#!/usr/bin/env bash
# URFON landing — serverga ajratilgan holda o'rnatish
#
# Falsafa: serverdagi HECH NARSAGA tegmaydi.
#   - kod:            /opt/urfon/
#   - foydalanuvchi:  urfon (login qila olmaydi, root emas)
#   - Node:           /opt/urfon/node/ (tizim paketlariga tegilmaydi)
#   - servis:         systemd unit urfon-landing.service
#   - port:           bo'sh port avtomatik tanlanadi
#
# Qayta-qayta ishga tushirsa bo'ladi (idempotent).
# Ishlatish:  bash deploy.sh

set -euo pipefail

APP_DIR=/opt/urfon
APP_USER=urfon
SERVICE=urfon-landing
NODE_VER=v24.21.0
WANT_PORT="${PORT:-4600}"

say() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "root sifatida ishga tushiring"; exit 1; }

# ---------- 1. Bo'sh port tanlash ----------
say "Bo'sh port qidirilmoqda (${WANT_PORT} dan boshlab)"
port=$WANT_PORT
while ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${port}\$"; do
  echo "   ${port} band, keyingisi..."
  port=$((port + 1))
  [ "$port" -lt 4700 ] || { echo "bo'sh port topilmadi"; exit 1; }
done
echo "   tanlandi: ${port}"

# ---------- 2. Foydalanuvchi ----------
say "Foydalanuvchi: ${APP_USER}"
if id "$APP_USER" >/dev/null 2>&1; then
  echo "   allaqachon bor"
else
  useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
  echo "   yaratildi (tizim foydalanuvchisi, login yo'q)"
fi

# ---------- 3. Papka ----------
say "Papka: ${APP_DIR}"
mkdir -p "$APP_DIR"

# ---------- 4. Node (faqat shu ilova uchun, tizimga tegmaydi) ----------
say "Node.js"
sys_node=""
if command -v node >/dev/null 2>&1; then
  v=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  [ "$v" -ge 18 ] 2>/dev/null && sys_node=$(command -v node)
fi

if [ -n "$sys_node" ]; then
  NODE_BIN="$sys_node"
  echo "   tizimdagi Node ishlatiladi: $($NODE_BIN -v) ($NODE_BIN)"
elif [ -x "$APP_DIR/node/bin/node" ]; then
  NODE_BIN="$APP_DIR/node/bin/node"
  echo "   avval o'rnatilgani ishlatiladi: $($NODE_BIN -v)"
else
  echo "   mos Node yo'q — ${NODE_VER} shu papkaga yuklanadi (apt'ga tegilmaydi)"
  arch=$(uname -m); case "$arch" in x86_64) a=x64;; aarch64) a=arm64;; *) echo "qo'llanmaydigan arxitektura: $arch"; exit 1;; esac
  tmp=$(mktemp -d)
  curl -fsSL "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-linux-${a}.tar.xz" -o "$tmp/node.tar.xz"
  mkdir -p "$APP_DIR/node"
  tar -xJf "$tmp/node.tar.xz" -C "$APP_DIR/node" --strip-components=1
  rm -rf "$tmp"
  NODE_BIN="$APP_DIR/node/bin/node"
  echo "   o'rnatildi: $($NODE_BIN -v)"
fi

# ---------- 5. Huquqlar ----------
say "Huquqlar"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
[ -f "$APP_DIR/.env" ] && chmod 600 "$APP_DIR/.env" && chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
echo "   egasi: ${APP_USER}, .env faqat o'ziga o'qishli"

# ---------- 6. systemd servisi ----------
say "systemd: ${SERVICE}.service"
cat > "/etc/systemd/system/${SERVICE}.service" <<UNIT
[Unit]
Description=URFON landing va lid qabul serveri
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${port}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=always
RestartSec=5

# Xavfsizlik: servis o'z papkasidan tashqariga yoza olmaydi
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${APP_DIR}
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1 || true
systemctl restart "$SERVICE"
echo "   ishga tushirildi"

# ---------- 7. Firewall (faqat mavjud bo'lsa, faqat shu port) ----------
say "Firewall"
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q '^Status: active'; then
  ufw allow "${port}/tcp" >/dev/null && echo "   ufw: ${port}/tcp ochildi"
elif command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port="${port}/tcp" >/dev/null
  firewall-cmd --reload >/dev/null
  echo "   firewalld: ${port}/tcp ochildi"
else
  echo "   faol firewall yo'q — qo'shimcha sozlash shart emas"
fi

# ---------- 8. Tekshirish ----------
say "Tekshirish"
sleep 2
if systemctl is-active --quiet "$SERVICE"; then
  echo "   servis: ishlayapti ✓"
else
  echo "   servis ISHLAMAYAPTI — jurnal:"
  journalctl -u "$SERVICE" -n 20 --no-pager
  exit 1
fi

health=$(curl -fsS --max-time 5 "http://127.0.0.1:${port}/health" || echo FAIL)
echo "   /health: ${health}"

ip=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo "SERVER_IP")
say "TAYYOR"
echo "   Sayt:    http://${ip}:${port}"
echo "   Jurnal:  journalctl -u ${SERVICE} -f"
echo "   Qayta:   systemctl restart ${SERVICE}"
echo "   Lidlar:  ${APP_DIR}/leads.jsonl"
