import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Route, Switch, BrowserRouter, Link } from 'react-router-dom';
import { Layout, Menu, Breadcrumb } from 'antd';
import { UserOutlined, LaptopOutlined, ControlOutlined, RadarChartOutlined } from '@ant-design/icons';
import AppHeader from './component/app-header';
import User from './component/user';
import AuthorRecord from './component/author-record';
import VistRecord from './component/vist-record';
import VistControl from './component/vist-control';
import Regard from './component/regard';
import MediaChat from './component/media-chat';
import './style.css';
// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'antd/dist/antd.css';

moment.locale('zh-cn');

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

class App extends Component {
  render() {
    return (
      <BrowserRouter>
      <Layout>
        <Header className="header" style={{minWidth: 800}}>
          <AppHeader></AppHeader>
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <SubMenu key="sub1" icon={<UserOutlined />} title="用户管理">
                <Menu.Item key="1">
                  <Link to="/manager/user/relation">家属</Link>
                </Menu.Item>
                <Menu.Item key="2">
                  <Link to="/manager/user/prisoner">服刑人员</Link>
                </Menu.Item>
                <Menu.Item key="3">
                  <Link to="/manager/user/admin">管理员</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="sub2" icon={<LaptopOutlined />} title="审核管理">
                <Menu.Item key="4">
                  <Link to="/manager/author_record">实名认证</Link>
                </Menu.Item>
                <Menu.Item key="5">
                  <Link to="/manager/vist_record">探监申请</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="sub3" icon={<ControlOutlined />} title="实时控制">
                {/* <Menu.Item key="6">在线用户</Menu.Item> */}
                <Menu.Item key="6">
                  <Link to="/manager/vist_control">音视控制</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="sub4" icon={<RadarChartOutlined />} title="系统管理">
                {/* <Menu.Item key="8">日志</Menu.Item> */}
                {/* <Menu.Item key="9">系统负载</Menu.Item> */}
                <Menu.Item key="7">
                  <Link to="/manager/regard">关于</Link>
                </Menu.Item>
              </SubMenu>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 14px 14px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              {/* <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>List</Breadcrumb.Item>
              <Breadcrumb.Item>App</Breadcrumb.Item> */}
            </Breadcrumb>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Switch>
                <Route path="/manager/user/:user_type" component={User}/>
                <Route path="/manager/author_record" component={AuthorRecord}/>
                <Route path="/manager/vist_record" component={VistRecord}/>
                <Route path="/manager/vist_control/:id" component={VistControl}/>
                <Route path="/manager/regard" component={Regard}/>
                <Route path="/relative/mediachat/:id" component={MediaChat}/>
              </Switch>
            </Content>
          </Layout>
        </Layout>
      </Layout>
      </BrowserRouter>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

