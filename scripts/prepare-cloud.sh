#!/usr/bin/env bash
set -euo pipefail
# Keep runtime/cache files outside the checkout and keep lockfiles frozen.
fd_node_root=/workspace/.tools/node-v22.23.3-linux-x64
if [[ ! -x "$fd_node_root/bin/node" ]]; then
  mkdir -p /workspace/.tools
  fd_download_dir=$(mktemp -d /workspace/.tools/fd-node-download.XXXXXX)
  trap 'rm -rf "$fd_download_dir"' EXIT
  curl -fsS --max-time 60 -o "$fd_download_dir/SHASUMS256.txt" https://nodejs.org/dist/v22.23.3/SHASUMS256.txt
  curl -fsS --max-time 60 -o "$fd_download_dir/node-v22.23.3-linux-x64.tar.xz" https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-x64.tar.xz
  (
    cd "$fd_download_dir"
    awk '$2 == "node-v22.23.3-linux-x64.tar.xz"' SHASUMS256.txt > selected-sha.txt
    test -s selected-sha.txt
    sha256sum --check selected-sha.txt
    tar -xJf node-v22.23.3-linux-x64.tar.xz -C /workspace/.tools
  )
fi
export PATH="$fd_node_root/bin:$PATH"
export npm_config_cache=/workspace/.npm-cache
export XDG_CONFIG_HOME=/workspace/.config
export FIREBASE_EMULATORS_PATH=/workspace/.firebase-emulators
cd /workspace/furniturediscounters.github.io
node --version
npm ci --no-fund --no-audit
npm run build
npm run build:editor
