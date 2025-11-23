import { Card, List, Typography } from "antd";

const { Title } = Typography;

const Students = () => {
  const items = ["Student ID 1", "Student ID 2", "Student ID 3"];
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
