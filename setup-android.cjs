const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("   VpnG Native Android Auto-Configurator Tool    ");
console.log("=================================================");

const androidDir = path.join(__dirname, 'android');

if (!fs.existsSync(androidDir)) {
    console.log("[-] 'android' directory not found yet. Skipping native injection.");
    console.log("    It will be created when Capacitor is fully initialized.");
    process.exit(0);
}

// 1. Destination for native VPN Kotlin files
const vpnDestDir = path.join(androidDir, 'app/src/main/java/com/vpng/client/vpn');
fs.mkdirSync(vpnDestDir, { recursive: true });

// Source native files
const sourceFiles = {
    'ConnectionConfigHelper.kt': path.join(__dirname, 'android-source/ConnectionConfigHelper.kt'),
    'MyVpnService.kt': path.join(__dirname, 'android-source/MyVpnService.kt'),
    'VpnBridgePlugin.kt': path.join(__dirname, 'android-source/VpnBridgePlugin.kt')
};

for (const [filename, sourcePath] of Object.entries(sourceFiles)) {
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(vpnDestDir, filename));
        console.log(`[+] Copied: ${filename} -> android/app/src/main/java/com/vpng/client/vpn/`);
    } else {
        console.warn(`[!] Warning: Source file ${filename} not found at ${sourcePath}`);
    }
}

// 2. Patch MainActivity.kt to register VpnBridgePlugin
const mainActivityPath = path.join(androidDir, 'app/src/main/java/com/vpng/client/MainActivity.kt');
if (fs.existsSync(mainActivityPath)) {
    let content = fs.readFileSync(mainActivityPath, 'utf8');
    
    // Check if import and registration are already added
    if (!content.includes('VpnBridgePlugin')) {
        console.log("[+] Patching MainActivity.kt to register VpnBridgePlugin...");
        
        // Add required imports
        content = content.replace(
            "import com.getcapacitor.BridgeActivity",
            "import android.os.Bundle\nimport com.getcapacitor.BridgeActivity\nimport com.vpng.client.vpn.VpnBridgePlugin"
        );

        // Add onCreate and register the plugin
        const registerCode = ` {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(VpnBridgePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}`;
        
        // Replace either standard empty class body or default braces
        if (content.includes('class MainActivity : BridgeActivity() {}')) {
            content = content.replace('class MainActivity : BridgeActivity() {}', `class MainActivity : BridgeActivity()${registerCode}`);
        } else if (content.includes('class MainActivity : BridgeActivity()')) {
            content = content.replace('class MainActivity : BridgeActivity()', `class MainActivity : BridgeActivity()${registerCode}`);
        } else if (content.includes('class MainActivity: BridgeActivity()')) {
            content = content.replace('class MainActivity: BridgeActivity()', `class MainActivity : BridgeActivity()${registerCode}`);
        }
        
        fs.writeFileSync(mainActivityPath, content, 'utf8');
        console.log("[+] MainActivity.kt successfully patched.");
    } else {
        console.log("[~] MainActivity.kt already contains VpnBridgePlugin registration.");
    }
} else {
    console.error(`[!] Error: MainActivity.kt not found at ${mainActivityPath}`);
}

// 3. Patch AndroidManifest.xml to register MyVpnService
const manifestPath = path.join(androidDir, 'app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
    let content = fs.readFileSync(manifestPath, 'utf8');
    
    if (!content.includes('com.vpng.client.vpn.MyVpnService')) {
        console.log("[+] Patching AndroidManifest.xml to register VpnService...");
        
        const serviceDeclaration = `
        <!-- VpnG system-level VPN Tunnel Service -->
        <service android:name="com.vpng.client.vpn.MyVpnService"
                 android:permission="android.permission.BIND_VPN_SERVICE"
                 android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService"/>
            </intent-filter>
        </service>
    </application>`;

        content = content.replace('</application>', serviceDeclaration);
        fs.writeFileSync(manifestPath, content, 'utf8');
        console.log("[+] AndroidManifest.xml successfully patched.");
    } else {
        console.log("[~] AndroidManifest.xml already contains MyVpnService registration.");
    }
} else {
    console.error(`[!] Error: AndroidManifest.xml not found at ${manifestPath}`);
}

console.log("[+] Auto-configuration complete!\n");
