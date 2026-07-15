import React, { useState } from "react";
import { 
  Plus, Edit, Trash2, Key, Check, Network, ShieldCheck, 
  HelpCircle, Sparkles, Server, Info, Lock, Eye, EyeOff,
  Copy, FileCode, CheckCheck
} from "lucide-react";
import { VpnProfile, AuthMethod } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProfilesProps {
  profiles: VpnProfile[];
  onSelectProfile: (id: string) => void;
  onAddProfile: (profile: Omit<VpnProfile, "id" | "isActive">) => void;
  onDeleteProfile: (id: string) => void;
  theme: "dark" | "light";
}

export const Profiles: React.FC<ProfilesProps> = ({
  profiles,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
  theme
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formHost, setFormHost] = useState("");
  const [formPort, setFormPort] = useState(443);
  const [formUsername, setFormUsername] = useState("vpn");
  const [formPassword, setFormPassword] = useState("vpn");
  const [formAuthMethod, setFormAuthMethod] = useState<AuthMethod>("AUTO");
  const [formHubName, setFormHubName] = useState("VPN");
  const [formProtocol, setFormProtocol] = useState<"SoftEther" | "L2TP" | "OpenVPN" | "SSTP">("SoftEther");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formHost) return;

    onAddProfile({
      name: formName,
      host: formHost,
      port: formPort,
      username: formAuthMethod === "ANONYMOUS" ? "" : formUsername,
      password: formAuthMethod === "ANONYMOUS" ? "" : formPassword,
      authMethod: formAuthMethod,
      hubName: formHubName,
      protocol: formProtocol,
      isCustom: true
    });

    // Reset Form
    setFormName("");
    setFormHost("");
    setFormPort(443);
    setFormUsername("vpn");
    setFormPassword("vpn");
    setFormAuthMethod("AUTO");
    setFormHubName("VPN");
    setFormProtocol("SoftEther");
    setIsAdding(false);
  };

  // Helper to fill pre-configured presets
  const applyPreset = (presetType: "vpngate" | "paid" | "anonymous") => {
    if (presetType === "vpngate") {
      setFormName("VPNGate Auto Server");
      setFormHost("vpn21910037.vpngate.net");
      setFormPort(443);
      setFormAuthMethod("AUTO");
      setFormUsername("vpn");
      setFormPassword("vpn");
      setFormHubName("VPN");
      setFormProtocol("SoftEther");
    } else if (presetType === "paid") {
      setFormName("Premium RADIUS Server");
      setFormHost("radius-germany.vpn.com");
      setFormPort(1194);
      setFormAuthMethod("PLAIN_PASSWORD");
      setFormUsername("user");
      setFormPassword("secret");
      setFormHubName("SecureHub");
      setFormProtocol("OpenVPN");
    } else if (presetType === "anonymous") {
      setFormName("Anonymous SoftEther Hub");
      setFormHost("academic-relay.tsukuba.ac.jp");
      setFormPort(992);
      setFormAuthMethod("ANONYMOUS");
      setFormUsername("");
      setFormPassword("");
      setFormHubName("DEFAULT");
      setFormProtocol("SoftEther");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-sm font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>مدیریت پروفایل‌های اتصال</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">پروفایل مناسب را برای پروتکل‌های SoftEther، SSTP و OpenVPN پیکربندی کنید</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
            isAdding 
              ? "bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20" 
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
          }`}
        >
          <Plus size={14} className={`transition-transform duration-300 ${isAdding ? "rotate-45" : ""}`} />
          {isAdding ? "بستن فرم" : "پروفایل جدید"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className={`p-5 rounded-3xl ${
              theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
            } space-y-4 overflow-hidden`}
          >
            <div className="flex items-center justify-between border-b border-slate-500/5 pb-2.5">
              <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>افزودن پروفایل جدید VpnG</span>
              
              {/* Presets buttons */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("vpngate")}
                  className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-[8px] text-emerald-400 rounded-md font-sans font-semibold cursor-pointer"
                >
                  رایگان VPNGate
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("paid")}
                  className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/15 text-[8px] text-blue-400 rounded-md font-sans font-semibold cursor-pointer"
                >
                  پولی RADIUS
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("anonymous")}
                  className="px-2 py-0.5 bg-violet-500/10 hover:bg-violet-500/15 text-[8px] text-violet-400 rounded-md font-sans font-semibold cursor-pointer"
                >
                  ناشناس Hub
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">نام پروفایل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سرور آلمان من"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                />
              </div>

              {/* Server Host */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">آدرس هاست / IP</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: de.vpngate.net"
                  value={formHost}
                  onChange={(e) => setFormHost(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                />
              </div>

              {/* Port */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">پورت اتصال</label>
                <input
                  type="number"
                  required
                  placeholder="443"
                  value={formPort}
                  onChange={(e) => setFormPort(parseInt(e.target.value) || 443)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                />
              </div>

              {/* Virtual Hub Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">نام Virtual Hub</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: VPN"
                  value={formHubName}
                  onChange={(e) => setFormHubName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                />
              </div>

              {/* Protocol */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">پروتکل</label>
                <select
                  value={formProtocol}
                  onChange={(e) => setFormProtocol(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                >
                  <option value="SoftEther">SoftEther (SSL-VPN)</option>
                  <option value="OpenVPN">OpenVPN</option>
                  <option value="L2TP">L2TP/IPsec</option>
                  <option value="SSTP">SSTP</option>
                </select>
              </div>

              {/* Auth Method */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold">روش احراز هویت</label>
                <select
                  value={formAuthMethod}
                  onChange={(e) => setFormAuthMethod(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    theme === "dark" 
                      ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                  }`}
                >
                  <option value="AUTO">AUTO (VPNGate Default)</option>
                  <option value="PLAIN_PASSWORD">Plain Password / RADIUS</option>
                  <option value="ANONYMOUS">Anonymous Hub</option>
                </select>
              </div>

              {/* Username (Conditionally shown) */}
              {formAuthMethod !== "ANONYMOUS" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold">نام کاربری</label>
                  <input
                    type="text"
                    required
                    placeholder="vpn"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                      theme === "dark" 
                        ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                    }`}
                  />
                </div>
              )}

              {/* Password (Conditionally shown) */}
              {formAuthMethod !== "ANONYMOUS" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold">رمز عبور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="vpn"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border pl-10 ${
                        theme === "dark" 
                          ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer ${
                  theme === "dark" 
                    ? "border-slate-800/80 text-slate-400 hover:bg-slate-950" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                ثبت و ذخیره پروفایل
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Profiles list */}
      <div className="space-y-3.5">
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            layoutId={profile.id}
            className={`p-4 rounded-3xl border transition-all duration-300 relative ${
              profile.isActive 
                ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/40 shadow-md shadow-emerald-500/5" 
                : theme === "dark" 
                ? "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80" 
                : "bg-white hover:bg-slate-50 border-slate-100 shadow-sm"
            }`}
          >
            {/* Main content tap zone */}
            <div 
              className="flex items-start justify-between gap-4 cursor-pointer"
              onClick={() => onSelectProfile(profile.id)}
            >
              <div className="flex items-start gap-3.5">
                {/* Protocol logo wrapper */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0 ${
                  profile.isActive 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : theme === "dark"
                    ? "bg-slate-950 border-slate-800/60 text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}>
                  <Server size={18} />
                </div>

                <div>
                  <h4 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-1.5`}>
                    {profile.name}
                    {profile.isActive && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-bold tracking-wider">فعال</span>
                    )}
                  </h4>

                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    {profile.host}:{profile.port} ({profile.protocol})
                  </p>

                  <div className="flex gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-slate-500/5 border border-slate-500/10 text-[8px] text-slate-500 rounded-md font-bold">
                      Hub: {profile.hubName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold ${
                      profile.authMethod === "AUTO" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                        : profile.authMethod === "PLAIN_PASSWORD"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                    }`}>
                      احراز هویت: {
                        profile.authMethod === "AUTO" ? "AUTO" : 
                        profile.authMethod === "PLAIN_PASSWORD" ? "RADIUS/PLAIN" : "ANONYMOUS"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Status or Active Check */}
              <div className="flex items-center gap-2">
                {profile.isActive ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold hover:text-emerald-400 transition-colors duration-150">انتخاب</span>
                )}
                
                {/* Delete button (only for custom added servers) */}
                {profile.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop parent click trigger
                      onDeleteProfile(profile.id);
                    }}
                    className="w-8 h-8 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {profiles.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p className="text-xs">هیچ پروفایل اتصالی وجود ندارد.</p>
          </div>
        )}
      </div>

      {/* Dynamic Android Integration & Kotlin SDK Code Generator */}
      {profiles.length > 0 && (() => {
        const activeProfile = profiles.find(p => p.isActive) || profiles[0];
        const generatedKotlinCode = `// تنظیمات اتصال سرویس اندروید VPN (تولید شده برای پروفایل ${activeProfile.name})
val connectionConfig = ConnectionConfig(
    host = "${activeProfile.host}",
    port = ${activeProfile.port},
    username = "${activeProfile.authMethod === "ANONYMOUS" ? "" : (activeProfile.username || "vpn")}",
    password = "${activeProfile.authMethod === "ANONYMOUS" ? "" : (activeProfile.password || "vpn")}",
    authMethod = AuthMethod.${activeProfile.authMethod},
    hubName = "${activeProfile.hubName}",
    protocol = ProtocolType.${activeProfile.protocol.toUpperCase()}
)

// برقراری ارتباط پایدار با ماژول VpnG
VpnGClient.connect(context, connectionConfig, object : ConnectionListener {
    override fun onConnecting() {
        Log.i("VpnG", "در حال مذاکره و برقراری تونل امن...")
    }

    override fun onConnected() {
        Log.i("VpnG", "اتصال با موفقیت برقرار شد!")
    }

    override fun onDisconnected() {
        Log.i("VpnG", "اتصال قطع شد.")
    }
})`;

        const handleCopyCode = () => {
          navigator.clipboard.writeText(generatedKotlinCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <div className={`p-5 rounded-3xl ${
            theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
          } space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-500/5 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="text-emerald-400" size={18} />
                <div>
                  <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>پیکربندی ماژول اندروید (Kotlin SDK)</h3>
                  <p className="text-[10px] text-slate-500">کدهای ارتباطی اختصاصی هماهنگ با SoftEther-Android-Module</p>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyCode}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  copied 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-slate-500/5 hover:bg-slate-500/10 border-slate-500/10 text-slate-400"
                }`}
              >
                {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                {copied ? "کپی شد!" : "کپی کد کاتلین"}
              </button>
            </div>

            <div className="space-y-2.5 text-[11px] leading-relaxed">
              <p>
                برای برقراری تونل VPN در اپلیکیشن اندرویدی خود، از پیکربندی <strong className="text-emerald-400 font-sans">ConnectionConfig</strong> زیر استفاده کنید. این کد متناسب با پروفایل فعال <strong className="text-cyan-400">{activeProfile.name}</strong> به صورت خودکار تولید شده است:
              </p>

              {/* LTR Code display box */}
              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-900/80 overflow-x-auto select-all" dir="ltr">
                <pre className="font-mono text-[9px] text-emerald-300/90 leading-relaxed whitespace-pre font-medium">
                  {generatedKotlinCode}
                </pre>
              </div>

              <div className={`p-3.5 rounded-2xl border text-[10px] leading-relaxed flex items-start gap-2.5 ${
                theme === "dark" ? "bg-slate-950/40 border-slate-800/40 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
              }`}>
                <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  این کلاس تنظیمات از احراز هویت خودکار (<strong className="font-sans font-bold">AUTO</strong>)، پولی RADIUS با رمز عبور (<strong className="font-sans font-bold">PLAIN_PASSWORD</strong>) و همچنین اتصال ناشناس به Virtual Hub پشتیبانی می‌کند.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
