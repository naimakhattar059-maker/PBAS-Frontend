import {
  ApartmentOutlined,
  BankOutlined,
  BellOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  FundOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Grid, Layout, Menu, Typography } from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { Title } = Typography;

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <UserOutlined />, label: 'User Management' },
  { key: '/departments', icon: <ApartmentOutlined />, label: 'Department Management' },
  { key: '/budget', icon: <FundOutlined />, label: 'Budget Management' },
  { key: '/expenses', icon: <DollarCircleOutlined />, label: 'Expense Management' },
  { key: '/payroll', icon: <CalculatorOutlined />, label: 'Payroll Management' },
  { key: '/fees', icon: <BankOutlined />, label: 'Fee Management' },
  { key: '/reports', icon: <FileTextOutlined />, label: 'Reports' },
  { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
  { key: '/requests', icon: <CheckCircleOutlined />, label: 'Requests & Approvals' },
  { key: '/students', icon: <TeamOutlined />, label: 'Students' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

const AppLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const currentNav = navItems.find((i) => i.key === location.pathname);

  const menu = (
    <Menu
      mode='inline'
      selectedKeys={[location.pathname]}
      items={navItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.key}>{item.label}</Link>,
      }))}
    />
  );

  return (
    <Layout className='app-shell'>
      {!isMobile && (
        <Sider width={220} className='app-sider' breakpoint='md' collapsedWidth='0'>
          <div className='brand'>
            <div className='brand-dot' />
            <span>Budget Automation</span>
          </div>
          <div className='menu-container'>{menu}</div>
          <div className='sider-footer'>
            <Button
              type='link'
              danger
              size='small'
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className='logout-button'
            >
              Logout
            </Button>
          </div>
        </Sider>
      )}
      <Layout>
        <Header className='app-header'>
          {isMobile && (
            <Button
              type='text'
              size='small'
              icon={<MenuFoldOutlined style={{ fontSize: 18 }} />}
              onClick={() => setDrawerOpen(true)}
              className='menu-button'
            />
          )}
          <div className='header-left'>
            <div className='header-eyebrow'>{(currentNav?.label || 'Dashboard').toUpperCase()}</div>
          </div>
          <div className='header-userchip'>
            <Avatar size={40} className='header-avatar'>
              {(user?.username || 'User')[0]}
            </Avatar>
            <div className='chip-meta'>
              <span className='chip-name'>{user?.username || 'User'}</span>
              <span className='chip-role'>{(user?.role || 'admin').toLowerCase()}</span>
            </div>
          </div>
        </Header>
        <Content className='app-content'>{children}</Content>
      </Layout>

      <Drawer
        open={drawerOpen}
        placement='left'
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={240}
      >
        <div className='brand mobile'>
          <div className='brand-dot' />
          <span>Budget Automation</span>
        </div>
        <div className='menu-container'>{menu}</div>
        <div className='drawer-footer'>
          <Button
            type='link'
            block
            danger
            onClick={handleLogout}
            className='logout-button'
            icon={<LogoutOutlined />}
          >
            Logout
          </Button>
        </div>
      </Drawer>
    </Layout>
  );
};

export default AppLayout;
