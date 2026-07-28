#!/usr/bin/env bash

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <config_name> [arguments...]"
    exit 1
fi

if ! command -v doppler &> /dev/null; then
    echo "Error: Doppler CLI not found. Install it first."
    exit 1
fi

# Extract config name for Doppler and shift remaining arguments to the left.
CONFIG_NAME=$1
shift

export LOCAL_DEV_ENVIRONMENT="true"

doppler run -p data-parser -c "$CONFIG_NAME" -- npm run dev
