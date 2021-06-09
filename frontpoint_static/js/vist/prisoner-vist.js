import {TuastTips} from '../component/dialog.js';
import {PRISONER_CHECK_LOGIN_API, PRISONER_GET_VIST_RECORD_API, MEDIA_CHAT_PAGE, PRISONER_LOGOUT_API} from "./api.js";
import {request} from "../utils/commons.js";
import {getUrlParams} from "../utils/utils.js";
import {MyCookie} from '../utils/commons.js'

$(function() {
    // 检查登录
    let userID;

    const get_session = async ()=>{
        const res = await request(
            PRISONER_CHECK_LOGIN_API,
            {
                method: "get"
            }
        )
        // console.log(res);
        if (res.data.errno === "0") {
            console.log(res);
            userID = res.data.data.user.id;
            return res.data;
        }
        throw new Error(res.data.errmsg);
    };

    get_session()
    .catch(err=>{
        TuastTips.error(err);
    });

    // 获取状态
    let data;
    let roomID = 100;

    const get_record_status = async ()=>{
        const res = await request(
            PRISONER_GET_VIST_RECORD_API,
            {
                method: "get"
            }
        );

        if (res.data['errno'] === "0") {
            TuastTips.success(res.data['errmsg']);
            console.log(res);
            // 渲染数据
            data = res.data.data.list[0];
            roomID = data["room_id"]
            $("#time-space").html(`<br>请在规定时间段进行通话:<br>${data["start_time"]} 至 ${data["end_time"]}<br>`)
        }
        else {
            TuastTips.error(res.data['errmsg']);
        }
    };

    get_record_status()
    .catch(err=>{
        TuastTips.error(err);
    });

    // 按钮
    $('#join-chat').click(function(){
        if (!roomID || !userID) {
            TuastTips.error("不存在已通过的探监申请");
            return;
        }
        location.href = `${MEDIA_CHAT_PAGE}?roomID=${roomID}&userID=${userID}`;
    });

    $('#logout').click(function(){
        axios(PRISONER_LOGOUT_API, {
            method: 'delete',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": MyCookie.get("csrf_token")
            }
        })
        .then(response=>{
            let data = response["data"];
            TuastTips.toggle_tips('icon-jiazaichenggong', data['errmsg'], ()=>{
                window.location.href = './prisoner-login.html';
            });
        })
        .catch(err=>{
            TuastTips.toggle_tips('icon-jiazaishibai', '异常', ()=>{
                window.location.href = './prisoner-login.html';
            });
        })
    });
});