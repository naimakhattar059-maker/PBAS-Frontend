import { useEffect, useState } from "react";
import { Button, Card, Empty, List, Space, Tag, Typography, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import "./Dashboard.css";

const { Title, Text } = Typography;

const Notifications = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const canViewNotifications = hasPermission(user, "view_notifications");

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const payload = await listNotifications(token);
      setItems(payload.notifications || []);
    } catch (err) {
      message.error(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewNotifications) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewNotifications]);

  if (!canViewNotifications) {
    return <AccessDenied title="Notifications" />;
  }

  const unreadCount = items.filter((item) => !item.read).length;

  const markRead = async (id) => {
    try {
      const payload = await markNotificationRead(token, id);
      setItems((current) => current.map((item) => (item.id === id ? payload.notification : item)));
    } catch (err) {
      message.error(err.message || "Could not mark notification read");
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      await loadNotifications();
      message.success("All notifications marked as read");
    } catch (err) {
      message.error(err.message || "Could not mark all notifications read");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <Text className="eyebrow">Notifications</Text>
            <div className="title-row">
              <Title level={2}>Activity feed</Title>
              <Tag color={unreadCount ? "orange" : "green"}>{unreadCount} unread</Tag>
            </div>
            <Text className="subtitle">Request, payroll, and budget setup events are shown here.</Text>
          </div>
          <Space>
            <Button icon={<CheckOutlined />} onClick={markAllRead} loading={markingAll} disabled={!items.length}>
              Mark all read
            </Button>
          </Space>
        </div>

        <Card className="panel-card" loading={loading}>
          {items.length ? (
            <List
              itemLayout="vertical"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    !item.read ? (
                      <Button key="read" type="link" onClick={() => markRead(item.id)}>
                        Mark read
                      </Button>
                    ) : null,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={item.read ? "green" : "orange"}>{item.read ? "read" : "new"}</Tag>
                        <Tag>{item.category}</Tag>
                      </Space>
                    }
                    description={item.body}
                  />
                  {item.link_path ? <Text type="secondary">Link: {item.link_path}</Text> : null}
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No notifications yet" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
