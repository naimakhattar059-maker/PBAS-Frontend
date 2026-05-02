import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/authSlice";

export const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        status: "idle",
        error: null,
        info: null,
        ...preloadedState.auth,
      },
    },
  });
