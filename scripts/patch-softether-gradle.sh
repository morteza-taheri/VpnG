#!/usr/bin/env bash
# Patches SoftEtherClient/build.gradle, which is missing the Kotlin Android
# plugin entirely (it has .kt sources but only applies 'com.android.library')
# and uses a `kotlin { compilerOptions {...} }` block nested inside
# `android {}` that isn't supported by the Kotlin plugin version this
# project pins. This is a bug in the upstream module itself, not something
# we can fix by editing our own build files — since SoftEtherClient is a
# git submodule we don't have push access to, this patch has to be
# reapplied after every `git submodule update`.
#
# Usage (from repo root, after `git submodule update --init --recursive`):
#   bash scripts/patch-softether-gradle.sh
#
# Idempotent — safe to run multiple times.

set -euo pipefail

FILE="SoftEtherClient/build.gradle"

if [ ! -f "$FILE" ]; then
    echo "ERROR: $FILE not found — run this from the repo root after 'git submodule update --init --recursive'."
    exit 1
fi

if grep -q "org.jetbrains.kotlin.android" "$FILE"; then
    echo "Already patched: $FILE"
else
    # 1. Add the missing Kotlin Android plugin (no version — resolves from
    #    the root project's plugin management, same version used by :app).
    sed -i.bak "s/id 'com.android.library'/id 'com.android.library'\n    id 'org.jetbrains.kotlin.android'/" "$FILE"

    # 2. Replace the fragile `kotlin { compilerOptions { jvmTarget = ... } }`
    #    block (requires a newer Kotlin plugin than this project pins) with
    #    the classic, universally-supported `kotlinOptions { jvmTarget = "17" }`.
    python3 - "$FILE" << 'PYEOF'
import re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
text = text.replace("import org.jetbrains.kotlin.gradle.dsl.JvmTarget\n\n", "")
text = re.sub(
    r"kotlin \{\s*compilerOptions \{\s*jvmTarget = JvmTarget\.JVM_17\s*\}\s*\}",
    'kotlinOptions {\n        jvmTarget = "17"\n    }',
    text
)
open(path, "w", encoding="utf-8").write(text)
PYEOF

    rm -f "$FILE.bak"
    echo "Patched: $FILE"
fi
