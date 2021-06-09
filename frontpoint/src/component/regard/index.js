import React, { Component, Fragment } from 'react';
import {Link, withRouter} from 'react-router-dom';
import './style.css'
import {Button, Modal, Input, message, Avatar} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import TRTC from 'trtc-js-sdk';

class Regard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowModle: true,
            susport: ""
        }
        // v4.7.0 及其以上版本的 SDK
        TRTC.checkSystemRequirements().then((checkResult) => {
            console.log('checkResult', checkResult.result, 'checkDetail', checkResult.detail);
            this.setState({susport: JSON.stringify(checkResult)})
            if(!checkResult.result) {
                // SDK 不支持当前浏览器，根据用户设备类型建议用户使用 SDK 支持的浏览器
            }
        });
    }

    render() {
        return (
            <Fragment>
                <Modal title="关于" visible={this.state.isShowModle} onOk={()=>{this.setState({isShowModle: false})}} onCancel={()=>{this.setState({isShowModle: false})}}>
                    <p>成都信息工程大学</p>
                    <p>毕业设计</p>
                    <p>视频探监系统管理平台</p>
                    <p>v1.0</p>
                    <p>{this.state.susport}</p>
                </Modal>
            </Fragment>
        );
    }

    async componentWillReceiveProps() {
        this.setState({isShowModle: true})
    }
}

export default withRouter(Regard);