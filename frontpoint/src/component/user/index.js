import React, {
  Component,
  Fragment
} from "react";
import {
  Table, Tag, Button, message, Avatar, Input, Modal 
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {request} from '../../utils/commons';
import {ADMIN_GET_USER_API, ADMIN_ADD_USER_API} from '../api';
import './style.css';
import axios from "axios";


export default class User extends Component {
  constructor(props) {
      super(props);

      this.addUser = this.addUser.bind(this)

      this.state = {
        userList: [],
        showList: [],
        user_type: "relation",
        isShowAddUser: false,
        register_user_type: "",
        register_account: "",
        register_password: "",
        id_card: ""
      }

      this.relationColumns = [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          render: id => <a>{id}</a>,
        },
        {
          title: '头像',
          dataIndex: 'avatar_url',
          key: 'id',
          render: avatar_url => <Avatar shape="square" icon={<UserOutlined />} src={avatar_url} />,
        },
        {
          title: '姓名',
          dataIndex: 'real_name',
          key: 'id',
          render: real_name => <a>{real_name}</a>,
        },
        {
          title: '身份证',
          dataIndex: 'id_card',
          key: 'id',
          render: id_card => <a>{id_card}</a>,
        },
        {
          title: '电话号码',
          dataIndex: 'mobile',
          key: 'id',
          render: mobile => <a>{mobile}</a>,
        },
        {
          title: '实名状态',
          dataIndex: 'real_status',
          key: 'id',
          render: status => {
            let color = "green";
            if (status === "审核中") {
              color = "geekblue";
            }
            else if (status === "未实名") {
              color = "volcano";
            }
            return (
              <Tag color={color} key={status}>
                {status}
              </Tag>
            );
          },
        }
      ];

      this.prisonerColumns = [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          render: id => <a>{id}</a>,
        },
        {
          title: '头像',
          dataIndex: 'avatar_url',
          key: 'id',
          render: avatar_url => <Avatar shape="square" icon={<UserOutlined />} src={avatar_url} />,
        },
        {
          title: '姓名',
          dataIndex: 'real_name',
          key: 'id',
          render: real_name => <a>{real_name}</a>,
        },
        {
          title: '身份证',
          dataIndex: 'id_card',
          key: 'id',
          render: id_card => <a>{id_card}</a>,
        },
        {
          title: '账号',
          dataIndex: 'mobile',
          key: 'id',
          render: mobile => <a>{mobile}</a>,
        }
      ];

      this.adminColumns = [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          render: id => <a>{id}</a>,
        },
        {
          title: '头像',
          dataIndex: 'avatar_url',
          key: 'id',
          render: avatar_url => <Avatar shape="square" icon={<UserOutlined />} src={avatar_url} />,
        },
        {
          title: '姓名',
          dataIndex: 'real_name',
          key: 'id',
          render: real_name => <a>{real_name}</a>,
        },
        {
          title: '账号',
          dataIndex: 'mobile',
          key: 'id',
          render: mobile => <a>{mobile}</a>,
        },
        {
          title: '账户类型',
          dataIndex: 'user_type',
          key: 'id',
          render: user_type => <a>{user_type}</a>,
        }
      ];
  }

  render() {
      return (
          <Fragment>
            <Button type="primary" onClick={()=>{this.setState({isShowAddUser: true})}} style={{marginLeft: 10}}>添加用户</Button>
            <Modal title="添加新账户" visible={this.state.isShowAddUser} onOk={this.addUser} onCancel={()=>{this.setState({isShowAddUser: false})}}>
                <Input placeholder="用户类型" type="text" value={this.state.register_user_type}  onChange={(e)=>{this.setState({register_user_type: e.target.value})}} style={{marginTop: 10}}></Input>
                <Input placeholder="身份证号" type="text" value={this.state.id_card}  onChange={(e)=>{this.setState({id_card: e.target.value})}} style={{marginTop: 10}}></Input>
                <Input placeholder="新账户" type="text" value={this.state.register_account}  onChange={(e)=>{this.setState({register_account: e.target.value})}} style={{marginTop: 10}}></Input>
                <Input placeholder="新密码" type="password" value={this.state.register_password}  onChange={(e)=>{this.setState({register_password: e.target.value})}} style={{marginTop: 10}}></Input>
            </Modal>
            <Table columns={
              this.state.user_type === "relation" ? this.relationColumns
              : (
                this.state.user_type === "prisoner" ? this.prisonerColumns
                : this.adminColumns
              )
            } dataSource={this.state.showList} rowKey={item=>item.id} />
          </Fragment>
          
      )
  };

  async addUser() {
    const ret = await request(ADMIN_ADD_USER_API, {
      method: "POST",
      data: {
        "mobile": this.state.register_account,
        "password": this.state.register_password,
        "user_type": this.state.register_user_type,
        "id_card": this.state.id_card
      }
    })
    console.log(ret);
    if (ret.errno === "0") {
      message.success(ret.errmsg)
    }
    else {
      message.error(ret.errmsg)
    }
  }

  async componentDidMount() {
    const user_type = this.props.match.params.user_type;
    // 获取记录列表
    await this.get_list(1);
    this.changeShowList(user_type)
  }
  
  async componentWillReceiveProps(nextProps) {
    const user_type = nextProps.match.params.user_type;
    this.changeShowList(user_type)
  }

  changeShowList(user_type) {
    const userList = this.state.userList
    // 过滤
    let showList = []
    for (let i = 0; i < userList.length; i++) {
      if (user_type === "relation" && userList[i].user_type === "家属") {
        showList.push(userList[i])
      }
      else if (user_type === "prisoner" && userList[i].user_type === "服刑人员") {
        showList.push(userList[i])
      }
      else if (user_type === "admin" && (userList[i].user_type === "系统管理员" || userList[i].user_type === "监狱管理员")) {
        showList.push(userList[i])
      }
    }
    this.setState({showList, user_type})
  }

  async get_list(page) {
    let url = ADMIN_GET_USER_API;
    if (page) {
      url = url + `?page=${page}`;
    }
    const ret = await request(url, {
      method: 'GET'
    })
    if (ret.errno === "0") {
      let userList = ret['data']['list'];
      if (userList) {
        userList.reverse();
        this.setState({userList});
      }
    }
    else {
      message.error(ret.errmsg);
    }
  }
}
