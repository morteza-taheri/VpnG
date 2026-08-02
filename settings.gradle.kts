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

// vpnLib (ics-openvpn) and sstpClient (Open-SSTP-Client) are checked out as
// full standalone projects (each has its own settings.gradle). Their actual
// Android library/app module lives in a subdirectory, so we include them
// under an alias and repoint projectDir accordingly.
include(":vpnLib")
project(":vpnLib").projectDir = file("vpnLib/main")

include(":sstpClient")
project(":sstpClient").projectDir = file("sstpClient/app")
