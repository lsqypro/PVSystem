import {TuastTips, Dialog} from '../component/dialog.js';
import {generateUUID, is_mobile_number, is_image_code, is_password} from '../utils/utils.js';
import {MyCookie} from '../utils/commons.js';
import {RELATION_SIGUP_URL, GET_IMAGE_CODE_API, GET_SMS_CODE_API} from './api.js';

$(function(){
    // 图片验证码
    let $img_code = $('#change-img-code');
    let image_id;
    flushImageCode();
    
    $img_code.click(function(){
        flushImageCode();
    });

    function flushImageCode() {
        image_id = generateUUID();
        $img_code.prop({src: GET_IMAGE_CODE_API + '/' + image_id});
    }

    // 发送手机验证码
    let $mobile = $('#phone-input');
    let $send_code = $('#sendcode');
    let $img_code_input = $('#img-code-input');
    let code_time = 0;
    let interval;

    $send_code.click(function(){
        // 手机号码格式检查
        if ( !is_mobile_number($mobile.val()) ) {
            TuastTips.toggle_tips('icon-jiazaishibai', '手机号码错误');
            return;
        }

        // 图片验证码格式检查
        if ( !is_image_code($img_code_input.val()) ) {
            flushImageCode();
            TuastTips.toggle_tips('icon-jiazaishibai', '验证码错误');
            return;
        }

        // 时间限制
        if (code_time > 0) return;

        // 发送请求
        axios(
            GET_SMS_CODE_API + '/' + $mobile.val(),
            {
                method: 'GET',
                params: {
                    image_code_id: image_id,
                    image_code: $img_code_input.val()
                }
            }
        )
        .then(rep=>{
            console.log(rep);
            let data = rep.data;
            if (data['errno'] === '0') {
                // 时间限制
                TuastTips.toggle_tips('icon-jiazaichenggong', '发送成功');
                code_time = 60;
                $send_code.html(`重新发送(${code_time})`);
                interval = setInterval(function(){
                    code_time--;
                    $send_code.html(`重新发送(${code_time})`);
                    if (code_time==0) {
                        clearInterval(interval);
                        $send_code.html(`发送验证码`);
                    }
                }, 1000);
            }
            else {
                TuastTips.toggle_tips('icon-jiazaishibai', data['errmsg']);
                flushImageCode();
            }
        })
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '发送失败');
            flushImageCode();
        });
    })

    // 用户协议
    let dialog = new Dialog(
        '用户协议', 
        '用户协议同意是怎么回事呢？用户协议相信大家都很熟悉，但是用户协议同意是怎么回事呢，下面就让小编带大家一起了解吧。 用户协议同意，其实就是不能不同意，大家可能会很惊讶用户协议怎么会同意呢？但事实就是这样，小编也感到非常惊讶。这就是关于用户协议同意的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论哦！',
        function() {
            $radio.addClass("radio-select");
            dialog.hide();
        },
        function() {
            $radio.removeClass("radio-select");
            dialog.hide();
        }
    );
    dialog.getElement().appendTo($('body'));

    let $radio = $(".radio");
    $radio.click(function(){
        $radio.toggleClass("radio-select");
    });
    $('.desc a').click(function(){
        dialog.show();
    });

    // 注册
    let $code = $('#code-input');
    let $password = $('#pwd-input');
    let $password2 = $('#pwd-input-2');
    $(".mbtn").click(function(){
        // 参数检查
        if(!$mobile.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入手机号码');
            return;
        }
        if(!$code.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入短信验证码');
            return;
        }
        if(!$password.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入密码');
            return;
        }
        if(!$password2.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '请输入确认密码');
            return;
        }
        if($password.val() !== $password2.val()) {
            TuastTips.toggle_tips('icon-jiazaishibai', '两次密码不同');
            return;
        }
        if(!is_mobile_number($mobile.val())) {
            TuastTips.toggle_tips('icon-jiazaishibai', '手机号码不存在');
            return;
        }
        if(!is_password($password.val())) {
            TuastTips.toggle_tips('icon-jiazaishibai', '密码格式错误');
            return;
        }

        // 发送请求
        axios(RELATION_SIGUP_URL, {
            method: 'post', 
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": MyCookie.get("csrf_token")
            }, 
            data: {
                mobile: $mobile.val(),
                password: $password.val(),
                sms_code: $code.val()
            }
        })
        .then(response=>{
            let data = response.data
            if (data['errno'] === "0") {
                TuastTips.toggle_tips('icon-jiazaichenggong', '注册成功', function(){
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

