import {TuastTips} from '../component/dialog.js';
import {RELATION_CHECK_LOGIN_API, RELATION_GET_VIST_RECORD_API, MEDIA_CHAT_PAGE} from "./api.js";
import {request} from "../utils/commons.js";
import {getUrlParams} from "../utils/utils.js";

$(function() {
    // 检查登录
    let userID;
    let record_id = getUrlParams("id");

    const get_session = async ()=>{
        const res = await request(
            RELATION_CHECK_LOGIN_API,
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
            RELATION_GET_VIST_RECORD_API + `?id=${record_id}`,
            {
                method: "get"
            }
        );

        if (res.data['errno'] === "0") {
            TuastTips.success(res.data['errmsg']);
            // console.log(res);
            // 渲染数据
            data = res.data.data.list[0];
            roomID = data["room_id"]

            if (data["status"] == "未通过") {
                $(".progress").html("您的申请未通过，请重新提交");
                return;
            }

            $("#record-submit").addClass("select");
            if (data["status"] == "审核中") {
                return;
            }
            
            $("#record-pass").addClass("select");
            $("#record-pass").children().eq(0).children().eq(0).addClass("line-select");
            $("#record-pass").children().eq(0).children().eq(2).addClass("line-select");
            if (data["status"] == "已通过") {
                $("#time-space").html(`<br>请在规定时间段进行通话:<br>${data["start_time"]} 至 ${data["end_time"]}<br>`)
                return;
            }

            $("#record-over").addClass("select");
            $("#record-over").children().eq(0).children().eq(0).addClass("line-select");
            $("#record-over").children().eq(0).children().eq(2).addClass("line-select");
            if (data["status"] == "已结束") {
                return;
            }
            
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
    $('.mbtn').click(function(){
        if (!data) {
            TuastTips.error("参数错误");
            return;
        }

        if (data["status"] != "已通过") {
            TuastTips.error("申请未通过或已结束");
            return;
        }

        if (data["current_time"] < data["start_time"]) {
            TuastTips.error("未到指定时间");
            return;
        }

        if (data["current_time"] > data["end_time"]) {
            TuastTips.error("已过期");
            return;
        }
        console.log(roomID, userID);
        if (!roomID || !userID) {
            TuastTips.error("参数错误");
            return;
        }
        location.href = `${MEDIA_CHAT_PAGE}/${record_id}`;
    });
});