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
// SoftEtherClient has its build.gradle at its own root, so it includes directly.
include(":SoftEtherClient")

// vpnLib (ics-openvpn) and sstpClient (Open-SSTP-Client) are deferred for now —
// see README "Protocol roadmap" for why and what's needed before adding them.
