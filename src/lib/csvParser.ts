import { VpnServer } from "../types";

/**
 * Parses a standard VPNGate style CSV string into VpnServer objects.
 * Handles headers, skips lines starting with '*' or empty lines, and supports standard VPNGate attributes.
 */
export function parseVpnGateCSV(csvText: string): VpnServer[] {
  if (!csvText) return [];

  const lines = csvText.split(/\r?\n/);
  let headerIndex = -1;

  // Find where header row starts
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#HostName") || line.startsWith("HostName")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.warn("Could not find standard VPNGate CSV header row in the provided text. Attempting simple column mapping...");
    // If no header, let's try a simple default header assumption or return empty
    return [];
  }

  const headerLine = lines[headerIndex].replace(/^#/, ""); // Remove # if present
  const headers = headerLine.split(",").map(h => h.trim());

  const parsedServers: VpnServer[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("*") || line === "") continue;

    // Split CSV correctly (handling potential comma inside quotes if any)
    const values = splitCsvLine(line);
    if (values.length < headers.length) continue;

    const serverObj: any = {};
    headers.forEach((header, idx) => {
      serverObj[header] = values[idx]?.trim() || "";
    });

    if (!serverObj.IP || serverObj.IP === "0.0.0.0") continue;

    parsedServers.push({
      HostName: serverObj.HostName || "vpngate",
      IP: serverObj.IP,
      Score: parseInt(serverObj.Score) || 0,
      Ping: parseInt(serverObj.Ping) || 999,
      Speed: parseInt(serverObj.Speed) || 0,
      CountryLong: serverObj.CountryLong || "Unknown Country",
      CountryShort: serverObj.CountryShort || "UN",
      NumVpnConnections: parseInt(serverObj.NumVpnConnections) || 0,
      Operator: serverObj.Operator || "Anonymous",
      Message: serverObj.Message || "",
      OpenVPN_ConfigData_Base64: serverObj.OpenVPN_ConfigData_Base64 || "",
      L2TP_IPsec: serverObj.L2TP_IPsec === "1" || serverObj.L2TP_IPsec === "true" || serverObj.L2TP_IPsec === true,
      "MS-SSTP": serverObj["MS-SSTP"] === "1" || serverObj["MS-SSTP"] === "true" || serverObj["MS-SSTP"] === true,
      OpenVPN: serverObj.OpenVPN === "1" || serverObj.OpenVPN === "true" || serverObj.OpenVPN === true,
      CreatedAt: serverObj.CreatedAt || new Date().toISOString()
    });
  }

  return parsedServers;
}

/**
 * Robustly splits a CSV line by commas, keeping quoted values intact.
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
