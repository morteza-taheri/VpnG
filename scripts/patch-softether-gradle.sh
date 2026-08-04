#!/usr/bin/env bash
# Patches known bugs/version conflicts in SoftEtherClient's own build.gradle.
# This is an upstream (external) file we don't have push access to (it's a
# git submodule), so this patch has to be reapplied after every
# `git submodule update`.
#
# Usage (from repo root, after `git submodule update --init --recursive`):
#   bash scripts/patch-softether-gradle.sh
#
# Each fix below is applied independently and is idempotent — safe to run
# multiple times, and safe to run after only some fixes were already applied.

set -euo pipefail

FILE="SoftEtherClient/build.gradle"

if [ ! -f "$FILE" ]; then
    echo "ERROR: $FILE not found — run this from the repo root after 'git submodule update --init --recursive'."
    exit 1
fi

CHANGED=0

# --- Fix 1: missing Kotlin Android plugin -----------------------------
# The module has .kt sources but only applies 'com.android.library', so
# Kotlin files wouldn't compile at all.
if grep -q "org.jetbrains.kotlin.android" "$FILE"; then
    echo "[1/3] Kotlin plugin: already present"
else
    sed -i.bak "s/id 'com.android.library'/id 'com.android.library'\n    id 'org.jetbrains.kotlin.android'/" "$FILE"
    rm -f "$FILE.bak"
    echo "[1/3] Kotlin plugin: added"
    CHANGED=1
fi

# --- Fix 2: fragile kotlin{compilerOptions{}} block inside android{} --
# Requires a newer Kotlin Gradle Plugin than this project pins; replaced
# with the classic, version-independent kotlinOptions{} syntax.
if grep -q "kotlin {" "$FILE" && grep -q "compilerOptions {" "$FILE"; then
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
    echo "[2/3] kotlin{compilerOptions{}} block: replaced with kotlinOptions{}"
    CHANGED=1
else
    echo "[2/3] kotlin{compilerOptions{}} block: not present (already patched or never had it)"
fi

# --- Fix 3: androidx.core:core-ktx pinned too new for our compileSdk ---
# The module requests 1.18.0 directly, which needs compileSdk 36 + AGP
# 8.9.1+ (we're on compileSdk 34 / AGP 8.5.0) — causes a hard AAR-metadata
# build failure ("requires libraries...to compile against version 36").
# The module only uses androidx.core.app.NotificationCompat, unchanged
# since core-ktx 1.0, so downgrading is safe — matches the version :app
# itself uses (see app/build.gradle.kts).
if grep -q "androidx.core:core-ktx:1.18.0" "$FILE"; then
    sed -i.bak "s/androidx.core:core-ktx:1.18.0/androidx.core:core-ktx:1.13.1/" "$FILE"
    rm -f "$FILE.bak"
    echo "[3/3] core-ktx version: downgraded 1.18.0 -> 1.13.1"
    CHANGED=1
else
    echo "[3/3] core-ktx version: already OK"
fi

if [ "$CHANGED" -eq 0 ]; then
    echo "Nothing to do — $FILE already fully patched."
else
    echo "Done."
fi
