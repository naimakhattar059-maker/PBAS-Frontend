import { Layout } from "antd";
import "./AuthLayout.css";

const { Content } = Layout;

const AuthLayout = ({ children, title, subtitle }) => (
  <Layout className="auth-shell">
    <Content className="auth-content">
      <div className="auth-card">
        {title ? <h1 className="auth-title">{title}</h1> : null}
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </Content>
  </Layout>
);

export default AuthLayout;
