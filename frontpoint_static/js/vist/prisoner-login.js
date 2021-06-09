import {TuastTips} from '../component/dialog.js'
import {MyCookie} from '../utils/commons.js'
import {PRISONER_LOGIN_API} from './api.js'

$(function(){
    let $mobie = $('#phone-input');
    let $password = $('#pwd-input');

    $('.mbtn').click(function(){
        if($mobie.val() && $password.val()) {
            axios(
                PRISONER_LOGIN_API, 
                {
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": MyCookie.get("csrf_token")
                    }, 
                    data: {
                        mobile: $mobie.val(),
                        password: $password.val()
                    }
                }
            )
            .then(response=>{
                let data = response.data
                if(response.data['errno'] === "0") {
                    // TODO 设置本地存储
                    // localStorage.setItem('user', JSON.stringify(response.data.data));
                    TuastTips.toggle_tips('icon-jiazaichenggong', data['errmsg']);
                    // TODO 跳转主页
                    window.location.replace('./prisoner-vist.html');
                }
                else {
                    TuastTips.toggle_tips('icon-jiazaishibai', data['errmsg']);
                }                
            })
            .catch(err=>{
                TuastTips.toggle_tips('icon-jiazaishibai', '请求异常');
            });
        }
        else {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入账号或密码');
        }
    });
});