export function generateUUID() {
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

export function is_mobile_number(num) {
    if (num.length != 11)
        return false;
    for (let i = 0; i < num.length; i++) {
        if (num[i] < '0' || num[i] > '9')
            return false;
    }
    return true;
}

export function is_image_code(code) {
    if (code.length != 4)
        return false;
    return true;
}

export function is_password(pwd) {
    if (pwd.length < 6 || pwd.length > 6)
        return false;
    return true;
}

// 是否为真实姓名
export const is_name = (name)=>{
    return is_name && name.length >= 2 && name.length < 10;
}

// 省份证号格式校验
export const is_id_card_number = (num)=>{
    return num && num.length === 18;
}

export const is_sms_code = (code)=>{
    return code && code.length === 6;
}

export function getUrlParams(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
 }