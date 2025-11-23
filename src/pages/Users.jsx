import { Card, List, Typography } from "antd";

const { Title } = Typography;

const Users = () => {
  const items = ["Admins", "Accountants", "Students"];
  return (
    <div>
      <Title level={3}>Users</Title>
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

export default Users;
