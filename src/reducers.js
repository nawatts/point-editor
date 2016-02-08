import {ADD_POINT, DELETE_POINT, MOVE_POINT, LABEL_POINT} from "./actions";

export const pointsReducer = (state=[], action) => {
    switch (action.type) {
        case ADD_POINT:
            let newPoint = {
                location: action.location,
                label: `Point ${state.length + 1}`
            };
            return [...state, newPoint];

        case DELETE_POINT:
            return [
                ...state.slice(0, action.pointIndex),
                ...state.slice(action.pointIndex + 1)
            ];

        case MOVE_POINT:
            return [
                ...state.slice(0, action.pointIndex),
                {
                    ...state[action.pointIndex],
                    location: action.location
                },
                ...state.slice(action.pointIndex + 1)
            ];

        case LABEL_POINT:
            return [
                ...state.slice(0, action.pointIndex),
                {
                    ...state[action.pointIndex],
                    label: action.label
                },
                ...state.slice(action.pointIndex + 1)
            ];

        default:
            return state;
    }
}
