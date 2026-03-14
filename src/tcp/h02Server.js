const net = require("net");
const GPSLog = require("../models/GPSLog");
const Boat = require("../models/Boat");
const kalman = require("../utils/kalman");

function dmToDecimal(dm, hemi) {
  const val = parseFloat(dm);
  if (Number.isNaN(val)) return null;

  const degDigits = dm.indexOf(".") > 4 ? 3 : 2;
  const deg = parseInt(dm.slice(0, degDigits), 10);
  const min = parseFloat(dm.slice(degDigits));

  let dec = deg + min / 60;
  if (hemi === "S" || hemi === "W") dec *= -1;
  return dec;
}

function parseH02Packet(text) {
  const clean = text.trim();
  if (!clean.startsWith("*") || !clean.endsWith("#")) return null;

  const body = clean.slice(1, -1);
  const parts = body.split(",");

  const vendor = parts[0];
  const deviceId = parts[1];
  const cmd = parts[2];

  return { vendor, deviceId, cmd, parts };
}

function makeAck(deviceId, cmd) {
  return `*HQ,${deviceId},V4,${cmd}#`;
}

function startH02Server({ port = 8090 } = {}) {
  const server = net.createServer((socket) => {
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[TCP] connected ${remote}`);

    socket.on("data", async (buf) => {
      try {
        const raw = buf.toString("utf8");
        const chunks = raw
          .split("#")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s + "#");

        for (const msg of chunks) {
          const pkt = parseH02Packet(msg);
          if (!pkt) {
            console.log("[TCP] unknown packet:", msg);
            continue;
          }

          const { deviceId, cmd, parts } = pkt;
          console.log(`[TCP] ${deviceId} ${cmd} => ${msg}`);

          if (cmd === "XT" || cmd === "HTBT") {
            socket.write(makeAck(deviceId, "XT"));
            continue;
          }

          if (cmd === "V1" || cmd === "VI1") {
            const latDm = parts[5];
            const latH = parts[6];
            const lonDm = parts[7];
            const lonH = parts[8];

            const lat = dmToDecimal(latDm, latH);
            const lng = dmToDecimal(lonDm, lonH);

            if (lat == null || lng == null) continue;

            // Find which boat owns this GPS device
            const boat = await Boat.findOne({ deviceId });

            if (!boat) {
              console.log(`[TCP] No boat mapped for deviceId ${deviceId}`);
              continue;
            }

            const filtered = kalman(deviceId, lat, lng);

            await GPSLog.create({
              boatId: boat._id,
              rawLat: lat,
              rawLng: lng,
              filteredLat: filtered.lat,
              filteredLng: filtered.lng,
              timestamp: new Date(),
            });

            console.log(`[TCP] Saved GPS for boat ${boat.name}`);

            socket.write(makeAck(deviceId, cmd));
          }
        }
      } catch (err) {
        console.error("[TCP] packet processing error:", err);
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