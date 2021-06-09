import {TuastTips} from '../component/dialog.js';
import {RELATION_CHECK_LOGIN_API, RELATION_LOGOUT_API, AVATAR_API, UPLOAD_IMAGE_API} from './api.js'
import {MyCookie} from '../utils/commons.js'

$(function(){
    $('#real-status').click(function(){
        if($('#real-status').html() == "已实名") {
            TuastTips.success("已实名");
        }
        else {
            window.location.href = './author.html';
        }
    });

    // 检查登录状态, 并设置用户信息
    function flush_user_info() {
        axios.get(RELATION_CHECK_LOGIN_API)
        .then(response=>{
            let data = response.data;
            if (data['errno'] === "0") {
                // TuastTips.toggle_tips('icon-jiazaichenggong', '已登录');
                // 加载数据
                let user = data['data']['user'];
                if (user['avatar_url'])
                    $('#avatar').prop({src: user['avatar_url']});
                $('#user-name').html(user['real_name']);
                $('#uid').html(`UID:${user['id']}`);
                $('#real-status').html(`${user['real_status']}`);
                let mobile = user['mobile'];
                $('#mobie').html(`${mobile.slice(0, 3)}****${mobile.slice(7, 11)}`);

            }
            else {
                TuastTips.toggle_tips('icon-jiazaishibai', data['errmsg']);
            }
        }) 
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '异常');
        })
    }

    flush_user_info();

    // 登出
    $('#quit').click(function(){
        axios(RELATION_LOGOUT_API, {
            method: 'delete',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": MyCookie.get("csrf_token")
            }
        })
        .then(response=>{
            let data = response["data"];
            TuastTips.toggle_tips('icon-jiazaichenggong', data['errmsg'], ()=>{
                window.location.href = './login.html';
            });
        })
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '异常', ()=>{
                window.location.href = './login.html';
            });
        })
    });

    // 上传头像
    // 取消事件冒泡
    $("#form-avatar").click(function(e){
        e.stopPropagation();
    })

    let load_tips;
    $("#form-avatar").submit(function(e){
        e.preventDefault();
        // 使用 jquery.form.min.js 异步提交
        load_tips = TuastTips.load("上传中");
        $(this).ajaxSubmit({
            url: UPLOAD_IMAGE_API,
            type: "post",
            dataType: "json",
            headers: {
                "X-CSRFToken": MyCookie.get("csrf_token")
            },
            success: function(res){
                // console.log(res);
                if (res.errno === "0") {
                    const image_url = res.data.image_url;
                    // console.log(image_url);
                    axios(AVATAR_API  + `?image_url=${image_url}`, {
                        method: 'PUT'
                    })
                    .then(ret=>{
                        // console.log(ret);
                        $("#avatar").prop({
                            'src': ret.data.data.avatar_url
                        })     
                        load_tips.hide();
                        TuastTips.toggle_tips('icon-jiazaichenggong', ret.data.errmsg);
                        $(".upload-avatar-container").addClass("dn");    
                    })
                    .catch(err=>{
                        load_tips.hide();
                        TuastTips.toggle_tips('icon-jiazaishibai', "网络异常");
                    })
                    
                } else {
                    load_tips.hide();
                    TuastTips.toggle_tips('icon-jiazaishibai', res.errmsg);
                }
            },
            error: function(err) {
                load_tips.hide();
                TuastTips.toggle_tips('icon-jiazaishibai', "网络异常");
            }
        });
    });

    // 显示上传头像界面
    $("#avatar").click(function(){
        $(".upload-avatar-container").removeClass("dn")
    });
    
    // 隐藏上传头像界面
    $(".upload-avatar-container").click(function(){
        console.log("click");
        $(this).addClass("dn");
    });

    // 版本
    const check_version = ()=>{
        // TODO 检查新版本
        TuastTips.success("已是最新版本");
    }
    $("#btn-version").click(check_version);
})

