export class Dialog {
    constructor(title, text, ok, cancel) {
        const $ele = $("<div>");
        
        $ele.addClass("dialog-container");
        $ele.html(`<div class="tips">
                            <div class="title">${title}</div>
                            <div class="text">${text}</div>
                            <div class="btns"><div class="ok">确定</div><div class="cancel">取消</div></div>
                        </div>`);
        
        const self = this;
        $ele.delegate("div", 'click', function(){
            if ($(this).hasClass("ok")) {
                self.status = 1;
                ok();
                $ele.hide();
            }
            else if ($(this).hasClass("cancel")) {
                self.status = 0;
                $ele.hide();
            }            
        });
        this.ele = $ele;
        self.status = 0;
        $ele.hide();
    }

    static show_dialog(tips, text, success, failed) {
        let dialog = new Dialog(
            tips, 
            text,
            success,
            failed
        );
        dialog.getElement().appendTo($('body'));
        dialog.show();   
    }

    getStatus() {
        return new Promise((resolve, reject)=>{
            this.ele.show();
            const self = this;
            this.ele.delegate("div", 'click', function(){
                if ($(this).hasClass("ok")) {
                    self.status = 1;
                    resolve(1);
                }
                else if ($(this).hasClass("cancel")) {
                    self.status = 0;
                    resolve(0);
                }   
                self.ele.hide()         
            });
        })
    }

    show() {
        this.ele.show(...arguments);
    }
    
    hide() {
        this.ele.hide(...arguments);
    }

    toggle() {
        this.ele.toggle(...arguments)
    }

    getElement() {
        return this.ele;
    }

    remove() {
        this.ele.remove();
    }
}

export class TuastTips {
    constructor(icon, text) {
        // icon-jiazaichenggong
        // 加载成功
        // icon-jiazaishibai
        // 加载失败
        // icon-wangluolianjieshibai
        // 网络连接失败
        // icon-jiazaizhong
        // 正在加载
        this.ele = $("<div>")
        this.ele.addClass("tuasttips-container");
        this.ele.html(`<div class="tips">
                            <i class="iconfont ${icon}"></i>
                            <span class="desc">${text}</span>
                        </div>`);
        this.ele.hide();
        this.ele.appendTo($("body"));
    }

    static toggle_tips(tips_icon, tips_text, func) {
        let tps = new TuastTips(tips_icon, tips_text);
        // tps.getElement().appendTo($('body'));
        tps.toggleFade(function(){
            tps.remove();
            if (func) {
                func();
            }
        });
    }

    static success() {
        TuastTips.toggle_tips("icon-jiazaichenggong", ...arguments);
    }

    static error() {
        TuastTips.toggle_tips("icon-jiazaishibai", ...arguments);
    }

    static load() {
        let tps = new TuastTips("icon-jiazaizhong", ...arguments);
        tps.show();
        return tps;
    }
    
    toggleFade(over_do) {
        // this.ele.fadeIn();
        this.ele.show();
        this.ele.fadeOut(1500, over_do);
    }

    show() {
        this.ele.show(...arguments);
    }
    
    hide() {
        this.ele.hide(...arguments);
    }

    toggle() {
        this.ele.toggle(...arguments)
    }

    getElement() {
        return this.ele;
    }

    remove() {
        this.ele.remove();
    }
}