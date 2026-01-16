import { useState } from 'react';
import { Card, Tabs } from 'antd';
import { SettingOutlined, AppstoreOutlined, TagsOutlined } from '@ant-design/icons';
import UnitsTab from './tabs/UnitsTab';
import CategoriesTab from './tabs/CategoriesTab';

export default function WarehouseSetup() {
  const [activeTab, setActiveTab] = useState('units');

  const items = [
    {
      key: 'units',
      label: (
        <span>
          <AppstoreOutlined /> Đơn vị
        </span>
      ),
      children: <UnitsTab />,
    },
    {
      key: 'categories',
      label: (
        <span>
          <TagsOutlined /> Danh mục
        </span>
      ),
      children: <CategoriesTab />,
    },
  ];

  return (
    <Card
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          Thiết lập kho
        </span>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        size="large"
      />
    </Card>
  );
}
