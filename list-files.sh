#!/bin/bash
echo "=== OPINIA PROJECT FILES ==="
find /home/claude/opinia -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -name "*.zip" \
  | sort
