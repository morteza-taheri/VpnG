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

// 1. Destination for native VPN files
const vpnDestDir = path.join(androidDir, 'app/src/main/java/com/vpng/client/vpn');
fs.mkdirSync(vpnDestDir, { recursive: true });

// 2. Detect language based on MainActivity files
const mainActivityPath = path.join(androidDir, 'app/src/main/java/com/vpng/client/MainActivity.kt');
const mainActivityJavaPath = path.join(androidDir, 'app/src/main/java/com/vpng/client/MainActivity.java');

const isKotlin = fs.existsSync(mainActivityPath);
const extension = isKotlin ? 'kt' : 'java';

console.log(`[+] Detected project type: ${isKotlin ? 'Kotlin' : 'Java'}`);

// Clean up old files of the opposite extension to avoid build errors (important!)
const oppositeExtension = isKotlin ? 'java' : 'kt';
const oldFiles = [
    `ConnectionConfigHelper.${oppositeExtension}`,
    `MyVpnService.${oppositeExtension}`,
    `VpnBridgePlugin.${oppositeExtension}`
];
for (const oldFile of oldFiles) {
    const oldFilePath = path.join(vpnDestDir, oldFile);
    if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`[-] Removed obsolete file: ${oldFile}`);
    }
}

// Source native files (use detected extension)
const sourceFiles = {
    [`ConnectionConfigHelper.${extension}`]: path.join(__dirname, `android-source/ConnectionConfigHelper.${extension}`),
    [`MyVpnService.${extension}`]: path.join(__dirname, `android-source/MyVpnService.${extension}`),
    [`VpnBridgePlugin.${extension}`]: path.join(__dirname, `android-source/VpnBridgePlugin.${extension}`)
};

for (const [filename, sourcePath] of Object.entries(sourceFiles)) {
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(vpnDestDir, filename));
        console.log(`[+] Copied: ${filename} -> android/app/src/main/java/com/vpng/client/vpn/`);
    } else {
        console.warn(`[!] Warning: Source file ${filename} not found at ${sourcePath}`);
    }
}

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
} else if (fs.existsSync(mainActivityJavaPath)) {
    let content = fs.readFileSync(mainActivityJavaPath, 'utf8');
    
    // Check if import and registration are already added
    if (!content.includes('VpnBridgePlugin')) {
        console.log("[+] Patching MainActivity.java to register VpnBridgePlugin...");
        
        // Add required imports
        content = content.replace(
            "import com.getcapacitor.BridgeActivity;",
            "import android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\nimport com.vpng.client.vpn.VpnBridgePlugin;"
        );

        // Add onCreate and register the plugin
        const registerCode = ` {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(VpnBridgePlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}`;
        
        // Replace either standard empty class body or default braces
        if (content.includes('public class MainActivity extends BridgeActivity {}')) {
            content = content.replace('public class MainActivity extends BridgeActivity {}', `public class MainActivity extends BridgeActivity${registerCode}`);
        } else if (content.includes('public class MainActivity extends BridgeActivity')) {
            content = content.replace('public class MainActivity extends BridgeActivity', `public class MainActivity extends BridgeActivity${registerCode}`);
        }
        
        fs.writeFileSync(mainActivityJavaPath, content, 'utf8');
        console.log("[+] MainActivity.java successfully patched.");
    } else {
        console.log("[~] MainActivity.java already contains VpnBridgePlugin registration.");
    }
} else {
    console.warn(`[!] Warning: Neither MainActivity.kt nor MainActivity.java was found under android/app/src/main/java/com/vpng/client/`);
}

// 3. Patch AndroidManifest.xml to register MyVpnService
const manifestPath = path.join(androidDir, 'app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
    let content = fs.readFileSync(manifestPath, 'utf8');
    
    let isModified = false;

    // Enable cleartext traffic (HTTP) for local API development/testing on real device
    if (!content.includes('android:usesCleartextTraffic="true"')) {
        console.log("[+] Patching AndroidManifest.xml to enable usesCleartextTraffic...");
        // Match <application and replace with <application android:usesCleartextTraffic="true"
        content = content.replace('<application', '<application android:usesCleartextTraffic="true"');
        isModified = true;
    }

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
        isModified = true;
        console.log("[+] AndroidManifest.xml VpnService registered.");
    }

    if (isModified) {
        fs.writeFileSync(manifestPath, content, 'utf8');
        console.log("[+] AndroidManifest.xml successfully patched.");
    } else {
        console.log("[~] AndroidManifest.xml is already patched.");
    }
} else {
    console.error(`[!] Error: AndroidManifest.xml not found at ${manifestPath}`);
}

console.log("[+] Auto-configuration complete!\n");
