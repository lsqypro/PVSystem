import {TuastTips} from '../component/dialog.js';
import {RELATION_CHECK_LOGIN_API, RELATION_GET_VIST_RECORD_API} from "./api.js"
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
            user_id = res.data.data.id;
            return res.data;
        }
        throw new Error(res.data.errmsg);
    };

    get_session()
    .catch(err=>{
        TuastTips.error(err);
    });

    // 刷新
    const flush = async ()=>{
        const res = await request(
            RELATION_GET_VIST_RECORD_API,
            {
                method: "get"
            }
        )
        if (res.data['errno'] === "0") {
            TuastTips.success(res.data['errmsg']);
            // 渲染数据
            const list = res.data.data.list;
            let $msg_ul = $("#message-ul");
            for (const item of list) {
                console.log(item);
                let $li = $(`
                    <li>
                    <div class="title-wrap"><span class="name">系统通知</span><div><span class="date">${item['update_time']}</span><i class="iconfont icon-qianjin"></i></div></div>
                    <div class="msg">${item['status']}</div>
                    </li>
                `)
                $msg_ul.prepend($li);
                // 绑定事件
                $li.click(function(){
                    // 跳转到指定页面
                    location.href = `description.html?id=${item["id"]}`;
                });
            }
        }
        else {
            TuastTips.error(res.data['errmsg']);
        }
    };

    flush().catch(err=>{
        TuastTips.error(err);
    });
})