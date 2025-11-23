import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authApi from "../api/auth";

const stored = (() => {
  try {
    const raw = localStorage.getItem("authState");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
})();

const initialState = {
  user: stored?.user || null,
  token: stored?.token || null,
  status: "idle",
  error: null,
  info: null,
};

const persist = (state) => {
  localStorage.setItem(
    "authState",
    JSON.stringify({ user: state.user, token: state.token })
  );
};

export const login = createAsyncThunk("auth/login", async (payload, thunkAPI) => {
  try {
    return await authApi.login(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue({ message: err.message, payload: err.payload });
  }
});

export const register = createAsyncThunk("auth/register", async (payload, thunkAPI) => {
  try {
    return await authApi.register(payload);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email, thunkAPI) => {
    try {
      return await authApi.requestPasswordReset(email);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, thunkAPI) => {
    try {
      return await authApi.resetPassword(payload);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (token, thunkAPI) => {
  try {
    return await authApi.verifyEmail(token);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (email, thunkAPI) => {
    try {
      return await authApi.resendVerification(email);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      persist(state);
    },
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        persist(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || action.payload || action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.info = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(requestPasswordReset.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.info = action.payload.message;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.user) {
          state.user = action.payload.user;
          if (action.payload.token) {
            state.token = action.payload.token;
          }
          persist(state);
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(resendVerification.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.info = action.payload.message;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout, setAuth } = authSlice.actions;
export default authSlice.reducer;
