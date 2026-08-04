plugins {
    id("com.android.application") version "8.9.1" apply false
    id("com.android.library") version "8.9.1" apply false
    id("org.jetbrains.kotlin.android") version "2.1.20" apply false
    // Kotlin 2.0+ moved the Compose compiler out of the Kotlin plugin into
    // its own Gradle plugin — required now that we're off Kotlin 1.9.x.
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.20" apply false
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
    // KSP version format is "<kotlin-version>-<ksp-build>" and must match
    // the Kotlin version above exactly.
    id("com.google.devtools.ksp") version "2.1.20-1.0.32" apply false
}

// :SoftEtherClient's own build.gradle (Groovy, older-style multi-module
// pattern) reads project.ext.compileSdkVersion/minSdkVersion/targetSdkVersion
// directly rather than declaring its own — an allprojects{} ext block is
// how the root project supplies those to every subproject in Groovy/Gradle.
// Kotlin DSL's `extra` maps onto Groovy's `ext`.
allprojects {
    extra["compileSdkVersion"] = 36
    extra["minSdkVersion"] = 26
    // targetSdk stays 34 per specification section 2.1 — compileSdk and
    // targetSdk are independent (compileSdk unlocks newer APIs to compile
    // against; targetSdk opts the app into new runtime behavior, which is a
    // separate product decision, not something to bump just to fix a build).
    extra["targetSdkVersion"] = 34
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
