import { Card, Typography } from "antd";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";

const { Title, Text } = Typography;

const requiredPermissions = {
  "Resource Request Management": "view_requests",
  "Expense Management": "view_reports",
  "Payroll Management": "view_payroll",
  Reports: "view_reports",
  Notifications: "view_notifications",
};

const Placeholder = ({ title }) => {
  const { user } = useSelector((state) => state.auth);
  const permission = requiredPermissions[title];

  if (permission && !hasPermission(user, permission)) {
    return <AccessDenied title={title} />;
  }

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 8 }}>
        {title}
      </Title>
      <Text type="secondary">This section is coming soon.</Text>
    </Card>
  );
};

export default Placeholder;
