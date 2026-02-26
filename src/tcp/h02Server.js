const net = require("net");
const GPSLog = require("../models/GPSLog");
const kalman = require("../utils/kalman");

// Convert DDMM.MMMM or DDDMM.MMMM to decimal degrees
function dmToDecimal(dm, hemi) {
  const val = parseFloat(dm);
  if (Number.isNaN(val)) return null;

  // latitude has 2-degree digits, longitude has 3
  const degDigits = dm.indexOf(".") > 4 ? 3 : 2; // crude but works for ddmm vs dddmm
  const deg = parseInt(dm.slice(0, degDigits), 10);
  const min = parseFloat(dm.slice(degDigits));

  let dec = deg + min / 60;
  if (hemi === "S" || hemi === "W") dec *= -1;
  return dec;
}

function parseH02Packet(text) {
  // Example from H02 doc:
  // *HQ,353505910449999,V1,052825,A,2239.4210,N,11400.8825,E,0.00,348,180814,FFFFFFFF,90,3,460,0,...#
  // Packet definition in protocol doc :contentReference[oaicite:1]{index=1}

  const clean = text.trim();

  if (!clean.startsWith("*") || !clean.endsWith("#")) return null;

  const body = clean.slice(1, -1); // remove * and #
  const parts = body.split(",");

  // parts[0] = "HQ" typically
  const vendor = parts[0];
  const deviceId = parts[1];        // terminal number / IMEI
  const cmd = parts[2];             // V1 / XT / VI1 / etc

  return { vendor, deviceId, cmd, parts };
}

function makeAck(deviceId, cmd) {
  // Many servers respond with V4 acknowledgements for downlink commands.
  // Some devices behave fine without ACK, but others need it. :contentReference[oaicite:2]{index=2}
  return `*HQ,${deviceId},V4,${cmd}#`;
}

function startH02Server({ port = 8090 } = {}) {
  const server = net.createServer((socket) => {
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[TCP] connected ${remote}`);

    socket.on("data", async (buf) => {
      // H02 packets are ASCII, may arrive concatenated; split by '#'
      const raw = buf.toString("utf8");
      const chunks = raw.split("#").map(s => s.trim()).filter(Boolean).map(s => s + "#");

      for (const msg of chunks) {
        const pkt = parseH02Packet(msg);
        if (!pkt) {
          console.log("[TCP] unknown packet:", msg);
          continue;
        }

        const { deviceId, cmd, parts } = pkt;
        console.log(`[TCP] ${deviceId} ${cmd} => ${msg}`);

        // Heartbeat (XT) – reply (safe)
        if (cmd === "XT" || cmd === "HTBT") {
          socket.write(makeAck(deviceId, "XT"));
          continue;
        }

        // Location data (V1 or VI1)
        if (cmd === "V1" || cmd === "VI1") {
          // indexes based on protocol doc packet definition :contentReference[oaicite:3]{index=3}
          // ... cmd, HHmmss, A/V, latitude, N/S, longitude, E/W, speed, direction, DDMMYY, status, pw, ...
          const latDm = parts[5];
          const latH = parts[6];
          const lonDm = parts[7];
          const lonH = parts[8];

          const lat = dmToDecimal(latDm, latH);
          const lng = dmToDecimal(lonDm, lonH);

          if (lat == null || lng == null) continue;

          const filtered = kalman(deviceId, lat, lng);

          await GPSLog.create({
            boatId: deviceId, // map deviceId -> boat later if you want
            rawLat: lat,
            rawLng: lng,
            filteredLat: filtered.lat,
            filteredLng: filtered.lng
          });

          // Optional ACK (some devices don’t require, but doesn’t hurt)
          socket.write(makeAck(deviceId, cmd));
        }
      }
    });

    socket.on("close", () => console.log(`[TCP] closed ${remote}`));
    socket.on("error", (e) => console.log(`[TCP] error ${remote}`, e.message));
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[TCP] H02 server listening on port ${port}`);
  });

  return server;
}

module.exports = { startH02Server };