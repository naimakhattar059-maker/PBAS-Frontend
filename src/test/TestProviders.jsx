import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

export const TestProviders = ({ store, route = "/", children }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  </Provider>
);
