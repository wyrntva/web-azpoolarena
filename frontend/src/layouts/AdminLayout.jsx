import { Layout } from "antd";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/topbar/Topbar";

const { Content } = Layout;

export default function AdminLayout({ children }) {
  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <Layout>
        <Topbar />

        <Content
          className="custom-scroll"
          style={{
            padding: 24,
            background: "#F0F2F4",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
