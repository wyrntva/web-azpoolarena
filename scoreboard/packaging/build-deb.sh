#!/bin/bash
# =============================================================================
# build-deb.sh - Build azpool-scoreboard .deb package
# =============================================================================
# Usage: ./packaging/build-deb.sh [version]
# Output: ./build/azpool-scoreboard_<version>_amd64.deb
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-1.0.0}"
PKG_NAME="azpool-scoreboard"
ARCH="amd64"
BUILD_DIR="$APP_DIR/build"
STAGE_DIR="$BUILD_DIR/${PKG_NAME}_${VERSION}_${ARCH}"
INSTALL_DIR="$STAGE_DIR/opt/azpool-scoreboard"
SYSTEMD_DIR="$STAGE_DIR/etc/systemd/system"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║       Building ${PKG_NAME} v${VERSION} (${ARCH})                "
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Clean previous build
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Cleaning previous build..."
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/DEBIAN"
mkdir -p "$INSTALL_DIR"
mkdir -p "$SYSTEMD_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Copy DEBIAN control files
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Copying DEBIAN control files..."
cp "$SCRIPT_DIR/debian/DEBIAN/control"   "$STAGE_DIR/DEBIAN/control"
cp "$SCRIPT_DIR/debian/DEBIAN/postinst"  "$STAGE_DIR/DEBIAN/postinst"
cp "$SCRIPT_DIR/debian/DEBIAN/prerm"     "$STAGE_DIR/DEBIAN/prerm"

# Update version in control file
sed -i "s/^Version:.*/Version: ${VERSION}/" "$STAGE_DIR/DEBIAN/control"

# Set correct permissions for maintainer scripts
chmod 755 "$STAGE_DIR/DEBIAN/postinst"
chmod 755 "$STAGE_DIR/DEBIAN/prerm"
chmod 644 "$STAGE_DIR/DEBIAN/control"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Copy application files
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Copying application files..."

# Main app files
cp "$APP_DIR/app.py"           "$INSTALL_DIR/"
cp "$APP_DIR/requirements.txt" "$INSTALL_DIR/"
cp "$APP_DIR/kiosk-run.sh"     "$INSTALL_DIR/"
chmod 755 "$INSTALL_DIR/kiosk-run.sh"

# Write VERSION file for runtime version detection
echo "$VERSION" > "$INSTALL_DIR/VERSION"

# Core Python modules
mkdir -p "$INSTALL_DIR/core"
for f in "$APP_DIR"/core/*.py; do
    [ -f "$f" ] && cp "$f" "$INSTALL_DIR/core/"
done

# QML files (recursive)
cp -r "$APP_DIR/qml" "$INSTALL_DIR/"

# Assets (recursive)
cp -r "$APP_DIR/assets" "$INSTALL_DIR/"

# Scripts
mkdir -p "$INSTALL_DIR/scripts"
for f in "$APP_DIR"/scripts/*.sh "$APP_DIR"/scripts/*.py; do
    [ -f "$f" ] && cp "$f" "$INSTALL_DIR/scripts/"
done
chmod +x "$INSTALL_DIR/scripts/"*.sh

# Config directory (create structure, actual config created by postinst)
mkdir -p "$INSTALL_DIR/config"

# Runtime directory placeholder
mkdir -p "$INSTALL_DIR/runtime"

# Documentation
mkdir -p "$INSTALL_DIR/docs"
for f in "$APP_DIR"/docs/*.md; do
    [ -f "$f" ] && cp "$f" "$INSTALL_DIR/docs/"
done

# ─────────────────────────────────────────────────────────────────────────────
# 4. Copy systemd service files
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Copying systemd service files..."
cp "$SCRIPT_DIR/systemd/azpool-cam-delay.service"   "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/azpool-cam-record.service"  "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/azpool-cam-prune.service"   "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/azpool-cam-prune.timer"     "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/azpool-clip-server.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/azpool-cam-index.service"   "$SYSTEMD_DIR/"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Remove __pycache__ and unnecessary files
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Cleaning build artifacts..."
find "$INSTALL_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$INSTALL_DIR" -name "*.pyc" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name "*.log" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name "*.bak" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name ".DS_Store" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name "debug*.txt" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name "dummy.txt" -delete 2>/dev/null || true
find "$INSTALL_DIR" -name "test_vid*" -delete 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# 6. Calculate installed size
# ─────────────────────────────────────────────────────────────────────────────
INSTALLED_SIZE=$(du -sk "$STAGE_DIR" | cut -f1)
sed -i "/^Description:/i Installed-Size: ${INSTALLED_SIZE}" "$STAGE_DIR/DEBIAN/control"

# ─────────────────────────────────────────────────────────────────────────────
# 7. Build the .deb package
# ─────────────────────────────────────────────────────────────────────────────
echo ">>> Building .deb package..."
DEB_FILE="$BUILD_DIR/${PKG_NAME}_${VERSION}_${ARCH}.deb"
dpkg-deb --build --root-owner-group "$STAGE_DIR" "$DEB_FILE"

# ─────────────────────────────────────────────────────────────────────────────
# 8. Verify
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo ">>> Package info:"
dpkg-deb --info "$DEB_FILE"

DEB_SIZE=$(du -h "$DEB_FILE" | cut -f1)
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Build successful!                                          ║"
echo "║                                                                ║"
echo "║  Package: $DEB_FILE"
echo "║  Size:    $DEB_SIZE"
echo "║                                                                ║"
echo "║  Install on target machine:                                    ║"
echo "║    sudo dpkg -i ${PKG_NAME}_${VERSION}_${ARCH}.deb             ║"
echo "║    sudo apt-get install -f   # fix missing deps if needed      ║"
echo "║    sudo reboot                                                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
