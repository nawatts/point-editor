export const normalizePoint = point => {
  if (Array.isArray(point)) {
    return point;
  }
  return [point.lat, point.lng || point.lon];
};

export const ADD_POINT = 'ADD_POINT';
export const addPoint = (location) => ({
  type: ADD_POINT,
  location: normalizePoint(location),
});

export const DELETE_POINT = 'DELETE_POINT';
export const deletePoint = (pointIndex) => ({
  type: DELETE_POINT,
  pointIndex,
});

export const MOVE_POINT = 'MOVE_POINT';
export const movePoint = (pointIndex, location) => ({
  type: MOVE_POINT,
  pointIndex,
  location: normalizePoint(location),
});

export const LABEL_POINT = 'LABEL_POINT';
export const labelPoint = (pointIndex, label) => ({
  type: LABEL_POINT,
  pointIndex,
  label,
});
