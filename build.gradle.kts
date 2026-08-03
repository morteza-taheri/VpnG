plugins {
    id("com.android.application") version "8.5.0" apply false
    id("com.android.library") version "8.5.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
    id("com.google.devtools.ksp") version "1.9.24-1.0.20" apply false
}

// :SoftEtherClient's own build.gradle (Groovy, older-style multi-module
// pattern) reads project.ext.compileSdkVersion/minSdkVersion/targetSdkVersion
// directly rather than declaring its own — an allprojects{} ext block is
// how the root project supplies those to every subproject in Groovy/Gradle.
// Kotlin DSL's `extra` maps onto Groovy's `ext`.
allprojects {
    extra["compileSdkVersion"] = 34
    extra["minSdkVersion"] = 26
    extra["targetSdkVersion"] = 34
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
