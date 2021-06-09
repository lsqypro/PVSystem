import axios from 'axios';
import cookie from 'react-cookies';
import {message} from 'antd';
import io from 'socket.io-client';
import { error } from 'jquery';

export class MyCookie {
    static set(name, value, { maxAge, domain, path, secure } = {}) {
        let cookieText = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        
        if (typeof maxAge === 'number') {
            cookieText += `; max-age=${maxAge}`;
        }
        
        if (domain) {
            cookieText += `; domain=${domain}`;
        }
        
        if (path) {
            cookieText += `; path=${path}`;
        }
        
        if (secure) {
            cookieText += `; secure`;
        }
        
        document.cookie = cookieText;
        
        // document.cookie='username=alex; max-age=5; domain='
    };

    static get(name) {
        name = `${encodeURIComponent(name)}`;
        
        const cookies = document.cookie.split('; ');
        
        for (const item of cookies) {
            const [cookieName, cookieValue] = item.split('=');
        
            if (cookieName === name) {
            return decodeURIComponent(cookieValue);
            }
        }
        return;
    };

    // 根据 name、domain 和 path 删除 Cookie
    static remove(name, { domain, path } = {}) {
        MyCookie.set(name, '', { domain, path, maxAge: -1 });
    };
};

export const request = async (url, arg)=>{
    // 如果非GET,携带csrf_token
    if (arg && arg.hasOwnProperty('method') && arg['method'] != 'get') {
        if (!arg.hasOwnProperty("headers")) {
            arg['headers'] = {};
        }

        // 跨域
        axios.defaults.withCredentials = true
        arg['headers']['X-CSRFToken'] = MyCookie.get("csrf_token");
        arg['withCredentials'] = true;
    }

    try{
        let ret = await axios(url, arg);
        console.log(ret);
        if (ret.status !== 200) {
            message.error("请求异常");
            return {errno: "1", errmsg: "请求异常", ret: ret};
        }
        return ret.data;
    } catch(error) {
        message.error("请求异常");
        return {errno: "1", errmsg: "请求异常", error: error};
    }
}

// export const socket = io('https://www.qingyun.work:8888?roomid=a001');
// export const socket = io.connect("https://www.qingyun.work:8888")
