import { createSlice } from '@reduxjs/toolkit';

export const PUNCH_STATUS = {
  CHECKED_OUT: 'CHECKED_OUT',
  WORKING: 'WORKING',
  ON_LUNCH: 'ON_LUNCH',
};

const getEmployeeKey = (employeeId) => {
  if (!employeeId) return '';
  return String(employeeId?._id || employeeId?.id || employeeId);
};

const isEmptyOut = (value) =>
  value === null || value === undefined || value === '' || value === '--:--';

export const getStatusFromAttendance = (attendance) => {
  if (!attendance) return PUNCH_STATUS.CHECKED_OUT;

  if (Object.values(PUNCH_STATUS).includes(attendance?.punchStatus)) {
    return attendance.punchStatus;
  }

  const punches = Array.isArray(attendance?.punches)
    ? attendance.punches.filter(Boolean)
    : [];

  const lastPunch = punches[punches.length - 1];

  if (lastPunch?.type === 'lunch' && lastPunch?.in && isEmptyOut(lastPunch?.out)) {
    return PUNCH_STATUS.ON_LUNCH;
  }

  if (lastPunch?.type === 'work' && lastPunch?.in && isEmptyOut(lastPunch?.out)) {
    return PUNCH_STATUS.WORKING;
  }

  // Fallback for old records where punches array is missing/empty but checkIn exists.
  if (attendance?.checkIn && isEmptyOut(attendance?.checkOut)) {
    return PUNCH_STATUS.WORKING;
  }

  return PUNCH_STATUS.CHECKED_OUT;
};

const initialState = {
  statusByEmployeeId: {},
};

const attendancePunchSlice = createSlice({
  name: 'attendancePunch',
  initialState,
  reducers: {
    setPunchStatus: (state, action) => {
      const { employeeId, status } = action.payload || {};
      const employeeKey = getEmployeeKey(employeeId);

      if (!employeeKey || !status) return;

      state.statusByEmployeeId[employeeKey] = status;
    },

    setPunchStatusFromAttendance: (state, action) => {
      const { employeeId, attendance } = action.payload || {};
      const employeeKey = getEmployeeKey(employeeId);

      if (!employeeKey) return;

      state.statusByEmployeeId[employeeKey] = getStatusFromAttendance(attendance);
    },

    clearPunchStatus: (state, action) => {
      const employeeKey = getEmployeeKey(action.payload);

      if (employeeKey) {
        delete state.statusByEmployeeId[employeeKey];
      } else {
        state.statusByEmployeeId = {};
      }
    },
  },
});

export const {
  setPunchStatus,
  setPunchStatusFromAttendance,
  clearPunchStatus,
} = attendancePunchSlice.actions;

export const selectPunchStatus = (state, employeeId) => {
  const employeeKey = getEmployeeKey(employeeId);
  return state.attendancePunch?.statusByEmployeeId?.[employeeKey] || PUNCH_STATUS.CHECKED_OUT;
};

export const selectIsCheckedIn = (state, employeeId) => {
  const status = selectPunchStatus(state, employeeId);

  return [
    PUNCH_STATUS.WORKING,
    PUNCH_STATUS.ON_LUNCH,
  ].includes(status);
};

export const selectIsOnLunch = (state, employeeId) =>
  selectPunchStatus(state, employeeId) === PUNCH_STATUS.ON_LUNCH;

export default attendancePunchSlice.reducer;
