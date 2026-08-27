import {
  ArrowRightOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  CheckSquareOutlined,
  FileSearchOutlined,
  LockFilled,
  PieChartOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./LoginSplash.css";

const splashFeatures = [
  { label: "Budget Planning", icon: <PieChartOutlined /> },
  { label: "Budget Preparation", icon: <CalculatorOutlined /> },
  { label: "Budget Monitoring", icon: <BarChartOutlined /> },
  { label: "Approval Workflow", icon: <CheckSquareOutlined /> },
  { label: "Reports & Analytics", icon: <FileSearchOutlined /> },
];

const LoginSplash = () => (
  <main className="login-splash">
    <img
      className="login-splash__image"
      src="/college-splash-background.png"
      alt="Budget Automation System"
    />
    <div className="login-splash__shade" aria-hidden="true" />
    <div className="login-splash__curve login-splash__curve--blue" aria-hidden="true" />
    <div className="login-splash__curve login-splash__curve--gold" aria-hidden="true" />
    <section className="login-splash__content" aria-label="Budget Automation System">
      <img className="login-splash__logo" src="/pbas-logo.png" alt="FG Postgraduate College for Women Wah Cantt" />
      <div className="login-splash__headline">
        <h1>
          <span>Budget</span>
          <span>Automation System</span>
        </h1>
        <div className="login-splash__rule" aria-hidden="true" />
        <p>Postgraduate College for Women Wah Cantt</p>
      </div>
      <div className="login-splash__features" aria-label="System features">
        {splashFeatures.map((feature) => (
          <div className="login-splash__feature" key={feature.label}>
            <span className="login-splash__feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <span className="login-splash__feature-label">{feature.label}</span>
          </div>
        ))}
      </div>
    </section>
    <Link className="login-splash__button" to="/login/form" aria-label="Open login form">
      <span className="login-splash__button-icon" aria-hidden="true">
        <LockFilled />
      </span>
      <span className="login-splash__button-divider" aria-hidden="true" />
      <span className="login-splash__button-label">LOGIN</span>
      <ArrowRightOutlined className="login-splash__button-arrow" aria-hidden="true" />
    </Link>
  </main>
);

export default LoginSplash;
