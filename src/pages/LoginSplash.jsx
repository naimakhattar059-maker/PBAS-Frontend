import { Link } from "react-router-dom";
import "./LoginSplash.css";

const LoginSplash = () => (
  <main className="login-splash">
    <div className="login-splash__frame">
      <img
        className="login-splash__image"
        src="/login-splash.png"
        alt="Budget Automation System"
      />
      <Link className="login-splash__button" to="/login/form" aria-label="Open login form" />
    </div>
  </main>
);

export default LoginSplash;
