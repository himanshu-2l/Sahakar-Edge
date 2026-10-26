#!/usr/bin/env bash
# ==============================================================================
# Sahakar Edge — Edge Wi-Fi Hotspot & Local Captive Portal Setup
# SSID: SahakarEdge-RICM-Bhopal-01 | Subnet: 192.168.4.1/24 (DHCP: .10 - .100)
# Targets: Linux ARM64 Gateways (Raspberry Pi 4/5, Orange Pi 5, Debian/Ubuntu)
# ==============================================================================
set -euo pipefail

HOTSPOT_SSID="${HOTSPOT_SSID:-SahakarEdge-RICM-Bhopal-01}"
HOTSPOT_PASSWORD="${HOTSPOT_PASSWORD:-}" # Open AP for seamless rural village classroom onboarding
HOTSPOT_IFACE="${HOTSPOT_IFACE:-wlan0}"
HOTSPOT_IP="${HOTSPOT_IP:-192.168.4.1}"
HOTSPOT_NETMASK="${HOTSPOT_NETMASK:-255.255.255.0}"
HOTSPOT_SUBNET="192.168.4.0/24"
DHCP_RANGE_START="192.168.4.10"
DHCP_RANGE_END="192.168.4.100"
EDGE_PORTAL_PORT="${EDGE_PORTAL_PORT:-4100}"
CONF_DIR="/etc/sahakar"
HOSTAPD_CONF="${CONF_DIR}/hostapd.conf"
DNSMASQ_CONF="${CONF_DIR}/dnsmasq-hotspot.conf"

COMMAND="${1:-status}"

log() {
  echo "[Sahakar-Hotspot] $*"
}

check_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    log "⚠️ Warning: Hotspot network management typically requires root privileges (sudo)."
  fi
}

start_hotspot() {
  log "Initializing Sahakar Edge Wi-Fi Hotspot..."
  log "SSID: ${HOTSPOT_SSID} | Gateway: ${HOTSPOT_IP}/24 | Interface: ${HOTSPOT_IFACE}"

  # Prefer NetworkManager / nmcli if available
  if command -v nmcli &>/dev/null; then
    log "Configuring Access Point using NetworkManager (nmcli)..."
    if nmcli connection show "${HOTSPOT_SSID}" &>/dev/null; then
      nmcli connection delete "${HOTSPOT_SSID}" || true
    fi

    nmcli connection add type wifi ifname "${HOTSPOT_IFACE}" con-name "${HOTSPOT_SSID}" autoconnect yes \
      ssid "${HOTSPOT_SSID}" mode ap 802-11-wireless.band bg 802-11-wireless.channel 6 \
      ipv4.method shared ipv4.addresses "${HOTSPOT_IP}/24"

    nmcli connection up "${HOTSPOT_SSID}" || log "nmcli connection up issued."
  else
    # Fallback to hostapd + dnsmasq
    log "Configuring Access Point using hostapd & dnsmasq fallback..."
    mkdir -p "${CONF_DIR}"

    # Generate hostapd configuration
    cat << EOF > "${HOSTAPD_CONF}"
interface=${HOTSPOT_IFACE}
driver=nl80211
ssid=${HOTSPOT_SSID}
hw_mode=g
channel=6
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wmm_enabled=0
EOF

    # Generate dnsmasq configuration with captive portal DNS spoofing
    cat << EOF > "${DNSMASQ_CONF}"
interface=${HOTSPOT_IFACE}
bind-interfaces
dhcp-range=${DHCP_RANGE_START},${DHCP_RANGE_END},${HOTSPOT_NETMASK},24h
dhcp-option=3,${HOTSPOT_IP}
dhcp-option=6,${HOTSPOT_IP}
address=/#/${HOTSPOT_IP}
EOF

    # Assign static IP to wireless interface
    if command -v ip &>/dev/null; then
      ip addr add "${HOTSPOT_IP}/24" dev "${HOTSPOT_IFACE}" 2>/dev/null || true
      ip link set "${HOTSPOT_IFACE}" up 2>/dev/null || true
    fi

    # Start services if available
    if command -v hostapd &>/dev/null; then
      hostapd -B "${HOSTAPD_CONF}" || true
    fi
    if command -v dnsmasq &>/dev/null; then
      dnsmasq -C "${DNSMASQ_CONF}" || true
    fi
  fi

  # Captive Portal HTTP Redirection (iptables)
  if command -v iptables &>/dev/null; then
    log "Enabling Captive Portal HTTP redirect on port ${EDGE_PORTAL_PORT}..."
    iptables -t nat -A PREROUTING -i "${HOTSPOT_IFACE}" -p tcp --dport 80 -j DNAT --to-destination "${HOTSPOT_IP}:${EDGE_PORTAL_PORT}" 2>/dev/null || true
  fi

  log "✓ Hotspot active. Trainees can connect to '${HOTSPOT_SSID}' and browse http://${HOTSPOT_IP}:${EDGE_PORTAL_PORT}"
}

stop_hotspot() {
  log "Stopping Sahakar Edge Wi-Fi Hotspot..."
  if command -v nmcli &>/dev/null; then
    nmcli connection down "${HOTSPOT_SSID}" 2>/dev/null || true
  fi
  if command -v killall &>/dev/null; then
    killall hostapd 2>/dev/null || true
    killall dnsmasq 2>/dev/null || true
  fi
  if command -v iptables &>/dev/null; then
    iptables -t nat -D PREROUTING -i "${HOTSPOT_IFACE}" -p tcp --dport 80 -j DNAT --to-destination "${HOTSPOT_IP}:${EDGE_PORTAL_PORT}" 2>/dev/null || true
  fi
  log "✓ Hotspot stopped."
}

status_hotspot() {
  local active=false
  local clients=0

  if command -v nmcli &>/dev/null; then
    if nmcli connection show --active 2>/dev/null | grep -q "${HOTSPOT_SSID}"; then
      active=true
    fi
  fi

  # Client count from leases or neighbor table
  if [ -f /var/lib/misc/dnsmasq.leases ]; then
    clients=$(wc -l < /var/lib/misc/dnsmasq.leases 2>/dev/null || echo "0")
  elif command -v ip &>/dev/null; then
    clients=$(ip neigh show dev "${HOTSPOT_IFACE}" 2>/dev/null | grep -c REACHABLE || true)
  fi

  echo "=========================================================="
  echo "   Sahakar Edge Wi-Fi Hotspot Status                      "
  echo "=========================================================="
  echo "SSID:            ${HOTSPOT_SSID}"
  echo "Gateway IP:      ${HOTSPOT_IP}"
  echo "Subnet:          ${HOTSPOT_SUBNET}"
  echo "DHCP Pool:       ${DHCP_RANGE_START} - ${DHCP_RANGE_END}"
  echo "Wireless IF:     ${HOTSPOT_IFACE}"
  echo "Local Portal:    http://${HOTSPOT_IP}:${EDGE_PORTAL_PORT}"
  echo "Active Clients:  ${clients}"
  echo "Hotspot State:   $([ "$active" = true ] && echo "ACTIVE" || echo "STANDBY / CONFIGURED")"
  echo "=========================================================="
}

case "${COMMAND}" in
  start)
    check_root
    start_hotspot
    ;;
  stop)
    check_root
    stop_hotspot
    ;;
  restart)
    check_root
    stop_hotspot
    start_hotspot
    ;;
  status)
    status_hotspot
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
