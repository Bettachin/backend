let lastLat = null;
let lastLng = null;

function kalmanFilter(lat, lng) {
  if (lastLat === null) {
    lastLat = lat;
    lastLng = lng;
    return { lat, lng };
  }

  const smoothFactor = 0.7;

  lastLat = smoothFactor * lastLat + (1 - smoothFactor) * lat;
  lastLng = smoothFactor * lastLng + (1 - smoothFactor) * lng;

  return {
    lat: lastLat,
    lng: lastLng
  };
}

module.exports = kalmanFilter;