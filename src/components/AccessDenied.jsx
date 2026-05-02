import { Button, Card, Space, Typography } from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const AccessDenied = ({ title = "Access restricted", message, backTo = "/dashboard" }) => {
  return (
    <Card className="access-denied-card">
      <Space direction="vertical" size={8}>
        <Title level={3} style={{ marginBottom: 0 }}>
          {title}
        </Title>
        <Text type="secondary">
          {message || "Your current role does not have permission to open this section."}
        </Text>
        <Button type="primary">
          <Link to={backTo}>Go back</Link>
        </Button>
      </Space>
    </Card>
  );
};

export default AccessDenied;
