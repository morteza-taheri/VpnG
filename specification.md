VpnG - Modern Android Application Specification

1. Project Overview

This document outlines the requirements for a modern Android VPN client application based on the open-source VPN Gate Connector project. The application serves as a comprehensive VPN client with a modern UI, multi-language support, and advanced features for server management, connectivity, and customization.

Application Name: VpnG

Base Project: vpngate-connector

---

2. Technology Stack & Architecture

2.1 Core Technologies

· Language: Kotlin
· UI Framework: Jetpack Compose with Material 3 Design
· Minimum SDK: Android 8.0 (API level 26)
· Target SDK: Android 14 (API level 34)
· Architecture: Clean Architecture with MVVM pattern
· Dependency Injection: Hilt
· Networking: Retrofit + OkHttp
· Database: Room
· Background Processing: WorkManager

2.2 Android Version Compatibility

Android Version API Level Behavior
Android 8.0 - 8.1 26-27 Full support
Android 9 - 11 28-30 Full support
Android 12 - 12L 31-32 Full support
Android 13+ 33+ Requires POST_NOTIFICATIONS permission
Android 14+ 34+ Requires FOREGROUND_SERVICE_SPECIAL_USE

Note: L2TP/IPsec is not supported in VpnG (see Section 3). All protocols (SoftEther, OpenVPN, MS-SSTP) work on all supported Android versions.

2.3 Infrastructure Layers

Data Layer

· Repository Pattern: For server list management and VPN configuration
· Local Storage: Room database for caching server lists, user preferences, and app settings
· Remote Data Sources:
  · VPN Gate CSV API (Official)
  · VPN Gate HTML page (Primary website)
  · Mirror CSV (Backup source)
  · Mirror sites (HTML fallback)

Domain Layer

· Use Cases: Server selection, connection management, protocol switching
· Models: Server, ConnectionSettings, UserPreferences
· Business Logic: Server ranking, auto-connect algorithms, protocol negotiation

Presentation Layer

· UI: Jetpack Compose with Material 3
· State Management: ViewModel with StateFlow
· Navigation: Compose Navigation
· Theming: Dynamic color support with dark/light themes

---

3. VPN Protocol Support

The application integrates three distinct VPN protocol implementations, each with its own module and usage patterns. This is based on the official vpngate-connector repository.

Note: L2TP/IPsec protocol has been removed from this application due to:

· Deprecation in Android 12 (API 31)
· Complete removal in Android 13 (API 33)
· Limited support and security concerns

3.1 Module Overview

Module Name Protocol Source / Repository Description
:vpnLib OpenVPN OpenVPN for Android Core OpenVPN implementation, supports TCP/UDP
:sstpClient MS-SSTP Open SSTP Client Microsoft SSTP protocol implementation
:SoftEtherClient SoftEther VPN SoftEther-Android-Module Native SoftEther implementation, supports TCP

3.2 SoftEther VPN Module (:SoftEtherClient)

Protocol Support

Transport Status Description
TCP (HTTPS/TLS) ✅ Supported Connects via SoftEther HTTPS/TLS channel on SE-VPN TCP port
UDP (RUDP) 🔄 Disabled (Coming Soon) Requires full reliable-UDP layer; will be enabled in future releases

Authentication Methods (AuthMethod enum)

Method Enum Value Status Notes
Anonymous AuthMethod.ANONYMOUS ✅ Supported No credentials required
Hashed Password AuthMethod.PASSWORD ✅ Supported SHA1(SHA1(pw + UPPER(user)) + server_random)
Plain Password (RADIUS) AuthMethod.PLAIN_PASSWORD ✅ Supported Plaintext password for RADIUS backend
Auto-detect AuthMethod.AUTO ✅ Supported Uses PASSWORD if password non-empty, else ANONYMOUS
Certificate — 🚧 Not supported Requires client certificate
Windows NT / AD — 🚧 Not supported Windows-specific

Server Authentication Rules

· Free VPN Gate servers: Authenticate as vpn/vpn against the vpngate virtual hub.
· Paid VPN Gate servers: Authenticate with user credentials against the VPNGatePaid virtual hub via RADIUS.

Usage Example:

```kotlin
// Free VPNGate server (auto-detect)
ConnectionConfig(
    username = "vpn",
    password = "vpn",
    authMethod = AuthMethod.AUTO
)

// Paid server with RADIUS
ConnectionConfig(
    username = "user",
    password = "secret",
    authMethod = AuthMethod.PLAIN_PASSWORD
)

// Anonymous hub
ConnectionConfig(
    username = "",
    password = "",
    authMethod = AuthMethod.ANONYMOUS
)
```

Source Version: Based on SoftEtherVPN_Stable v4.44-9807-rtm. Key reference files: Protocol.c, Connection.c, Network.c.

OpenSSL Configuration:
The correct OpenSSL configuration file for the SoftEther module is located at:
SoftEtherClient/src/main/cpp/openssl/include/openssl/opensslconf.h

Key settings include:

· OPENSSL_THREADS defined
· Disabled algorithms: NO_CAST, NO_IDEA, NO_MD2, NO_RC5, NO_SEED, NO_SHA0, NO_WHRLPOOL
· THIRTY_TWO_BIT defined (not SIXTY_FOUR_BIT) for armeabi-v7a builds
· arm64-v8a and x86_64 builds use SIXTY_FOUR_BIT
· x86-specific optimizations: DES_PTR, DES_RISC1, DES_UNROLL
· RC4_INT as unsigned char
· RC4_CHUNK as unsigned long

Note: The OpenSSL configuration flags are generated per-ABI during the build process. THIRTY_TWO_BIT applies to armeabi-v7a builds. arm64-v8a and x86_64 builds use SIXTY_FOUR_BIT.

3.3 OpenVPN Module (:vpnLib)

Protocol Support

Transport Status
TCP ✅ Supported
UDP ✅ Supported

Implementation

· Upstream: OpenVPN for Android (ics-openvpn)
· License: GPLv2-or-later
· Usage: The module encapsulates ics-openvpn and provides a unified VPN interface.

Important: OpenVPN connections require OpenVPN configuration data (Base64), which is only available from CSV sources (API or Mirror CSV). If HTML is the only active source, OpenVPN will be unavailable.

Usage Example (Conceptual):

```kotlin
val profile = VpnProfile("VPNGate")
profile.serverAddress = "vpn.example.com"
profile.openvpnConfig = openVpnConfigString // from CSV or import

// Start VPN via VpnService
val intent = VpnService.prepare(context)
startActivityForResult(intent, REQUEST_CODE)
```

3.4 MS-SSTP Module (:sstpClient)

Protocol Support

Transport Status
TCP (HTTPS/TLS) ✅ Supported

Implementation

· Upstream: Open SSTP Client
· Authentication: Username/Password
· License: MIT

Usage Example (Conceptual):

```kotlin
val sstpClient = SSTPClient()
sstpClient.setServer("vpn.example.com", 1805)
sstpClient.setCredentials("username", "password")
sstpClient.connect()
```

Important: SSTP hostname and port are identical to OpenVPN TCP (see section 4.3 for extraction rules).

3.5 Protocol Selection & Defaults

Setting Value
Default Protocol SoftEther (TCP)
Authentication Method AUTO (Auto-detect)
Username vpn
Password vpn
SoftEther UDP Status Disabled (Coming Soon)

User Options in Settings:

· SoftEther (TCP) – ✅ Default
· SoftEther (UDP) – ⚠️ Disabled (Coming Soon)
· OpenVPN (TCP) – ✅
· OpenVPN (UDP) – ✅
· MS-SSTP – ✅
· Always Ask – ✅ (prompts each connection)

3.6 Protocol Module Dependencies

In app/build.gradle:

```gradle
dependencies {
    implementation project(path: ':vpnLib')
    implementation project(path: ':sstpClient')
    implementation project(path: ':SoftEtherClient')
}
```

3.7 VPN Service Architecture (Unified VpnService)

3.7.1 Overview

Android allows only one active VpnService at a time. To support multiple protocols seamlessly, the application uses a single unified VpnService that delegates protocol-specific logic to the appropriate module.

3.7.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VpnG Application                         │
├─────────────────────────────────────────────────────────────┤
│                    Unified VpnService                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Protocol Manager                       │   │
│  │  ┌──────────────────────────────────────────────────┐│   │
│  │  │   Protocol Adapter Interface                    ││   │
│  │  └──────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  SoftEther  │ │  OpenVPN    │ │   SSTP      │          │
│  │  Adapter    │ │  Adapter    │ │  Adapter    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│          │               │               │                  │
│          ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  SoftEther  │ │  vpnLib     │ │  sstpClient │          │
│  │  Client     │ │  (OpenVPN)  │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

3.7.3 Protocol Adapter Contract

```kotlin
interface ProtocolAdapter {
    suspend fun connect(server: Server, config: ProtocolConfig): OperationResult<Unit>
    suspend fun disconnect(): OperationResult<Unit>
    fun getState(): ConnectionState
    fun onDestroy()
}

sealed class ConnectionState {
    object Disconnected : ConnectionState()
    data class Connecting(
        val server: Server? = null,   // null for auto-connect
        val progress: Int? = null,    // null for direct connect
        val total: Int? = null        // null for direct connect
    ) : ConnectionState()
    data class Connected(val server: Server, val protocol: ProtocolType) : ConnectionState()
    data class Error(val cause: Throwable) : ConnectionState()
}

sealed class OperationResult<out T> {
    data class Success<T>(val data: T) : OperationResult<T>()
    data class Error(val cause: Throwable) : OperationResult<Nothing>()
    // Loading is handled via StateFlow in ViewModel, not returned directly
}
```

Note: OperationResult is used for one-shot operations (connect, disconnect). The Repository layer uses Kotlin's built-in Result<T> for simplicity. ConnectionState represents the live VPN connection state in the Presentation layer. Loading state is emitted via StateFlow from the ViewModel, not returned from suspend functions.

3.7.4 Implementation Strategy

1. Single VpnService extends android.net.VpnService
2. Protocol Manager handles:
   · Protocol selection and switching
   · Connection state management
   · Interface configuration (tun0)
3. Protocol Adapters implement common interface:
   · connect(server: Server, config: ProtocolConfig): OperationResult<Unit>
   · disconnect(): OperationResult<Unit>
   · getState(): ConnectionState
4. Adapter Implementation:
   · Each adapter uses its respective module (SoftEther, OpenVPN, SSTP)
   · Adapters manage their own internal state
   · All adapters share the same VpnService interface (tun0)

3.7.5 Protocol Switching

When switching protocols:

1. Disconnect current protocol (cleanup)
2. Release tun0 interface
3. Initialize new protocol adapter
4. Configure tun0 with same parameters
5. Establish new connection

Note: This approach ensures clean switching without requiring separate VpnService instances.

3.8 API Endpoints & Rate Limiting

Source Endpoint Rate Limit Notes
VPN Gate API http://www.vpngate.net/api/iphone/ ~1 req/min Unofficial, be respectful
Website HTML https://www.vpngate.net/en/ ~1 req/min Parsed for protocol data
Mirror CSV GitHub raw URL ~5 req/min Hosted on GitHub
Mirror Sites https://www.vpngate.net/en/sites.aspx ~1 req/min Fallback only

---

4. Server Management

4.1 Server List Sources (Three-Tier Strategy)

To maximize availability, coverage, and reliability, the application fetches server data from three distinct sources using a strategic priority system.

4.1.1 Primary Source: Official VPN Gate CSV API

· Endpoint: http://www.vpngate.net/api/iphone/
· Format: CSV with specific column headers (see section 4.2)
· Description: The official and most up-to-date source. Provides comprehensive server information including hostname, country, score, ping, uptime, and Base64-encoded OpenVPN configurations.
· Priority: Highest - Always attempt this source first.
· Default Status: ✅ Enabled

4.1.2 Secondary Source: HTML Page Parsing (Always Active)

· Endpoint: https://www.vpngate.net/en/
· Format: HTML table with server listings
· Description: The main VPN Gate web page displays a comprehensive table of all active public VPN relay servers. The application will always fetch and parse this HTML page alongside the CSV API.
· What we extract from the HTML table:
  · Country (physical location)
  · DDNS Hostname and IP Address
  · VPN Sessions, Uptime, and Cumulative Users
  · Line Quality, Throughput, and Ping
  · Supported Protocols: Green checkmarks (✓) indicating protocol support
  · Connection Details: Hostname and port for each protocol (TCP/UDP)
  · Operator Name and Score
· Priority: Secondary - Always fetched in parallel with primary source.
· Default Status: ✅ Enabled

4.1.3 Tertiary Source: Mirror CSV (Backup Source)

· Endpoint: https://raw.githubusercontent.com/morteza-taheri/VpnM/refs/heads/master/Servers.csv
· Format: CSV with exactly the same column structure as the official VPN Gate API
· Description: This is a static mirror copy of the official API data, hosted on GitHub. It serves as a reliable backup when the official API is unavailable.
· Priority: Tertiary - Only used if enabled by user AND primary source fails
· Default Status: ❌ Disabled by default (User can enable in settings)

Note: If Mirror CSV is disabled and primary sources fail, the app will skip to Mirror Sites HTML.

4.1.4 Quaternary Source: Mirror Sites (HTML Fallback)

· Source Page: https://www.vpngate.net/en/sites.aspx
· Description: This page provides a list of mirror sites that host identical content to the primary website.
· Priority: Lowest - Ultimate fallback if all other sources fail.
· Default Status: ✅ Enabled

4.2 Server Data Structure (CSV Format)

Both the official API and the mirror CSV share the exact same column structure:

Column Name Type Description
#HostName String Server DDNS hostname
IP String Server IP address
Score Integer Quality score (higher = better)
Ping Integer Response time in milliseconds
Speed Integer Bandwidth speed in Mbps
CountryLong String Full country name (e.g., "Japan")
CountryShort String Country code (e.g., "JP")
NumVpnSessions Integer Current active VPN sessions
Uptime String Server uptime (e.g., "21 days")
TotalUsers Integer Cumulative users count
TotalTraffic String Total traffic in GB
LogType String Logging policy (e.g., "2 Weeks")
Operator String Volunteer operator name
Message String Operator's message
OpenVPN_ConfigData_Base64 String Base64-encoded OpenVPN configuration

Note: The HTML source does not provide OpenVPN_ConfigData_Base64. Therefore, OpenVPN is only available when CSV sources are active.

4.3 Extracting MS-SSTP Configuration from Other Protocols

Key Observation: The connection details for MS-SSTP protocol (hostname and port) are identical to those of OpenVPN (TCP) for each server that supports SSTP.

Implementation Strategy:

1. When parsing HTML:
   · If a server has a green checkmark (✓) in the MS-SSTP column, extract the SSTP hostname and port from the OpenVPN TCP column.
   · If OpenVPN TCP is not available, fallback to SSL-VPN (SoftEther TCP) column.
2. When parsing CSV:
   · If the CSV indicates SSTP support, use the OpenVPN TCP hostname and port (parsed from the OpenVPN config) as the SSTP hostname and port.
   · If OpenVPN TCP is not available, fallback to SSL-VPN (SoftEther TCP) hostname and port.
3. Unified Model Update:
   · The Server data class includes:
     · sstpHostname: String? → Derived from OpenVPN/SSL-VPN hostname
     · sstpPort: Int? → Derived from OpenVPN/SSL-VPN port

4.4 Unified Server Model

The application will standardize data from all sources into a unified model with the following fields:

Field Type Description Source
hostName String Server DDNS hostname API / HTML
ip String Server IP address API / HTML
countryLong String Full country name API / HTML
countryShort String Country code API / HTML
score Integer Quality score API
ping Integer Response time in milliseconds API / HTML
uptime String Server uptime API / HTML
sessions Integer Current active VPN sessions API / HTML
totalUsers Integer Cumulative users count API
totalTraffic String Total traffic in GB API
logPolicy String Logging retention policy API / HTML
operator String Volunteer operator name API / HTML
message String Operator's message API
openVpnConfig String? Base64 encoded OpenVPN config API
supportedProtocols List<ProtocolType> Supported protocols with port details API / HTML
sstpHostname String? SSTP hostname (derived) Derived
sstpPort Int? SSTP port (derived) Derived
isBookmarked Boolean User bookmark status App
selectedProtocol ProtocolType? User-selected protocol App
serverSelectionState ServerSelectionState DEFAULT/SELECTED/CONNECTED App
source DataSource Data source (API/HTML/Mirror) App

```kotlin
enum class ServerSelectionState {
    DEFAULT,    // No special state
    SELECTED,   // User selected this server
    CONNECTED   // Currently connected to this server
}
```

4.5 Server List Update Strategy

· Automatic Update: Every 2 hours by default.
· User Configurable: Update interval adjustable in settings.
· Background Updates: Using WorkManager for efficient background processing.
· Priority-Based Fetching Strategy:
  1. Fetch from official CSV API and HTML page concurrently
  2. If primary succeeds, parse both sources, merge, deduplicate
  3. If primary fails AND Mirror CSV is enabled, attempt Mirror CSV
  4. If all CSV sources fail, attempt Mirror Sites HTML
  5. If all sources fail, use cached server list (with warning)
· Data Deduplication: Merge and deduplicate based on IP or hostname

4.6 Offline Behavior

Scenario Behavior
No internet connection Show cached server list with banner: "You are offline. Showing cached servers."
Cache expired (7+ days) Show warning: "Server list may be outdated. Please connect to the internet to update."
Update fails Keep existing cache; show error message with "Retry" button
All sources disabled Show warning: "All data sources are disabled. Please enable at least one source in Settings."

---

5. User Interface & Experience

5.1 Modern UI Requirements

· Framework: Jetpack Compose with Material 3
· Design Philosophy: Clean, modern, and intuitive
· Navigation: Bottom navigation with primary sections: Home, Servers, Settings
· Animations: Smooth transitions and micro-interactions

5.2 Theme Support

· Dark Theme: Full dark mode support
· Light Theme: Standard light theme
· System Default: Follow system theme setting
· Dynamic Color: Material You support on Android 12+

5.3 Multi-Language Support

· Supported Languages: Persian (فارسی) and English
· Language Detection: Auto-detect system language with fallback to English
· Language Switch: User can manually switch between languages in settings
· Calendar Integration:
  · Persian Calendar: For users with Persian language selected
  · Gregorian Calendar: For users with English language selected

5.4 Accessibility Requirements

Requirement Implementation
Content Descriptions All interactive elements have contentDescription
Touch Targets Minimum 48dp for all touch targets
TalkBack Support Full support for screen reader navigation
Color Contrast Meets WCAG 2.1 AA standards (minimum contrast ratio 4.5:1)
Text Scaling Supports system font scaling (up to 200%)
Focus Order Logical focus traversal for keyboard navigation

5.5 Icon Requirements

Source Icon: icon.jpg located in project root

Required Icon Sizes:

· Adaptive Icons:
  · Foreground: 108×108 dp minimum (1024×1024 px recommended)
  · Background: Solid color (e.g., #1A73E8) or drawable with rounded square shape
· Legacy Icons:
  · mdpi: 48×48 px | hdpi: 72×72 px | xhdpi: 96×96 px
  · xxhdpi: 144×144 px | xxxhdpi: 192×192 px
· Play Store Icon: 512×512 px

Icon Processing:

1. Remove all background elements and padding
2. Keep only the rounded square shape with rounded corners
3. Generate all required sizes from the source icon

---

6. Main Screens

The application consists of three main screens accessible via bottom navigation:

1. Home Screen - Main connection control and status
2. Servers Screen - Server list with filters and search
3. Settings Screen - Application configuration

---

7. Home Screen

7.1 Components

7.1.1 Header

· App logo/icon (left)
· App title: "VpnG"
· Settings icon (gear) in top-right for quick access

7.1.2 Connection Status

· Text: Displays current status ("Disconnected", "Connecting...", "Connected", "Error")
· Color Coding: Matches button state colors

7.1.3 Main Connection Button (Large Circular Button)

Four States with Distinct Colors:

State Color Icon Description
Disconnected Blue (#2196F3) Play ▶️ Ready to connect
Connecting Yellow/Orange (#FFC107) Spinner 🔄 Attempting connection
Connected Green (#4CAF50) Check ✅ VPN active
Error Red (#F44336) Warning ⚠️ Connection failed

Behavior:

· Single tap toggles between states
· Disconnected → Connecting → Connected or Error
· Tap again to cancel/disconnect
· Connection attempts use filtered server list from Servers screen
· Each server has an independent timeout (default: 10 seconds)
· Progress bar shows: "Testing server X/Y" (e.g., "Testing server 3/20")

7.1.4 Connected Server Info

· Server name (hostname)
· Country with flag
· Protocol in use
· IP address

7.1.5 Status Card

· Number of filtered servers available
· Default protocol selected
· DNS configured

7.1.6 Progress Bar (Auto-Connect)

Behavior:

· Appears immediately when the button enters the Connecting state.
· Shows the number of servers tested out of the total available in the filtered list.
· Example: "Testing server 3/20" indicates that 3 out of 20 servers have been tested.
· The progress bar updates in real-time as each server is tested.
· If the connection succeeds, the progress bar is replaced by the "Connected" status.
· If all servers fail, the progress bar shows "All servers failed" before transitioning to the Error state.

UI Representation:

```
┌─────────────────────────────────────────────────────┐
│  ████████████░░░░░░░░░░░░░░░░  3/20 servers tested │
│  Testing server vpn123.opengw.net (Japan)          │
└─────────────────────────────────────────────────────┘
```

7.1.7 Log Window

Title: "📋 Connection Log"

Controls:

1. Clear Button: Clears the UI log view AND truncates the session.log file. A confirmation dialog is shown before clearing.
2. Copy Button: Copies all log entries to the system clipboard
3. Expand/Collapse Button: Toggle between full and compact view

Copy Button Behavior:

· A small copy icon (📋) is placed next to the Clear button.
· When tapped, all log entries are copied to the clipboard as plain text.
· A toast message confirms: "Logs copied to clipboard."
· The copy includes timestamps, icons, and messages in a readable format.

Log Entries:

· Include timestamp, icon, and message
· Color Coding: Success (green), Error (red), Warning (yellow), Info (blue)

Footer: Total entry count

Log Modules:

· SYSTEM (📱) - App lifecycle
· SERVER (🌐) - Server operations
· CONNECTION (🔗) - Connection attempts
· OPENVPN (🔒) - OpenVPN module
· SOFTHER (🔷) - SoftEther module
· SSTP (🔶) - SSTP module
· DNS (🌍) - DNS resolution
· VPN_SERVICE (🛡️) - VPN tunnel status

7.1.7.1 session.log Management

session.log Storage:

· Location: context.filesDir/session.log
· Format: Plain text with timestamps, module, and message
· Retention: Last 1000 entries (auto-rotate)
· Clear: Only when user explicitly clicks the Clear button (with confirmation dialog)

7.1.8 Quick Actions (Optional)

· 🔄 Update Servers: Manual server list refresh
· ⭐ Bookmarks: View bookmarked servers
· ⚡ Quick Connect: Connect to last used server

7.2 Notification Behavior

State Notification Content
Disconnected No notification
Connecting "VpnG: Connecting to server..."
Connected "VpnG: Connected to [server] • [duration]"
Error "VpnG: Connection failed. Tap to retry."

Toast Messages:

Event Message
Disconnected (by user) "VpnG: Disconnected"

---

8. Servers Screen

8.1 Components

8.1.1 Header

· Title: "Servers" / "لیست سرورها"
· Search icon (magnifying glass)
· Filter icon (funnel)
· Refresh icon (for manual update)

8.1.2 Search Bar

· Search by: Hostname, Country, IP Address
· Real-time results
· Clear button (✕) to reset search

8.1.3 Filter Bar

Filters Available:

1. Country Filter: Dropdown or chips showing all available countries
2. Protocol Filter: Multi-select chips for protocols (SoftEther, OpenVPN, MS-SSTP)
3. Bookmark Filter: All / Bookmarked Only / Non-Bookmarked Only
4. Server Status: All / Online / Offline
5. Clear Filters Button: Reset all filters

8.1.4 Sort Options

Sortable Fields:

· Score (highest first) - Default
· Ping (lowest first)
· Country (alphabetical)
· Server Name (alphabetical)
· Sessions (highest first)
· Uptime (highest first)

Sort Modes:

· Pre-sort: Sort entire dataset, then filter (default)
· Post-sort: Filter first, then sort results
· Order: Ascending / Descending toggle

8.1.5 Server List Items

Each Item Displays:

Component Details
Country Flag emoji + country name
Hostname DDNS hostname
IP Address Server IP
Score Quality score
Ping Response time with color indicator (Green <100ms, Yellow 100-300ms, Red >300ms)
Uptime Server uptime
Sessions Active VPN sessions
Protocols Badges with port and transport type (TCP/UDP)
Bookmark Star toggle
Ping Test Button for live ping test
Connect Button to connect (larger than others)

Protocol Badge Format:

```
🟢 SoftEther (TCP:1805 / UDP:1994)
🔵 OpenVPN   (TCP:1805 / UDP:1403)
🟠 MS-SSTP   (TCP:1805)
```

8.1.6 Connection States (Visual Highlighting)

State Visual Indicator
Default Standard appearance
Selected Blue border around item
Connected Green highlight + green accent bar left + "Connected" badge

8.1.7 Connect Button Behavior

1. User taps Connect button (larger than other buttons)
2. Protocol Selection Dialog appears:
   · Shows only protocols supported by that server
   · User selects a protocol
   · Options include port and transport type
3. After selection:
   · App switches to Home Screen
   · Main button enters Connecting state
   · Uses selected protocol to test servers from filtered list
4. Cancellation:
   · User taps the big button to stop activity
   · Tapping again restores normal Auto-Connect behavior

8.1.8 Bookmark Persistence

· Bookmarked servers are never removed during updates
· Even if server is offline or removed from sources, it remains visible
· Displayed with "⚠️ Offline" indicator if unavailable
· Only removed when user explicitly unbookmarks

8.1.9 Empty State

When no servers match filters:

```
🔍 No servers found
Try adjusting your filters or search
[Clear Filters]
```

---

9. Settings Screen

9.1 Sections

9.1.1 General

Setting Options Default
Language English / فارسی System default
Theme Light / Dark / System System
Update Interval 1h / 2h / 4h / 6h / 12h / 24h 2 hours

9.1.2 VPN Settings

Setting Options Default Description
Default Protocol SoftEther TCP, OpenVPN TCP, OpenVPN UDP, MS-SSTP, Always Ask SoftEther TCP -
Connection Timeout 5-30 seconds (slider) 10 seconds -
Kill Switch On / Off Off When enabled, shows a persistent notification reminding the user to enable Always-on VPN in system settings. Does not implement a programmatic kill switch.
Auto-Connect on Start On / Off Off -

Note: SoftEther UDP appears disabled with note: "⚠️ در حال توسعه - به زودی پشتیبانی می‌شود"

9.1.3 DNS Settings

Setting Options Default
Custom DNS On / Off Off
Primary DNS Text input 8.8.8.8
Secondary DNS Text input 8.8.4.4
DNS over HTTPS (DoH) On / Off Off
Preset DNS Shekan, Google, Cloudflare, OpenDNS Google DNS

Preset DNS Servers:

Provider Primary Secondary
Shekan (Iran) 178.22.122.100 185.51.200.2
Google DNS 8.8.8.8 8.8.4.4
Cloudflare 1.1.1.1 1.0.0.1
OpenDNS 208.67.222.222 208.67.220.220

9.1.4 Data Sources

Default Status:

Source Name Editable Default Status
Source 1 VPN Gate API ✅ Yes ✅ Enabled
Source 2 Website HTML ❌ No (Enable/Disable Only) ✅ Enabled
Source 3 Mirror CSV (GitHub) ✅ Yes ❌ Disabled
Source 4 Mirror Sites HTML ✅ Yes ✅ Enabled

Settings UI:

· Toggle switch for enable/disable
· URL display (editable for sources 1, 3, 4)
· "Edit" button for URL modification
· "Reset" button to restore default URL

9.1.5 Split Tunneling

Setting Options Default
Enable On / Off Off
Mode Include / Exclude Exclude
Select Apps List of installed apps None selected

9.1.6 Appearance

Setting Options Default
Dynamic Color On / Off On
Font Size Small / Medium / Large Medium

9.1.7 Permissions

Required Permissions (AndroidManifest.xml):

Permission Purpose Target SDK
android.permission.INTERNET Network access All
android.permission.ACCESS_NETWORK_STATE Network status monitoring All
android.permission.FOREGROUND_SERVICE Background VPN service All
android.permission.FOREGROUND_SERVICE_SPECIAL_USE VpnService foreground service Android 14+
android.permission.POST_NOTIFICATIONS Notification display Android 13+ (Required)
android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS Battery optimization exemption All (Special)
android.permission.WRITE_EXTERNAL_STORAGE Export/Import Config, Share Logs Android 8-10 (maxSdkVersion 28)

Android 14+ Foreground Service Configuration:

```xml
<service android:name=".VpnGService"
    android:foregroundServiceType="specialUse">
    <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
        android:value="vpn" />
</service>
```

Storage Permission Notes:

· Storage is only requested for:
  · Exporting/Importing OpenVPN config files
  · Sharing log files
· Uses Storage Access Framework (SAF) for Android 10+ (scoped storage)
· Permission is limited to API 28 and below (maxSdkVersion="28")
· Not required for normal app operation

Runtime Permission Handling (Android 13+):

```kotlin
// Check and request POST_NOTIFICATIONS permission
fun requestNotificationPermission(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                REQUEST_NOTIFICATION_PERMISSION
            )
        }
    }
}
```

UI Display:

Permission Type Default Status
VPN Permission Button (Request) Pending
POST_NOTIFICATIONS Button (Request) Android 13+: Pending
Internet Status Display Always Granted
Storage Button (Request) Denied (API 28 and below only - hidden on Android 10+)
Background Activity Toggle Enabled
Battery Optimization Configure Button Needs Configuration
Network State Status Display Always Granted

Background Activity Details:

When enabled, requests REQUEST_IGNORE_BATTERY_OPTIMIZATIONS to allow WorkManager periodic updates. If denied, automatic server updates may be delayed by the system.

Background Activity Warning:

```
⚠️ Disabling this will prevent automatic server updates and 
auto-connect in the background. You will need to manually 
open the app and refresh to get latest servers.
[I Understand] [Cancel]
```

9.1.8 Data Management

Setting Action
Clear Cache Button (with confirmation)
Clear All Data Button (with double confirmation)
Storage Used Display only

9.1.9 About

Setting Action
Version Display (e.g., "v1.2.3 (Build 42)")
Changelog Button (opens CHANGELOG.md)
Source Code Button (opens GitHub)
Privacy Policy Button (opens browser)
License Button (opens licenses page)

---

10. Core Features

10.1 Auto-Connect & Fallback Mechanism

Functionality:

1. User activates auto-connect via toggle button
2. Application tests servers in priority order (by score/quality)
3. Each server is tested with an independent timeout (default: 10 seconds)
4. First working server with default protocol (SoftEther TCP) is selected
5. Connection established automatically
6. If connection drops, automatically test and connect to next available server
7. Process continues until user manually stops the auto-connect

Progress Indication:

· During auto-connect, a progress bar displays the testing progress.
· Shows "Testing server X/Y" where X is the current server being tested and Y is the total number of servers in the filtered list.
· Example: "Testing server 3/20" indicates 3 out of 20 servers have been tested.

Implementation:

· Server testing with per-server timeout (independent)
· Priority queue based on server quality scores
· Continuous monitoring of connection status
· Graceful fallback without user interruption

10.2 Split Tunneling (App Bypass)

Feature Requirements:

· User can select which installed apps use the VPN tunnel
· Selected apps bypass the VPN and use direct internet connection
· Default: All apps use the VPN tunnel
· Two modes:
  1. Include Mode: Only selected apps use VPN
  2. Exclude Mode: All apps use VPN except selected ones

Technical Implementation:

· Using Android's VpnService.Builder with addDisallowedApplication() and addAllowedApplication() methods
· Maintain list of app package names in preferences
· Update VPN configuration when app selection changes

10.3 DNS Configuration

Custom DNS Support:

· User can enter custom DNS server IP addresses
· Preset list of popular DNS servers (Shekan, Google, Cloudflare, OpenDNS)
· DNS leak prevention
· Support for DNS over HTTPS (DoH) for enhanced privacy
· Apply DNS settings through VPN interface configuration

DoH Implementation:
DoH is implemented using OkHttp's custom Dns interface with a DNS-over-HTTPS resolver (e.g., okhttp-dnsoverhttps or a custom RFC 8484 implementation). Falls back to system DNS if DoH provider is unreachable.

10.4 Protocol Selection

Default Protocol: SoftEther VPN over TCP

User Options:

1. Manual Protocol Selection: Set a default protocol from available options
2. "Always Ask" Mode: Prompt user each time to choose protocol
3. Protocol Validation: Check server supports selected protocol
4. Auto-Connect Priority: Use selected protocol; fallback if unavailable

10.5 Error Handling Strategy

OperationResult Wrapper (for one-shot operations):

```kotlin
sealed class OperationResult<out T> {
    data class Success<T>(val data: T) : OperationResult<T>()
    data class Error(val cause: Throwable) : OperationResult<Nothing>()
    // Loading is handled via StateFlow in ViewModel, not returned directly
}
```

Note: OperationResult is used for one-shot operations (connect, disconnect). The Repository layer uses Kotlin's built-in Result<T> for simplicity. ConnectionState (see section 3.7.3) represents the live VPN connection state. Loading state is emitted via StateFlow from the ViewModel.

Retry Policy:

· Maximum attempts: 3
· Exponential backoff: 1s, 2s, 4s
· Network timeout: 15 seconds
· Connection timeout: Per-server (user-configurable)

UI Feedback:

· Error messages displayed via Snackbar
· Retry button for failed operations
· Graceful degradation when sources fail

10.6 Coroutine Dispatchers

Layer Dispatcher Purpose
Data Layer (Network) Dispatchers.IO Network calls, file I/O
Data Layer (Database) Dispatchers.IO Database operations
Domain Layer Dispatchers.Default CPU-intensive operations
Presentation Layer Dispatchers.Main UI updates, ViewModel

---

11. Data Management

11.1 Local Storage

· Preferences: DataStore for user preferences (theme, language, DNS, protocol selection)
· Database: Room for caching server lists and connection history
· Cache: Server list cache with timestamp for efficient updates
· Bookmark Database: Separate table for persistent bookmarks (immune to clear data)

11.2 Database Migration Strategy

```kotlin
@Database(entities = [Server::class, Bookmark::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    // Migration examples:
    // version 1 → 2: Add new column
    // version 2 → 3: Change column type
    
    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE servers ADD COLUMN new_column TEXT")
            }
        }
    }
}
```

11.3 Background Operations

· Server List Updates: Periodic WorkManager job (default 2 hours)
· Connection Monitoring: Foreground service with notification
· Auto-Connect: Background process for server testing and fallback

---

12. Versioning & Change Log Management

12.1 Automated Version Bumping

Requirement: The application version must be incremented on official releases and significant changes.

Implementation Strategy:

· Use Semantic Versioning (SemVer): MAJOR.MINOR.PATCH
· Version numbers stored in gradle.properties or build.gradle.kts

Version Bumping Strategy:

1. Manual Version Bump: Developer manually updates version for meaningful changes:
   · PATCH: Bug fixes and minor improvements
   · MINOR: New features (backward compatible)
   · MAJOR: Breaking changes
2. CI/CD Automation:
   · Version bump on merge to main branch (using GitHub Actions or GitLab CI)
   · Increment PATCH for each merge to main (e.g., 1.2.3 → 1.2.4)
   · MINOR and MAJOR are manually triggered
3. Alternative (Recommended):
   · Use version from git tags: git describe --tags --dirty
   · Version format: 1.2.3+42 (where 42 is commit count)

Example build.gradle.kts snippet:

```kotlin
android {
    defaultConfig {
        versionCode = getVersionCode()  // Based on commit count or build number
        versionName = getVersionName()  // From git tag or VERSION file
    }
}

fun getVersionName(): String {
    // Read from VERSION file or derive from latest git tag
    return "1.2.3"
}

fun getVersionCode(): Int {
    // Increment with each build (using commit count)
    return 42
}
```

Recommendation: Use version from git tags for clean versioning. Only bump on release merges, not every commit.

12.2 Session Work Log (Changelog)

File Name: CHANGELOG.md (stored in project root)

Format: Follows Keep a Changelog convention.

Update Mechanism:

· Every commit must include entry under [Unreleased] section
· When released, move to new version tag with date

---

13. Development Workflow & Git Practices

13.1 Step-by-Step Commits (Workflow-like)

Guidelines:

· Atomic Commits: Each commit contains one self-contained change
· Descriptive Messages: Follow conventional commit format (feat:, fix:, docs:, style:, refactor:, test:, chore:)
· No Large, Monolithic Commits: Break down large features into multiple smaller commits
· Commit Often: Commit after completing each logical step

13.2 Permanent Deletion of Unused/Extra Files

Process:

1. Identify unused files (old icons, backup files, IDE-specific files)
2. Remove from Git tracking: git rm <file>
3. Commit: chore: remove unused file <file>
4. For untracked files: Use git clean -fd (with preview: git clean -n)
5. For sensitive data: Use git filter-branch or BFG Repo-Cleaner

---

14. Security Considerations

14.1 Kill Switch Implementation

Requirement: Block internet access if VPN disconnects unexpectedly.

Correct Implementation Strategy:

Android does not allow apps to programmatically force a system-level kill switch. Instead, the application must:

1. Recommend Always-on VPN to the user via system settings
2. Implement proper VPN routing to ensure all traffic goes through the tunnel
3. Monitor connection status and notify the user of disconnections

14.1.1 Always-on VPN Recommendation

```kotlin
fun openVpnSettings(context: Context) {
    val intent = Intent(Settings.ACTION_VPN_SETTINGS)
    context.startActivity(intent)
}

fun showAlwaysOnRecommendation() {
    // Show a dialog explaining how to enable Always-on VPN
    // User must manually enable: Settings → VPN → VpnG → Always-on VPN
}
```

14.1.2 Proper VPN Routing

```kotlin
fun configureVpnRouting(builder: VpnService.Builder) {
    // Route all IPv4 traffic through VPN
    builder.addRoute("0.0.0.0", 0)
    
    // Route all IPv6 traffic through VPN (if supported)
    builder.addRoute("::", 0)
    
    // Set MTU for optimal performance
    builder.setMtu(1400)  // Standard VPN MTU to avoid fragmentation
    
    // Set session name for identification
    builder.setSession("VpnG")  // ✅ Correct method
}
```

14.1.3 Connection Monitoring

```kotlin
fun monitorVpnConnection() {
    // Check VPN status periodically
    if (!isVpnRunning()) {
        // Show notification to user
        showDisconnectedNotification()
        
        // Optionally, attempt auto-reconnect
        if (autoReconnectEnabled) {
            attemptReconnection()
        }
    }
}
```

Note: The setBlocking(true) method does not block non-VPN traffic. It only controls blocking/non-blocking I/O operations on the tun file descriptor. For true kill switch functionality, the user must enable "Always-on VPN" in system settings, which Android provides as a system-level feature.

14.2 DNS Leak Prevention

Requirement: Ensure all DNS queries go through VPN tunnel.

Correct Implementation:

```kotlin
fun configureDns(builder: VpnService.Builder, dnsServers: List<String>) {
    // Set DNS servers through VPN interface
    dnsServers.forEach { dns ->
        builder.addDnsServer(dns)
    }
    
    // Route all DNS traffic through VPN
    // DNS queries will use the VPN-assigned DNS servers
    // This is handled automatically by VpnService.Builder
}
```

Note: When addRoute("0.0.0.0", 0) is used, all traffic including DNS queries is routed through the VPN tunnel. Android automatically handles DNS leak prevention when DNS servers are set via addDnsServer() and all traffic is routed through the VPN. No runtime verification is needed.

14.3 Encryption Standards

Protocol Encryption Key Exchange
SoftEther (TCP) AES-256-GCM TLS 1.2/1.3
OpenVPN (TCP/UDP) AES-256-CBC / AES-256-GCM TLS/SSL
MS-SSTP AES-256-CBC TLS/SSL

14.4 Security Best Practices

Practice Implementation
No Logging Policy Application does not log user activity
Secure Storage Use Android Keystore for sensitive data
Certificate Pinning Applied to API endpoints (vpngate.net, GitHub raw) only. VPN server certificates are validated via standard TLS chain verification.
TLS/SSL Version Use TLS 1.2+ for all connections

14.5 Analytics & Crash Reporting

Policy: Due to the privacy-focused nature of this application, NO analytics or crash reporting tools are integrated. This includes:

· No Firebase Analytics
· No Crashlytics
· No third-party tracking
· No usage data collection

This policy is explicitly stated in the Privacy Policy.

---

15. Dependencies

```gradle
// Core
implementation 'androidx.core:core-ktx:1.12.0'
implementation 'androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0'

// Compose
implementation 'androidx.compose.ui:ui:1.5.4'
implementation 'androidx.compose.material3:material3:1.1.2'
implementation 'androidx.compose.material3:material3-window-size-class:1.1.2'

// Navigation
implementation 'androidx.navigation:navigation-compose:2.7.5'

// Networking
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'com.squareup.retrofit2:converter-scalars:2.9.0'

// Database
implementation 'androidx.room:room-runtime:2.6.0'
implementation 'androidx.room:room-ktx:2.6.0'

// DataStore (Preferences)
implementation 'androidx.datastore:datastore-preferences:1.0.0'

// Background Processing
implementation 'androidx.work:work-runtime-ktx:2.9.0'

// Dependency Injection
implementation 'com.google.dagger:hilt-android:2.48'

// HTML Parsing
implementation 'org.jsoup:jsoup:1.17.2'

// Image Loading (Compose)
implementation 'io.coil-kt:coil-compose:2.5.0'

// VPN Modules (local submodules)
implementation project(path: ':vpnLib')
implementation project(path: ':sstpClient')
implementation project(path: ':SoftEtherClient')

// DoH Support
implementation 'com.squareup.okhttp3:okhttp-dnsoverhttps:4.12.0'
```

---

16. Module References

The following modules are used in the base project and must be included as submodules or dependencies:

Module Protocol Repository URL License
SoftEther-Android-Module SoftEther VPN https://github.com/hoang-rio/SoftEther-Android-Module GPLv3
OpenVPN for Android (ics-openvpn) OpenVPN https://github.com/schwabe/ics-openvpn GPLv2-or-later
Open SSTP Client MS-SSTP https://github.com/kittoku/Open-SSTP-Client MIT

Note: Image loading uses Coil (see Dependencies section), which is not a submodule.

Submodule Initialization:

```bash
git submodule add https://github.com/hoang-rio/SoftEther-Android-Module SoftEtherClient
git submodule add https://github.com/schwabe/ics-openvpn vpnLib
git submodule add https://github.com/kittoku/Open-SSTP-Client sstpClient
```

---

17. License Compatibility

Module License Compatible
SoftEther-Android-Module GPLv3 ✅
OpenVPN for Android (ics-openvpn) GPLv2-or-later ✅ Compatible with GPLv3
Open SSTP Client MIT ✅ Compatible
VpnG (Application) GPLv3 ✅

Note: ics-openvpn uses GPLv2 with the "or later" clause, making it compatible with GPLv3. The combined work is distributed under GPLv3. Any project using this code must also be open source.

---

18. Native Code & ABI Configuration

18.1 NDK Configuration

```gradle
android {
    ndkVersion = "26.3.11579264"  // Latest stable NDK version
    
    defaultConfig {
        ndk {
            // ABI filters for native code
            abiFilters += listOf(
                "arm64-v8a",      // Modern ARM devices (64-bit)
                "armeabi-v7a",    // Legacy ARM devices (32-bit)
                "x86_64"          // For emulator testing (debug builds only)
            )
            // NOTE: x86 excluded to reduce APK size
        }
        
        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++17"
                arguments += "-DANDROID_STL=c++_shared"
            }
        }
    }
    
    // Split APK by ABI (optional)
    splits {
        abi {
            enable = true
            reset()
            include += listOf("arm64-v8a", "armeabi-v7a")
            universalApk = false  // Generate separate APKs per ABI
        }
    }
}
```

18.2 APK Size Estimation

Component Estimated Size
SoftEther Native Library ~3-5 MB (arm64)
OpenVPN Native Library ~1-2 MB
SSTP Native Library ~500 KB
Application Code + Resources ~5-8 MB
Total (arm64-v8a) ~10-15 MB

18.3 Optimization Recommendations

1. Enable ProGuard/R8: Reduce DEX size by 30-50%
2. Enable resource shrinking: Remove unused resources
3. Use extractNativeLibs="false": Reduce APK size by not extracting native libs at install
4. Consider App Bundle: Use Android App Bundle for optimized delivery per device

Note: Native code requires the NDK. Ensure proper installation and configuration.

---

19. Testing Strategy

19.1 Unit Tests

Coverage:

· Data layer (Repository, DataSource)
· Domain layer (UseCases, Models)
· ViewModel logic
· Utility functions

Framework: JUnit5 + MockK

```kotlin
@Test
fun testServerRepository_fetchServers_success() {
    val repository = ServerRepository(mockApi, mockHtml)
    val result = repository.fetchServers()
    assertTrue(result.isSuccess)
    assertTrue(result.getOrNull()?.isNotEmpty() ?: false)
}
```

19.2 Integration Tests

Coverage:

· Server list update flow
· Protocol switching
· DNS configuration
· Bookmark persistence

Framework: AndroidJUnit4 + Espresso

Emulator Configuration:

· Use arm64-v8a emulator image (with ARM translation for x86 hosts)
· Test with different API levels (26, 33, 34)
· For CI/CD, use x86_64 with ABI inclusion in debug builds

19.3 UI Tests

Coverage:

· Server list display
· Filtering and sorting
· Connection button states
· Log window functionality

Framework: Compose UI Testing

19.4 Performance Tests

Coverage:

· Server list update time
· Connection establishment time
· Memory usage
· APK size

Tools: Android Studio Profiler, Baseline Profiles

19.5 Test Coverage Goals

Component Target Coverage
Domain Layer 90%+
Data Layer 80%+
ViewModel 80%+
UI 60%+ (critical paths)
Total 75%+

19.6 Mocking Native Modules

For testing purposes, native modules (SoftEther, OpenVPN) are mocked using:

· Mockito for mocking classes
· MockK for Kotlin-friendly mocking
· Interface-based design to allow swapping implementations

---

20. References

1. Base Project: vpngate-connector
2. Official VPN Gate API: http://www.vpngate.net/api/iphone/
3. Primary Website (HTML): https://www.vpngate.net/en/
4. Mirror CSV (Backup): https://raw.githubusercontent.com/morteza-taheri/VpnM/refs/heads/master/Servers.csv
5. Mirror Sites List: https://www.vpngate.net/en/sites.aspx
6. SoftEther Protocol: SoftEther VPN Project – SoftEtherVPN_Stable v4.44-9807-rtm
7. OpenVPN Library: ics-openvpn v0.7.64
8. SSTP Client: Open-SSTP-Client
9. SoftEther-Android-Module: SoftEther-Android-Module
10. Coil Image Loading: coil-kt/coil v2.5.0

---

Summary of Key Features

Feature Status
Modern UI with Jetpack Compose & Material 3 ✅
Multi-language (Persian & English) with calendar integration ✅
Dark & Light themes with dynamic color ✅
Three-tier server fetching strategy (API, HTML, Mirror) ✅
HTML table parsing for protocol support (green checkmarks) ✅
SSTP details derived from OpenVPN/SSL-VPN ✅
Automatic server updates every 2 hours (configurable) ✅
Manual update button with loading indication ✅
Auto-connect with fallback server testing ✅
Per-server independent timeout (default: 10 seconds) ✅
Progress bar showing "Testing server X/Y" during auto-connect ✅
Split tunneling (select which apps use VPN) ✅
Custom DNS with preset popular DNS servers ✅
DNS over HTTPS (DoH) support ✅
Multi-protocol support (SoftEther, OpenVPN, SSTP) - L2TP removed ✅
SoftEther UDP disabled (coming soon) with note ✅
"Always Ask" mode for protocol selection ✅
Server list filtering (country, protocol, bookmark) ✅
Bookmark filter (All / Bookmarked Only) ✅
Sorting (pre-filter and post-filter modes) ✅
Search (by server name, country, IP) ✅
Bookmark/star with persistent storage (immune to data wipe) ✅
Ping test button on each server item ✅
Protocol badges with port and transport type (TCP/UDP) ✅
Selected & Connected state highlighting ✅
Connect button larger than others ✅
Protocol selection dialog on connect ✅
Switch to Home screen after protocol selection ✅
Log window on Home screen with clear, copy, and expand ✅
session.log with location, format, and retention policy ✅
Toast messages for user events ✅
Connection log removed from Settings (only on Home) ✅
Data Sources configuration (enable/disable, edit URLs) ✅
Mirror CSV disabled by default ✅
Permissions section with background activity toggle ✅
Battery optimization configuration ✅
POST_NOTIFICATIONS permission for Android 13+ ✅
FOREGROUND_SERVICE_SPECIAL_USE for Android 14+ ✅
REQUEST_IGNORE_BATTERY_OPTIMIZATIONS permission ✅
Correct WRITE_EXTERNAL_STORAGE with maxSdkVersion ✅
Coil for image loading (Compose-optimized) ✅
SoftEther authentication methods (Anonymous, PASSWORD, PLAIN_PASSWORD, AUTO) ✅
Detailed protocol module integration with accurate repository links ✅
Correct OpenSSL configuration for SoftEther module (per-ABI) ✅
Unified VpnService architecture with protocol adapters ✅
License compatibility documented (GPLv2-or-later compatible) ✅
NDK and ABI configuration (arm64-v8a, armeabi-v7a, x86_64) ✅
Detailed testing strategy (Unit, Integration, UI, Performance) ✅
Correct Kill Switch implementation (Always-on VPN recommendation) ✅
Correct DNS Leak Prevention implementation (proper routing) ✅
Versioning strategy (CI/CD-based, not per-commit) ✅
Error Handling strategy (OperationResult, Retry policy) ✅
Accessibility requirements (TalkBack, touch targets, contrast) ✅
Offline behavior (cached servers, warnings) ✅
No analytics/crash reporting (privacy-focused) ✅
Database migration strategy ✅
Coroutine Dispatcher strategy ✅
API endpoints & rate limiting documentation ✅
Notification behavior documentation ✅
ServerSelectionState enum definition ✅
Certificate Pinning properly scoped ✅
Connecting state with nullable progress/total ✅
DoH implementation details with OkHttp ✅
CHANGELOG.md in project root ✅
Step-by-step commits to GitHub ✅
Permanent deletion of unused files ✅
Clean architecture with modern Android practices ✅

---

End of Document