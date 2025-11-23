import { Card, Typography } from "antd";

const { Title, Text } = Typography;

const Dashboard = () => {
  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Card>
        <Text>Welcome to the Budget Automation System.</Text>
      </Card>
    </div>
  );
};

export default Dashboard;
