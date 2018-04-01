/*!
 * jquery.depend v1.0.0
 * https://github.com/liuzhanpeng/jquery.depend
 *
 * Copyright (c) 2017-2018 Zhanpeng Liu <liuzhanpeng@gmail.com>
 * Released under the MIT license
 */

;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function($) {

    /**
     * 单条依赖规则处理器
     *
     * @param {Function} handler 依赖规则对应的处理函数
     * @param {Object} $selector 依赖元素对象
     * @param {string|Array} param 处理函数参数
     */
    var RuleHandler = function(handler, $selector, param) {
        this.handler = handler;
        this.$selector = $selector;
        this.param = param;
    }

    RuleHandler.prototype = {
        
        /**
         * 执行处理函数
         *
         * @return {boolean} 返回执行结果
         */
        exec: function() {
            return this.handler(this.$selector, this.param);
        },

        /**
         * 调用内置规则
         *
         * @param {string} rule 规则名
         * @param {string|Array} param 参数
         */
        test: function(rule, param) {
            if (!Depend.builtinRules.hasOwnProperty(rule)) {
                $.error('无效依赖规则:' + rule);
            }
            return Depend.builtinRules[rule](this.$selector, param);
        }
    };

    /**
     * 依赖规则检查器
     */
    var RuleInspector = function() {
        this.ruleHandlers = []; 
    };

    RuleInspector.prototype = {
        
        /**
        * 添加一个依赖规则处理器
        *
        * @param {Function} handler 依赖规则对应的处理函数
        * @param {Object} $selector 依赖元素对象
        * @param {string|Array} param 处理函数参数
        * @return {void}
        */
        add: function(handler, $selector, param) {
            this.ruleHandlers.push(new RuleHandler(handler, $selector, param)); 
        },

        /**
        * 检查当前检查器内部的所有依赖规则
        * 因为只有"and"关系，所以必须所有处理器都返回true才通过检查
        *
        * @return {boolean}
        */
        check: function() {
            for (var i in this.ruleHandlers) {
                if (this.ruleHandlers[i].exec() !== true) {
                    return false;
                }
            } 

            return true;
        }

    };

    /**
     * 依赖规则检查器组
     *
     * @todo 当前每组规则检查器的关系只有"or", 但已覆盖绝大多数场景, 以后有时间再处理多关系
     */
    var RuleInspectorGroup = function() {
        this.ruleInspectors = []; 
    };

    RuleInspectorGroup.prototype = {
    
        /**
         * 添加一个依赖规则检查器
         *
         * @return {void}
         */
        add: function(ruleInspector) {
            this.ruleInspectors.push(ruleInspector); 
        },

        /**
        * 检查多组依赖规则检查器是否通过检查
        * 因为只有"or"关系，只有一组成功就表示通过检查
        */
        check: function() {
            for (var i in this.ruleInspectors) {
                if (this.ruleInspectors[i].check() === true) {
                    return true;
                }
            }

            return false;
        }

    };

    /**
     * 依赖有关系处理
     *
     * @param {Object} $element 当前元素对象
     * @param {Object} dependants 依赖元素配置
     * @param {Object} options 当前元素配置
     */
    var Depend = function($element, dependants, options) {

        this.$element = $element;
        this.options = $.extend({}, Depend.options, options);
        this.ruleInspectorGroup = new RuleInspectorGroup();
        this.eventStore = [];

        this.options.onInit($element);

        Depend.handleDependants.call(this, dependants);

        return this;
    };

    /**
     * 处理依赖元素
     *
     * @param {Object} dependants 依赖元素配置
     */
    Depend.handleDependants = function(dependants) {
        var $this = this;

        var ruleInspector = new RuleInspector();

        $.each(dependants, function(selector, dependant) {
            var $selector = $(selector);
            if (!$selector.length) {
                $.error('找不到依赖元素:' + selector);
            }

            dependant = $.extend({}, {
                event: $this.options.event,
                rule: {}
            }, dependant);

            // 获取所有依赖规则并保存到规则检查器中
            $.each(dependant.rule, function(k, v) {
                if (Depend.builtinRules.hasOwnProperty(k)) {
                    ruleInspector.add(Depend.builtinRules[k], $selector, v);
                } else if (typeof v === 'function') {
                    ruleInspector.add(v, $selector, null);
                } else {
                    $.error('无效依赖规则:' + k);
                }
            });

            // 绑定所有依赖元素的监听事件
            if (!$.isArray(dependant.event)) {
                $.error('依赖元素<' + selector + '>event选项无效');
            }
            $.each(dependant.event, function(i, event) {
                $this.eventStore.push({
                    selector: $selector, 
                    event: event
                });
                $selector.on(event, function(e) {
                    var result = $this.ruleInspectorGroup.check();
                    if ($this.options.debug) {
                        console.log('元素:<' + $this.$element.selector + '>;依赖元素:<' + selector + '>;事件:' + e.type + ';检查结果:' + result);
                    }

                    if (result) {
                        $this.options.onPass($this.$element);
                    } else {
                        $this.options.onNotPass($this.$element);
                    }
                });
            });
        });

        this.ruleInspectorGroup.add(ruleInspector);
    };

    Depend.prototype = {
    
        /**
         * 增加关系“或”的依赖规则组
         *
         * @param {Object} dependants 依赖元素配置
         */
        or: function(dependants) {
            
            Depend.handleDependants.call(this, dependants);

            return this;
        },

        /**
         * 手动触发依赖元素的绑定事件
         */
        exec: function() {
            $.each(this.eventStore, function(i, eventObj) {
                eventObj.selector.trigger(eventObj.event)
            });
        }
    };

    /**
     * 元素全局配置
     */
    Depend.options = {

        /**
         * 是否调式模式
         */
        debug: false, 

        /**
         * 依赖元素默认触发事件
         */
        event: ['change'],

        /**
         * 初始化事件
         *
         * @param {Object} $element 当前元素对象
         */
        onInit: function($element) {
            $element.prop('disabled', true);
        },

        /**
         * 依赖规则检查通过事件
         *
         * @param {Object} $element 当前元素对象
         */
        onPass: function($element) {
            $element.removeProp('disabled'); 
        },

        /**
         * 依赖规则检查不通过事件
         */
        onNotPass: function($element) {
            $element.prop('disabled', true);
        }
    
    };

    /**
     * 获取元素的值
     *
     * @return {string|Array}
     */
    Depend.getElementValue = function($element) {
        if ($element.is('input') && $element.attr('type') === 'radio') {
            return $element.filter(':checked').val();
        } else if ($element.is('input') && $element.attr('type') === 'checkbox') {
            var vals = [];
            $element.filter(':checked').each(function(i, item) {
                vals.push($(item).val()); 
            });
            return vals;
        } else { 
            // select元素可能返回数组;
            return $element.val();
        }
    };

    /**
     * 内置规则
     */
    Depend.builtinRules = {

        /**
         * 判断元素的值是否和给定参数相等
         * 
         * @param {Object} $selector 元素对象
         * @param {string|Array} param 比较值，支持string和Array
         * @return {boolean}
         */
        equal: function($selector, param) {
            var val = Depend.getElementValue($selector);
            if (typeof val !== typeof param) {
                return false;
            }
            if ($.isArray(val) && $.isArray(param)) {
                return val.sort().toString() === param.sort().toString();
            } else {
                return val === param;
            }
        },

        /**
         * 判断元素的值是否与给定参数不相等
         *
         * @param {Object} $selector 元素对象
         * @param {string|Array} param 比较值，支持string和Array
         * @return {boolean}
         */
        notEqual: function($selector, param) {
            return !this.equal($selector, param); 
        },

        /**
         * 判断元素的值是否和给定数组参数内的某值相等
         * @param {Object} $selector 元素对象
         * @param {Array} param 参数 
         * @return {boolean}
         */
        any: function($selector, param) {
            if (!$.isArray(param)) {
                $.error('any规则参数必须为数组');
            }
            var val = Depend.getElementValue($selector);
            if ($.isArray(val) && val.length === 1) {
                val = val[0]; 
            }
            return $.inArray(val, param) !== -1;
        }

    };
    
    /**
     * 元素操作依赖于其它元素
     *
     * @param {Object} dependants 元素依赖配置
     * @param {Object} options 当前元素配置
     */
    $.fn.depend = function(dependants, options) {
        
        return new Depend(this, dependants, options);
    }

    $.depend = {
        
        /**
         * 元素全局配置
         */
        config: function(options) {
            Depend.options = $.extend({}, Depend.options, options);
        },

        /**
         * 添加全局自定义规则
         */
        addRule: function(name, handler) {
            if (typeof handler !== 'function') {
                $.error('无效自定义规则:' + name);
            }
            Depend.builtinRules[name] = handler; 
        },

        /**
         * 添加全局自定义规则
         */
        addRules: function(rules) {
            var $this = this;
            $.each(rules, function(name, handler) {
                $this.addRule(name, handler); 
            });
        }

    };

}));
