import { useState } from "react";
import { Card, Tabs } from "antd";
import {
  DollarOutlined,
  DollarCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  TableOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/shared/PageHeader";
import SalaryTable from "./components/SalaryTable";
import AdvancePayment from "./components/AdvancePayment";
import Bonus from "./components/Bonus";
import Penalty from "./components/Penalty";
import "./Payroll.css";

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("salary");

  const tabItems = [
    {
      key: "salary",
      label: (
        <span style={{ paddingLeft: 12 }}>
          <TableOutlined /> Bảng Lương
        </span>
      ),
      children: <SalaryTable />,
    },
    {
      key: "advance",
      label: (
        <span>
          <DollarCircleOutlined /> Ứng Tiền
        </span>
      ),
      children: <AdvancePayment />,
    },
    {
      key: "bonus",
      label: (
        <span>
          <TrophyOutlined /> Thưởng
        </span>
      ),
      children: <Bonus />,
    },
    {
      key: "penalty",
      label: (
        <span>
          <WarningOutlined /> Phạt
        </span>
      ),
      children: <Penalty />,
    },
  ];

  return (
    <div className="payroll-page">
      <PageHeader
        title="Quản lý Lương"
        subtitle="Quản lý bảng lương, ứng tiền, thưởng và phạt nhân viên"
        icon={<DollarOutlined />}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}
