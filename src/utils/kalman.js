// Simple Kalman-like smoothing per boat (thesis-friendly)
const state = new Map(); // boatId -> { lat, lng }

function kalmanFilter(boatId, lat, lng) {
  if (!state.has(boatId)) {
    state.set(boatId, { lat, lng });
    return { lat, lng };
  }

  const prev = state.get(boatId);
  const smoothFactor = 0.7;

  const filteredLat = smoothFactor * prev.lat + (1 - smoothFactor) * lat;
  const filteredLng = smoothFactor * prev.lng + (1 - smoothFactor) * lng;

  state.set(boatId, { lat: filteredLat, lng: filteredLng });

  return { lat: filteredLat, lng: filteredLng };
}

module.exports = kalmanFilter;
