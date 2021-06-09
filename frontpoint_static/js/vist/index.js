import {TuastTips, Dialog} from '../component/dialog.js';
import {RELATION_CHECK_LOGIN_API, MEDIA_CHAT_PAGE} from "./api.js"

$(function() {
    let id, user, real_status = "未实名";

    $('#apply-for').click(function(){
        // 进行实名认证检查
        if (real_status != "已实名") {
            // 用户协议
            Dialog.show_dialog(
                '提示', 
                '您还没有进行实名认证，是否进行认证',
                function() {
                    location.href = './author.html';
                }
            )
        } else {
            location.href = './applyfor.html';
        }
    });

    $('#select').click(function(){
        location.href = 'description.html';
    });


    // 进入房间
    $('#join-room').click(function(){
        let roomID = $('#room-input').val();
        let userID = id;
        console.log(roomID, userID);
        if (!roomID || !userID) {
            TuastTips.error("参数错误");
            return;
        }
        location.href = `${MEDIA_CHAT_PAGE}?roomID=${roomID}&userID=${userID}`;
    })

    flush_user_info();

    // 检查登录状态, 并设置用户信息
    function flush_user_info() {
        axios.get(RELATION_CHECK_LOGIN_API)
        .then(response=>{
            let data = response.data;
            if (data['errno'] === "0") {
                // TuastTips.toggle_tips('icon-jiazaichenggong', '已登录');
                // 加载数据
                user = data['data']['user'];
                console.log(user);
                id = user['id']
                real_status = user['real_status'];
                // TODO 实名认证
                // real_status = "已实名";
                // $('#avatar').prop({src: user['avatar_url']});
                // $('#user-name').html(user['real_name']);
                // $('#uid').html(`UID:${user['id']}`);
                // $('#real-status').html(`${user['real_status']}`);
                // $('#mobie').html(`${user['mobile']}`);
            }
            else {
                TuastTips.toggle_tips('icon-jiazaishibai', data['errmsg']);
            }
        }) 
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '异常');
        })
    }
});