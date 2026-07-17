package com.vpng.client.vpn;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VpnBridge")
public class VpnBridgePlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Intent intent = VpnService.prepare(getContext());
        JSObject response = new JSObject();
        response.put("granted", intent == null);
        call.resolve(response);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = VpnService.prepare(getContext());
        if (intent != null) {
            startActivityForResult(call, intent, "vpnPermissionResult");
        } else {
            JSObject response = new JSObject();
            response.put("granted", true);
            call.resolve(response);
        }
    }

    @ActivityCallback
    private void vpnPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        boolean granted = result.getResultCode() == Activity.RESULT_OK;
        JSObject response = new JSObject();
        response.put("granted", granted);
        call.resolve(response);
    }

    @PluginMethod
    public void startVpn(PluginCall call) {
        String serverIp = call.getString("serverIp", "");
        int port = call.getInt("port", 1194);
        String config = call.getString("config", "");
        String username = call.getString("username", "");
        String password = call.getString("password", "");
        String protocol = call.getString("protocol", "openvpn");

        try {
            if ("softether".equalsIgnoreCase(protocol)) {
                ConnectionConfigHelper.ConnectionConfig connConfig = new ConnectionConfigHelper.ConnectionConfig(
                    username,
                    password,
                    ConnectionConfigHelper.AuthMethod.PLAIN_PASSWORD,
                    serverIp,
                    port
                );
                ConnectionConfigHelper.startSoftEther(getContext(), connConfig);
            } else {
                ConnectionConfigHelper.startOpenVpn(getContext(), serverIp, port, config);
            }
            JSObject response = new JSObject();
            response.put("success", true);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Failed to start VPN: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopVpn(PluginCall call) {
        try {
            ConnectionConfigHelper.stopVpn(getContext());
            JSObject response = new JSObject();
            response.put("success", true);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Failed to stop VPN: " + e.getMessage());
        }
    }
}
