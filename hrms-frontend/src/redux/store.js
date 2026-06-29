import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './slices/authSlice.js';
import attendancePunchReducer from './slices/attendancePunchSlice.js';

const appReducer = combineReducers({
  auth: authReducer,
  attendancePunch: attendancePunchReducer,
});

const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    state = undefined;
  }

  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
