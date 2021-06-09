import React, { Component, Fragment } from 'react';
import {Link, withRouter} from 'react-router-dom';
import {Button, Modal, Input, message, Avatar, Space} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {ADMIN_LOGIN_API, ADMIN_CHECK_LOGIN_API, ADMIN_LOGOUT_API, ADMIN_CHANGE_PASSWORD_API} from '../api';
import {request} from '../../utils/commons'
import './style.css'

class Login extends Component {
    constructor(props) {
        super(props);

        this.onLogOutClick = this.onLogOutClick.bind(this);
        this.onLoginClick = this.onLoginClick.bind(this);
        this.checkInput = this.checkInput.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.usernameChange = this.usernameChange.bind(this);
        this.passwordChange = this.passwordChange.bind(this);
        
        this.state = {
            isLogin: false,
            isShowLogin: false,
            isShowChangePassword: false,
            user: {
                avatar_url: "",
                user_type: ""
            },
            username: "",
            password: "",
            passwordAgin: "",
            oldPassword: "",
        }
    }

    render() {
        return (
            <div className="login-container">
            <Space size={5}>
                <Link to="/relative/mediachat/10">
                    <Button type="primary">视频测试</Button>
                </Link>
                <Link to="/vist/html/login.html">
                    <Button type="primary">家属端</Button>
                </Link>
                <Link to="/vist/html/prisoner-login.html">
                    <Button type="primary">服刑人员端</Button>
                </Link>
                {
                    this.state.isLogin ? 
                    <Fragment>
                        <a>{this.state.user.user_type} </a>
                        <Avatar size="large" icon={<UserOutlined />} src={this.state.user.avatar_url} />
                        <Button type="primary" onClick={this.onLogOutClick} style={{marginLeft: 10}}>退出</Button>
                        <Button type="primary" onClick={()=>this.setState({isShowChangePassword: true})} style={{marginLeft: 10}}>修改密码</Button>
                    </Fragment>
                    :
                    <Button type="primary" onClick={this.onLoginClick}>登录</Button>
                }
                {
                    <Modal title="登录" visible={this.state.isShowLogin} onOk={this.checkInput} onCancel={()=>{this.setState({isShowLogin: false})}}>
                        <Input placeholder="用户名" value={this.state.username} onChange={this.usernameChange}></Input>
                        <Input placeholder="密码" type="password" value={this.state.password}  onChange={this.passwordChange} style={{marginTop: 10}}></Input>
                    </Modal>
                }
                {
                    <Modal title="修改密码" visible={this.state.isShowChangePassword} onOk={this.changePassword} onCancel={()=>{this.setState({isShowChangePassword: false})}}>
                        {/* <Input placeholder="用户名" value={this.state.username} onChange={this.usernameChange}></Input> */}
                        <Input placeholder="旧密码" type="password" value={this.state.oldPassword}  onChange={(e)=>{this.setState({oldPassword: e.target.value})}} style={{marginTop: 10}}></Input>
                        <Input placeholder="新密码" type="password" value={this.state.passwordAgin}  onChange={(e)=>{this.setState({passwordAgin: e.target.value})}} style={{marginTop: 10}}></Input>
                        <Input placeholder="确认新密码" type="password" value={this.state.password}  onChange={this.passwordChange} style={{marginTop: 10}}></Input>
                    </Modal>
                    
                }
            </Space>
            </div>
        );
    }

    async componentDidMount() {
        // 检查登录状态
        const ret = await request(ADMIN_CHECK_LOGIN_API, {
            method: 'GET'
        })
        if (ret.errno === "0") {
            message.success(ret.errmsg);
            this.setState({
                isShowLogin: false,
                isLogin: true,
                user: ret.data.user
            });
        }
        else {
            message.error(ret.errmsg);
        }
    }

    // 检查输入并登录
    async checkInput() {
        if (!this.state.username || !this.state.password) {
            message.error("请输入用户名或密码");
            return;
        }
        let ret = await request(ADMIN_LOGIN_API, {
            method: "POST",
            data: {
                "mobile": this.state.username,
                "password": this.state.password
            }
        });

        if (ret.errno === "0") {
            message.success(ret.errmsg);
            this.setState({
                isShowLogin: false,
                isLogin: true,
                user: ret.data.user
            });
        }
        else {
            message.error(ret.errmsg);
        }
    }

    async onLogOutClick() {
        let ret = await request(ADMIN_LOGOUT_API, {method: "DELETE"});
        if (ret.errno === "0") {
            message.success(ret.errmsg)
            this.setState({
                isLogin: false
            })
        }
        else {
            message.error(ret.errmsg)
        }
    }

    async changePassword() {
        let ret = await request(ADMIN_CHANGE_PASSWORD_API, {
            method: "PUT",
            data: {
                mobile: this.state.user.mobile,
                old_password: this.state.oldPassword,
                password: this.state.password
            }
        })

        if (ret.errno === "0") {
            message.success(ret.errmsg)
            this.setState({isShowChangePassword: false});
        }
        else {
            message.error(ret.errmsg)
        }
    }

    onLoginClick() {
        this.setState({isShowLogin: true});
    }

    usernameChange(e) {
        this.setState({
            username: e.target.value
        });
    }

    passwordChange(e) {
        this.setState({
            password: e.target.value
        });
    }
}

export default withRouter(Login);