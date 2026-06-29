import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

const userFromStorage = (() => {
  try {
    const raw = localStorage.getItem('hrms_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Storage parse failed:', error);
    return null;
  }
})();

const tokenFromStorage = localStorage.getItem('hrms_token') || null;

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);

    return data;
  } catch (err) {
    const message = err.response?.data?.message || 'Login failed';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: userFromStorage,
    token: tokenFromStorage,
    loading: false,
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('hrms_user');
      localStorage.removeItem('hrms_token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {

        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('hrms_user', JSON.stringify(action.payload.user));
        localStorage.setItem('hrms_token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      });
  }
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
