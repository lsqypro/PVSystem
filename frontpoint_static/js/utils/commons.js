export class MyCookie {
    static set(name, value, { maxAge, domain, path, secure } = {}) {
        let cookieText = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        
        if (typeof maxAge === 'number') {
            cookieText += `; max-age=${maxAge}`;
        }
        
        if (domain) {
            cookieText += `; domain=${domain}`;
        }
        
        if (path) {
            cookieText += `; path=${path}`;
        }
        
        if (secure) {
            cookieText += `; secure`;
        }
        
        document.cookie = cookieText;
        
        // document.cookie='username=alex; max-age=5; domain='
    };

    static get(name) {
        name = `${encodeURIComponent(name)}`;
        
        const cookies = document.cookie.split('; ');
        
        for (const item of cookies) {
            const [cookieName, cookieValue] = item.split('=');
        
            if (cookieName === name) {
            return decodeURIComponent(cookieValue);
            }
        }
        
        return;
    };

    // 根据 name、domain 和 path 删除 Cookie
    static remove(name, { domain, path } = {}) {
        set(name, '', { domain, path, maxAge: -1 });
    };
}

export const request = (url, arg)=>{
    // 如果非GET,携带csrf_token
    if (arg && arg.hasOwnProperty('method') && arg['method'] != 'get') {
        if (!arg.hasOwnProperty("headers")) {
            arg['headers'] = {};
        }
        arg['headers']['X-CSRFToken'] = MyCookie.get("csrf_token");
    }
    return axios(url, arg)
}
