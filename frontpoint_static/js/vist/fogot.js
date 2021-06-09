import {TuastTips} from '../component/dialog.js';
import {is_password} from '../utils/utils.js';
import {MyCookie} from '../utils/commons.js';
import {RELATION_CHANGE_PASSWORD_API} from './api.js';

$(function(){
    // 修改密码
    let $user = $('#user-input');
    let $password_old = $('#pwd-input-old');
    let $password = $('#pwd-input');
    let $password2 = $('#pwd-input-2');
    $(".mbtn").click(function(){
        // 参数检查
        if(!$user.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入手机号或ID');
            return;
        }
        if(!$password_old.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入原始密码');
            return;
        }
        if(!$password.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入新密码');
            return;
        }
        if(!$password2.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入确认密码');
            return;
        }
        if($password.val() !== $password2.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '两次密码不一致');
            return;
        }
        if(!is_password($password.val())) {
            TuastTips.toggle_tips('icon-jiazaishibai', '密码格式错误');
            return;
        }

        // 发送请求
        axios(RELATION_CHANGE_PASSWORD_API, {
            method: 'PUT', 
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": MyCookie.get("csrf_token")
            }, 
            data: {
                mobile: $user.val(),
                old_password: $password_old.val(), 
                password: $password.val()
            }
        })
        .then(response=>{
            let data = response.data
            if (data['errno'] === "0") {
                TuastTips.toggle_tips('icon-jiazaichenggong', '修改成功', function(){
                    window.location.replace('login.html');
                });
            }
            else {
                TuastTips.toggle_tips('icon-jiazaishibai', data['errmsg']);
            }
        })
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '请求异常');
        });
    }); 
})

