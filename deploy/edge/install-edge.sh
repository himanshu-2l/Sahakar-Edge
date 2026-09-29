#!/usr/bin/env bash
# ==============================================================================
# Sahakar Edge — Linux ARM64 Node Installer
# Targets: Raspberry Pi 4/5, Orange Pi 5, or industrial ARM64 gateways running Debian/Ubuntu
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "   Installing Sahakar Edge Node Daemon (NCCT SIH Stack)   "
echo "=========================================================="

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: Please execute installer as root or using sudo."
  exit 1
fi

# 1. Create dedicated system user and directories
echo ">>> Creating sahakar system user and data directories..."
id -u sahakar &>/dev/null || useradd -r -s /bin/false -d /var/lib/sahakar-edge sahakar
mkdir -p /opt/sahakar-edge
mkdir -p /etc/sahakar
mkdir -p /var/lib/sahakar-edge/data
mkdir -p /var/lib/sahakar-edge/assets

# 2. Write environment configuration
echo ">>> Writing /etc/sahakar/edge.env..."
cat << 'EOF' > /etc/sahakar/edge.env
NODE_ENV=production
EDGE_PORT=5000
EDGE_NODE_ID=edge-node-ricm-bhopal-01
EDGE_DB_PATH=/var/lib/sahakar-edge/data/edge.sqlite
CENTRAL_API_URL=https://central.sahakar.gov.in
EOF

# 3. Copy application distribution files
echo ">>> Deploying binary bundle to /opt/sahakar-edge..."
# Assumes build directory copied to target host
chmod -R 755 /opt/sahakar-edge
chown -R sahakar:sahakar /var/lib/sahakar-edge
chown -R sahakar:sahakar /etc/sahakar

# 4. Install systemd unit
echo ">>> Installing systemd service..."
cp "$(dirname "$0")/sahakar-edge.service" /etc/systemd/system/sahakar-edge.service
systemctl daemon-reload
systemctl enable sahakar-edge.service
systemctl restart sahakar-edge.service

echo ""
echo "=========================================================="
echo "   ✓ Sahakar Edge Node installed and active!             "
echo "   • Service: systemctl status sahakar-edge               "
echo "   • Logs:    journalctl -u sahakar-edge -f               "
echo "   • Health:  curl -s http://localhost:5000/health        "
echo "=========================================================="
