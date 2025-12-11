import { Card, Typography } from "antd";

const { Title, Text } = Typography;

const Placeholder = ({ title }) => {
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
