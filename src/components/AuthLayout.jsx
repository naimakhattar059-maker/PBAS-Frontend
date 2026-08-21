import { Layout } from "antd";
import "./AuthLayout.css";

const { Content } = Layout;

const AuthLayout = ({ children, title, subtitle, logoSrc, backgroundSrc, formOnly = false }) => (
  <Layout
    className={`auth-shell${backgroundSrc ? " auth-shell--branded" : ""}${
      formOnly ? " auth-shell--form-only" : ""
    }`}
  >
    <div
      className="auth-hero-panel"
      style={
        backgroundSrc
          ? { "--auth-background-image": `url("${backgroundSrc}"), url("/auth-hero.jpg")` }
          : undefined
      }
      aria-hidden="true"
    />
    <Content className="auth-content">
      <div className="auth-form-panel">
        {logoSrc ? (
          <img
            className="auth-logo"
            src={logoSrc}
            alt="PBAS logo"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        {title ? <h1 className="auth-title">{title}</h1> : null}
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </Content>
  </Layout>
);

export default AuthLayout;
