import { useState } from "react";
import { Layout, Menu, Button, Grid, Drawer, Typography } from "antd";
import {
  MenuFoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import "./AppLayout.css";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { Title } = Typography;

const navItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/users", icon: <UserOutlined />, label: "Users" },
  { key: "/students", icon: <TeamOutlined />, label: "Students" },
];

const AppLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={navItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.key}>{item.label}</Link>,
      }))}
    />
  );

  return (
    <Layout className="app-shell">
      {!isMobile && (
        <Sider width={220} className="app-sider" breakpoint="md" collapsedWidth="0">
          <div className="brand">
            <div className="brand-dot" />
            <span>Budget Automation</span>
          </div>
          {menu}
        </Sider>
      )}
      <Layout>
        <Header className="app-header">
          {isMobile && (
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setDrawerOpen(true)}
              className="menu-button"
            />
          )}
          <Title level={4} className="header-title">
            {navItems.find((i) => i.key === location.pathname)?.label || "Dashboard"}
          </Title>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>

      <Drawer
        open={drawerOpen}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={240}
      >
        <div className="brand mobile">
          <div className="brand-dot" />
          <span>Budget Automation</span>
        </div>
        {menu}
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
