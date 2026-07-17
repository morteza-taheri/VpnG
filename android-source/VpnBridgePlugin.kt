package com.vpng.client.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "VpnBridge")
class VpnBridgePlugin : Plugin() {

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        val intent = VpnService.prepare(context)
        val response = JSObject().apply {
            put("hasPermission", intent == null)
        }
        call.resolve(response)
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val intent = VpnService.prepare(context)
        if (intent == null) {
            val response = JSObject().apply {
                put("granted", true)
            }
            call.resolve(response)
        } else {
            startActivityForResult(call, intent, "vpnPermissionResult")
        }
    }

    @ActivityCallback
    private fun vpnPermissionResult(call: PluginCall, result: ActivityResult) {
        val response = JSObject().apply {
            put("granted", result.resultCode == Activity.RESULT_OK)
        }
        call.resolve(response)
    }

    @PluginMethod
    fun startVpn(call: PluginCall) {
        val serverIp = call.getString("serverIp") ?: ""
        val port = call.getInt("port", 1194)
        val configBase64 = call.getString("configBase64") ?: ""
        val protocol = call.getString("protocol") ?: "SoftEther"
        val username = call.getString("username") ?: "vpn"
        val password = call.getString("password") ?: "vpn"
        val hubName = call.getString("hubName") ?: "VPN"

        val intent = VpnService.prepare(context)
        if (intent != null) {
            val response = JSObject().apply {
                put("status", "need_permission")
            }
            call.resolve(response)
            return
        }

        ConnectionConfigHelper.startVpnWithProtocol(
            context, 
            serverIp, 
            port, 
            configBase64, 
            protocol, 
            username, 
            password, 
            hubName
        )
        val response = JSObject().apply {
            put("status", "connecting")
        }
        call.resolve(response)
    }

    @PluginMethod
    fun stopVpn(call: PluginCall) {
        ConnectionConfigHelper.stopVpn(context)
        val response = JSObject().apply {
            put("status", "disconnected")
        }
        call.resolve(response)
    }
}
