pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "VpnG"

include(":app")

// Protocol modules — added as git submodules per specification section 16.
// Uncomment once submodules are initialized:
// include(":SoftEtherClient")
// include(":vpnLib")
// include(":sstpClient")
