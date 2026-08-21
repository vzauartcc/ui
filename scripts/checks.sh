#!/usr/bin/env bash

set -euo pipefail


npm run format

npm run type-check

npm run lint
