import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";
import { store } from "./store";
import "./index.css";
import App from "./App.jsx";
import { themeTokens } from "./theme";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={themeTokens}>
        <App />
      </ConfigProvider>
    </Provider>
  </StrictMode>
);
