/*
    name: splus表单控件
    project: splus前端框架
    author: 2goyoung
    email:zhangguoyong@revenco.com
    date: 2014-05-26


    ***************组件扩展说明******************
    扩展方法：sFrom.extend(obj)
    obj：扩展组件对象的属性和方法，
        obj属性：
        type:组件类型，必填
        init:初始化组件执行函数，必填
        get:获取组件的值，必填
        set:设置组件的值，必填
        private:设置属性私有，不会被继承,（已去除，代替：属性前加"_"表示私有属性 不被继承）
        cloneType:克隆某种类型的组件，通过cloneWith或cloneWithout筛选属性
        ......:自定义的方法

    例子：
        扩展radio类型组件
        sFrom.extend({type:"radio",....})  

        扩展自定义组件
        //js
        sFrom.extend({
            type:"myComponent",
            init:function(element){
                var _this=this;
                //初始化组件结构、添加事件 之类
                $(element).html("点击我会弹出警告框！！");
                sForm("#test").on("click",function(){
                       _this.myAlert("你点了我~")
                })
            },
            myAlert:function(msg){
                //自定义方法
                alert(msg);
            }
        }) 
        //html
        <div id="test" type="myComponent"></div>
        //调用
        var com=sForm("#test").init();  
        com.myAlert("测试！");
        注：sForm("#test") 返回组件对象，当集合中只有一种类型 才会继承此类型组件的属性和方法

*/

; (function (factory) {
    if (typeof define === 'function') {
        if (define.amd) {
            define(['jquery','jscrollpane'], factory);
        } else if (define.cmd) {
            define(function (require, exports, module) {
                require('jscrollpane');
                return factory(require('jquery'));
            })
        }
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        factory(jQuery);
    }
}(function ($) {
    var PREFIX = "sForm",
        sDataType = PREFIX + "-type",
        sDataInit = PREFIX + "-init",
        sDataDefault = PREFIX + "-default",
        className = {
            textbox:"sp-textbox",
            radio: "sp-radio",
            checkbox: "sp-checkbox",
            select:"sp-select",
            file:"sp-file",
            button:"sp-btn",
            spinner:"sp-spinner"
        };
    
    //扩展对象的内置默认属性
    var extendDefault = {
        type: true,//扩展控件类型
        init: true,//初始化执行函数
        get:true,//返回控件的值的方法
        set: true,//设置控件的值的方法
        //change: true,//设置控件的值的方法
        cloneType: true,//克隆控件的类型,，字符串
        cloneInit: true,//克隆控件的初始化，执行与被克隆控件初始化后
        cloneWith: true,//选择克隆的方法，数组
        cloneWithout: true//去除被克隆的方法，数组
    }

    var cloneList = {};//保存克隆的组件，可以追溯组件的克隆对象（克隆类型：被克隆类型）
    var formGroups = {};//控件组对象，保存系统所有组件信息

    //var formTypeArray=["button","checkbox","color","data","datetime","datetime-local","email","file","hidden","image","month","number","password","range","radio","reset","search"]
    var formTypeArray = ["text", "autocomplete", "password", "email", "radio", "checkbox", "spinner", "select", "file", "adress"];

    var $ = $;

    var sForm = function (selector) {
        return new sForm.prototype.ready(selector);
    }
    
    sForm.fn=sForm.prototype = {
        constructor: sForm,
        ready: function (selector) {
            //种子函数
            var _this = this;
            if (!selector) {
                return _this;
            }
            var typeList = {};
            this.$element = $(selector);
            $.each(this.$element, function () {
                var type = getFormType(this);
                if (sForm.hasType(type)) {
                    $(this).data(sDataType, type);
                    typeList[type] = true;
                }
            });

            var typeNum=0;
            for (var t in typeList) {
                typeNum++;
            }
            if (typeNum == 1) {
                //如果集合中只有一种组件类型，继承组件的方法和属性
                for (var t in typeList) {
                    //var privatArray=formGroups[t].prototype.private;
                    //var privateObj = {};
                    //if (privatArray!==undefined)
                    //$.each(privatArray,function(i,n){
                    //    privateObj[n]=true;
                    //})
                    for (var m in formGroups[t].prototype) {
                        if (!extendDefault[m] && !/^_/.test(m)) {
                            _this[m] = (function () {
                                var method = formGroups[t].prototype[m];
                                if (typeof method == "function") {
                                    return function () {
                                        var arg = arguments;
                                        var returnVal;
                                        _this.$element.each(function () {
                                            if ($(this).data(sDataType)) {
                                                returnVal = method.apply($(this).data("sForm"), arg);
                                            }
                                        })
                                        if (returnVal !== undefined) {
                                            return returnVal;
                                        } else {
                                            return this;
                                        }
                                    }
                                } else {
                                    return method;
                                }
                            })()
                        }
                    }
                }
            } else if (typeNum==0) {
                
            }
            
            return _this;
        },
        init: function (sFormData) {
            //sFormData={"type":"","config":{},"data":{}}
            //初始化组件
            $.each(this.$element, function () {
                try {
                    var comType = sFormData === undefined || sFormData.type === undefined ? $(this).data(sDataType) : sFormData.type;
                    if (!comType) {
                        //alert("组件类型不能为空")
                    }
                    else if (!$(this).attr(sDataInit) && $(this).attr(sDataInit) != true) {
                        $(this).attr(sDataInit, "true");
                        //if (cloneList[comType]) {
                        //    var newSForm = new formGroups[cloneList[comType]](this, { cloning: comType });
                        //    if (typeof formGroups[comType].prototype.cloneInit == "function") {
                        //        formGroups[comType].prototype.cloneInit(newSForm);
                        //    }
                        //    $(this).data("sForm", newSForm);
                        //} else {
                        //    $(this).data("sForm", new formGroups[comType](this, {}));
                        //}
                        $(this).data("sForm", new formGroups[comType](this, sFormData));
                    }
                } catch (e) {
                    // alert("不支持此表单元素")
                }
            });
            return this;
        },
        getValue: function () {
            return $(this.$element).data("sForm").get();
        },
        setValue: function (value) {
            var arg=arguments;
            $.each(this.$element, function () {
                var setMethod = formGroups[$(this).data(sDataType)].prototype.set;
                if (typeof setMethod == "function") {
                    setMethod.apply($(this).data("sForm"), arg);
                } else {
                    alert($(this).data(sDataType) + "不具有setValue方法");
                }
                
            });
            return this;
        },
        getType: function (index) {
            var i = index === undefined ? 0 : index;
        },
        change: function () {
            alert("组件（" + getFormType(this.$element[0])+"）不支持change事件")
        },
        reset: function () { 
            var _this=this;
            $.each(this.$element, function () {
                var defaultValue=$(this).data(sDataDefault);
                if (typeof defaultValue != "undefined") {
                    _this.setValue(defaultValue);
                } else {
                    alert("reset失败，元素缺少默认值");
                }
            });
            return this;
        }
    }

    sForm.fn.ready.prototype = sForm.fn;

    sForm.extend = function (comConfig) {
        var type = comConfig.type;
        if (!type) { alert("组件类型不能为空"); return; }
        if (formGroups[comConfig.type]) {
            alert("组件"+comConfig.type+"已存在");
        } else {
            if (comConfig.cloneType) {
                //克隆组件
                var cloneCom = {};
                var orgCom = $.extend(true,{}, formGroups[comConfig.cloneType].prototype);
                var cloneDelList = {  "type": true };
                
                if (comConfig.cloneWithout) {
                    for (var off in comConfig.cloneWithout) {
                        cloneDelList[off] = true;
                    }
                }

                if (comConfig.cloneWith) {
                    for (var on in comConfig.cloneWith) {
                        cloneDelList[on] = false;
                    }
                }

                for (var i in orgCom) {
                    if (!cloneDelList[i]) {

                        cloneCom[i] = orgCom[i];
                    }
                }

                for (var i in comConfig) {
                    cloneCom[i] = comConfig[i];
                }

                cloneList[type] = comConfig.cloneType;
                formGroups[type] = function () {
                    cloneCom.init.apply(this, arguments);
                    if (typeof cloneCom.cloneInit == "function") {
                        cloneCom.cloneInit.call(this);
                    }
                };
                formGroups[type].prototype = cloneCom;
            } else {
                formGroups[type] = comConfig.init;
                formGroups[type].prototype = comConfig;
            }
        }
    }

    sForm.hasType = function (type) {
        return formGroups[type] ? true : false;
    }

    sForm.getTypeList = function () {
        var i,list=[];
        for (i in formGroups) {
            list.push[i];
        }
        return list;
    }

    sForm.init = function () {
        return sForm("input,textarea,button,select").init();
    }

    //文本输入框
    sForm.extend({
        type: "text",
        init: function (element, info) {
            var
                _this = this,
                $textBox = this.$textBox = $(element),
                placeholder = $textBox.data('placeholder'),
                iconLeft = $textBox.data('icon-left'),
                iconRight = $textBox.data('icon-right'),
                $textBoxWrap;
            this.element = element;
            //保存当前值
            this.currentValue = $textBox.val();
            //保存默认值
            $textBox.data(sDataDefault, this.currentValue);
            //初始化结构
            if (!$textBox.parents('.' + className.textbox).length) {
                $textBox.wrap($('<div class="' + className.textbox + '" ><div class="' + className.textbox + '-input"><div class="' + className.textbox + '-inner"></div></div></div>'));
                $textBoxWrap = $textBox.parents('.' + className.textbox).eq(0);
                if (placeholder) {
                    this.$placeholder = $('<span class="placeholder">' + placeholder + '</span>').prependTo($textBoxWrap);
                }
                if (iconLeft) {
                    $textBoxWrap.addClass("icon-left");
                    this.$iconLeft = $('<span class="icon left"><i class="' + iconLeft + '"></i></span>').appendTo($textBoxWrap);
                }
                if (iconRight) {
                    $textBoxWrap.addClass("icon-right");
                    this.$iconRight = $('<span class="icon right"><i class="' + iconRight + '"></i></span>').appendTo($textBoxWrap);
                }
            } else {
                $textBoxWrap = $textBox.parents('.' + className.textbox).eq(0);
                var $placeholder = $textBoxWrap.find('.placeholder');
                var $iconLeft = $textBoxWrap.find('.icon.left');
                var $iconRight = $textBoxWrap.find('.icon.right');
                if (!$placeholder.length && placeholder) {
                    this.$placeholder = $('<span class="placeholder">' + placeholder + '</span>').prependTo($textBoxWrap);
                } else if (placeholder) {
                    this.$placeholder = $placeholder;
                }

                if (!$iconLeft.length && iconLeft) {
                    $textBoxWrap.addClass("icon-left");
                    this.$iconLeft = $('<span class="icon left"><i class="' + iconLeft + '"></i></span>').appendTo($textBoxWrap);
                } else if (iconLeft) {
                    $textBoxWrap.addClass("icon-left");
                    this.$iconLeft = $iconLeft;
                }

                if (!$iconRight.length && iconRight) {
                    $textBoxWrap.addClass("icon-right");
                    this.$iconRight = $('<span class="icon right"><i class="' + iconRight + '"></i></span>').appendTo($textBoxWrap);
                } else if (iconRight) {
                    $textBoxWrap.addClass("icon-right");
                    this.$iconRight = $iconRight;
                }

                if (!$textBox.parent().hasClass(className.textbox + '-input')) {
                    $textBox.wrap('<div class="' + className.textbox + '-input"><div class="' + className.textbox + '-inner"></div></div>');
                }
            }
            this.$textBoxWrap = $textBoxWrap;
            
            //绑定事件
            if (placeholder) {
                this.checkPlaceholder();
                this.$textBox.on("keyup keypress", function () {
                    _this.checkPlaceholder();
                })
            }
            this.$textBoxWrap.on("mouseenter", function () {
                $(this).addClass("hover");
            }).on("mouseleave", function () {
                $(this).removeClass("hover");
            });
            this.$textBox.on("focus", function () {
                _this.$textBoxWrap.addClass("focus");
            }).on("blur", function () {
                _this.$textBoxWrap.removeClass("focus");
            }).on("keyup", function (e) {
                if (e.keyCode == sForm.keyMap.enter) {
                    if (typeof _this._enterFunction == "function") {
                        if (_this._enterFunction()) {
                            _this.enterFunction.call(_this, _this.$textBox.val());
                        }
                    }
                    else if (typeof _this.enterFunction == "function") {
                        _this.enterFunction.call(_this, _this.$textBox.val());
                    }
                } else {
                    _this.set(_this.$textBox.val());
                }
            });
        },
        get: function () {
            return this.$textBox.val();
        },
        set: function (val) {
            if (this.currentValue == val) return;
            this.$textBox.val(val);
            if (typeof this.changeFunction == "function") {
                this.changeFunction.call(this, val);
            }
            this.currentValue = val;
        },
        change: function (func) {
            this.changeFunction = func;
        },
        hidePlaceholder: function () {
            if (this.$placeholder) { this.$placeholder.hide(); }
        },
        showPlaceHolder: function () {
            if (this.$placeholder) { this.$placeholder.show(); }
        },
        checkPlaceholder: function () {
            if (this.$placeholder) {
                if (this.$textBox.val() == "") {
                    this.showPlaceHolder();
                } else {
                    this.hidePlaceholder();
                }
            }
        },
        enterFor: function (fun) {
            this.enterFunction = fun;
        }
    });

    //自动完成输入框
    sForm.extend({
        type: "autocomplete",
        init: function () {

        },
        _renderData: function (data) {

        },
        _gainData: function (inputValue) {

            return;
        },
        _showDropList: function () {
            this.$dropList.slideDown();
        },
        _hideDropList: function () {
            this.$dropList.slideUp();
        }
        
    })

    //密码输入框
    sForm.extend({
        type: "password",
        cloneType: "text",
        getStrength: function () {
            var passwd = this.$textBox.val();
            intScore = 0; 
            if (passwd.match(/[a-z]/)) // [验证]至少一个小写字母 
            { 
                intScore = (intScore + 1)
            } 
            if (passwd.match(/[A-Z]/)) // [验证]至少一个大写字母 
            { 
                intScore = (intScore+1) 
            }
            // 单一验证 
            if (passwd.match(/\d+/)) // [验证]至少一个数字 
            { 
                intScore = (intScore+1) 
            }
            if (passwd.match(/(\d.*\d.*\d)/)) // [验证]至少三个数字 
            { 
                intScore = (intScore+1) 
            }
            // 特殊字符验证 
            if (passwd.match(/[!,@#$%^&*?_~.]/)) // [验证]至少一个特殊字符 
            { 
                intScore = (intScore+1) 
            }
            if (passwd.match(/([!,@#$%^&*?_~.].*[!,@#$%^&*?_~.])/)) // [验证]至少两个特殊字符 
            { 
                intScore = (intScore+1) 
            }
            // 复合验证 
            //if (passwd.match(/[a-z]/) && passwd.match(/[A-Z]/)) // [验证]同时包含大写和小写 
            //{ 
            //    intScore = (intScore+2) 
            //}
            //if (passwd.match(/\d/) && passwd.match(/\D/)) // [验证] 同时包含字母和数字 
            //{ 
            //    intScore = (intScore+2) 
            //}
            // [验证] 同时包含大写字母，小写字母，数字和特殊字符 
            //if (passwd.match(/[a-z]/) && passwd.match(/[A-Z]/) && passwd.match(/\d/) && passwd.match(/[!,@#$%^&*?_~]/)) 
            //{ 
            //    intScore = (intScore+2) 
            //} 
            return intScore; 
        }
    });

    //数字输入框 只允许输入数字
    sForm.extend({
        type: "number",
        cloneType: "text",
        cloneInit: function () {
            this.$textBox.on("keydown", function (event) {
                if (!(event.keyCode == 46) && !(event.keyCode == 8) && !(event.keyCode == 37) && !(event.keyCode == 39))
                    if (!((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))) {
                        return false;
                    }
            })
        }
    });

    //电话输入框 只允许输入数字
    sForm.extend({
        type: "tel",
        cloneType: "text",
        cloneInit: function () {
            this.$textBox.on("keydown", function (event) {
                if (!(event.keyCode == 46) && !(event.keyCode == 8) && !(event.keyCode == 37) && !(event.keyCode == 39))
                    if (!((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))) {
                        return false;
                    }
            })
        }
    });

    //邮箱输入框
    sForm.extend({
        type: "email",
        cloneType: "text",
        cloneInit: function () {
            var _this = this;
            this.$dropList = $('<div class="drop-list"></div>').appendTo(this.$textBoxWrap);
            this.showMax = 10;
            this.$textBox.on("keydown", function (e) {
                if (e.keyCode == sForm.keyMap.down) {
                    _this._downSelect();
                    return false;
                } else if (e.keyCode == sForm.keyMap.up) {
                    _this._upSelect();
                    return false;
                }
                else if (e.keyCode == sForm.keyMap.enter) {
                    _this._selectValue();
                    
                }
                

            }).on("keyup", function (e) {
                if (e.keyCode == sForm.keyMap.down || e.keyCode == sForm.keyMap.up || e.keyCode == sForm.keyMap.left || e.keyCode == sForm.keyMap.right) {

                } else {
                    var value = $(this).val();
                    if (value.match("@")) {
                        _this._updateDropList(value);
                    } else {
                        _this._hideDropList();
                    }
                }
            });
            this.$textBox.on("blur", function (e) {
                setTimeout(function () {
                    _this._hideDropList();
                }, 100)
            });
            this.$textBox.on("focus", function (e) {
                var value = $(this).val();
                if (value.match("@")) {
                    _this._updateDropList(value);
                }
            });
            this.$dropList.on("click", "li", function () {
                _this._selectValue();
            }).on("mouseenter","li", function () {
                $(this).addClass("active").siblings(".active").removeClass("active");
            })
        },
        _handleInput: function (inputValue) {
            //响应输入的数值
            var mailList = ["qq.com", "sina.com", "163.com", "126.com", "hotmail.com", "139.com", "189.com", "21cn.com", "gmail.com", "sohu.com", "live.com"];
            var resultMailList = [];
            var name = inputValue.split("@")[0];
            var lastName = inputValue.split("@")[1];
            var output = [];
            if (lastName == "") {
                resultMailList = mailList;
            } else {
                var reg = new RegExp("^" + lastName);
                $.each(mailList, function (i,n) {
                    if (n.match(reg)) {
                        resultMailList.push(n);
                    }
                })
            }
            $.each(resultMailList, function (i, n) {
                output.push(name + "@" + n);
            });
            if (output.length) {
                this._renderDropList(output);
                this._showDropList();
            } else {
                this._hideDropList();
            }
        },
        _renderDropList: function (data) {
            var li = "";
            var max = this.showMax;
            $.each(data, function (i, n) {
                if (i < max) {
                    if(i==0){
                        li += "<li class='active'>" + n + "</li>";
                    }else{
                        li += "<li>" + n + "</li>";
                    }
                } else {
                    return;
                }
            });
            this.$dropList.html(li);
        },
        _updateDropList: function (value) {
            this._handleInput(value);
        },
        _showDropList: function () {
            this.$dropList.slideDown();
        },
        _hideDropList: function () {
            this.$dropList.slideUp();
        },
        _enterFunction: function () {
            
        },
        _keyupFunction: function () {
            alert(0)
        },
        _upSelect: function () {
            var $prev = this.$dropList.find(".active").removeClass("active").prev();
            if ($prev.length) {
                $prev.addClass("active");
            } else {
                this.$dropList.find("li:last").addClass("active");
            }
        },
        _downSelect: function () {
            var $next = this.$dropList.find(".active").removeClass("active").next();
            if ($next.length) {
                $next.addClass("active");
            } else {
                this.$dropList.find("li").eq(0).addClass("active");
            }
        },
        _selectValue: function () {
            this.set(this.$dropList.find(".active").text());
            this.$textBox.blur();
        }
    });

    //单选
    sForm.extend({
        type: "radio",
        init: function (element) {
            var
                _this=this,
                $radio =this.$radio= $(element),
                text = $radio.data('text'),
                $radioWrap;
            this.element = element;
            //init data
            $radio.data(sDataDefault, element.checked);
            
            //init html
            text = text === undefined ? '' : text;
            if (!$radio.parents('.' + className.radio).length) {
                $radioWrap = $('<div class="' + className.radio + '" onselectstart="return false;" ><i class="radio-icon"></i><span class="radio-text">' + text + '</span></div>').insertAfter($radio);
                $radio.appendTo($radioWrap.find('i.radio-icon'));
            } else {
                $radioWrap = $radio.parents('.' + className.radio).eq(0);
                if (!$radioWrap.find('i').length) { $radio.wrap('<i class="radio-icon">'); }
                if (!$radioWrap.find('span').length) { $radioWrap.append($('<span class="radio-text">' + text + '</span>')); }
            }
            this.$radioWrap = $radioWrap;

            if (element.checked) {
                $radioWrap.addClass('checked');
            }
            if (element.disabled) {
                this.disableRadio();
            }
            
            $radioWrap.on('click', function () {
                if ($(this).hasClass('disabled') || $(this).hasClass('checked')) return;
                _this.set(true);
            })

        },
        get: function () {
            return this.element.checked;
        },
        set: function (value) {
            var groupName = $(this.element).attr('name');
            if (this.element.checked != value) {
                if (typeof this.changeFunction == "function") {
                    this.changeFunction.call(this, value);
                }
            }
            if (value) {
                if (groupName !== undefined) {
                    $(":radio:checked[name='" + groupName + "']").parents('.' + className.radio).eq(0).removeClass('checked');
                }
                this.element.checked = true;
                this.$radioWrap.addClass('checked');
            } else {
                this.element.checked = false;
                this.$radioWrap.removeClass('checked');
            }
        },
        change: function (func) {
            this.changeFunction = func;
        },
        disabled: function (boolean) {
            if (boolean) {
                this.disabledRadio();
            } else {
                this.enableRadio();
            }
        },

        //私有方法
        disabledRadio: function () {
            this.$radioWrap.addClass('disabled');
        },
        enableRadio: function () {
            this.$radioWrap.removeClass('disabled');
        }
    })

    //多选
    sForm.extend({
        type: "checkbox",
        init: function (element) {
            var
                _this = this,
                $checkbox = this.$checkbox=$(element),
                text = $checkbox.data('text'),
                $checkboxWrap;
            this.element = element;
            //init data
            $checkbox.data(sDataDefault, element.checked);
            //init html
            text = text === undefined ? '' : text;
            if (!$checkbox.parents('.' + className.checkbox).length) {
                $checkboxWrap = $('<div class="' + className.checkbox + '"><i class="checkbox-icon"></i><span class="checkbox-text">' + text + '</span></div>').insertAfter($checkbox);
                $checkbox.appendTo($checkboxWrap.find('i.checkbox-icon'));
            } else {
                $checkboxWrap = $checkbox.parents('.' + className.checkbox).eq(0);
                if (!$checkboxWrap.find('i').length) { $checkbox.wrap('<i class="checkbox-icon">'); }
                if (!$checkboxWrap.find('.text').length) { $checkboxWrap.append('<span class="checkbox-text">' + text + '</span>'); }
            }
            if (element.checked) {
                $checkboxWrap.addClass('checked');
            }
            if (element.disabled) {
                $checkboxWrap.addClass('disabled');
            }

            this.$checkboxWrap = $checkboxWrap;

            $checkboxWrap.on('click', function () {
                if ($(this).hasClass('checked'))
                    _this.set(false);
                else
                    _this.set(true);
            });

        },
        get: function () {
            return this.element.checked;
        },
        set: function (value) {
            if (this.element.checked != value) {
                if (typeof this.changeFunction == "function") {
                    this.changeFunction.call(this, value);
                }
            }
            if (value) {
                this.element.checked = true;
                this.$checkboxWrap.addClass('checked');
            } else {
                this.element.checked = false;
                this.$checkboxWrap.removeClass('checked');
            }
        },
        change: function (func) {
            this.changeFunction = func;
        }
    })

    //数值增减
    //data [min,max,range,fixed]
    sForm.extend({
        type: "spinner",
        init: function (element) {
            var _this = this,
                $spinner = $(element), $spinnerWrap;
            this.defaultValue=this.currentValue = Number($spinner.val());
            $spinner.data(sDataDefault, this.currentValue);
            if (this.currentValue == "" || isNaN(this.currentValue) || typeof this.currentValue != "number") {
                $spinner.val(0);
                this.currentValue = 0;
            }
            this.$spinner = $spinner;
            this.range = $spinner.data("range")?parseFloat($spinner.data("range")):1;
            this.max = parseFloat($spinner.data("max"));
            this.min = parseFloat($spinner.data("min"));
            this.fixed = $spinner.data("fixed");

            //设置乘数
            this._setMultiplier();

            //init html
            if (!$spinner.parents("." + className.spinner).length) {
                var html = ' <div class="'+className.spinner+'">' +
                                    '<div class="'+className.spinner+'-num"></div>' +
                                    '<div class="' + className.spinner + '-button">' +
                                        '<i class="' + className.spinner + '-up"><i class="' + className.spinner + '-i"></i></i>' +
                                        '<i class="' + className.spinner + '-down"><i class="' + className.spinner + '-i"></i></i>' +
                                    '</div>' +
                                '</div>';
                $spinnerWrap = $(html).insertAfter($spinner);
                $spinner.appendTo($spinnerWrap.find("." + className.spinner + "-num"));
            } else {
                var buttons = '<div class="' + className.spinner + '-button">' +
                                        '<i class="' + className.spinner + '-up"><i class="' + className.spinner + '-i"></i></i>' +
                                        '<i class="' + className.spinner + '-down"><i class="' + className.spinner + '-i"></i></i>' +
                                    '</div>';
                $spinnerWrap = $spinner.parents("." + className.spinner);
                $spinner.wrap('<div class="' + className.spinner + '-num"></div>');
                $spinnerWrap.find('.' + className.spinner + '-num').after(buttons);
            }
            this.$spinnerWrap = $spinnerWrap;

            //event
            //add
            this.$btnAdd=$spinnerWrap.find('.' + className.spinner + '-up').on("click", function (e) {
                if ($(this).hasClass("disabled")) return;
                _this.add(_this.range);
            });
            //minus
            this.$btnMinus = $spinnerWrap.find('.' + className.spinner + '-down').on("click", function (e) {
                if ($(this).hasClass("disabled")) return;
                _this.minus(_this.range);
            });
            _this.$spinner.on("keydown", function (e) {
                if (e.keyCode == sForm.keyMap.up) {
                    _this.add();
                    e.stopPropagation();
                    e.preventDefault();
                } else if (e.keyCode == sForm.keyMap.down) {
                    _this.minus();
                    e.stopPropagation();
                    e.preventDefault();
                }
                
            })
            this.$spinner.blur(function () {
                _this.set($spinner.val());
            });
            this.set(this.currentValue, true)
        },
        get: function () {
            return Number(this.$spinner.val());
        },
        set: function (num, isChange) {
            if (!isChange && this.currentValue == num) return;
            var nNum = Number(num);
            if (isNaN(nNum)) {
                nNum = this.currentValue;
                if (typeof this.errorFunction == "function") {
                    this.errorFunction.call(this, "data");
                }
            } else {
                if (this.min || this.min == 0) {
                    if (this.min > nNum) {
                        nNum = this.min;
                        if (typeof this.errorFunction == "function") {
                            this.errorFunction.call(this, "min");
                        }
                    }
                }
                if (this.max || this.max == 0) {
                    if (this.max < nNum) {
                        nNum = this.max;
                        if (typeof this.errorFunction == "function") {
                            this.errorFunction.call(this, "max");
                        }
                    }
                }
            }
            var result = this.fixed ? nNum.toFixed(this.fixed) : nNum;
            this._setMaxStatus(result == this.max);
            this._setMinStatus(result == this.min);
            this.$spinner.val(result);
            if (this.currentValue != result && typeof this.changeFunction == "function") {
                this.changeFunction.call(this, Number(result));
            }
            this.currentValue = Number(result);
        },
        add: function (num) {
            var n = num === undefined ? this.range : num;
            this.set((this.get() * this.multiplier + n * this.multiplier) / this.multiplier);/*fixed 0.1+0.2*/
        },
        minus: function (num) {
            var n = num === undefined ? this.range : num;
            var multiplier = Math.pow(10, this.decimal);
            this.set((this.get() * this.multiplier - n * this.multiplier) / this.multiplier);/*fixed -0.1*/
        },
        change: function (func) {
            this.changeFunction=func;
        },
        error: function (func) {
            this.errorFunction = func;
        },
        setMax: function (value) {
            this.max = value;
            this.set(this.get(), true);
        },
        setMin: function (value) {
            this.min = value;
            this.set(this.get(), true);
        },
        setRange: function (num) {
            this.range = num;
            this._setMultiplier();
        },
        _setMaxStatus: function (bool) {
            if (bool) {
                this.$btnAdd.addClass("disabled");
            } else {
                this.$btnAdd.removeClass("disabled");
            }
        },
        _setMinStatus: function (bool) {
            if (bool) {
                this.$btnMinus.addClass("disabled");
            } else {
                this.$btnMinus.removeClass("disabled");
            }
        },
        _getDecimalNum: function (num) {
            var s = num + "";
            var index = s.lastIndexOf(".");
            return index == -1 ? 0 : s.length - index - 1;
        },
        _setMultiplier: function () {//设置乘数，相加减时先转成整数再转成小数
            var decimalD = this._getDecimalNum(this.defaultValue);
            var decimalR = this._getDecimalNum(this.range);
            var decimal = Math.max(decimalD, decimalR);
            this.multiplier = Math.pow(10, decimal);
        }
    })

    //下拉框
    //this.element select元素
    //this.$select select（jquery）元素
    //this.$selectWrap select的外层容器
    //this.$dropList select的下拉容器
    //this.$selectedText 显示select当前值的容器
    //this.isDisabled 保存select是否可用
    //data [{"value":"","text":"","select":""}]
    //config {"disable":"","speed":""}
    sForm.extend({
        type: "select",
        init: function (element, sFormData) {
            var
                _this = this,
                $select = this.$select = $(element),
                $selectWrap;
            this.element = element;
            var selectList = "", optionTextList = "", selectedText;

            //init data
            this.config = {};

            this.currentValue = this.get();
            $select.data(sDataDefault, this.currentValue)
            
            this.dropSpeed = 150;

            //init html
            $select.find("option").each(function () {
                var value = this.value == "" ? this.innerHTML : this.value;
                if (!$(this).data("offlist")) {
                    if (this.selected) {
                        selectList += '<li class="selected" data-value="' + value + '">' + this.innerHTML + '</li>';
                        $select.data(sDataDefault, value);
                        selectedText = this.innerHTML;
                    } else {
                        selectList += '<li data-value="' + value + '">' + this.innerHTML + '</li>';
                    }
                } else if (this.selected) {
                    selectedText = this.innerHTML;
                }
                optionTextList+='<span data-text="'+this.innerHTML+'">'+this.innerHTML+'</span>';
            })

            if (!$select.parents('.' + className.select).length) {
                $selectWrap = $('<div class="' + className.select + '"><div class="selected-inner"><div class="selected-text"><span class="text">' + selectedText + '</span>' + optionTextList + '</div><span class="drop-arrow"><i  class="it"></i><i class="ib"></i></span><div class="drop-list"><ul>' + selectList + '</ul></div></div></div>').insertAfter($select);
                $select.appendTo($selectWrap);
            } else {
                $selectWrap = $select.parents('.' + className.select).eq(0);
                $('<div class="selected-inner"><div class="selected-text"><span class="text">' + selectedText + '</span>' + optionTextList + '</div><span class="drop-arrow"><i  class="it"></i><i class="ib"></i></span><div class="drop-list"><ul>' + selectList + '</ul></div></div>').insertAfter($select);
            }

            if (element.disabled) {
                $selectWrap.addClass('disabled');
                this.isDisabled=true;
            }else{
                this.isDisabled=false;
            }
            
            this.$selectWrap = $selectWrap;
            this.$dropList = $selectWrap.find('.drop-list');
            this.$selectedText = $selectWrap.find('.text');
            this._resizeScroll();
            
            //bind event
            $selectWrap.on('click', function (e) {
                if(!_this.isDisabled){
                    if ($(this).hasClass("show-droplist")) {
                        _this.hideDropList();
                    }else{
                        var $showingSelect=$('.show-droplist select');
                        if($showingSelect.length){
                            sForm($showingSelect).hideDropList();
                        }
                        _this.showDropList();
                    }
                }
                e.stopPropagation();
            });

            $selectWrap.on('click', 'li', function (e) {
                if (!_this.set($(this).data('value'))) {
                    alert("下拉框选择出错：下拉选项值不能相同")
                }
                e.stopPropagation();
            });
        },
        get: function () {
            var select=this.element;
            for(var i=select.options.length;i--;){
                if(select.options[i].selected==true){
                    return select.options[i].value;
                }
            }
        },
        set:function(value){
            var select=this.element;
            var optionInfo = this.getOption(value);
            var $selectLi=$(optionInfo.li);

            this.$selectedText.html($selectLi.html());
            optionInfo.option.selected=true;
            this.$dropList.find('.selected').removeClass('selected');
            this.hideDropList();

            if (this.currentValue != value && typeof this.changeFunction == "function") {
                this.changeFunction.call(this, value);
            }
            this.currentValue = value;
            var $selectedItem, selectedNum=0;
            $.each(this.$dropList.find('li'), function () {
                if ($(this).data("value") == value) {
                    $selectedItem = $(this);
                    selectedNum++;
                }
            })
            if (selectedNum==1) {
                $selectedItem.addClass('selected');
            } else {
                return false;
            }
            
            return true;
        },
        change: function (func) {
            this.changeFunction = func;
        },
        showDropList: function (callback) {

            if (typeof this.showDropHandlerFunc == "function"&&this.showDropHandlerFunc(this.get()) === false) {
                return;
            }

            this.$dropList.css({ "display": "block", "opacity": "0" });
            var _this=this,
                selectWrap = this.$selectWrap[0],
                selectHeight = selectWrap.offsetHeight,
                marginBottom = $(window).height() - getElementTop(selectWrap) - selectHeight + document.body.scrollTop,
                dropHeight = this.$dropList[0].offsetHeight;
            if (marginBottom > dropHeight) {
                //bottom show
                this.showDownDropList(callback);
            } else {
                //top show
                this.showTopDropList(callback);
            }
            this.dropListIsShow = true;
            $(document).one('click', function () {
                if (_this.dropListIsShow) {
                    _this.hideDropList();
                }
            });
        },
        showDropHandler: function (func) {
            this.showDropHandlerFunc = func;
        },
        hideDropList: function () {
            if (typeof this.hideDropHandlerFunc == "function"&&this.hideDropHandlerFunc(this.get()) === false) {
                return;
            }
            this.$selectWrap.removeClass("show-droplist");
            this.$dropList.hide();
            this.dropListIsShow = false;
        },
        hideDropHandler: function (func) {
            this.hideDropHandlerFunc = func;
        },
        showDownDropList : function (callback) {
            var _this=this;
            this.$selectWrap.addClass("show-droplist");
            this.$dropList.data('jsp').scrollToY(0);
            this.$dropList.css("top", this.$selectWrap[0].offsetHeight - 10 + 'px').stop().animate({ "top": this.$selectWrap[0].offsetHeight + "px", "opacity": "1" }, this.dropSpeed, function () {
                if (typeof callback == "function") {
                    callback.call(_this);
                }
            });
        },
        showTopDropList: function (callback) {
            var _this=this;
            this.$selectWrap.addClass("show-droplist");
            this.$dropList.data('jsp').scrollToY(0);
            this.$dropList.css("top", -this.$dropList[0].offsetHeight + 10 + 'px').stop().animate({ "top": -this.$dropList[0].offsetHeight - (this.$selectWrap[0].offsetHeight-this.$selectWrap.height()) + "px", "opacity": "1" }, this.dropSpeed, function () {
                if (typeof callback == "function") {
                    callback.call(_this);
                }
            });
        },
        setDropListHeight: function (height) {
            if(height!==undefined){
                this.$dropList.css("height", height);
                this._resizeScroll();
            }else{
                var _this=this;
                this._optionDropList(function(){
                    this.height(this.find('ul').outerHeight(true));
                    _this._resizeScroll();
                });
            }
        },
        addItem:function(items){//可以是数组或者对象[{value:"",text:"",index:1,selected:false}]，value和text其中一项必填，其他可选
            var _this=this,addLi=[],addOption=[],sortIndex=[],sortIndexMap={},sortResult=[],addItems,selectedIndex;
            if(items.length){
                addItems=items;
            } else {
                addItems=[];
                addItems.push(items);
            }

            //根据index排序
            $.each(items,function(i,n){
                if(n.index){
                    sortIndex.push(n.index);
                    sortIndexMap[n.index]=i;
                }
                if(n.selected){
                    selectedIndex=i;
                }
            })
            
            if(sortIndex.length){
                sortResult=quickSort(sortIndex);
            }

            //添加结构
            $.each(addItems,function(i,item){
                if(item.value===undefined){
                    if(item.text===undefined){
                        alert("参数不正确");
                        return;
                    }
                    item.value=item.text;
                }
                if(item.text===undefined){
                    if(item.value===undefined){
                        alert("参数不正确");
                        return;
                    }
                    item.text=item.value;
                }
                var $addOption=$('<option value="'+item.value+'">'+item.text+'</option>').appendTo(_this.$select);
                var $addLi=$('<li data-value="'+item.value+'">'+item.text+'</li>').appendTo(_this.$dropList.find('ul'));
                _this.$selectedText.after($('<span data-text="'+item.text+'">'+item.text+'</span>'));
                addOption.push($addOption[0]);
                addLi.push($addLi[0]);
            });

            //处理顺序和是否选中
            var maxIndex = _this.$dropList.find('li').length - 1;
            $.each(sortResult,function(i,n){
                var mapIndex=sortIndexMap[n];
                var domOption=addOption[mapIndex];
                var domLi=addLi[mapIndex];
                var eqNum=n-2<0?0:n-2;
                var method=n==1?"before":"after";

                if(eqNum>maxIndex){eqNum=maxIndex;}
                _this.$select.find('option').eq(eqNum)[method](domOption);
                _this.$dropList.find('li').eq(eqNum)[method](domLi);
            });
            if(selectedIndex!==undefined){
                var $selectedLi=$(addLi[selectedIndex]);
                _this.set($selectedLi.data("value"));
            }
            
            _this.setDropListHeight();
            return {addLi:addLi,addOption:addOption}
        },
        deleteItem:function(value){
            var _this=this;
            eachArg(value,del);
            this._resizeScroll();
            function del(val){
                var $list;
                $.each(_this.$dropList.find('li'), function () {
                    if ($(this).data("value") == val) {
                        $list = $(this);
                        return;
                    }
                })
                var optionInfo=_this.getOption(val);
                $(optionInfo.option).remove();
                $(optionInfo.li).remove();
                if($(optionInfo.li).hasClass("selected")){
                    //如果删除项是被选中的元素，将第一个元素选中
                    _this.set(_this.$dropList.find('li').eq(0).data("value"));
                }
                _this.$selectedText.siblings('[data-text='+$(optionInfo.li).text()+']').remove();
                _this.setDropListHeight();
            }
        },
        deleteAll:function(){
            
        },
        disabled:function(boolean){
            var bool=boolean===undefined?true:boolean;
            if(bool===undefined){
                bool=true;
            }else if(typeof boolean=="string"){
                bool=boolean=="false"?false:true;
            }
            else{
                bool=boolean;
            }
            if(bool){
                this.disabled=true;
                this.$selectWrap.addClass('disabled');
                this.hideDropList();
            }else{
                this.disabled=false;
                this.$selectWrap.removeClass('disabled');
            }
            this.isDisabled=bool;
        },
        getOption:function(word){//先匹配value的值再匹配文本的值
            var $li, option, index;
            $.each(this.$dropList.find('li'), function () {//使用字符串值比较方法 防止word字符串有空格造成 li[data-value=word] 选择器报错
                if ($(this).data("value") == word) {
                    $li = $(this);
                    return;
                }
            });
            if($li.length==0||$li.length>1){
                this.$dropList.find('li').each(function(i,n){
                    if($(this).text()==word){
                        $li=$(this);
                        index=i;
                        return;
                    }
                })
            }else{
                index=$li.index();
            }
            $.each(this.$select.find('option'), function (i, n) {
                var value = n.value==""?$(this).text():n.value;
                if (value == word) {
                    option = this;
                    return;
                }
            });
            return {option:option,li:$li[0],index:index}
        },
        _creatOptionHtml: function (data) {
            var optionHtml = "";
            $.each(data, function (i, n) {
                optionHtml += '<option value="' + n.value + '">' + n.text + '</option>';
            });
            return optionHtml;
        },
        _resizeScroll: function () {
            this._optionDropList(function(){
                this.jScrollPane();
            });
        },
        _optionDropList:function(fun){
            //保证元素display不为none，处理元素，最后还原元素状态
            var $dropList=this.$dropList;
            var display = $dropList.css('display');
            var opacity = $dropList.css('opacity');
            $dropList.css({ "display": "block", "opacity": "0" });
            fun.call($dropList);
            $dropList.css({ "display": display, "opacity": opacity });
        }
    })

    //上传文件
    sForm.extend({
        type:"file",
        init:function(element){
            var
                _this = this,
                $file = this.$file=$(element),
                $fileWrap;
            this.element = element;
            this.currentValue = $file.val();
            $file.data(sDataDefault, this.currentValue);
            //init html

            if ($file.parents("." + className.file)) {
                $fileWrap=$file.parents("." + className.file);
                var fileHtml = '<div class="' + className.file + '-inner"><div class="' + className.file + '-text"></div><div class="' + className.button + '"><i class="' + className.file + '-icon"></i>选择文件</div> </span></div></div>';
                $(fileHtml).insertAfter(this.element)
                $file.appendTo($fileWrap.find('.' + className.button));
            } else {
                $fileWrap = $('<div class="' + className.file + '"><div class="' + className.file + '-inner"><div class="' + className.file + '-text"></div><div class="' + className.button + '"><i class="' + className.file + '-icon"></i>选择文件</div> </span></div></div></div>').insertAfter(this.element)
                $file.appendTo($fileWrap.find('.' + className.button));
            }

            this.$fileWrap=$fileWrap;
            this.$text=$fileWrap.find('.'+className.file+'-text');
            if (element.disabled) {
                this.$fileWrap.addClass("disabled");
            }

            $file.on('change', function () {
                var val=$(this).val();
                if (typeof _this.changeFunction == "function") {
                    if (_this.changeFunction.call(_this, val) != false) {
                        _this.$text.text(val);
                        $file.attr("title", val);
                    } else {
                        _this.$file.val("");
                        _this.$text.text("");
                        $file.attr("title", "");
                    };
                } else {
                    _this.$text.text(val);
                    $file.attr("title", val)
                }
            });
            this.$file.on("mouseenter", function () {
                _this.$fileWrap.addClass("hover");
            }).on("mouseleave", function () {
                _this.$fileWrap.removeClass("hover");
            })

        },
        get: function () {
            return this.$file.val();
        },
        set: function (value) {
            alert("文件上传组件不能设置值");
        },
        change: function (func) {
            this.changeFunction = func;
        },
        disabled: function (bool) {
            var bool = parseBool(bool);
            if (bool) {
                this.$fileWrap.addClass("disabled");
                this.$file.disabled = true;
            } else {
                this.$fileWrap.removeClass("disabled");
                this.$file.disabled = false;
            }
        },
        upload: function (config) {
            this._uploadConfig(config);
            
            if (typeof this.uploadConfig != "object") {
                alert("缺少上传参数，请通过uploadConfig方法进行设置");
            } else {
                this._ajaxFileUpload(this.uploadConfig);
            }
        },
        _uploadConfig: function (config) {
            var fileId = this.$file.attr("id");
            if (!fileId) {
                fileId = "file" + (+new Date());
                this.$file.attr("id", fileId);
            }
            var configObj = $.extend({}, { fileElementId: fileId }, config);
            this.uploadConfig = configObj;
        },
        _ajaxFileUpload: function (s) {
            s = $.extend({}, $.ajaxSettings, s);
            var _this = this;
            var id = new Date().getTime()
            var form = _this._createUploadForm(id, s.fileElementId, (typeof (s.data) == 'undefined' ? false : s.data));
            var io = _this._createUploadIframe(id, s.secureuri);
            var frameId = 'jUploadFrame' + id;
            var formId = 'jUploadForm' + id;
            if (s.global && !$.active++) {
                $.event.trigger("ajaxStart");
            }
            var requestDone = false;
            var xml = {}
            if (s.global)
                $.event.trigger("ajaxSend", [xml, s]);
            var uploadCallback = function (isTimeout) {
                var io = document.getElementById(frameId);
                try {
                    if (io.contentWindow) {
                        xml.responseText = io.contentWindow.document.body ? io.contentWindow.document.body.innerHTML : null;
                        xml.responseXML = io.contentWindow.document.XMLDocument ? io.contentWindow.document.XMLDocument : io.contentWindow.document;
                    } else if (io.contentDocument) {
                        xml.responseText = io.contentDocument.document.body ? io.contentDocument.document.body.innerHTML : null;
                        xml.responseXML = io.contentDocument.document.XMLDocument ? io.contentDocument.document.XMLDocument : io.contentDocument.document;
                    }
                } catch (e) {
                    _this._handleError(s, xml, null, e);
                }
                if (xml || isTimeout == "timeout") {
                    requestDone = true;
                    var status;
                    try {
                        status = isTimeout != "timeout" ? "success" : "error";
                        if (status != "error") {
                            var data = _this.uploadHttpData(xml, s.dataType);
                            if (s.success)
                                s.success(data, status);
                            if (s.global)
                                $.event.trigger("ajaxSuccess", [xml, s]);
                        } else
                            _this._handleError(s, xml, status);
                    } catch (e) {
                        status = "error";
                        _this._handleError(s, xml, status, e);
                    }
                    if (s.global)
                        $.event.trigger("ajaxComplete", [xml, s]);
                    if (s.global && ! --$.active)
                        $.event.trigger("ajaxStop");
                    if (s.complete)
                        s.complete(xml, status);
                    $(io).unbind()
                    setTimeout(function () {
                        try {
                            $(io).remove();
                            $(form).remove();
                        } catch (e) {
                            _this._handleError(s, xml, null, e);
                        }
                    }, 100)
                    xml = null
                }
            }
            if (s.timeout > 0) {
                setTimeout(function () {
                    if (!requestDone) uploadCallback("timeout");
                }, s.timeout);
            }
            try {
                var form = $('#' + formId);
                $(form).attr('action', s.url);
                $(form).attr('method', 'POST');
                $(form).attr('target', frameId);
                if (form.encoding) {
                    $(form).attr('encoding', 'multipart/form-data');
                }
                else {
                    $(form).attr('enctype', 'multipart/form-data');
                }
                $(form).submit();
            } catch (e) {
                _this._handleError(s, xml, null, e);
            }
            $('#' + frameId).load(uploadCallback);
            return { abort: function () { } };
        },
        _uploadHttpData: function (r, type) {
            var data = !type;
            data = type == "xml" || data ? r.responseXML : r.responseText;
            if (type == "script")
                $.globalEval(data);
            if (type == "json")
                eval("data = " + data);
            if (type == "html")
                $("<div>").html(data).evalScripts();
            return data;
        },
        _createUploadIframe: function (id, uri) {
            var frameId = 'jUploadFrame' + id;
            var iframeHtml = '<iframe id="' + frameId + '" name="' + frameId + '" style="position:absolute; top:-9999px; left:-9999px"';
            if (window.ActiveXObject) {
                if (typeof uri == 'boolean') {
                    iframeHtml += ' src="' + 'javascript:false' + '"';
                }
                else if (typeof uri == 'string') {
                    iframeHtml += ' src="' + uri + '"';
                }
            }
            iframeHtml += ' />';
            $(iframeHtml).appendTo(document.body);
            return $('#' + frameId).get(0);
        },
        _createUploadForm: function (id, fileElementId, data) {
            var formId = 'jUploadForm' + id;
            var fileId = 'jUploadFile' + id;
            var form = $('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');
            if (data) {
                for (var i in data) {
                    $('<input type="hidden" name="' + i + '" value="' + data[i] + '" />').appendTo(form);
                }
            }
            var oldElement = $('#' + fileElementId);
            var newElement = $(oldElement).clone();
            $(oldElement).attr('id', fileId).before(newElement);
            $(oldElement).appendTo(form);
            $(form).css({ 'position': 'absolute', 'top': '-1200px', 'left': '-1200px' }).appendTo('body');
            return form;
        },
        _handleError:function(s, xhr, status, e) {
            if (s.error) {
                s.error.call(s.context || s, xhr, status, e);
            }
            if (s.global) {
                (s.context ? jQuery(s.context) : jQuery.event).trigger("ajaxError", [xhr, s, e]);
            }
        }
    })

    //地址选择
    sForm.extend({
        type: "adress",
        init: function (element) {

        }
    })

    //按钮
    sForm.extend({
        type: "button",
        init: function (element) {

        }
    })

    //sForm End

    //获取组件类型
    function getFormType(element) {
        var tag = element.tagName.toString().toLowerCase(),type;
        if (tag == "input") {
            type = element.getAttribute("type");
        } else {
            //var formEle = {
            //    "input": true,
            //    "button": true,
            //    "select":true
            //}
            //if (formEle[tag]) {
            //    type = tag;
            //} 
            type = tag;
        }
        return type;
    }

    //获取元素整体位置
    function getElementLeft(element) {
        var actualLeft = element.offsetLeft;
        var current = element.offsetParent;
        while (current !== null) {
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        return actualLeft;
    }
    function getElementTop(element) {
        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        return actualTop;
    }
    function eachArg(arg,callFunction){
        if(Object.prototype.toString.call(arg)=="[object Array]"){
            $.each(arg,function(i,n){
                callFunction(n);
            })
        }else{
            callFunction(arg);
        }
    }
    function quickSort(array){  
        var i = 0;  
        var j = array.length - 1;  
        var Sort = function(i, j){   
            if(i == j ){ return };
            var key = array[i];  
            var tempi = i; 
            var tempj = j;         
            while(j > i){  
                if(array[j] >= key){  
                    j--;  
                }else{  
                    array[i] = array[j]  
                    while(j > ++i){  
                        if(array[i] > key){  
                            array[j] = array[i];  
                            break;  
                        }  
                    }  
                }  
            } 
            if(tempi == i){  
                Sort(++i, tempj);  
                return ;  
            } 
            array[i] = key;  
            Sort(tempi, i);  
            Sort(j, tempj);  
        }  
        Sort(i, j);
        return array;  
    }

    function parseBool(boolean) {
        var bool = boolean === undefined ? true : boolean;
        if (bool === undefined) {
            bool = true;
        } else if (typeof boolean == "string") {
            bool = boolean == "false" ? false : true;
        }
        else {
            bool = boolean;
        }
        return bool;
    }

    //键位值
    sForm.keyMap = {
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        'enter': 13
    }

    //配置属性
    sForm.config = {
        "9grid": false,
        "dropListMaxHeight":"240px"
    }

    window.sForm = sForm;
    return sForm;
}))

