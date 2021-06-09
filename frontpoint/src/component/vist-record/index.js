import React, {
  Component,
  Fragment
} from "react";
import { Link } from 'react-router-dom';
import {
  Table, Tag, Space, message, Avatar, Input, Modal 
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {request} from '../../utils/commons';
import {ADMIN_GET_VISTRECORD_API, ADMIN_CHANGE_VISTRECORD_API} from '../api';
import './style.css';


export default class AuthorRecord extends Component {
  constructor(props) {
      super(props);

      this.showDetail = this.showDetail.bind(this)
      this.state = {
          authorRecordlist: [],
          isShowDetail: false,
          currten_id: 0
      }

      this.columns = [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          render: id => <a>{id}</a>,
        },
        {
          title: '申请家属',
          dataIndex: 'relation_id',
          key: 'id',
          render: relation_id => <a>{relation_id}</a>,
        },
        {
          title: '服刑人员',
          dataIndex: 'prisoner_id',
          key: 'id',
          render: prisoner_id => <a>{prisoner_id}</a>,
        },
        {
          title: '申请描述',
          dataIndex: 'apply_desc',
          key: 'id',
          render: apply_desc => <a>{apply_desc}</a>,
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'id',
          render: status => {
            // geekblue green volcano
            let color = "green";
            if (status === "审核中") {
              color = "geekblue";
            }
            else if (status === "未通过") {
              color = "volcano";
            }
            return (
              <Tag color={color} key={status}>
                {status}
              </Tag>
            )
          }
        },
        {
          title: '操作',
          dataIndex: 'id',
          key: 'id',
          render: (id) => (
            <Space size="middle">
              <a onClick={this.detail.bind(this, id)}>查看详情</a>
              <a onClick={this.pass.bind(this, id)}>通过</a>
              <a onClick={this.reject.bind(this, id)}>驳回</a>
              <Link to={`/manager/vist_control/${id}`}>进入聊天室</Link>
            </Space>
          ),
        },
      ];
  }

  render() {
      return (
        <Fragment>
          <Modal title="查看详情" visible={this.state.isShowDetail} onOk={this.showDetail} onCancel={()=>{this.setState({isShowDetail: false})}}>
          </Modal>
          <Table columns={this.columns} dataSource={this.state.authorRecordlist} rowKey={item=>item.id} />
        </Fragment>
      )
  };

  async showDetail() {
    console.log(this.state.currten_id);
    // TODO 查询该ID探监记录详情
  }

  async componentDidMount() {
    // 获取记录列表
    this.get_list(1);
  }

  async get_list(page) {
    let url = ADMIN_GET_VISTRECORD_API;
    if (page) {
      url = url + `?page=${page}`;
    }

    const ret = await request(url, {
      method: 'GET'
    })

    if (ret.errno === "0") {
      message.success(ret.errmsg)
      let authorRecordlist = ret['data']['list'];
      if (authorRecordlist) {
        authorRecordlist.reverse();
        this.setState({
          authorRecordlist
        });
      }
    }
    else {
      message.error(ret.errmsg)
    }
  }

  async detail(id) {
    this.setState({isShowDetail: true, currten_id: id})
  }

  async pass(id) {
    const ret = await request(ADMIN_CHANGE_VISTRECORD_API, {
      method: 'PUT',
      data: {
        "id": id,
        "vist_record_dict": {
            "status": "已通过"
        }
      }
    })

    if (ret.errno === "0") {
      // 更新list
      message.success(ret.errmsg);
      let authorRecordlist = this.state.authorRecordlist;
      for (let i = 0; i < authorRecordlist.length; i++) {
        if (authorRecordlist[i].id === id) {
          authorRecordlist[i].status = "已通过";
        }
      }
      this.setState({authorRecordlist});
    }
    else {
      message.error(ret.errmsg);
    }
  }

  async reject(id) {
    const ret = await request(ADMIN_CHANGE_VISTRECORD_API, {
      method: 'PUT',
      data: {
        "id": id,
        "vist_record_dict": {
            "status": "未通过"
        }
      }
    })

    if (ret.errno === "0") {
      // 更新list
      message.success(ret.errmsg);
      let authorRecordlist = this.state.authorRecordlist;
      for (let i = 0; i < authorRecordlist.length; i++) {
        if (authorRecordlist[i].id === id) {
          authorRecordlist[i].status = "未通过";
        }
      }
      this.setState({authorRecordlist});
    }
    else {
      message.error(ret.errmsg);
    }
  }
}
