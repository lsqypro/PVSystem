import React, { Component, Fragment } from 'react';
import {Link, withRouter} from 'react-router-dom';
import './style.css'
import Login from '../login';

class AppHeader extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    render() {
        return (
            <Fragment>
                <Link to="/">
                    <div className="logo-text">成都信息工程大学·毕业设计·视频探监系统管理平台</div>
                </Link>
                <Login></Login>
            </Fragment>
        );
    }

    async componentDidMount() {
        
    }
}

export default withRouter(AppHeader);