import {TuastTips} from '../component/dialog.js';
import {RELATION_CHECK_LOGIN_API, RELATION_POST_VIST_RECORD_API} from "./api.js"
import {request} from "../utils/commons.js"

$(function() {
    // 检查登录
    let user_id;
    const get_session = async ()=>{
        const res = await request(
            RELATION_CHECK_LOGIN_API,
            {
                method: "get"
            }
        )
        // console.log(res);
        if (res.data.errno === "0") {
            // console.log(res.data.data.user);
            user_id = res.data.data.user.id;
            return res.data;
        }
        throw new Error(res.data.errmsg);
    };

    get_session()
    .catch(err=>{
        TuastTips.error(err);
    });

    // 提交申请
    const submit_form = async ()=>{
        const user_id_a = user_id;
        const user_id_b = Number($("#bid").val());
        const desc = $("#desc").val();
        let start = new String($("#start-time-input").val());
        let end = new String($("#end-time-input").val());

        if (!user_id_a) {
            TuastTips.error("请登录");
            return;
        }

        if (!user_id_b) {
            TuastTips.error("请输入ID");
            return;
        }

        if (!desc) {
            TuastTips.error("请输入申请理由");
            return;
        }
        
        if (!start) {
            TuastTips.error("请选择起始时间");
            return;
        }
        else {
            start = start.split("");
            start[10] = " ";
            start = start.join("");
        }

        if (!end) {
            TuastTips.error("请选择结束时间");
            return;
        }
        else {
            end = end.split("");
            end[10] = " ";
            end = end.join("");
        }
        // console.log(start, end, start < end);
        if (start >= end) {
            TuastTips.error("请选择正确的时间段");
            return;
        }

        const data = {
            prisoner_id: user_id_b,
            prisoner_mobile: " ",
            apply_desc: desc,
            start_time: start,
            end_time: end
        };
        console.log(data);
        const res = await request(
            RELATION_POST_VIST_RECORD_API,
            {
                method: "post",
                data: data
            }
        )
        if (res.data['errno'] === "0") {
            TuastTips.success(res.data['errmsg'], ()=>{
                location.href = './index.html';
            });
        }
        else {
            TuastTips.error(res.data['errmsg']);
        }
    };

    $(".mbtn").click(function(){
        submit_form().catch(err=>{
                TuastTips.error(err);
            });
    })
    
})