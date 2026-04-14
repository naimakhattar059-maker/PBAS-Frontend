import { Card, List, Typography } from "antd";

const { Title } = Typography;

const Students = () => {
  const items = ["User 1", "User 2", "User 3"];
  return (
    <div>
      <Title level={3}>Students</Title>
      <Card>
        <List
          dataSource={items}
          renderItem={(item) => <List.Item>{item}</List.Item>}
          bordered
        />
      </Card>
    </div>
  );
};

export default Students;
