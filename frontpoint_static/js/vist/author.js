import {
    Dialog,
    TuastTips
} from "../component/dialog.js";
import {
    generateUUID,
    is_mobile_number,
    is_image_code,
    is_sms_code,
    is_password,
    is_name,
    is_id_card_number
} from '../utils/utils.js';
import {
    RELATION_CHECK_LOGIN_API, GET_SMS_CODE_API, GET_IMAGE_CODE_API, UPLOAD_IMAGE_API, REALNAME_POST_AUTHOR_API
} from './api.js';
import {
    request,
    MyCookie
} from "../utils/commons.js"

$(function () {
    // 用户协议
    let dialog = new Dialog(
        '用户协议',
        '用户协议同意是怎么回事呢？用户协议相信大家都很熟悉，但是用户协议同意是怎么回事呢，下面就让小编带大家一起了解吧。 用户协议同意，其实就是不能不同意，大家可能会很惊讶用户协议怎么会同意呢？但事实就是这样，小编也感到非常惊讶。这就是关于用户协议同意的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论哦！',
        function () {
            $radio.addClass("radio-select");
            dialog.hide();
        },
        function () {
            $radio.removeClass("radio-select");
            dialog.hide();
        }
    );
    dialog.getElement().appendTo($('body'));

    let $radio = $(".radio");
    $radio.click(function () {
        console.log("hh");
        $radio.toggleClass("radio-select");
    });
    $('.desc a').click(function () {
        dialog.show();
    });

    // 获取用户信息
    let mobile;
    request(RELATION_CHECK_LOGIN_API, {
        method: "get"
    })
    .then(res=>{
        mobile = res.data.data.user.mobile;
        $("#mobile").val(`${mobile.slice(0, 3)}****${mobile.slice(7, 11)}`)
    })
    .catch(err=>{
        TuastTips.error("网络异常");
    })

    // 上传证件
    // 建立一可存取到file的url
    function getObjectURL(file) {
        var url = null;
        if (window.createObjectURL != undefined) { // basic
            url = window.createObjectURL(file);
        } else if (window.URL != undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file);
        } else if (window.webkitURL != undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file);
        }
        return url;
    }

    // 正面
    // 提交事件
    let $card1 = $("#form-idcard-1");
    let card_object_url_1;
    let card_url_1;
    $card1.submit(function(e){
        let load_tips = TuastTips.load("上传中");
        e.preventDefault();
        $(this).ajaxSubmit({
            url: UPLOAD_IMAGE_API,
            type: "post",
            dataType: "json",
            headers: {"X-CSRFToken": MyCookie.get("csrf_token")},
            success: res=>{
                load_tips.hide();
                card_url_1 = res.data.image_url;
                TuastTips.success(res.errmsg);
                $card1.prev().children("img").attr({src: card_object_url_1});
                $card1.prev().children("img").removeClass("dn");
                $card1.prev().children("img").next().addClass("dn");
            },
            error: err=>{
                load_tips.hide();
                TuastTips.error("请求异常");
            }
        });
    });
    // 图片选择事件
    $card1.children("input").change(function(e){
        card_object_url_1 = getObjectURL(this.files[0]);
        if (card_object_url_1) {
            $card1.trigger("submit");
        }
    })
    $card1.prev().click(function(){
        $card1.children("input").trigger("click");
    });
    
    // 反面
    // 提交事件
    let $card2 = $("#form-idcard-2");
    let card_url_2;
    let card_object_url_2;
    $card2.submit(function(e){
        let load_tips = TuastTips.load("上传中");
        e.preventDefault();
        $(this).ajaxSubmit({
            url: UPLOAD_IMAGE_API,
            type: "post",
            dataType: "json",
            headers: {"X-CSRFToken": MyCookie.get("csrf_token")},
            success: res=>{
                load_tips.hide();
                card_url_2 = res.data.image_url;
                TuastTips.success(res.errmsg);
                $card2.prev().children("img").attr({src: card_object_url_2});
                $card2.prev().children("img").removeClass("dn");
                $card2.prev().children("img").next().addClass("dn");
            },
            error: err=>{
                load_tips.hide();
                TuastTips.error("请求异常");
            }
        });
    });
    // 图片选择事件
    $card2.children("input").change(function(e){
        card_object_url_2 = getObjectURL(this.files[0]);
        if (card_object_url_2) {
            $card2.trigger("submit");
        }
    })
    $card2.prev().click(function(){
        $card2.children("input").trigger("click");
    });

    // 图片验证码验证
    let $img_code = $('#change-img-code');
    let image_id;
    flushImageCode();

    $img_code.click(function () {
        flushImageCode();
    });

    function flushImageCode() {
        image_id = generateUUID();
        $img_code.prop({
            src: GET_IMAGE_CODE_API + '/' + image_id
        });
    }
    // 发送短信验证码
    let code_time = 0;
    let timer;
    $("#sendcode").click(function(){
        if (code_time > 0) return;
        const img_code = $("#img_code").val();

        if (!is_image_code(img_code)) {
            TuastTips.error("请输入图片验证码");
            return;
        }

        // 验证图片验证码
        check_image_code(image_id, img_code)
        .then(res=>{
            // 倒计时
            code_time = 60;
            timer = setInterval(function(){
                $("#sendcode").html(`重新发送(${--code_time})`);
                if (code_time == 0) {
                    $("#sendcode").html(`重新发送`);
                    clearInterval(timer);
                }
            }, 1000, 60);
        })
        .catch(err=>{
            TuastTips.error(err);
            flushImageCode();
        })
    })

    const check_image_code = async (id, code)=>{
        if (!code || !is_image_code(code) || !id) {
            throw new Error("参数错误");
        }

        const res = await request(
            GET_SMS_CODE_API + `/${mobile}?image_code=${code}&image_code_id=${id}`,
            {
                method: "get"
            }
        )
        if (res.data.errno === "0") {
            TuastTips.success("发送成功");
            return;
        }
        else {
            throw new Error(res.data.errmsg);
        }
    }

    // 提交表单
    const submit_form = async () => {
        // window.location.replace('my.html');

        // 测试
        // $("#name").val("张三");
        // $("#id_card").val("12342519980501151x");
        // $("#img_code").val("1234");
        // $("#sms_code").val("123456");
        // card_url_1 = "https://vist-project.oss-cn-chengdu.aliyuncs.com/avatar/c1aee110a02911ebb81b525400aa89b3.jpg"
        // card_url_2 = "https://vist-project.oss-cn-chengdu.aliyuncs.com/avatar/c441b074a02911eba6b3525400aa89b3.jpg"

        const real_name = $("#name").val();
        if (!is_name(real_name)) {
            TuastTips.error("请输入正确姓名");
            return;
        }

        const id_num = $("#id_card").val();
        if (!is_id_card_number(id_num)) {
            TuastTips.error("请输入正确的身份证号");
            return;
        }

        const img_code = $("#img_code").val();
        if (!is_image_code(img_code)) {
            TuastTips.error("请输入正确的图片验证码");
            return;
        }

        const sms_code = $("#sms_code").val();
        if (!is_sms_code(sms_code)) {
            TuastTips.error("请输入正确的短信验证码");
            return;
        }

        if (!card_url_1 || !card_url_2) {
            TuastTips.error("请上传身份证照片");
            return;
        }
        const data = {
            real_name: real_name,
            id_card: id_num,
            sms_code: sms_code,
            id_card_url_front: card_url_1,
            id_card_url_back: card_url_2
        }
        console.log(data);
        request(
            REALNAME_POST_AUTHOR_API,
            {
                method: "post",
                headers:{},
                data: data
            }
        )
        .then(res=>{
            console.log(res);
            if (res.data.errno === "0") {
                TuastTips.success(res.data.errmsg, ()=>{
                    window.location.replace('./my.html');
                })
            }
            else {
                TuastTips.error(res.data.errmsg)
            }
        })
        .catch(err=>{
            TuastTips.error("请求异常")
        })
    }
    $("#go_author").click(submit_form);
})