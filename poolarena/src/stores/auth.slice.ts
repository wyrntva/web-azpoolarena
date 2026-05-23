import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/auth';
import { LoginResponse } from '@/types/auth.types';
import { UserGender, UserRank } from '@/types/user.types';

export interface AuthState {
  token: string | null;
  user: LoginResponse['users'] | null;
  loading: boolean;
  error: string | null;
}

// Helper to safely get from localStorage
const getStoredUser = (): LoginResponse['users'] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: getStoredUser(),
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<LoginResponse, { emailOrPhone: string; password: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      return response;
    } catch (error: any) {
      // Get error message from axios response or fallback
      const errorMessage = error?.response?.data?.detail ?? error?.message ?? 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerThunk = createAsyncThunk<
  void,
  { fullName: string; phoneNumber: string; password: string; email?: string; gender?: UserGender; address?: string; rank?: UserRank, role?: string }
>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { fullName, phoneNumber, password, email, gender, address, rank, role = 'player' } = payload;
      await authService.register({ fullName, phoneNumber, password, email, gender, address, rank, role } as any);
    } catch (error: any) {
      return rejectWithValue(error?.message ?? 'Register failed');
    }
  }
);

export const forgotPasswordThunk = createAsyncThunk<
  void,
  { phoneNumber: string }
>(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(payload.phoneNumber as any);
    } catch (error: any) {
      return rejectWithValue(error?.message ?? 'Forgot password failed');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
      }
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setUser(state, action: PayloadAction<LoginResponse['users'] | null>) {
      state.user = action.payload;
      // Persist user data to localStorage
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('user', JSON.stringify(action.payload));
        } else {
          localStorage.removeItem('user');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.users ?? null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.access_token);
          // Save user data for faster page loads
          if (action.payload.users) {
            localStorage.setItem('user', JSON.stringify(action.payload.users));
          }
          // Also set cookie for middleware to read (server-side)
          document.cookie = `token=${action.payload.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
      })
      .addCase(loginThunk.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? 'Register failed';
      })
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPasswordThunk.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? 'Forgot password failed';
      });
  },
});

export const { logout, setToken, setUser } = authSlice.actions;

export default authSlice.reducer;


