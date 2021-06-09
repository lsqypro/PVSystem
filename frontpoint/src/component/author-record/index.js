import React, {
    Component,
    Fragment
} from "react";
import {
    Table, Tag, Space, message, Image, Input, Modal 
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {request} from '../../utils/commons';
import {ADMIN_GET_AUTHORRECORD_API, ADMIN_CHANGE_AUTHORRECORD_API} from '../api';
import './style.css';


export default class AuthorRecord extends Component {
    constructor(props) {
        super(props);

        this.showDetail = this.showDetail.bind(this)
        this.state = {
            authorRecordlist: [],
            isShowDetail: false,
            currten_id: 0,
            currentUser: {
              avatar_url: "",
              real_name: "张三",
              id_card: "111111111122222222",
              id_card_url_front: "https://vist-face.oss-cn-shanghai.aliyuncs.com/9ab39bf2c76411eb9714525400aa89b3.png",
              id_card_url_back_desc: "https://vist-face.oss-cn-shanghai.aliyuncs.com/9d646d68c76411eb8d87525400aa89b3.png"
            }
        }

        this.columns = [
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: id => <a>{id}</a>,
          },
          {
            title: '真实姓名',
            dataIndex: 'real_name',
            key: 'id',
            render: real_name => <a>{real_name}</a>,
          },
          {
            title: '身份证号',
            dataIndex: 'id_card',
            key: 'id',
            render: id_card => <a>{id_card}</a>,
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
            render: (id, id_card, real_name, id_card_url_front, id_card_url_back_desc) => (
              <Space size="middle">
                <a onClick={this.detail.bind(this, {id_card, real_name, id_card_url_front, id_card_url_back_desc})}>查看详情</a>
                <a onClick={this.pass.bind(this, id)}>通过</a>
                <a onClick={this.reject.bind(this, id)}>驳回</a>
              </Space>
            ),
          },
        ];
    }

    render() {
        return (
          <Fragment>
            <Modal title="查看详情" visible={this.state.isShowDetail} onOk={this.showDetail} onCancel={()=>{this.setState({isShowDetail: false})}}>
              <Input placeholder="default size" prefix="姓名" disabled="true" value={this.state.currentUser.real_name} />
              <Input placeholder="default size" prefix="身份证" disabled="true" value={this.state.currentUser.id_card} />
              <Image
              width={100}
              src={this.state.currentUser.id_card_url_front}
              />
              <Image
              width={100}
              src={this.state.currentUser.id_card_url_back_desc}
              />
            </Modal>
            <Table columns={this.columns} dataSource={this.state.authorRecordlist} rowKey={item=>item.id} />
          </Fragment>
        )
    };

    async showDetail() {
      this.setState({isShowDetail: false})
      console.log(this.state.currten_id);
      // TODO 查询该ID探监记录详情
    }

    async componentDidMount() {
      // 获取记录列表
      this.get_list(1);
    }

    async get_list(page) {
      let url = ADMIN_GET_AUTHORRECORD_API;
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

    async detail(id, user) {
      this.setState({isShowDetail: true, currentUser: user})
    }

    async pass(id) {
      const ret = await request(ADMIN_CHANGE_AUTHORRECORD_API, {
        method: 'PUT',
        data: {
          "id": id,
          "author_record_dict": {
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
      const ret = await request(ADMIN_CHANGE_AUTHORRECORD_API, {
        method: 'PUT',
        data: {
          "id": id,
          "author_record_dict": {
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
