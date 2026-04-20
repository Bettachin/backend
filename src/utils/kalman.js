const stateMap = new Map();

function createInitialState(lat, lng, timestamp) {
  return {
    x: [lat, lng, 0, 0],
    P: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    lastTime: timestamp,
  };
}

function multiply(A, B) {
  return A.map((row, i) =>
    B[0].map((_, j) =>
      row.reduce((sum, _, k) => sum + A[i][k] * B[k][j], 0)
    )
  );
}

function add(A, B) {
  return A.map((row, i) =>
    row.map((val, j) => val + B[i][j])
  );
}

function subtract(A, B) {
  return A.map((row, i) =>
    row.map((val, j) => val - B[i][j])
  );
}

function transpose(A) {
  return A[0].map((_, i) => A.map(row => row[i]));
}

function identity(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function kalmanFilter(boatId, lat, lng, timestamp = Date.now()) {

  if (!stateMap.has(boatId)) {
    stateMap.set(boatId, createInitialState(lat, lng, timestamp));
    return { lat, lng };
  }

  const state = stateMap.get(boatId);

  const dt = (timestamp - state.lastTime) / 1000 || 1;
  state.lastTime = timestamp;

  const A = [
    [1, 0, dt, 0],
    [0, 1, 0, dt],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  const H = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
  ];

  const Q = [
    [0.0001, 0, 0, 0],
    [0, 0.0001, 0, 0],
    [0, 0, 0.01, 0],
    [0, 0, 0, 0.01],
  ];

  const R = [
    [0.001, 0],
    [0, 0.001],
  ];

  const x = [[state.x[0]], [state.x[1]], [state.x[2]], [state.x[3]]];
  const z = [[lat], [lng]];

  const x_pred = multiply(A, x);
  const P_pred = add(
    multiply(multiply(A, state.P), transpose(A)),
    Q
  );

  const y = subtract(z, multiply(H, x_pred));

  const S = add(
    multiply(multiply(H, P_pred), transpose(H)),
    R
  );

  const det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
  const S_inv = [
    [S[1][1] / det, -S[0][1] / det],
    [-S[1][0] / det, S[0][0] / det],
  ];

  const K = multiply(
    multiply(P_pred, transpose(H)),
    S_inv
  );

  const x_new = add(x_pred, multiply(K, y));

  const I = identity(4);
  const P_new = multiply(
    subtract(I, multiply(K, H)),
    P_pred
  );

  state.x = [
    x_new[0][0],
    x_new[1][0],
    x_new[2][0],
    x_new[3][0],
  ];
  state.P = P_new;

  stateMap.set(boatId, state);

  return {
    lat: state.x[0],
    lng: state.x[1],
  };
}

module.exports = kalmanFilter;