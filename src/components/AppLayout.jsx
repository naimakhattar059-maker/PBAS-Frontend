import {
  ApartmentOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CalculatorOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FundOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Grid, Layout, Menu, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createAuditLog } from '../api/auditLogs';
import { listNotifications } from '../api/notifications';
import { logout } from '../store/authSlice';
import { getAvatarInitial } from '../utils/userAvatar';
import { hasAnyPermission, hasPermission } from '../utils/permissions';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const navItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    headerLabel: 'Dashboard (P.G Budget System)',
    permission: 'view_dashboard',
  },
  { key: '/users', icon: <UserOutlined />, label: 'User Management', permission: 'view_users' },
  { key: '/departments', icon: <ApartmentOutlined />, label: 'Resource Request Management', permission: 'view_requests' },
  { key: '/budget', icon: <FundOutlined />, label: 'Budget Management', permission: 'view_budgets' },
  { key: '/payroll', icon: <CalculatorOutlined />, label: 'Payroll Management', permission: 'view_payroll' },
  { key: '/internal-revenue', icon: <BankOutlined />, label: 'Internal Revenue', permission: 'view_budgets' },
  { key: '/reports', icon: <FileTextOutlined />, label: 'Reports', permission: 'view_reports' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs', permissions: ['view_audit_logs', 'view_reports'] },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', permission: 'manage_profile' },
];

const AppLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    if (token) {
      try {
        await createAuditLog(token, {
          action: 'logout',
          entity_type: 'sessions',
          metadata: { occurred_at: new Date().toISOString() },
        });
      } catch {
        // Logout must not be blocked if audit logging is unavailable.
      }
    }

    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const loadUnread = async () => {
      if (!token || !hasPermission(user, 'view_notifications')) {
        setUnreadCount(0);
        return;
      }

      try {
        const payload = await listNotifications(token);
        setUnreadCount((payload.notifications || []).filter((item) => !item.read).length);
      } catch (err) {
        setUnreadCount(0);
        message.error(err.message || 'Failed to load notification count');
      }
    };

    loadUnread();
  }, [token, user]);

  const visibleNavItems = navItems.filter((item) =>
    item.permissions ? hasAnyPermission(user, item.permissions) : hasPermission(user, item.permission)
  );
  const currentNav = visibleNavItems.find((i) => i.key === location.pathname);
  const headerLabel = currentNav?.headerLabel || currentNav?.label || 'Dashboard (P.G Budget System)';

  const menu = (
    <Menu
      mode='inline'
      selectedKeys={[location.pathname]}
      items={visibleNavItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.key}>{item.label}</Link>,
      }))}
    />
  );

  return (
    <Layout className='app-shell'>
      {!isMobile && (
        <Sider width={280} className='app-sider' breakpoint='md' collapsedWidth='0'>
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
            <div className='header-eyebrow'>{headerLabel}</div>
          </div>
          <div className='header-actions'>
            {hasPermission(user, 'view_notifications') ? (
              <Button
                type='text'
                className='header-icon-button'
                onClick={() => navigate('/notifications')}
                aria-label='Open notifications'
              >
                <Badge count={unreadCount} size='small' offset={[-2, 2]}>
                  <BellOutlined style={{ fontSize: 24 }} />
                </Badge>
              </Button>
            ) : null}
            <Button
              type='text'
              className='header-avatar-button'
              onClick={() => navigate('/settings')}
              aria-label='Open settings'
            >
              <Avatar size={34} src={user?.attachment_image_data || undefined} className='header-avatar'>
                {user?.attachment_image_data ? null : getAvatarInitial(user?.username)}
              </Avatar>
            </Button>
          </div>
        </Header>
        <Content className='app-content'>{children}</Content>
      </Layout>

        <Drawer
        open={drawerOpen}
        placement='left'
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={300}
      >
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
