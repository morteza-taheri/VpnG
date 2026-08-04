#!/usr/bin/env bash
# Patches known bugs in SoftEtherClient's own build.gradle. This is an
# upstream (external) file we don't have push access to (it's a git
# submodule), so this patch has to be reapplied after every
# `git submodule update`.
#
# Usage (from repo root, after `git submodule update --init --recursive`):
#   bash scripts/patch-softether-gradle.sh
#
# Each fix below is applied independently and is idempotent — safe to run
# multiple times, and safe to run after only some fixes were already applied.
#
# NOTE: as of the project moving to AGP 8.9.1 / compileSdk 36 (see root
# build.gradle.kts), SoftEtherClient's own androidx.core:core-ktx:1.18.0
# request is no longer a problem (that version needs compileSdk 36, which we
# now have) — an earlier version of this script force-downgraded it to
# 1.13.1; that fix was removed since it's no longer needed.

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
    echo "[1/2] Kotlin plugin: already present"
else
    sed -i.bak "s/id 'com.android.library'/id 'com.android.library'\n    id 'org.jetbrains.kotlin.android'/" "$FILE"
    rm -f "$FILE.bak"
    echo "[1/2] Kotlin plugin: added"
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
    echo "[2/2] kotlin{compilerOptions{}} block: replaced with kotlinOptions{}"
    CHANGED=1
else
    echo "[2/2] kotlin{compilerOptions{}} block: not present (already patched or never had it)"
fi

# --- Revert-if-present: undo the old core-ktx 1.13.1 force-downgrade ---
# from an earlier version of this script, now unnecessary (see NOTE above).
if grep -q "androidx.core:core-ktx:1.13.1" "$FILE"; then
    sed -i.bak "s/androidx.core:core-ktx:1.13.1/androidx.core:core-ktx:1.18.0/" "$FILE"
    rm -f "$FILE.bak"
    echo "[revert] core-ktx: restored to the module's original 1.18.0 (compileSdk 36 supports it now)"
    CHANGED=1
fi

if [ "$CHANGED" -eq 0 ]; then
    echo "Nothing to do — $FILE already fully patched."
else
    echo "Done."
fi
