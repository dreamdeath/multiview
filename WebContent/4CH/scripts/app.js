'use strict';

/**
 * [BaseObject description]
 * @type {Object}
 */
var Class = {
    create: function create() {
       var instance = Object.create(this);
       instance._construct.apply(instance, arguments);
       return instance;
    },
 
    extend: function extend(properties, propertyDescriptors) {
        propertyDescriptors = propertyDescriptors || {};
 
        if(properties){
            var simpleProperties = Object.getOwnPropertyNames(properties);
            for (var i = 0, len = simpleProperties.length; i < len; i += 1) {
                var propertyName = simpleProperties[i];
                if(propertyDescriptors.hasOwnProperty(propertyName)) {
                    continue;
                }
 
                propertyDescriptors[propertyName] =
                    Object.getOwnPropertyDescriptor(properties, propertyName);
            }
        }
 
        return Object.create(this, propertyDescriptors);
    },
 
    _construct: function _construct() {},
 
    _super: function _super(definedOn, methodName, args) {
        if (typeof methodName !== "string") {
            args = methodName;
            methodName = '_construct';
        }
 
        return Object.getPrototypeOf(definedOn)[methodName].apply(this, args);
    }
};

/**
 * 
 * @class App
 * @static
 * 
 */
var App = App || {};

/**
 *
 * 클래스를 정의한다.
 *
 * @exports App
 * @method define
 * @param  {String} namespace 해당 클래스의 namespace
 * @param  {Function|Object} constructor 생성자 함수 혹은 BaseObject 기반의 정의 객체
 */
Object.defineProperty(App, 'defineClass', {
	value : function (namespace, constructFunction) {
	    var sections = namespace.split('.'),
	        parent = window,
	        i, length, className;

	    if (sections[0] === 'window') {
	        sections.splice(0, 1);
	    }

	    for (i = 0, length = sections.length; i < length; i++) {

	    	if (i === length - 1) {
	    		className = sections[i];
	    		continue;
	    	}

	        if (typeof parent[sections[i]] === 'undefined') {
	    		parent[sections[i]] = {};	
	        }
	        parent = parent[sections[i]];
	    }

	    if (window[className]) {
	    	// throw 'already existed window[name] : ' + className;
	    }

	    // 생성자 Function 이면 직접 생성해 준다. 주로 Singlton Class 를 표현할때 쓰인다.
	    if (constructFunction instanceof Function) {
	    	
	    	constructFunction.prototype.toString = function() {
		    	return className;
		    };

		    constructFunction.prototype.instanceOf = function(str) {
		    	return str === namespace;
		    };

		    parent[className] = new constructFunction();
		    // static 성격을 지니고 있으므로, window 자식 프로퍼티로 등록한다.
		    window[className] = parent[className];
		    
	    } else if (constructFunction instanceof Object) { 

	    	if (!constructFunction.toString) {
	    		constructFunction.toString = function() {
	    			return namespace;
	    		};
	    	}

	    	constructFunction.instanceOf = function(str) {
	    		return str === namespace;
		    };

	    	// 일반 Object 정의인 경우 이렇게 한다. 주로 Component Class 를 표현할 때 쓰인다.
	    	parent[className] = Class.extend(constructFunction);



	    	// static 성격이 아니므로 window 직속 자식으로 등록하지 않는다.
	    	window[className] = parent[className];
	    } else {
	    	throw 'Not supported \'constructFunction\' parameter!';
	    }

	    return parent[className];
	}
});
 
/**
 *
 * BaseObject 기반으로 정의된 클래스를 상속하여 새로운 클래스를 정의한다.
 *
 * @method
 * @param  {String} parentClassNameSpace 부모 클래스의 네임스페이스
 * @param  {String} newClassNameSpace    생성하려는 클래스의 네임스페이스
 * @param  {Object} definition           생성하려는 클래스의 BaseObject 기반 정의 객체
 */
Object.defineProperty(App, 'extendClass', {
	value: function(parentClassNameSpace, newClassNameSpace, definition) {

		// Parameter Validation
		if (arguments.length !== 3) {
			throw 'Arguments\' length should be 3!!!';
		} else if (typeof parentClassNameSpace !== 'string') {
			throw 'Parent Class Namespace should be String!!!';
		} else if (typeof newClassNameSpace !== 'string'){
			throw 'New Class Namespace should be String!!!';
		} else if (!(definition instanceof Object) || definition instanceof Array) {
			throw 'Definition should be plain object!!';
		}

		var parentClass = window, 
			parentClassSections = parentClassNameSpace.split('.'),
			newClassSections = newClassNameSpace.split('.'),
			parentNode = window, 
			newClassName, i, length; 

		// Parent Class Parsing
		if (parentClassSections[0] === 'window') {
	        parentClassSections.splice(0, 1);
	    }

	    for (i = 0, length = parentClassSections.length; i < length; i++) {

	    	if (typeof parentClass[parentClassSections[i]] === 'undefined') {
	    		parentClass[parentClassSections[i]] = {};	
	        }
	        parentClass = parentClass[parentClassSections[i]];
	    }

	    if (Object.keys(parentClass).length === 0) {
	    	throw 'Parent class is not existed!!!';
	    } else if (!(Class.isPrototypeOf(parentClass))) {
	    	throw 'Parent class is not extended Class!!';
	    }

	    // New Class Parsing
	    if (newClassSections[0] === 'window') {
	        newClassSections.splice(0, 1);
	    }

	    for (i = 0, length = newClassSections.length; i < length; i++) {

	    	if (i === length - 1) {
	    		newClassName = newClassSections[i];
	    		continue;
	    	}

	        if (typeof parentNode[newClassSections[i]] === 'undefined') {
	    		parentNode[newClassSections[i]] = {};	
	        }
	        parentNode = parentNode[newClassSections[i]];
	    }

	    parentNode[newClassName] = parentClass.extend(definition);

	    parentNode[newClassName].instanceOf = function(str) {
	    		return str === newClassNameSpace || str === parentClassNameSpace;
		    };

	    window[newClassName] = parentNode[newClassName];

	    return parentNode[newClassName];
	}
});







'use strict';
App.defineClass('App.commons.EventBus', function EventBus() {
    var me = this,
        messages = {};
        
    me.__defineGetter__('messages', function() {
        return messages;
    });
    /**
     * 이벤트를 등록.
     * @param  {Object}   [required] instance 이벤트를 발생시키는 주체
     * @param  {String}   [required] name     이벤트 이름
     * @param  {Function} [required] callback 이벤트시 발생시키는 메소드
     * @param  {Number}   [optional] priority 이벤트 발생 우선 순위, prirority 가 생략되고 condition 이 올 수도 있다.
     * @param  {Function} [optional] condition 이벤트 발생 조건
     */
    me.register = function(instance, name, callback, priority, condition) {

        if (messages[name] === undefined) {
            messages[name] = [];
        }

        if (arguments.length === 1) {
            messages[name].push({
                instance: instance.instance,
                callback: instance.callback,
                priority: typeof instance.priority === 'number' ? priority : 998,
                condition: instance.condition
            });
        } else {
            messages[name].push({
                instance: instance,
                callback: callback,
                priority: typeof priority === 'number' ? priority : 998,
                condition: typeof priority === 'function' ? priority : condition
            });    
        }
    };
    /**
     * 이벤트를 발생.
     * 이벤트명이 존재하지 않는 경우 아무것도 발생하지 않는다.
     * 임시로 이벤트 발생을 중단된 경우에도 발생하지 않는다.
     * @param  {String} name 등록된 이벤트명
     */
    me.fire = function(name) {
        var events = messages[name],
            args = [],
            i, length;
        // 첫번째 파라미터인 name 을 제거한 나머지를 표현한다.
        for (i = 0, length = arguments.length; i < length; i++) {
            if (i !== 0) {
                args.push(arguments[i]);
            }
        }
        if (events) {
            // priority 우선 순위에 맞추어 재정렬한다.
            events.sort(function(beforeObject, afterObject) {
                return beforeObject.priority - afterObject.priority;
            });
            for (i = 0, length = events.length; i < length; i++) {


                if (events[i].condition instanceof Function && events[i].condition.apply(events[i].instance, args) !== true) {
                    continue;
                }

                if (events[i].callback.apply(events[i].instance, args) === false) {
                	// Event Listener 메소드가 'false' 를 리턴하면 해당 이벤트는 종료된다.
                	// 테스트 성격, 디버그 성격...기타 등등의 목적이다.
                	return;
                };
            }
        }
    };
    return me;
});
'use strict';
App.defineClass('App.commons.Timer', function Timer() {
    /**
     * @config debug
     * @type {Boolean}
     */
    var debug = true,
        times = {},
        start = function(name) {
            if (!debug || times[name]) {
                return;
            }
            times[name] = {
                start: window.performance.now()
            };
        },
        end = function(name) {
            if (!debug || times[name].end) {
                return;
            }
            times[name].end = window.performance.now();
        },
        report = function() {
            var par, item;
            if (!debug) {
                return;
            }
            for (par in times) {
                item = times[par];
                if (item.end && item.start) {
                    item.dur = item.end - item.start;
                    console.log(par + ' : ' + item.dur);
                }
            }
        },
        execute = function(instance, executeFunction, args) {
            var startTime, endTime;
            startTime = window.performance.now();
            executeFunction.apply(instance, args);
            endTime = window.performance.now();
            console.log(endTime - startTime);
        },
        reset = function() {
            times = [];
        };
    /**
     * window.performance polly fill
     */
    (function() {
        if (typeof window.performance === 'undefined') {
            window.performance = {};
        }
        if (!window.performance.now) {
            var nowOffset = Date.now();
            if (window.performance.timing && window.performance.timing.navigationStart) {
                nowOffset = window.performance.timing.navigationStart;
            }
            window.performance.now = function now() {
                return Date.now() - nowOffset;
            };
        }
    })();
    return {
        start: start,
        end: end,
        report: report,
        reset: reset,
        execute: execute
    };
});
'use strict';
App.defineClass('App.commons.Utils', function Utils() {
    var me = this;

    me.trim = function(value) {
        if (typeof value !== 'string' || !value) {
            return value;
        }

        return value.trim();
    };

    me.convertKeyCodeToNumber = function(keyCode) {
        if (keyCode < 48 || keyCode > 57) {
            return NaN;
        }

        return keyCode - 48;
    };

    me.change = function(array, target1Index, target2Index) {
        var temp = {};

        for (var i = 0, length = array.length; i < length; i++) {
            temp[i] = array[i];
        }

        var target1Object = temp[target1Index];
        var target2Object = temp[target2Index];

        temp[target2Index] = target1Object;
        temp[target1Index] = target2Object;

        for (var par in temp) {
            array[par] = temp[par];
        }
    };

    me.clone = function(obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null === obj || 'object' !== typeof obj) {
            return obj;
        }

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {

            copy = [];

            for (var i = 0, length = obj.length; i < length; i++) {
                copy.push(me.clone(obj[i]));
            }


            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = me.clone(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error('Unable to copy obj! Its type isn\'t supported.');
    };

    me.generateUUID = function() {
        var s4 = function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    me.toBoolean = function(obj) {
        if (typeof obj === 'undefined') {
            return false;
        }
        if (obj === 'undefined') {
            return false;
        }
        if (obj === 'true') {
            return true;
        }
        if (obj === 'false') {
            return false;
        }
        return Boolean(obj);
    };
    me.toNumber = function(value) {
        if (value === 'true' || value === 'false') {
            return NaN;
        }
        return Number(value);
    };
    me.fillZero = function(value, length) {
        var result = '',
            valueStr = value.toString(),
            i;
        if (valueStr.length < length) {
            for (i = 0; i < length - valueStr.length; i++) {
                result += '0';
            }
        }
        return result + valueStr;
    };
    /**
     * Collection 형식의 Object 인지를 반환한다.
     * 판단의 기준은 단순히 length 를 가지고 있느냐 이고, NodeList 에 대한 판단을 위해 만들었다.
     * @param  {Object}  target
     * @return {Boolean} 'length' property 를 가지고 있으면 true, 없으면 false
     */
    me.isAbstractArrayList = function(target) {
        if (target) {
            return target.hasOwnProperty('length');
        }
        return false;
    };

    me.toArray = function(object, filter) {
        var result = _.values(object);
        if (!filter) {
            return result.filter(function(obj) {
                return typeof obj !== 'function';
            });
        }

        return result.filter(filter);
    };

    me.convertXmlToJson = function(xmlString, root) {
        var xml = (new DOMParser()).parseFromString(xmlString, 'text/xml');
        var X = {
            toObj: function(xml) {
                var self = this,
                    o = {};
                if (xml.nodeType === 1) { // element node ..
                    if (xml.attributes.length) { // element with attributes ..
                        for (var i = 0; i < xml.attributes.length; i++) {
                            o[xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || '').toString();
                        }
                    }
                    if (xml.firstChild) { // element has child nodes ..
                        var textChild = 0,
                            cdataChild = 0,
                            hasElementChild = false;
                        for (var n = xml.firstChild; n; n = n.nextSibling) {
                            if (n.nodeType === 1) {
                                hasElementChild = true;
                            } else if (n.nodeType === 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                                textChild++; // non-whitespace text
                            } else if (n.nodeType === 4) {
                                cdataChild++; // cdata section node
                            }
                        }
                        if (hasElementChild) {
                            if (textChild < 2 && cdataChild < 2) { // structured
                                // element
                                // with
                                // evtl. a
                                // single
                                // text
                                // or/and
                                // cdata
                                // node ..
                                self.removeWhite(xml);
                                for (n = xml.firstChild; n; n = n.nextSibling) {
                                    if (n.nodeType === 3) { // text node
                                        o['value'] = self.self.cape(n.nodeValue);
                                    } else if (n.nodeType === 4) { // cdata node
                                        o['value'] = self.escape(n.nodeValue);
                                    } else if (o[n.nodeName]) { // multiple
                                        // occurence of
                                        // element ..
                                        if (o[n.nodeName] instanceof Array) {
                                            o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                        } else {
                                            o[n.nodeName] = [o[n.nodeName],
                                                self.toObj(n)
                                            ];
                                        }
                                    } else {
                                        // first occurence of element..
                                        o[n.nodeName] = self.toObj(n);
                                    }
                                }
                            } else { // mixed content
                                if (!xml.attributes.length) {
                                    o = self.escape(self.innerXml(xml));
                                } else {
                                    o['value'] = self.escape(self.innerXml(xml));
                                }
                            }
                        } else if (textChild) { // pure text
                            if (!xml.attributes.length) {
                                o = self.escape(self.innerXml(xml));
                            } else {
                                o['value'] = self.escape(self.innerXml(xml));
                            }
                        } else if (cdataChild) { // cdata
                            if (cdataChild > 1) {
                                o = self.escape(self.innerXml(xml));
                            } else {
                                for (n = xml.firstChild; n; n = n.nextSibling) {
                                    o['value'] = self.escape(n.nodeValue);
                                }
                            }
                        }
                    }
                    if (!xml.attributes.length && !xml.firstChild) {
                        o = null;
                    }

                } else if (xml.nodeType === 9) { // document.node
                    o = self.toObj(xml.documentElement);
                } else {
                    console.error('unhandled node type: ' + xml.nodeType);
                }
                return o;
            },
            toJson: function(o, name, ind) {
                var self = this,
                    json = name ? ('\"' + name + '\"') : '';
                if (o instanceof Array) {
                    for (var i = 0, n = o.length; i < n; i++) o[i] = self.toJson(o[i], '', ind + '\t');
                    json += (name ? ':[' : '[') + (o.length > 1 ? ('\n' + ind + '\t' + o.join(',\n' + ind + '\t') + '\n' + ind) : o.join('')) + ']';
                } else if (o === null) {
                    json += (name && ':') + 'null';
                } else if (typeof(o) === 'object') {
                    var arr = [];
                    for (var m in o) {
                        arr[arr.length] = self.toJson(o[m], m, ind + '\t');
                    }
                    json += (name ? ':{' : '{') + (arr.length > 1 ? ('\n' + ind + '\t' + arr.join(',\n' + ind + '\t') + '\n' + ind) : arr.join('')) + '}';
                } else if (typeof(o) === 'string') {
                    json += (name && ':') + '\"' + o.toString() + '\"';
                } else {
                    json += (name && ':') + o.toString();
                }
                return json;
            },
            innerXml: function(node) {
                var s = '';
                if ('innerHTML' in node) s = node.innerHTML;
                else {
                    var asXml = function(n) {
                        var s = '';
                        if (n.nodeType == 1) {
                            s += '<' + n.nodeName;
                            for (var i = 0; i < n.attributes.length; i++) s += ' ' + n.attributes[i].nodeName + '=\"' + (n.attributes[i].nodeValue || '').toString() + '\"';
                            if (n.firstChild) {
                                s += '>';
                                for (var c = n.firstChild; c; c = c.nextSibling) s += asXml(c);
                                s += '</' + n.nodeName + '>';
                            } else s += '/>';
                        } else if (n.nodeType == 3) s += n.nodeValue;
                        else if (n.nodeType == 4) s += '<![CDATA[' + n.nodeValue + ']]>';
                        return s;
                    };
                    for (var c = node.firstChild; c; c = c.nextSibling) s += asXml(c);
                }
                return s;
            },
            escape: function(txt) {
                return txt.replace(/[\\]/g, '\\\\').replace(/[\"]/g, '\\"').replace(/[\n]/g, '\\n').replace(/[\r]/g, '\\r');
            },
            removeWhite: function(e) {
                var self = this;
                e.normalize();
                for (var n = e.firstChild; n;) {
                    if (n.nodeType == 3) { // text node
                        if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure
                            // whitespace
                            // text node
                            var nxt = n.nextSibling;
                            e.removeChild(n);
                            n = nxt;
                        } else n = n.nextSibling;
                    } else if (n.nodeType == 1) { // element node
                        self.removeWhite(n);
                        n = n.nextSibling;
                    } else
                    // any other node
                        n = n.nextSibling;
                }
                return e;
            }
        };
        if (xml.nodeType == 9) // document node
            xml = xml.documentElement;
        var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, '\t');

        if (root) {
            return JSON.parse('{' + json + '}')[root];
        }

        return JSON.parse('{' + json + '}');
    };
    me.equals = function(origin, target) {
        var p;
        if (origin === target) {
            return true;
        }
        // some checks for native types first
        // function and string
        if (typeof(origin) === 'function' || typeof(origin) === 'string' || origin instanceof String) {
            return origin.toString() === target.toString();
        }
        // number
        if (origin instanceof Number || typeof(origin) === 'number') {
            if (target instanceof Number || typeof(target) === 'number') {
                return origin.valueOf() === target.valueOf();
            }
            return false;
        }
        // null.equals(null) and undefined.equals(undefined) do not inherit from the 
        // targetect.prototype so we can return false when they are passed as target
        if (typeof(origin) !== typeof(target) || target === null || typeof(target) === 'undefined') {
            return false;
        }

        function sort(o) {
            var result = {};
            if (typeof o !== 'object') {
                return o;
            }
            Object.keys(o).sort().forEach(function(key) {
                result[key] = sort(o[key]);
            });
            return result;
        }
        if (typeof(origin) === 'object') {
            if (Array.isArray(origin)) { // check on arrays
                return JSON.stringify(origin) === JSON.stringify(target);
            } else { // anyway objects
                for (p in origin) {
                    if (typeof(origin[p]) !== typeof(target[p])) {
                        return false;
                    }
                    if ((origin[p] === null) !== (target[p] === null)) {
                        return false;
                    }
                    switch (typeof(origin[p])) {
                        case 'undefined':
                            if (typeof(target[p]) !== 'undefined') {
                                return false;
                            }
                            break;
                        case 'object':
                            if (origin[p] !== null && target[p] !== null && (origin[p].constructor.toString() !== target[p].constructor.toString() || !origin[p].equals(target[p]))) {
                                return false;
                            }
                            break;
                        case 'function':
                            if (origin[p].toString() !== target[p].toString()) {
                                return false;
                            }
                            break;
                        default:
                            if (origin[p] !== target[p]) {
                                return false;
                            }
                    }
                }
            }
        }
        // at least check them with JSON
        return JSON.stringify(sort(origin)) === JSON.stringify(sort(target));
    };
    return me;
});
'use strict';

App.defineClass('MultiView.enums.ViewMode', function ViewMode () {
	return { 
		STANDARD: 'standardMode',
		
		MAIN_SUB: 'mainSubMode',

		REG_DIALOG: 'regDialogMode',

		MENU_DIALOG: 'menuDialogMode'

	};
});

'use strict';

App.defineClass('MultiView.enums.LimitType', function LimitType () {
	return {
		/**
		 * Block 되지 않았음.
		 * @type {String}
		 */
		NONE: '',
		/**
		 * 나이제한
		 * @type {String}
		 */
		AGE: 'age',

		/**
		 * 존재하지 않는 채널, 미가입 처리.
		 * @type {String}
		 */
		NOT_EXIST: 'notExist',
		
		/**
		 * 시청 제한 채널에 설정되어 있음.
		 * @type {String}
		 */
		LIMITED: 'limited',

		/**
		 * Limited Element 를 의미하는 기본 지시자.
		 * @type {String}
		 */
		DEFAULT: 'limitType',

		generateClassName: function() {
			var me = this,
				classes = [me.DEFAULT],
				i, length;

			for (i = 0, length = arguments.length; i < length; i++) {
				classes.push(arguments[i]);
			}

			return classes.join(' ');
		}
	};
});

'use strict';
App.defineClass('MultiView.enums.FocusType', function FocusType() {
    return {
        /**
         * VIDEO 영역
         * @type {String}
         */
        VIDEO: 'VIDEO',
        /**
         * MENU 영역
         * @type {String}
         */
        MENU: 'MENU'
    };
});
'use strict';

App.defineClass('MultiView.enums.FocusMovingType', function FocusMovingType () {
	return {
		VIDEO_TO_VIDEO: 'VIDEO_TO_VIDEO',
		
		MENU_TO_MENU: 'MENU_TO_MENU',

		VIDEO_TO_MENU: 'VIDEO_TO_MENU',
		
		MENU_TO_VIDEO: 'MENU_TO_VIDEO',

		getType: function(from, to) {
			var me = this;

			if (from === FocusType.MENU && to === FocusType.MENU) {
				return me.MENU_TO_MENU;
			} else if (from === FocusType.VIDEO && to === FocusType.VIDEO) {
				return me.VIDEO_TO_VIDEO;
			} if (from === FocusType.MENU && to === FocusType.VIDEO) {
				return me.MENU_TO_VIDEO;
			} if (from === FocusType.VIDEO && to === FocusType.MENU) {
				return me.VIDEO_TO_MENU;
			}
		}
	};
});

'use strict';

App.defineClass('MultiView.enums.STBType', function STBType () {
	return { 
		OTV: 'otv',
		
		OTS: 'ots',

		UHD: 'uhd'
	};
});

'use strict';

App.defineClass('MultiView.enums.MenuStatus', function MenuStatus () {
	return {
		FOCUS: 'focus',
		
		SELECT: 'select',

		BASIC: 'basic',

		DEFAULT: 'menuItem',

		getSelector: function(type) {
			return '.' + type;
		},

		generateClassName: function() {
			var me = this,
				classes = [me.DEFAULT],
				i, length;

			for (i = 0, length = arguments.length; i < length; i++) {
				classes.push(arguments[i]);
			}

			return classes.join(' ');
		}
	};
});

'use strict';

App.defineClass('MultiView.enums.DisplayStatus', function DisplayStatus () {
	return {
		FOCUS: 'focus',
		
		SELECT: 'select',

		BASIC: 'basic',

		DEFAULT: 'inner',

		getSelector: function(type) {
			return '.' + type;
		},

		generateClassName: function() {
			var me = this,
				classes = [me.DEFAULT],
				i, length;

			for (i = 0, length = arguments.length; i < length; i++) {
				classes.push(arguments[i]);
			}

			return classes.join(' ');
		}
	};
});

'use strict';

App.defineClass('MultiView.enums.RegistrationType', function RegistrationType () {
	return {

		NEW: 'new',

		EDIT: 'edit',

		OVERWRITE: 'overwrite',

		REMOVE: 'remove',

		RENAME: 'rename'
	};
});
'use strict';

var global = window;
global.onload = function onLoad() {
	global.Main = MultiView.app.Main.create(App.commons.EventBus);
	global.Main.init();
};

global.press = function press(keyCode) {
	var e = {};
	e.keyCode = keyCode;
	e.preventDefault = function() {};
	e.stopPropagation = function() {};
	EventBus.fire('keyDown', e);
};

App.defineClass('MultiView.app.Main', {

	_construct: function() {

		var me = this,

			version,

			viewMode,

			/**
			 * [보기 방식 변경] 기능의 사용 여부를 반환한다.
			 * 펌웨어가 안정되어 이 기능을  사용가능해 지면 true 를 리턴하게 수정하면 된다.
			 * 그렇게 되면 이 코드는 쓰레기 코드로 있게 되나, 유지해야만 한다.
			 * @return {Boolean} 
			 */
			isAvailableViewModeChanging,

			loadViewMode = function() {

				viewMode = window.localStorage.getItem('viewMode');

				if (viewMode) {
					return;
				}

				if (STBService.isUHDDevice()) {
					viewMode = MultiView.enums.ViewMode.MAIN_SUB;
				} else {
					viewMode = MultiView.enums.ViewMode.STANDARD;
				}

				window.localStorage.setItem('viewMode', viewMode);
			},

			isEditMode = false,

			eventBus = App.commons.EventBus,

			initialized = false,

			enable5chTrigger,

			initializeClasses = function(eventBus) {
				var global = window;

				global.UserChannelService = MultiView.app.UserChannelService.create();
				global.ChannelDataManager = MultiView.app.ChannelDataManager.create(eventBus);
				global.KeyBinder = MultiView.app.KeyBinder.create(eventBus);
				global.UiRenderer = MultiView.app.UiRenderer.create(eventBus);
			},

			setVersion = function(expectedVersion) {
				var localVersion = localStorage.getItem('version');

				if (localVersion !== expectedVersion) {
					localStorage.setItem('version', expectedVersion);
					localVersion = expectedVersion;
				}

				version = localVersion;
			};

		eventBus.register(me, 'changeViewMode', function(targetViewMode) {
			viewMode = targetViewMode;
			window.localStorage.setItem('viewMode', viewMode);
			eventBus.fire('changedViewMode', viewMode);
		});

		eventBus.register(me, 'enterEditMode', function() {
			isEditMode = true;
			eventBus.fire('showMessage', 'editMode');
		}, 1);

		eventBus.register(me, 'exitEditMode', function(channelDataIndex, subChannelDataIndex) {
			isEditMode = false;
			eventBus.fire('changeCategory', channelDataIndex === 0 ? 0 : (channelDataIndex || ChannelDataManager.currentChannelDataIndex), subChannelDataIndex, true);
		}, 1);

		me.__defineGetter__('initialized', function() {
			return initialized;
		});

		me.__defineGetter__('viewMode', function() {
			return viewMode;
		});

		me.__defineGetter__('isEditMode', function() {
			return isEditMode;
		});

		me.__defineGetter__('version', function() {
			return version;
		});

		me.__defineGetter__('enable5chTrigger', function() {
			return enable5chTrigger;
		});

		/**
		 * @public
		 * Document 로딩 완료 후 호출된다.
		 */
		me.init = function() {

			Timer.start('init');

			global.STBService = MultiView.app.STBService.create(eventBus);
			global.RPCService = MultiView.app.RPCService.create();

			loadViewMode();

			RPCService.loadAppConfig(function(appConfig) {

				global.AppConfig = appConfig;

				enable5chTrigger = Utils.toBoolean(appConfig.fiveChannel.enable);
				
				setVersion(appConfig.version);

				isAvailableViewModeChanging = Utils.toBoolean(appConfig.enableViewModeChanging);

				STBService.setFiveChannelNo(Utils.toNumber(appConfig.fiveChannel.no));
				RPCService.setFiveChannelTriggerUrl(appConfig.fiveChannel.triggerUrl);

				initializeClasses(eventBus);

				RPCService.getPKGList(function() {
					eventBus.fire('loadedChannelData', appConfig.multiChannels.multiChannel);

					eventBus.fire('completeInitializing');

					RPCService.sendStartMessage();

					initialized = true;

					Timer.end('init');
				});

			});
		};

		me.isAvailableViewModeChanging = function() {
			return isAvailableViewModeChanging;
		};

		return me;
	}
});
'use strict';

App.defineClass('MultiView.components.UiComponent', {
	createElement: function(options) {
		var element = document.createElement(options.elementName);

		if (options.className) {
			element.className = options.className;
		}
		
		if (options.innerHtml) {
			element.innerHTML = options.innerHtml;
		}

		return element;
	},

	createDIV: function(className) {
		return this.createElement({
			elementName: 'div',
			className: className
		});
	},

	showElement: function (element) {
		element.style.display = 'block';
	},

	hideElement: function (element) {
		element.style.display = 'none';
	},

	removeElement: function(element) {
		this.removeElements(element);
	},

	removeElements: function(elements) {
		var targets = App.commons.Utils.isAbstractArrayList(elements) ? elements : [elements],
			i, length, target;
		
		for (i = 0, length = targets.length; i < length; i++) {
			target = targets[i];
			if (target && target.parentNode) {
				target.parentNode.removeChild(target);
			}	
		}
	},

	$1: function(query, parentNode) {
		var parent = parentNode || this.element || document;
		return parent.querySelector(query);
	},

	$: function(query, parentNode) {
		var parent = parentNode || this.element || document;
		return parent.querySelectorAll(query);
	},
	
	show: function() {
		var me = this;
		
		if (me.element) {
			me.element.style.display = 'block';
			me.visible = true;
		}
	},
	
	hide: function() {
		var me = this;
		if (me.element) {
			me.element.style.display = 'none';
			me.visible = false;
		}
	},

	setText: function(element, text) {
		element.innerHTML = text;
	}
});
'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.MenuItem', {
	
	eventBus: undefined,

	index: -1,

	channelDatum: undefined,

	element: undefined,

	_construct: function(eventBus, index, channelDatum) {
		var me = this;

		me.eventBus = eventBus;
		me.index = index;
		me.channelDatum = channelDatum || me._createChannelDatumForRegister();

		me.initializeElement();

		me.eventBus.register(me, 'changeCategory', function() {
			if (Main.isEditMode) {
				return;
			}
			if (me.element.className.indexOf(MenuStatus.SELECT) !== -1) {
				me.element.className = MenuStatus.generateClassName(MenuStatus.BASIC);
			}
		}, 0);

		// me.eventBus.register(me, 'cancelCategoryChangingedChannelMoving', function() {
		// 	if (me.element.className.indexOf(MenuStatus.SELECT) !== -1) {
		// 		me.focusIn(true);
		// 	} else if (me.element.className.indexOf(MenuStatus.FOCUS) !== -1) {
		// 		me.focusOut();
		// 	}
		// });
	},
	
	_createChannelDatumForRegister: function() {
		var channelDatum = {
				name: '등록',
				isEmpty: true
		};
		
		return channelDatum;
	},

	/**
	 * @private
	 */
	initializeElement: function() {
		var me = this,
			cls = function() {
				if (me.channelDatum.isUHD) {
					return 'uhd';
				}
				
				if (me.channelDatum.isEmpty) {
					return 'add';
				}
				
				return '';
			}();;
		

		me.element = me.createElement({
			elementName: 'li',
			className: MenuStatus.generateClassName(MenuStatus.BASIC),
			innerHtml: '<span class="' + cls + '">' + me.channelDatum.name + '</span>'
		});
	},

	focusIn: function(isSelect) {
		var me = this,
			focusType = isSelect ? MenuStatus.SELECT : MenuStatus.FOCUS;
//		focusType = MenuStatus.FOCUS;
		me.element.className = MenuStatus.generateClassName(focusType);
	},

	focusOut: function() {
		var me = this;

		if (ChannelDataManager.currentChannelDataIndex === me.index) {
			me.element.className = MenuStatus.generateClassName(MenuStatus.SELECT);
		} else {
			me.element.className = MenuStatus.generateClassName(MenuStatus.BASIC);
		}
	},

	toString: function() {
		return 'MenuItem';
	}

});
'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.DisplayItem', {

	element: undefined,

	programElement: undefined,

	_construct: function(eventBus, index, provider) {
		var me = this;

		me.eventBus = eventBus;
		
		me.index = index;

		me.inputKey = true;

		me.provider = provider;
		
		me.element = me.createDIV('displayItem');

		me.createChildElements();
		
		me.registerEventActors();
		
	},

	createChildElements: function() {
		var me = this;

		me.innerElement = me.createDIV(DisplayStatus.generateClassName(DisplayStatus.BASIC));
		me.element.appendChild(me.innerElement);

		me.limitElement = me.createDIV(LimitType.generateClassName(LimitType.BASIC));
		me.element.appendChild(me.limitElement);
		
		me.programInfoPanel = MultiView.components.displayItem.ProgramInfoPanel.create(me.element);
		
		me.channelListPanel = MultiView.components.displayItem.ChannelListPanel.create(me.element);
		
		me.channelInfoPanel = MultiView.components.displayItem.ChannelInfoPanel.create(me.element);
	},

	registerEventActors: function() {
		var me = this;

		me.eventBus.register(me, 'pressedEnterKeyInEditMode', function (focusInfo, callbackForPassing) {
			if (me.channelTuningTimer) {
				clearTimeout(me.channelTuningTimer);
				me.channelTuningTimer = null;

				if (me.channelInfoPanel.visible) {
					me.channelInfoPanel.tune();	
				} else {
					me.channelListPanel.tune();	
				}

				me.inputKey = true;
			} else {
				callbackForPassing();
			}
		}, me._commonConditions);
		
		me.eventBus.register(me, 'pressedChannelUpAndDownKey', function (keyCode) {

			if (!me.inputKey) {
				return;
			}

			if (me.channelTuningTimer) {
				clearTimeout(me.channelTuningTimer);
				me.channelTuningTimer = null;
			}

			me.channelInfoPanel.reset();

			me.channelTuningTimer = me.channelListPanel.render(keyCode === global.VK_CHANNEL_UP);
		
		}, me._commonConditions);

		me.eventBus.register(me, 'pressedChannelLeftAndRightKey', function (keyCode) {
			me.inputKey = true;
		}, me._commonConditions);

		me.eventBus.register(me, 'pressedNumberKey', function (keyCode) {
			if (!me.inputKey) {
				return;
			}

			me.channelListPanel.reset();

			if (me.index === 0 && Main.viewMode === ViewMode.MAIN_SUB) {
				clearTimeout(me.programTimer);
				me.programTimer = null;
				 me.channelInfoPanel.hideChannelName();
			} else if (me.index !== 0 && Main.viewMode === ViewMode.MAIN_SUB) {
				me.programInfoPanel.hideChannelInfo();
			} else {
				me.programInfoPanel.hide();
			}

			if (me.channelTuningTimer) {
				clearTimeout(me.channelTuningTimer);
				me.channelTuningTimer = null;
			} else {
				me.channelInfoPanel.clear();
			}

			me.channelTuningTimer = me.channelInfoPanel.render(Utils.convertKeyCodeToNumber(keyCode));

		}, me._commonConditions);

		me.eventBus.register(me, 'changeSubToMain', me.reloadProgramInfo, function () {
			return Main.viewMode === ViewMode.MAIN_SUB;// && me.index !== 0;
		});

		me.eventBus.register(me, 'changeCategory', me.changeCategory, 3);

		me.eventBus.register(me, 'tuneMosaicChannel', function () {

			me.inputKey = false;

			me.changeCategory();

		}, me._commonConditions);

		me.eventBus.register(me, 'tunedMosaicChannel', function() {

			console.log('called tunedMosaicChannel');

			me.inputKey = true;

			clearTimeout(me.channelTuningTimer);
			me.channelTuningTimer = null;

			me.channelListPanel.reset();
			
			me.tuned = true;

			me.focusIn();
		}, me._commonConditions);
	},

	_commonConditions: function () {
		return Main.isEditMode && ChannelDataManager.currentSubChannelDataIndex === this.index;
	},

	reloadProgramInfo: function() {
		var me = this;

		if (Main.viewMode !== ViewMode.MAIN_SUB) {
			return false;
		}

		me.changeLimitedStatus();
		
		me.provider.getInstance(me).reloadProgramInfo(me);
	},

	changeCategory: function() {
		var me = this;

		me.changeLimitedStatus();

		clearTimeout(me.programTimer);
		
		if (me.interval) {
			clearInterval(me.interval);
		}
		
		me.interval = me.provider.getInstance(me).changeCategory(me);
	},

	focusOrSelect: function() {
		this.focusIn(KeyBinder.focusInfo.focusType === FocusType.VIDEO ? DisplayStatus.FOCUS : DisplayStatus.SELECT);
	},

	changeLimitedStatus: function() {
		var me = this,
			limitType = ChannelDataManager.currentChannelDatum.channels[me.index].limitType;

		if (limitType) {
			me.limitElement.className = LimitType.generateClassName(limitType);
			me.showElement(me.limitElement);
		}  else {
			me.hideElement(me.limitElement);
		}
	},

	/**
	 * Display 영역의 테두리에 Focusing Effect 를 준다.
	 * @param  {DisplayStatus} Focus 상태, undefined 이면 변경되지 않는다.
	 */
	focusIn: function(displayStatus) {
		var me = this,
			program = STBService.getProgramByIndex(me.index);
		
		if (displayStatus) {
			me.innerElement.className = DisplayStatus.generateClassName(displayStatus);	
		}
		
		me.programTimer = me.provider.getInstance(me).focusIn(me, program);
	},
	
	focusOut: function() {
		var me = this;

		me.channelInfoPanel.reset();
		me.channelListPanel.reset();

		clearTimeout(me.channelTuningTimer);
		me.channelTuningTimer = null;

		
		me.provider.getInstance(me).focusOut(me);
		
		if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
			me.innerElement.className = DisplayStatus.generateClassName(DisplayStatus.SELECT);
		} else {
			me.innerElement.className = DisplayStatus.generateClassName(DisplayStatus.BASIC);
		}
	},

	toString: function() {
		return 'DisplayItem';
	}
});
	
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.Menu', {
	
    menuCount: -1,
    
    menuElement: undefined,
    
    menuItems: [],
    
    visible: false,
    
    maxMenuCount: 8,
    
    _construct: function (eventBus) {
        var me = this;

        me.eventBus = eventBus;
        me.menuElement = me.$1('#menu');
        // 메뉴 아이템 생성
        for (var i = 0; i < me.maxMenuCount; i++) {
        	if (window.ChannelDataManager.channelData[i]) {
        		me.menuItems.push(MultiView.components.MenuItem.create(eventBus, i, window.ChannelDataManager.channelData[i]));
        	} else {
        		me.menuItems.push(MultiView.components.MenuItem.create(eventBus, i));
        	}
            
        }
  //       eventBus.register(me, 'cancelCategoryChangingedChannelMoving', function() {
		// 	me.render(window.ChannelDataManager.currentChannelDataIndex);
		// });

		eventBus.register(me, 'movedPrevChannel', function() {
			me.showForAMoment();
		});

        eventBus.register(me, 'exitEditMode', function(channelDataIndex) {
            me.render(channelDataIndex || window.ChannelDataManager.currentChannelDataIndex);

            if (KeyBinder.focusInfo.focusType === FocusType.MENU) {
                var nextFocusInfo = {
                    focusType: FocusType.MENU,
                    index: channelDataIndex || window.ChannelDataManager.currentChannelDataIndex
                };
                EventBus.fire('moveFocus', KeyBinder.focusInfo, nextFocusInfo);
                App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);

                me.show();
            } else {
                me.showForAMoment();
            }
        });

		eventBus.register(me, 'enterEditMode', function() {
			me.hide();
		});
		eventBus.register(me, 'moveFocus', function(from, to, keepSelectMode) {
			if (Main.isEditMode) {
				return;
			}
			switch(MultiView.enums.FocusMovingType.getType(from.focusType, to.focusType)) {
				case MultiView.enums.FocusMovingType.MENU_TO_MENU:
					
						// 이전키를 눌렀을 경우 메뉴의 포커스는 다른 곳에 있을 수도 있다.
						if (KeyBinder.focusInfo.index !== from.index) {
							me.menuItems[KeyBinder.focusInfo.index].focusOut();
						}
					
						me.menuItems[from.index].focusOut();
						me.menuItems[to.index].focusIn(keepSelectMode);
						
					break;
				case MultiView.enums.FocusMovingType.VIDEO_TO_VIDEO:
					if (me.visible) {
						me.hide();
					}
					break;
				case MultiView.enums.FocusMovingType.VIDEO_TO_MENU:
					me.menuItems[to.index].focusIn();
					me.show();
					break;
				case MultiView.enums.FocusMovingType.MENU_TO_VIDEO:
					me.menuItems[from.index].focusIn(true);
					me.hide();
                    if (from.index !== window.ChannelDataManager.currentChannelDataIndex) {
                        me.render(window.ChannelDataManager.currentChannelDataIndex);
                        // eventBus.fire('cancelCategoryChangingedChannelMoving');
                    }
					break;
			}
		});

        eventBus.register(me, 'rerenderMenu', function () {
            me.render(KeyBinder.focusInfo.focusType === FocusType.MENU ? KeyBinder.focusInfo.index : ChannelDataManager.currentChannelDataIndex);
        });

        eventBus.register(me, 'showMenu', function() {
            me.show();
        });

        eventBus.register(me, 'hideMenu', function() {
            me.hide();
        });
    },

    initialize: function () {
        var me = this;
        me.menuElement.className = me.getDefaultMenuClassName('hide');
        me.render(0);
        me.showForAMoment();
    },

    render: function (focusedIndex) {
        var me = this,
            menuItemParentElement = me.$1('.menu_box', me.menuElement),
            i, length, menuItem;
        me.removeItems();
        for (i = 0, length = me.maxMenuCount; i < length; i++) {
            menuItem = me.menuItems[i];
            
            if (i === focusedIndex) {
                menuItem.focusIn(KeyBinder.focusInfo.focusType === FocusType.VIDEO);
            } else {
                menuItem.focusOut();
            }
            menuItemParentElement.appendChild(menuItem.element);
        }
    },

    removeItems: function () {
        var me = this,
            i;
        for (i = 0; i < me.maxMenuCount; i++) {
            me.removeElement(me.menuItems[i].element);
        }

        me.menuItems = [];

        for (var i = 0; i < me.maxMenuCount; i++) {
            if (window.ChannelDataManager.channelData[i]) {
                me.menuItems.push(MultiView.components.MenuItem.create(me.eventBus, i, window.ChannelDataManager.channelData[i]));
            } else {
                me.menuItems.push(MultiView.components.MenuItem.create(me.eventBus, i));
            }
            
        }
    },

    getDefaultMenuClassName: function (display) {
        return 'menu ' + display;
    },

    showForAMoment: function (time) {
        var me = this,
        	duration = time || 5000;
        me.show();
        if (me.timeCnt) {
            clearTimeout(me.timeCnt);
        }
        me.timeCnt = setTimeout(function() {
            if (window.KeyBinder.focusInfo.focusType !== MultiView.enums.FocusType.MENU) {
                me.hide();
            }
        }, duration);
    },
    show: function () {
    	var me = this;
        // me.eventBus.fire('disableForKeyInput', true);
        me.visible = true;
        me.$1('#menuBtn').style.display = 'none';
        me.menuElement.className = me.getDefaultMenuClassName('show');
        // setTimeout(function() {
            // me.eventBus.fire('disableForKeyInput', false);
        // }, 300);
        
        me.eventBus.fire('menuVisible', true);
    },
    hide: function () {
    	var me = this;
        // me.eventBus.fire('disableForKeyInput', true);
        me.visible = false;
        me.menuElement.className = me.getDefaultMenuClassName('hide');
        me.$1('#menuBtn').style.display = 'block';
        // setTimeout(function() {
        //     me.eventBus.fire('disableForKeyInput', false);
        // }, 300);
        
        me.eventBus.fire('menuVisible', false);
    }
});
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.Display', {
	displayItems: [],
	_construct: function(eventBus) {
		var me = this,
			displayItemDelegatorProvider = MultiView.components.displayItem.DisplayItemDelegatorProvider.create(),
			i, displayItem;
		
		me.element = me.createDIV('display');

		me.hide();

		for (i = 0; i < 4; i++) {
			displayItem = MultiView.components.DisplayItem.create(eventBus, i, displayItemDelegatorProvider);
			
			me.element.appendChild(displayItem.element);
			
			me.displayItems.push(displayItem);
		}

		eventBus.register(me, 'completeInitializing', function() {
			me.displayItems[window.ChannelDataManager.currentSubChannelDataIndex].focusIn(MultiView.enums.DisplayStatus.FOCUS);
		});

		eventBus.register(me, 'moveFocus', function(from, to) {
			switch(MultiView.enums.FocusMovingType.getType(from.focusType, to.focusType)) {
				case MultiView.enums.FocusMovingType.VIDEO_TO_VIDEO:
					me.displayItems[from.index].focusOut();
					me.displayItems[to.index].focusIn(MultiView.enums.DisplayStatus.FOCUS);

					me.displayItems[from.index].inputKey = true;
					me.displayItems[to.index].inputKey = true;
					break;
				case MultiView.enums.FocusMovingType.VIDEO_TO_MENU:
					me.displayItems[from.index].focusOut();

					me.displayItems[from.index].inputKey = true;
					break;
				case MultiView.enums.FocusMovingType.MENU_TO_VIDEO:
					me.displayItems[to.index].focusIn(MultiView.enums.DisplayStatus.FOCUS);

					me.displayItems[to.index].inputKey = true;
					break;
			}

		}, 2);
	}
});
'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.Button', {
	
	eventBus: undefined,

	index: -1,

	channelDatum: undefined,

	element: undefined,

	_construct: function(eventBus, index, name) {
		var me = this;

		me.eventBus = eventBus;
		me.index = index;

		me.initializeElement(name);

	},
	
	/**
	 * @private
	 */
	initializeElement: function(name) {
		var me = this;

		me.element = me.createElement({
			elementName: 'li',
			className: MenuStatus.generateClassName(MenuStatus.BASIC)
		});

		me.element.innerHTML = '<span class="name">' + name + '</span>';
	},

	focusIn: function(isSelect) {
		var me = this,
			focusType = isSelect ? MenuStatus.SELECT : MenuStatus.FOCUS;
//		focusType = MenuStatus.FOCUS;
		me.element.className = MenuStatus.generateClassName(focusType);
	},

	focusOut: function() {
		var me = this;

		if (ChannelDataManager.currentChannelDataIndex === me.index) {
			me.element.className = MenuStatus.generateClassName(MenuStatus.SELECT);
		} else {
			me.element.className = MenuStatus.generateClassName(MenuStatus.BASIC);
		}
	},

	toString: function() {
		return 'Button';
	}

});
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.RegistrationButtonBar', {
    menuElement: undefined,
    menuItems: [],
    visible: false,
    _construct: function(eventBus) {
        var me = this;

        me.eventBus = eventBus;
        me.element = me.$1('#registrationBar');
        
        me.okBtn = me.$1('#ok_btn');
        me.cancelBtn = me.$1('#cancel_btn');

        me.selectedIndex = 0;

        eventBus.register(me, 'pressedLeftOrRightKeyInRegistrationButtonBar', function() {
            me.selectedIndex = me.selectedIndex ? 0 : 1;
            me.changeFocus();
        });
        
        eventBus.register(me, 'moveFocus', function(from, to, keepSelectMode) {
        	if (!Main.isEditMode) {
				return;
			}
			switch(MultiView.enums.FocusMovingType.getType(from.focusType, to.focusType)) {
				case MultiView.enums.FocusMovingType.VIDEO_TO_VIDEO:
					if (me.visible) {
						me.hide();
					}
					break;
				case MultiView.enums.FocusMovingType.VIDEO_TO_MENU:
					me.selectedIndex = 0;
                    me.changeFocus();
					me.show();
					break;
				case MultiView.enums.FocusMovingType.MENU_TO_VIDEO:
					me.hide();
					break;
			}
		});

        eventBus.register(me, 'pressedEnterKeyInRegistrationButtonBar', function() {
            if (me.selectedIndex  === 0) {
                me.hide();
                App.commons.EventBus.fire('openRegDialog', ChannelDataManager.currentChannelDatum);

            } else {
                me.hide();
                eventBus.fire('cancelRegistration', ChannelDataManager.currentChannelDatum);
            }
        });

        eventBus.register(me, 'exitEditMode', function() {
            me.hide();
        });
    },

    changeFocus: function() {
        var me = this,
            firstIndex = me.selectedIndex === 0;
        me.okBtn.className = firstIndex ? 'focus' : 'basic';
        me.cancelBtn.className = firstIndex ? 'basic' : 'focus';
    },
    
    getDefaultMenuClassName: function(display) {
        return 'registrationBar ' + display;
    },

    show: function() {
    	var me = this;
        me.visible = true;
        me.hideElement(me.$1('#menuBtn', document));
        me.element.className = me.getDefaultMenuClassName('show');
    },
    hide: function() {
    	var me = this;
        me.visible = false;
        me.element.className = me.getDefaultMenuClassName('hide');
        me.showElement(me.$1('#menuBtn', document));
        
    }
});
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.EditButton', {

	_construct : function(eventBus) {
		var me = this;

		me.element = me.$1('#editBtn');

		me.message = me.$1('#message', me.element);

		me.menuFocusingTextGenerator = MultiView.components.editButton.MenuFocusingTextGenerator.create();

		me.videoFocusingTextGenerator = MultiView.components.editButton.VideoFocusingTextGenerator.create();

		eventBus.register(me, 'menuVisible', function (visible) {
			if (visible) {
				me.up();
			} else {
				me.down();
			}
		});

		eventBus.register(me, 'enterEditMode', function () {
			me.element.className = 'edit_btn saveMode menuHide';
			me.setText(me.message, '마이 채널 저장');
		});

		eventBus.register(me, 'exitEditMode', function () {
			me.element.className = me.element.className.replace('saveMode', '');
			me.setText(me.message, '4채널 편집');
		});

		eventBus.register(me, 'moveFocus', function (from, to) {
			me.initialize(to);
		});

		eventBus.register(me, 'changeCategory', function (index) {
			me.show();
			me.initialize({index: index});
		}, function () {
			return !Main.isEditMode;
		});

		eventBus.register(me, 'openEmptyDialog', function () { 
			me.hide();
		});

		eventBus.register(me, 'closeEmptyDialog', function () { 
			me.show();
		});

		eventBus.register(me, 'completeInitializing', function () {
			me.initialize(KeyBinder.focusInfo);
		});
	},

	initialize: function (focusInfo) {
		var me = this,
			message = me.getMessage(focusInfo);

		if (message) {
			me.setText(me.message, message);	
			me.show();
		} else {
			me.hide();
		}
	},

	getMessage: function (focusInfo) {

		// Edit Mode 인 경우 고정.
		if (Main.isEditMode) {
			return '마이 채널 저장';
		}

		// [+등록] 버튼 위에서는 나타나지 말아야 한다.
		if (!ChannelDataManager.channelData[focusInfo.index] && UiRenderer.visibledEmptyDialog) {
			return;
		}

		if (focusInfo.focusType === FocusType.VIDEO) {
			return this.videoFocusingTextGenerator.generate(focusInfo);
		} else {
			return this.menuFocusingTextGenerator.generate(focusInfo);
		}

		
	},
	
	down: function () {
		if (Main.isEditMode) {
			this.element.className = 'edit_btn saveMode menuHide';
		} else {
			this.element.className = 'edit_btn menuHide';	
		}
		
	},
	
	up: function () {
		if (Main.isEditMode) {
			this.element.className = 'edit_btn saveMode menuShow';
		} else {
			this.element.className = 'edit_btn menuShow';	
		}
	}
});

App.defineClass('MultiView.components.editButton.MenuFocusingTextGenerator', {

	defaultMessage: '4채널 편집',

	generate: function (focusInfo) {
		if (focusInfo.index < 4 && !STBService.isUHDDevice()) {
			return;
		}

		if (UiRenderer.visibledEmptyDialog) {
			return;
		}

		if (focusInfo.index < 4) {
			return Main.isAvailableViewModeChanging() ? '보기방식 변경' : undefined;
		}

		if (!ChannelDataManager.channelData[focusInfo.index]) {
			return Main.isAvailableViewModeChanging() ? '보기방식 변경' : undefined;	
		}

		return this.defaultMessage;

	}
});

App.defineClass('MultiView.components.editButton.VideoFocusingTextGenerator', {

	_construct: function () {
		var me = this;

		me.defaultMessage = '4채널 편집';
	},

	generate: function () {

		if (ChannelDataManager.currentChannelDataIndex < 4 && !STBService.isUHDDevice()) {
			return;
		}

		if (ChannelDataManager.currentChannelDataIndex < 4) {
			return Main.isAvailableViewModeChanging() ? '보기방식 변경' : undefined;
		} 

		return this.defaultMessage;
	}
});

'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.MenuDialog', {

	currentIndex : -1,

	_construct : function(eventBus) {
		var me = this;

		me.element = me.$1('#menuDialog');

		me.channelNameChanger = me.$1('li.pop_bg:first-child');
		me.channelRemover = me.$1('li.pop_bg:nth-child(2)');
		me.viewModeChanger = me.$1('li.pop_bg:last-child');

		eventBus.register(me, 'pressedEnterKeyInMenuDialog', function() {
			var currentItem = me.items[me.currentIndex];
			switch (currentItem) {
			case me.channelNameChanger:
				eventBus.fire('openRegDialog', me.channelDatum, RegistrationType.RENAME);
				me.hide();
				break;
			case me.channelRemover:
				me.hide();
				eventBus.fire('openRegDialog', me.channelDatum, RegistrationType.REMOVE);
				break;
			case me.viewModeChanger:
				
				var selectedViewMode = me.viewModeChanger.querySelector('span:nth-child(2)').className.indexOf('standard') > -1 ? ViewMode.STANDARD : ViewMode.MAIN_SUB;
				
				if (selectedViewMode !== Main.viewMode) {
					eventBus.fire('changeViewMode', selectedViewMode);	
				}
				me.hide();
				
				break;
			default:
				return;
			}
		});
		
		eventBus.register(me, 'pressedLeftRightKeyInMenuDialog', function() {
			
			if (me.items[me.currentIndex] !== me.viewModeChanger) {
				return;
			}
			
			var element = me.viewModeChanger.querySelector('span:nth-child(2)');
			element.className = 'pop_a_t ' + ( element.className.indexOf('standard') > -1 ? 'mainSub' : 'standard');
		});
		
		eventBus.register(me, 'pressedUpDownKeyInMenuDialog', function(keyCode) {
			
			if (me.items.length === 1) {
				return;
			}
			
			var nextIndex = function() {
				if (keyCode === global.VK_DOWN) {
					return me.currentIndex === me.items.length -1 ? 0 : me.currentIndex + 1; 
				} else {
					return me.currentIndex === 0 ? me.items.length -1 : me.currentIndex - 1;
				}
			}();
			
			me.focusIn(nextIndex);
			
		});
		
		eventBus.register(me, 'openMenuDialog', function (channelDatum) {
			me.isUserChannel = channelDatum && typeof channelDatum.id !== 'undefined';
			
			me.channelDatum = channelDatum;
			me.show();
		});
		
		eventBus.register(me, 'closeMenuDialog', function() {
			me.hide();

			me.channelDatum = null;
		});
	},

	show: function() {
		
		var appMgr = oipfObjectFactory.createApplicationManagerObject(); 
		var self = appMgr.getOwnerApplication( window.document ); 

		self.activateInput(true);
		
		var me = this,
			tempItems = me.$('li.pop_bg');

		me.items = (function () {
			var result = [];

			if (me.isUserChannel) {
				result.push(me.channelNameChanger);
				
				result.push(me.channelRemover);

				me.setText(me.$1('div', me.channelRemover), me.channelDatum.name + ' 삭제');
			}

			// viewModeChanger 는 UHD 장비일때, 그리고 현재 송출되고 있는 놈을 기준으로 fixed 가 아닌 경우에만 노출된다.
			if (Main.isAvailableViewModeChanging() && STBService.isUHDDevice() && !ChannelDataManager.currentChannelDatum.isFixed) {
				result.push(me.viewModeChanger);	
				me.viewModeChanger.querySelector('span:nth-child(2)').className = 'pop_a_t ' + (Main.viewMode === ViewMode.STANDARD ? 'standard' : 'mainSub');
			}

			return result;
		})();

		
		me.element.className = 'menuDialog' + me.items.length;

		for (var i = 0, length = tempItems.length; i < length; i++) {
			me.hideElement(tempItems[i]);
			for (var j = 0, jLength = me.items.length; j < jLength; j++) {
				if (me.items[j] === tempItems[i]) {
					me.showElement(tempItems[i]);
				}
			}
		}

		me.focusIn(0);

		me._super(MultiView.components.MenuDialog, 'show');
	},

	hide : function() {
		var me = this;

		me.isUserChannel = null;

		me._super(MultiView.components.MenuDialog, 'hide');
	},

	focusIn : function(index) {
		var me = this, i;

		for (i = 0; i < me.items.length; i++) {
			me.$1('div:first-child', me.items[i]).className = i === index ? 'focus' : '';
		}
		me.currentIndex = index;
	}
});

'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.EmptyDialog', {
	
	focused: false,
	
	_construct: function(eventBus) {
		var me = this;

		me.eventBus = eventBus;
		
		me.element = me.$1('#emptyDialog');

		eventBus.register(me, 'openEmptyDialog', function() {
			eventBus.fire('mute', true);
			me.show();
		});
		
		eventBus.register(me, 'closeEmptyDialog', function() {
			eventBus.fire('mute', false);
			me.hide();
		});
		
		eventBus.register(me, 'focusEmptyDialog', me.focusIn);
		
		eventBus.register(me, 'unfocusEmptyDialog', me.focusOut);

		eventBus.register(me, 'enterEditMode', function () {
			eventBus.fire('mute', false);
			me.hide();
		});

		eventBus.register(me, 'changeCategory', function (channelDataIndex) {

			if (!ChannelDataManager.channelData[channelDataIndex]) {
				eventBus.fire('mute', true);
				me.show();

			} else if (me.visible){
				eventBus.fire('mute', false);
				me.hide();	
			}
		}, 0, function () {
			return !Main.isEditMode;
		});
		
	},
	
	focusIn: function() {
		var me = this;
		me.$1('div').className = 'focus';
		me.focused = true;

		me.eventBus.fire('hideMenu');
	},
	
	focusOut: function() {
		var me = this;
		me.$1('div').className = 'basic';
		me.focused = false;

		me.eventBus.fire('showMenu');
	}
});
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.MessageDialog', {
	
	messages: {
		editMode : '채널(<img src="images/icon_pip_ch_tune_b.png"  style="vertical-align:-8px;">) 키, 채널 번호를 눌러서 원하는 채널을 선택한 후 연관메뉴(<img src="images/key_noti.png"  style="vertical-align:-13px;">)로 키로 저장하세요',
		fixedChannel: '{fixedChannel}에서는 채널을 변경할 수 없습니다',
		savedUserChannel: '<img src="images/icon_book_b.png" style="vertical-align:-11px;"> {savedUserChannel} 로 저장되었습니다.',
		removedChannel: '{removedChannel}이 삭제되었습니다.'
	},
    
	_construct: function(eventBus) {
		var me = this;
		
		me.element = me.$1('#messageDialog');
		
		eventBus.register(me, 'menuVisible', function(visible) {
			if (visible) {
				me.up();
			} else {
				me.down();
			}
		});
		
		eventBus.register(me, 'showMessage', function(message, arg1) {
			
			if (me.messages.hasOwnProperty(message)) {
				
				var innerStr = arg1 ? me.messages[message].replace('{' + message + '}', arg1) : me.messages[message];
				
				me.element.innerHTML = innerStr;
			} else {
				me.element.innerHTML = message;
			}
			
			me.show();
		});
		
	},
	
	show: function() {
		var me = this;
		me._super(MultiView.components.MessageDialog, 'show');
		
		if (me.timer) {
			clearTimeout(me.timer);
		}
		
		me.timer = setTimeout(function() {
			me.hide();
			me.timer = null;
		}, 3000);
	},
	
	down: function() {
		this.element.className = 'menuHide';
	},
	
	up: function() {
		this.element.className = 'menuShow';
	}
});
'use strict';
App.extendClass('MultiView.components.UiComponent', 'MultiView.components.RegDialog', {

	message: {
		remove: '{channelName}<br><span class="pop_save_txt02">선택한 마이 채널을 삭제하시겠습니까?</span>',
		edit: '선택한 채널을 저장 합니다<br><span class="pop_save_txt02">마이 채널명은 10자까지 등록 가능합니다.</span>',
		overwrite: '<span style="color:#ad352c;">이미 마이 채널 4개가 등록되어 있습니다</span><br><span class="pop_save_txt02">선택한 채널을 저장할 마이 채널을 선택하세요</span>',
		duplicate: '<span style="color:#ad352c;">이미 존재하는 채널명입니다</span><br><span class="pop_save_txt02">다른 이름을 등록해 주세요</span>',
		maxLengh: '선택한 채널을 저장 합니다</span><br><span class="pop_save_txt02" style="color:#ad352c;">채널명이 10자를 초과해 자동 수정되었습니다.</span>',
		unknown: '알 수 없는 예외가 발생되었습니다</span><br><span class="pop_save_txt02" style="color:#ad352c;>채널명을 변경해 주세요.</span>',
		minLength: '채널명이 입력되지 않았습니다<br><span class="pop_save_txt02">마이 채널명은 10자까지 등록 가능합니다.</span>'
	},

	_construct: function(eventBus) {
		var me = this;

		me.element = me.$1('#registrationDialog');

		me.firstElement = me.$1('div');
		me.messageElement = me.$1('p');
		me.inputBoxElement = me.$1('#inputBox');
		me.arrowElement = me.$1('#arrowBtn');
		me.inputElement = me.$1('input');

		me.okBtnElement = me.$1('ul.ch_btn li:first-child');
		me.cancelBtnElement = me.$1('ul.ch_btn li:last-child');

		eventBus.register(me, 'pressedEnterKeyInRegDialog', function () {

			if (me.selectedIndex === 1) {
				if (me.regType !== RegistrationType.REMOVE) {
					me.channelDatum.name = Utils.trim(me.inputElement.value);

					if (me.regType === RegistrationType.OVERWRITE) {
						me.channelDatum.id = me.overwriteTargets[me.overwriteTargetIndex].id;
					}

					UserChannelService.saveUserChannel(me.channelDatum, function success() {
						eventBus.fire('changedUserChannelData');

						me._closeDialog();

						if (me.regType === RegistrationType.NEW) {
							eventBus.fire('exitEditMode', UserChannelService.getUserChannels().length - 1 + 4, ChannelDataManager.currentSubChannelDataIndex);
						} else if (me.regType === RegistrationType.OVERWRITE) {
							eventBus.fire('exitEditMode', me.overwriteTargetIndex + 4, ChannelDataManager.currentSubChannelDataIndex);	
						} else if (me.regType === RegistrationType.RENAME) {
							eventBus.fire('rerenderMenu');	
						} else {
							eventBus.fire('exitEditMode', undefined, ChannelDataManager.currentSubChannelDataIndex);	
						}

						eventBus.fire('showMessage', 'savedUserChannel', me.channelDatum.name);

					}, function failure(error) {
						me._error(error);
					});

				} else {
					var targetChannelDataIndex = ChannelDataManager.indexOf(me.channelDatum);
					var currentChannelDatum = ChannelDataManager.currentChannelDatum;

					UserChannelService.removeUserChannel(me.channelDatum.id);

					eventBus.fire('changedUserChannelData', true);

					var nextChannelDataIndex = (function() {

						if (ChannelDataManager.equal(currentChannelDatum, me.channelDatum)) {
							// 무조건 이전으로....
							// if (ChannelDataManager.channelData[ChannelDataManager.currentChannelDataIndex]) {
							// 	return ChannelDataManager.currentChannelDataIndex;
							// } else {
								return targetChannelDataIndex - 1;
							// }	
						} else {
							return ChannelDataManager.indexOf(currentChannelDatum);
						}
					})();

					if (ChannelDataManager.currentChannelDataIndex === targetChannelDataIndex) {
						eventBus.fire('exitEditMode', nextChannelDataIndex);	
					} else {
						eventBus.fire('exitEditMode', nextChannelDataIndex, ChannelDataManager.currentSubChannelDataIndex);
					}

					eventBus.fire('showMessage', 'removedChannel', me.channelDatum.name);

					me._closeDialog();
				}
			} else if (me.selectedIndex === 2) {
				me._cancel(me.regType);
				
			} else if (me.selectedIndex === 0) {
				if (me.regType !== RegistrationType.OVERWRITE) {
					me.channelDatum.name = Utils.trim(me.inputElement.value);
					try {
						UserChannelService.valid(me.channelDatum);
						me.setText(me.messageElement, me.message.edit);
						me.selectedIndex = 1;
						me._focus();
					} catch (error) {
						me._error(error);
					}
				}
				
			}
			
		});

		eventBus.register(me, 'openRegDialog', function (channelDatum, regType) {

			me.originalDatum = channelDatum;
			me.channelDatum = Utils.clone(channelDatum);

			if (!regType) {
				me.regType = me._getRegistrationType(me.channelDatum);
			} else {
				me.regType = regType;
			}
			me._reset();

			me._initializeTemplate(me.regType);

			me._initializeSubChannelData(me.channelDatum);

			if (me.regType === RegistrationType.OVERWRITE) {
				me.selectedIndex = 0;
				me.showElement(me.arrowElement);
				me.overwriteTargets = UserChannelService.getUserChannels();

				me.inputElement.value = me.overwriteTargets[0].name;
			} else if (me.regType === RegistrationType.RENAME) {
				me.selectedIndex = 0;
				me.inputElement.value = me.channelDatum.name;
				// me.inputElement.focus();
			} else {
				me.inputElement.value = me.channelDatum.name;
			}

			me.show();

			me._focus();
		});

		eventBus.register(me, 'closeRegDialog', me._closeDialog);

		eventBus.register(me, 'pressedLeftRightKeyInRegDialog', function (keyCode) {

			if (me.selectedIndex === 0 && me.regType === RegistrationType.OVERWRITE) {
				if (keyCode === global.VK_LEFT) {
					me.overwriteTargetIndex = me.overwriteTargetIndex === 0 ? 3 : me.overwriteTargetIndex - 1;	
				} else {
					me.overwriteTargetIndex = me.overwriteTargetIndex === 3 ? 0 : me.overwriteTargetIndex + 1;
				}

				me._changeOverwriteTarget();
			} else if (me.selectedIndex === 1) {
				me.selectedIndex = 2;
			} else {
				me.selectedIndex = 1;
			}

			me._focus();

		});

    	eventBus.register(me, 'pressedUpDownKeyInRegDialog', function (keyCode) {

    		if (me.regType === RegistrationType.REMOVE) {
    			return;
    		}

    		if (keyCode === global.VK_UP && me.selectedIndex !== 0) {
    			me.selectedIndex = 0;
    			me._focus();
    		} else if (keyCode === global.VK_DOWN && me.selectedIndex === 0) {
    			me.selectedIndex = 1;
    			me._focus();
    		}

    		
    	});

    	eventBus.register(me, 'cancelRegistration', function (channelDatum) {
    		me._cancel(me._getRegistrationType(channelDatum));
    	});

	},

	_cancel: function (regType) {
		var isNotActionInEditMode = regType === RegistrationType.EDIT || regType === RegistrationType.NEW || regType === RegistrationType.OVERWRITE;

		this._closeDialog();

		if ( isNotActionInEditMode ) {
			EventBus.fire(
				'exitEditMode', 
				regType === RegistrationType.NEW && !ChannelDataManager.servicedChannelData[ChannelDataManager.currentChannelDataIndex] ? ChannelDataManager.prevChannelDataIndex : ChannelDataManager.currentChannelDataIndex
			);
		} 
	}, 

	_error: function (error) {
		var me = this;
		if (error.message === 'Duplicated Name') {
			me.setText(me.messageElement, me.message.duplicate);
			me.selectedIndex = 0;
			me._focus();
		} else if (error.message === 'Max Length') {
			me.inputElement.value = me.inputElement.value.substr(0, 10);
			me.setText(me.messageElement, me.message.maxLengh);
			me.selectedIndex = 1;
			me._focus();
		} else if (error.message === 'Min Length') {
			me.setText(me.messageElement, me.message.minLength);
			me.selectedIndex = 0;
			me._focus();
		} else {
			me.setText(me.messageElement, me.message.unknown);
		}

	},

	_closeDialog: function () {
		var me = this;
		me.hide();
		me.inputElement.blur();
	},

	_changeOverwriteTarget: function() {
		var me = this;

		me.inputElement.value = me.overwriteTargets[me.overwriteTargetIndex].name;
	},

	_focus: function() {
		var me = this;	

		switch (me.selectedIndex) {
			case 0:
				me.inputBoxElement.className = 'focus';
				me.arrowElement.className = 'focus';
				me.okBtnElement.className = 'basic';
				me.cancelBtnElement.className = 'basic';

				if (me.regType === RegistrationType.RENAME || me.regType === RegistrationType.EDIT || me.regType === RegistrationType.NEW ) {
					me.inputElement.focus();
				}

				break;
			case 1:
				me.inputBoxElement.className = 'basic';
				me.arrowElement.className = '';
				me.okBtnElement.className = 'focus';
				me.cancelBtnElement.className = 'basic';

				me.inputElement.blur();
				break;
			case 2:
				me.inputBoxElement.className = 'basic';
				me.arrowElement.className = '';
				me.okBtnElement.className = 'basic';
				me.cancelBtnElement.className = 'focus';

				me.inputElement.blur();
				break;
		}
	},

	_reset: function() {
		var me = this;

		me.overwriteTargets = [];

		me.overwriteTargetIndex = 0;

		me.selectedIndex = 1;
	},

	_initializeTemplate: function() {
		var me = this;

		if (me.regType === RegistrationType.REMOVE) {
			me.firstElement.className = 'pop_delete';
			me.setText(me.messageElement, me.message.remove.replace('{channelName}', me.channelDatum.name));
			me.hideElement(me.inputBoxElement);
			me.hideElement(me.arrowElement);
			me.hideElement(me.inputElement);
		} else if (me.regType === RegistrationType.OVERWRITE) {
			me.firstElement.className = 'pop_save';
			me.setText(me.messageElement, me.message.overwrite);
			me.showElement(me.inputBoxElement);
			me.showElement(me.arrowElement);
			me.showElement(me.inputElement);
		} else  {
			me.firstElement.className = 'pop_save';
			me.setText(me.messageElement, me.message.edit);
			me.showElement(me.inputBoxElement);
			me.hideElement(me.arrowElement);
			me.showElement(me.inputElement);
		}
	},

	_initializeSubChannelData: function(channelDatum) {
		var me = this,
			subChannelData = channelDatum.channels,
			subChannelDataElements = me.$('.ch_pop li'),
			i;

		for (i = 0; i < 4; i++) {
			me.setText(subChannelDataElements[i], Utils.fillZero(subChannelData[i].no, 3) + ' <p>' + subChannelData[i].name + '</p>');	
		}
	},

	_getRegistrationType: function(channelDatum) {

		if (!channelDatum.id && UserChannelService.getUserChannels().length === 4) {
			return RegistrationType.OVERWRITE;
		}

		if (!channelDatum.id) {
			return RegistrationType.NEW;	
		}

		return RegistrationType.EDIT;
	}
});
'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.SwitchChannel', {
	
	intervalEvent: new Object(),
	intervalTime: 120000,
	isResult: false,
	isChVisibility: false,
	isVideoVisibility: true,
	
	_construct : function(eventBus) {

		// console.log('STBService.isUHDDevice() : ' + STBService.isUHDDevice()); // ?????
		// if (STBService.isUHDDevice()) {
		// 	return;
		// }

		var me = this;

		me.eventBus = eventBus;

		me.element = me.$1('#sportChannel');
		if (!STBService.isUHDDevice()) {
			me.element.className = "fourChSmart";
		}

		me.initialize();
	},

	initialize: function () {
		var me = this;

		me.isChVisibility = ChannelDataManager.currentChannelDataIndex < 4;

		me.eventBus.register(me, 'completeInitializing', function () {

			//var date = new Date();
			//if(date.getHours() > 12) {
				me.requestData();
			//}

			me.intervalEvent = setInterval(function() {
				//var hour = date.getHours();
				//if(date.getHours() > 12) {
					me.requestData();
				//}
			}, me.intervalTime);

			me.eventBus.register(me, 'moveFocus', function (from, to) {
				console.log('to.focusType : ' + to.focusType);
				if (to.focusType === FocusType.VIDEO && !Main.isEditMode) {
					me.isVideoVisibility = true;
					me.show();
				} else {
					me.isVideoVisibility = false;
					me.hide();
				}
			});

			me.eventBus.register(me, 'enterEditMode', function () {
				// TODO
				console.log('Main.isEditMode : ' + Main.isEditMode);
				me.hide();
			});


			me.eventBus.register(me, 'exitEditMode', function () {
				// TODO
				console.log('Main.isEditMode : ' + Main.isEditMode);
				me.show();
			});

			me.eventBus.register(me, 'changeCategory', function (channelIndex, subChannelIndex, changeOptions) {
				console.log('ChannelDataManager.currentChannelDataIndex : ' + ChannelDataManager.currentChannelDataIndex);
				if (ChannelDataManager.currentChannelDataIndex < 4) {
					me.isChVisibility = true;	
					me.show();
				} else {
					me.isChVisibility = false;
					me.hide();
				}
			});
		});
	},

	requestData: function() {
		var me = this;
		
		RPCService.goingGameinterval(function(json) {
			console.log("json.API.RESULT ======================>"+json.API.RESULT)
			if(json.API.RESULT == 'TRUE' && !Main.isEditMode) {
//			if(json.result == 'TRUE' && !Main.isEditMode) {
				// if (ChannelDataManager.currentChannelDataIndex < 4) {
					me.isResult = true;
					
					me.show();
				// }
				// clearInterval(me.intervalEvent);
			} else {
				me.isResult = false;
				me.hide();
			}
		});	
		
		
	},
	
	show: function() {
		var me = this;
		if(me.isResult && me.isChVisibility && me.isVideoVisibility) {

			if (!me.element) {
				return;
			}
			
			me.element.style.display = 'block';
			// me.visible = true;

			// return me.element;
		}
	},
	
	hide: function() {
		var me = this;

		if (!me.element) {
			return;
		}
		
		me.element.style.display = 'none';
		// me.visible = false;

		// return me.element;
	}
});
'use strict';

App.defineClass('MultiView.components.displayItem.StandardItemDelegator', {

	focusIn: function(me, program) {
		me.programInfoPanel.render(program);
		if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
			me.programInfoPanel.hideProgramInfo();
		}
		return setTimeout(function() {
			me.programInfoPanel.reset();
			if (!me.channelTuningTimer) {
				me.channelInfoPanel.clear();	
			}
		}, 3000);	
	},

	focusOut: function(me) {
		me.programInfoPanel.reset();
	},

	changeCategory: function(me) {
		if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
			me.focusOrSelect();
		} else {
			me.focusOut();
		}
	},

	reloadProgramInfo: function(me) {
		me.programInfoPanel.render(STBService.getProgramByIndex(me.index));
		if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
			me.programInfoPanel.hideProgramInfo();
		}
	}
});
'use strict';

App.defineClass('MultiView.components.displayItem.MainItemDelegator', {

	focusIn: function(me, program) {
		me.programInfoPanel.render(program, false, true);
		me.channelInfoPanel.renderChannelInfo(program);
		return setTimeout(function() {
			if (!me.channelTuningTimer) {
				me.channelInfoPanel.clear();	
			}
		}, 3000);
	},

	focusOut: function() {
		// nothing
	},
	changeCategory: function(me) {
		if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
			me.focusOrSelect();
		} else {
			me.focusOut();
			me.programInfoPanel.render(STBService.getProgramByIndex(me.index), false, true);
		}

		return setInterval(function() {
			me.programInfoPanel.render(STBService.getProgramByIndex(me.index), false, true);
		}, 60000);

	},

	reloadProgramInfo: function(me) {

		me.programInfoPanel.render(STBService.getProgramByIndex(me.index), false, true);

		me.focusIn(KeyBinder.focusInfo.focusType === FocusType.VIDEO ? DisplayStatus.FOCUS : DisplayStatus.SELECT);
	}
});
'use strict';

App.defineClass('MultiView.components.displayItem.SubItemDelegator', {

	focusIn: function(me, program) {
		me.programInfoPanel.render(program);

		if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
			me.programInfoPanel.hideProgramInfo();
		}
		
		return setTimeout(function() {
			me.programInfoPanel.hideChannelInfo();
			if (!me.channelTuningTimer) {
				me.channelInfoPanel.clear();	
			}
		}, 3000);	
	},

	focusOut: function(me) {
		me.programInfoPanel.hideChannelInfo();
	},

	changeCategory: function(me) {
		if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
			me.focusOrSelect();
		} else {
			me.focusOut();
			me.programInfoPanel.render(STBService.getProgramByIndex(me.index), true);
			me.programInfoPanel.hideChannelInfo();
			if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
				me.programInfoPanel.hideProgramInfo();
			}
		}

		return setInterval(function() {
			me.programInfoPanel.render(STBService.getProgramByIndex(me.index), true);
			me.programInfoPanel.hideChannelInfo();
			if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
				me.programInfoPanel.hideProgramInfo();
			}
		}, 60000);

	},

	reloadProgramInfo: function(me) {
		me.programInfoPanel.render(STBService.getProgramByIndex(me.index));
		if (ChannelDataManager.currentChannelDatum.channels[me.index].limitType === LimitType.NOT_EXIST) {
			me.programInfoPanel.hideProgramInfo();
		}
		me.programInfoPanel.hideChannelInfo();
	}
});
'use strict';

App.defineClass('MultiView.components.displayItem.DisplayItemDelegatorProvider', {

	_construct: function() {
		var me = this;

		me.standardItemDelegator = MultiView.components.displayItem.StandardItemDelegator.create();
		me.mainItemDelegator = MultiView.components.displayItem.MainItemDelegator.create();
		me.subItemDelegator = MultiView.components.displayItem.SubItemDelegator.create();

	},

	getInstance: function(displayItem) {
		var me = this;

		if (me.isStandardMode()) {
			return me.standardItemDelegator;
		} else if (me.isFocusedToMain(displayItem)) {
			return me.mainItemDelegator;
		} else {
			return me.subItemDelegator;
		}
	},

	isStandardMode: function() {
		var standardMode = Main.viewMode === ViewMode.STANDARD,
			fixedChannel = ChannelDataManager.currentChannelDatum.isFixed;

		return standardMode || fixedChannel;
	},

	isFocusedToMain: function(displayItem) {
		var mainSubMode = Main.viewMode === ViewMode.MAIN_SUB,
			firstIndex = displayItem.index === 0;

		return mainSubMode && firstIndex;
	}
});

'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.displayItem.ChannelInfoPanel', {

	_construct: function(parentElement) {
		var me = this;

		me.element = me._createElement();

		me.hide();

		parentElement.appendChild(me.element);
	},

	_createElement: function() {
		var element = this.createDIV('channelNumber'),
			innerHtmlBuilder = [];
		
		innerHtmlBuilder.push('<div class="ch_channel_number">');
		innerHtmlBuilder.push('	<ul>');
		innerHtmlBuilder.push('		<li  id="channelNumber"></li>');
		innerHtmlBuilder.push('		<li class="txt_s" id="channelName"></li>');
		innerHtmlBuilder.push('	</ul>');
		innerHtmlBuilder.push('</div>');
		
		element.innerHTML = innerHtmlBuilder.join('');

		return element;

	},

	renderChannelInfo: function(obj) {
		var me = this;

		me.setText(me.$1('#channelNumber'), Utils.fillZero(obj.channelNumber, 3));
		me.setText(me.$1('#channelName'), obj.channelName);

		me.show();
	},

	render: function(numberStr) {
		var me = this,
			targetElement = me.$1('#channelNumber'),
			numberText = targetElement.innerHTML + numberStr;

		me.show();
		
		me.setText(me.$1('#channelName'), '');
		me.setText(targetElement, numberText);

		if (numberText.length === 3) {
			me.tune(numberText);
			return;
		}

		return setTimeout(function() {
			me.tune(numberText);
		}, 2000);
	},

	tune: function (numberText) {
		var me = this,
			number = numberText ? Utils.toNumber(numberText) :  Utils.toNumber(me.$1('#channelNumber').innerHTML),
			channel = STBService.getChannel({type: STBService.getCurrentSTBMode(), no: number }, true);

		if (channel) {
			EventBus.fire('tuneMosaicChannel', STBService.convertChannelToChannelDatum(channel));
		} else {
			me.reset();
		}
	},

	hideChannelName: function() {
		var me = this;
		me.setText(me.$1('#channelName'), '');
	},

	clear: function () {
		var me = this;
		me.setText(me.$1('#channelName'), '');
		me.setText(me.$1('#channelNumber'), '');
	},

	reset: function() {
		var me = this;
		
		me.clear();
		me.hide();
	}
});

'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.displayItem.ChannelListPanel', {
	
	_construct: function(parentElement) {
		var me = this;

		me.element = me._createElement();

		me.hide();

		parentElement.appendChild(me.element);
	},

	_createElement: function () {
		var element = this.createElement({
			elementName: 'ul',
			className: 'ch_Select ch_select_txt'
		});

		return element;
	},

	_initialize: function(channelDatum) {
		var me = this,
			currentChannelDatum = channelDatum || ChannelDataManager.currentSubChannelDatum,
			channelData = STBService.getSDChannelsForDisplayItem(currentChannelDatum),
			currentChannelDataIndex = ((channelData.length - 1) / 2);

		me.nextChannelDatum = channelData[currentChannelDataIndex - 1];
		me.prevChannelDatum = channelData[currentChannelDataIndex + 1];
	},

	render: function(isChannelUpKey) {
		var me = this;

		// 1. initialize
		me._initialize(me.currentChannelDatum);

		// 2. Next View
		var nextChannelDatum = isChannelUpKey ? me.nextChannelDatum : me.prevChannelDatum;

		if (nextChannelDatum) {
			me.currentChannelDatum = nextChannelDatum;
		}

		me._renderChannelList(me.currentChannelDatum);

		me.show();

		return setTimeout(function() {
			EventBus.fire('tuneMosaicChannel', me.currentChannelDatum);
		}, 2000);
	},

	tune: function () {
		EventBus.fire('tuneMosaicChannel', this.currentChannelDatum);
	},

	_renderChannelList: function(channelDatum) {
		var me = this,
			channelData = STBService.getSDChannelsForDisplayItem(channelDatum),
			inner = [],
			i, length;

		for (i = 0, length = channelData.length; i < length; i++) {
			if (channelData[i]) {
				inner.push('<li class="ch_list">');
		        inner.push('    <ul>');
		        inner.push('    	<li class="ch_number" >' + Utils.fillZero(channelData[i].no, 3) + '</li>');
		        inner.push('      	<li class="ch_txt" >' + channelData[i].name + '</li>');
		        inner.push('    </ul>');
		        inner.push('</li>');	
			} else {
				inner.push('<li class="ch_list">');
		        inner.push('    <ul>');
		        inner.push('    </ul>');
		        inner.push('</li>');	
			}
		}

		me.element.innerHTML = inner.join('');
	},

	reset: function() {
		var me = this;

		me.nextChannelDatum = null;
		me.currentChannelDatum = null;
		me.prevChannelDatum = null;

		me.hide();
	}
});
'use strict';

App.extendClass('MultiView.components.UiComponent', 'MultiView.components.displayItem.ProgramInfoPanel', {
	
	_construct: function(parentElement) {
		var me = this;

		me.element = me._createElement();

		me.hide();

		parentElement.appendChild(me.element);
	},

	_createElement: function() {
		var element = this.createDIV('program'),
			innerHtmlBuilder = [];
		
		innerHtmlBuilder.push('<div class="channelInfo" style="display:none;">');
		innerHtmlBuilder.push('	<div class="ch_Big_name">');
		innerHtmlBuilder.push('		<ul>');
		innerHtmlBuilder.push('			<li  id="channelNumber"></li>');
		innerHtmlBuilder.push('			<li class="txt_s"  id="channelName"></li>');
		innerHtmlBuilder.push('		</ul>');
		innerHtmlBuilder.push('	</div>');
		innerHtmlBuilder.push('	<ul class="ch_Box">');
		innerHtmlBuilder.push('		<li class="ch_Box_select"><img src="images/icon_pip_ch_tune.png" style="vertical-align:10px;"></li>');
		innerHtmlBuilder.push('		<li class="ch_Box_name" id="name"></li>');
		innerHtmlBuilder.push('	</ul>');
		innerHtmlBuilder.push('</div>');
		innerHtmlBuilder.push('<div class="ch_Box_bar">');
		innerHtmlBuilder.push('	<div class="ch_L" id="startTime"></div>');
		innerHtmlBuilder.push('	<div class="fl rBox">');
		innerHtmlBuilder.push('		<div class="rBar" id="prograssbar"></div>');
		innerHtmlBuilder.push('	</div>');
		innerHtmlBuilder.push('	<div class="ch_R" id="endTime"></div>');
		innerHtmlBuilder.push('</div>');

		element.innerHTML = innerHtmlBuilder.join('');

		return element;

	},

	render: function(program, hideProgramName, isMain) {
		var me = this;

		me.showElement(me.$1('.channelInfo'));

		me.setText(me.$1('#channelNumber'), App.commons.Utils.fillZero(program.channelNumber, 3));
		me.setText(me.$1('#channelName'), program.channelName);
		
		if (!program.name) {
			me.hideElement(me.$1('.ch_Box'));
			me.hideElement(me.$1('.ch_Box_bar'));
		} else {
			me.showElement(me.$1('.ch_Box'));
			me.showElement(me.$1('.ch_Box_bar'));
			me.setText(me.$1('#name'), program.name);
			me.setText(me.$1('#startTime'), program.startTime);
			me.setText(me.$1('#endTime'), program.endTime);	
			me.$1('#prograssbar').style.width = program.percent + '%';
		}

		if (isMain && ChannelDataManager.currentChannelDatum.channels[0].limitType === LimitType.NOT_EXIST) {
			me.hideElement(me.$1('.ch_Box_bar'));
			me.showElement(me.$1('.ch_Box'));
			me.setText(me.$1('#name'), '가입이 필요한 유료채널입니다');
		}

		if (hideProgramName) {
			me.hideElement(me.$1('.ch_Box'));
		}

		me.show();
	},

	hideProgramInfo: function () {
		var me = this;
		me.hideElement(me.$1('.ch_Box'));
		me.hideElement(me.$1('.ch_Box_bar'));
	},

	hideChannelInfo: function() {
		var me = this;
		me.hideElement(me.$1('.channelInfo'));
	},

	reset: function () {
		var me = this;

		me.hide();
	}
});
'use strict';
App.defineClass('MultiView.keyEventActor.AbstractKeyEventActor', {
    stopEvent: function(e) {
    	e.preventDefault();
        e.stopPropagation();
    },
    pressedEnterKey: function() {},
    
    pressedChannelUpAndDownKey: function(e) {
        this.stopEvent(e);  
    },

    pressedNavigationKey: function() {},

    pressedNumberKey: function(e) {
        this.stopEvent(e);  
    },

    pressedGreenKey: function(e, focusInfo) {
        var me = this;

        // 마이 채널 추가 전체 화면이 떠 있는 동안은 아무 키도 안먹게 한다.
        if (UiRenderer.visibledEmptyDialog) {
            return;
        }
        
        // Edit Mode 이고 하단 저장 버튼 바가 보이지 않는 다면 등록 팝업을 띄운다.
        if (Main.isEditMode && !UiRenderer.visibledRegButtonBar) {
            App.commons.EventBus.fire('openRegDialog', ChannelDataManager.currentChannelDatum);
            return;
        }
        
        // 포커스가 메뉴에 있다면, 메뉴의 포커스가 가리키는 카테고리의 정보를 기반으로 MenuDialog 를 띄운다.
        if (KeyBinder.focusInfo.focusType === FocusType.MENU) {

            // 메뉴 팝업을 띄울 수 없는 경우 경고창만 띄운다.
            if (me._unavailableMenuDialog(focusInfo.index)) {
                // var channelDatum = ChannelDataManager.channelData[focusInfo.index];
                // App.commons.EventBus.fire('showMessage', 'fixedChannel', channelDatum ? channelDatum.name : '등록버튼');
                return;
            }

            App.commons.EventBus.fire('openMenuDialog', ChannelDataManager.channelData[focusInfo.index]);
        
        } else { // A/V 인 경우 
            if (me._unavailableMenuDialog(ChannelDataManager.currentChannelDataIndex)) {
                // var channelDatum = ChannelDataManager.channelData[focusInfo.index];
                // App.commons.EventBus.fire('showMessage', 'fixedChannel', channelDatum ? channelDatum.name : '등록버튼');
                return;
            }
            App.commons.EventBus.fire('openMenuDialog', ChannelDataManager.currentChannelDatum);
        }
    },

    _unavailableMenuDialog: function (index) {

        // 고정형 채널인 경우 - 스포츠(UHD) 혹은 쇼핑(OTS)과 같은 경우
        if (ChannelDataManager.currentChannelDatum.isFixed === true) {
            return true;
        }

        // UHD STB 가 아니면서 기본 제공 카테고리에 속하는 경우 
        // UHD STB 인 경우 '보기방식 변경' 이라도 띄울 수 있다.
        if (!STBService.isUHDDevice() && index < 4) {
            return true;
        }

        if (!Main.isAvailableViewModeChanging() && STBService.isUHDDevice() && (index < 4 || !ChannelDataManager.channelData[index])) {
            return true;
        }

        return false;
    },

    pressedBackKey: function(e) {
        if(typeof ChannelDataManager.prevChannelDataIndex !== 'undefined'){
            this.stopEvent(e);  
            App.commons.EventBus.fire('forcedToMove', ChannelDataManager.prevChannelDataIndex);
            return;
        } 
    },

    pressedRedKey: function() {}
});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.VideoFocusKeyEventActorForStandardMode', {
    pressedEnterKey: function(e, focusInfo) {

        var callbackForPassing = function() {
            App.commons.EventBus.fire('goChannel');
        };

        if (Main.isEditMode) {
            App.commons.EventBus.fire('pressedEnterKeyInEditMode', focusInfo, callbackForPassing);
        } else {
            callbackForPassing();
        }
    },
    pressedChannelUpAndDownKey: function(e) {

        this.stopEvent(e);

        if (ChannelDataManager.currentChannelDatum.isFixed) {
            App.commons.EventBus.fire('showMessage', 'fixedChannel', ChannelDataManager.currentChannelDatum.name);
            return;
        }

        if (!Main.isEditMode) {
            App.commons.EventBus.fire('enterEditMode', Utils.clone(ChannelDataManager.currentChannelDatum), ChannelDataManager.currentSubChannelDataIndex, ChannelDataManager.currentChannelDataIndex);
        }
        App.commons.EventBus.fire('pressedChannelUpAndDownKey', e.keyCode);
    },
    pressedNavigationKey: function(e, focusInfo) {

        var nextFocusInfo = {
            focusType: focusInfo.focusType,
            index: focusInfo.index
        };

        switch (e.keyCode) {
            case VK_LEFT:
                nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex - 1 < 0 ? 3 : ChannelDataManager.currentSubChannelDataIndex - 1;
                break;
            case VK_RIGHT:
                nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex + 1 > 3 ? 0 : ChannelDataManager.currentSubChannelDataIndex + 1;
                break;
            case VK_UP:
                if (focusInfo.index === 0 || focusInfo.index === 1) {
                    nextFocusInfo.focusType = MultiView.enums.FocusType.MENU;
                    nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;
                } else if (focusInfo.index === 2 || focusInfo.index === 3) {
                    nextFocusInfo.index = focusInfo.index === 2 ? 0 : 1;
                }
                break;
            case VK_DOWN:
                if (focusInfo.index === 0 || focusInfo.index === 1) {
                    nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex + 2;
                } else if (focusInfo.index === 2 || focusInfo.index === 3) {
                    nextFocusInfo.focusType = MultiView.enums.FocusType.MENU;
                    nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;
                }
                break;
        }

        if (!App.commons.Utils.equals(focusInfo, nextFocusInfo)) {
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    },

    pressedNumberKey: function(e) {
        this.stopEvent(e);

        if (ChannelDataManager.currentChannelDatum.isFixed) {
            App.commons.EventBus.fire('showMessage', 'fixedChannel', ChannelDataManager.currentChannelDatum.name);
            return;
        }

        if (!Main.isEditMode) {
            App.commons.EventBus.fire('enterEditMode', Utils.clone(ChannelDataManager.currentChannelDatum), ChannelDataManager.currentSubChannelDataIndex, ChannelDataManager.currentChannelDataIndex);
        }

        App.commons.EventBus.fire('pressedNumberKey', e.keyCode);
    },

    pressedBackKey: function(e, focusInfo) {

        if (Main.isEditMode) {
            this.stopEvent(e);
            var nextFocusInfo = {
                focusType: focusInfo.focusType,
                index: focusInfo.index
            };

            nextFocusInfo.focusType = MultiView.enums.FocusType.MENU;
            nextFocusInfo.index = 0;

            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        } else {
            if (typeof ChannelDataManager.prevChannelDataIndex !== 'undefined') {
                this.stopEvent(e);
                App.commons.EventBus.fire('forcedToMove', ChannelDataManager.prevChannelDataIndex);
            }
        }

    },

    pressedRedKey: function() {

        if (!Main.isEditMode && ChannelDataManager.currentChannelDataIndex < 4) {
            App.commons.EventBus.fire('going5ch');
        }

    }
});
'use strict';
App.extendClass('MultiView.keyEventActor.VideoFocusKeyEventActorForStandardMode', 'MultiView.keyEventActor.VideoFocusKeyEventActorForMainSubMode', {
	
	pressedEnterKey: function(e, focusInfo) {

        this.stopEvent(e);

        var callbackForPassing = function () {
            if (focusInfo.index === 0) {
                App.commons.EventBus.fire('goChannel');
            } else {
                App.commons.EventBus.fire('changeSubToMain', focusInfo.index);
                
                var nextFocusInfo = {
                        focusType: FocusType.VIDEO,
                        index: 0
                };
                
                App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo );
                App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
            }
        };

        if (Main.isEditMode) {
            App.commons.EventBus.fire('pressedEnterKeyInEditMode', focusInfo, callbackForPassing);
        } else {
            callbackForPassing();
        }
	},
    
    pressedNavigationKey: function(e, focusInfo) {
        var nextFocusInfo = {
            focusType: focusInfo.focusType,
            index: focusInfo.index
        };

        switch (e.keyCode) {
            case VK_LEFT:
            	nextFocusInfo.index = focusInfo.index === 0 ? 1 : 0;
                break;
            case VK_RIGHT:
            	nextFocusInfo.index = focusInfo.index === 0 ? 1 : 0;
                break;
            case VK_UP:
                if (focusInfo.index === 0 || focusInfo.index === 1) {
                	nextFocusInfo.focusType = MultiView.enums.FocusType.MENU;
                    nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;
                } else if (focusInfo.index === 2 || focusInfo.index === 3) {
                	nextFocusInfo.index = focusInfo.index - 1;
                }
                break;
            case VK_DOWN:
                if (focusInfo.index === 1 || focusInfo.index === 2) {
                	nextFocusInfo.index = focusInfo.index + 1;
                } else if (focusInfo.index === 0 || focusInfo.index === 3) {
                	nextFocusInfo.focusType = MultiView.enums.FocusType.MENU;
                    nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;
                }
                break;
        }

        if (!App.commons.Utils.equals(focusInfo, nextFocusInfo)) {
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    }

});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.MenuFocusKeyEventActor', {
    pressedEnterKey: function(e, focusInfo) {

        if (focusInfo.index !== ChannelDataManager.currentChannelDataIndex) {
            App.commons.EventBus.fire('changeCategory', focusInfo.index);
        }

    	if (!ChannelDataManager.channelData[focusInfo.index]) {
            // 등록 전체 화면이 뜨면 포커스 타입을 VIDEO 로 변경해야 한다.
            var nextFocusInfo = {
                focusType: FocusType.VIDEO,
                index: 0
            };
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);

            App.commons.EventBus.fire('openEmptyDialog');
            App.commons.EventBus.fire('focusEmptyDialog');
            App.commons.EventBus.fire('rerenderMenu');
    	} 
    },

    pressedChannelUpAndDownKey: function(e) {
        // 메뉴 모드에서 채널 업/다운 을 누르면 이벤트를 통과 시킨다.
        // 종료 팝업을 유도 한다.
    },

    pressedNumberKey: function() {
        // 메뉴 모드에서 번호키를 누르면 이벤트를 통과 시킨다.
        // DCA 에 의한 채널 변경을 유도 한다.
    },

    pressedNavigationKey: function(e, focusInfo) {
    	this.stopEvent(e);
    	
        var nextFocusInfo = {
            focusType: focusInfo.focusType,
            index: focusInfo.index
        },
        lastMenuIndex = MultiView.components.Menu.maxMenuCount - 1;

        switch (e.keyCode) {
            case global.VK_LEFT:
           		nextFocusInfo.index = focusInfo.index - 1 < 0 ? lastMenuIndex : focusInfo.index - 1;	
                break;
            case global.VK_RIGHT:
                nextFocusInfo.index = focusInfo.index + 1 > lastMenuIndex ? 0 : focusInfo.index + 1;
                break;
            case global.VK_UP:
            	if (focusInfo.index < lastMenuIndex / 2) {

                    if (UiRenderer.visibledEmptyDialog) {
                        App.commons.EventBus.fire('focusEmptyDialog');
                    } else {
                        nextFocusInfo.focusType = MultiView.enums.FocusType.VIDEO;
                        nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;    
                    }
            	} else {
            		nextFocusInfo.index = focusInfo.index - 4;
            	}
                break;
            case global.VK_DOWN:
            	if (focusInfo.index > lastMenuIndex / 2) {
                    if (UiRenderer.visibledEmptyDialog) {
                        App.commons.EventBus.fire('focusEmptyDialog');
                    } else {
                		nextFocusInfo.focusType = MultiView.enums.FocusType.VIDEO;
                		nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;
                    }
           		
            	} else {
            		nextFocusInfo.index = focusInfo.index + 4;
            	}
                break;
        }

        if (!App.commons.Utils.equals(focusInfo, nextFocusInfo)) {
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    },
    
    pressedBackKey: function() {
    	App.commons.EventBus.fire('unfocusEmptyDialog');
    	
    	this._super(MultiView.keyEventActor.MenuFocusKeyEventActor, 'pressedBackKey', arguments);
    }

});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.MenuDialogKeyEventActor', {
    
	pressedEnterKey: function(e) {
		App.commons.EventBus.fire('pressedEnterKeyInMenuDialog');
    },
    
    pressedNavigationKey: function(e) {
    	if (e.keyCode === VK_LEFT || e.keyCode === VK_RIGHT) {
    		App.commons.EventBus.fire('pressedLeftRightKeyInMenuDialog');
    	} else {
    		App.commons.EventBus.fire('pressedUpDownKeyInMenuDialog', e.keyCode);
    	}
    },

    pressedGreenKey: function(e) {
    	App.commons.EventBus.fire('closeMenuDialog');
    },
    
    pressedBackKey: function(e) {
        this.stopEvent(e);  
    	App.commons.EventBus.fire('closeMenuDialog');
    }
});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.EmptyDialogKeyEventActor', {
    
	pressedEnterKey: function() {
		App.commons.EventBus.fire('enterEditMode', undefined, 0, ChannelDataManager.currentChannelDataIndex);

        var nextFocusInfo = {
            focusType: FocusType.VIDEO,
            index: 0
        };
        EventBus.fire('moveFocus', KeyBinder.focusInfo, nextFocusInfo);
        App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
    },

    pressedNavigationKey: function(e) {
    	if (e.keyCode === global.VK_DOWN) {
    	 	App.commons.EventBus.fire('unfocusEmptyDialog');
            // App.commons.EventBus.fire('closeEmptyDialog');
            
            var nextFocusInfo = {
                focusType: FocusType.MENU,
                index: ChannelDataManager.currentChannelDataIndex
            };
            EventBus.fire('moveFocus', KeyBinder.focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
    	}
    },
    
    pressedBackKey: function(e) {
        this.stopEvent(e);  

        App.commons.EventBus.fire('closeEmptyDialog');
        App.commons.EventBus.fire('unfocusEmptyDialog');
        App.commons.EventBus.fire('forcedToMove', ChannelDataManager.prevChannelDataIndex);
    },

    pressedGreenKey: function () {
        // nothing
    }
});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.RegistrationButtonBarFocusKeyEventActor', {
    pressedEnterKey: function() {
    	App.commons.EventBus.fire('pressedEnterKeyInRegistrationButtonBar');
    },

    pressedNavigationKey: function(e, focusInfo) {
    	this.stopEvent(e);
    	
        var nextFocusInfo = {
            focusType: focusInfo.focusType,
            index: focusInfo.index
        };

        switch (e.keyCode) {
            case global.VK_LEFT:
                App.commons.EventBus.fire('pressedLeftOrRightKeyInRegistrationButtonBar');
                break;
            case global.VK_RIGHT:
                App.commons.EventBus.fire('pressedLeftOrRightKeyInRegistrationButtonBar');
                break;
            case global.VK_UP:
            		nextFocusInfo.focusType = MultiView.enums.FocusType.VIDEO;
            		nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;
                break;
            case global.VK_DOWN:
            		// nothing
                break;
        }

        if (!App.commons.Utils.equals(focusInfo, nextFocusInfo)) {
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    },

    pressedBackKey: function(e, focusInfo) {
        this.stopEvent(e);
        var nextFocusInfo = {
            focusType: focusInfo.focusType,
            index: focusInfo.index
        };

        nextFocusInfo.focusType = MultiView.enums.FocusType.VIDEO;
        nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;

        if (!App.commons.Utils.equals(focusInfo, nextFocusInfo)) {
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo);
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    },

    pressedGreenKey: function() {}

});
'use strict';
App.extendClass('MultiView.keyEventActor.AbstractKeyEventActor', 'MultiView.keyEventActor.RegDialogKeyEventActor', {
    pressedEnterKey: function(e) {
		App.commons.EventBus.fire('pressedEnterKeyInRegDialog');
    },
    
    pressedNavigationKey: function(e) {
    	if (e.keyCode === VK_LEFT || e.keyCode === VK_RIGHT) {
    		App.commons.EventBus.fire('pressedLeftRightKeyInRegDialog', e.keyCode);
    	} else {
    		App.commons.EventBus.fire('pressedUpDownKeyInRegDialog', e.keyCode);
    	}
    },
    
    pressedGreenKey: function(e, focusInfo) {
    	App.commons.EventBus.fire('closeRegDialog');

        if (focusInfo.focusType === FocusType.MENU) {
            var nextFocusInfo = {
                    focusType: FocusType.VIDEO,
                    index: ChannelDataManager.currentSubChannelDataIndex
            };
            
            App.commons.EventBus.fire('moveFocus', focusInfo, nextFocusInfo );
            App.commons.EventBus.fire('finishedFocusMoving', nextFocusInfo);
        }
    },
    
    pressedBackKey: function(e) {
        this.stopEvent(e);  
    	App.commons.EventBus.fire('closeRegDialog');
    }
});
'use strict';
App.defineClass('MultiView.keyEventActor.KeyEventActorProvider', {
    _construct: function() {
        var me = this;
        
        me.videoFocusKeyEventActorForStandardMode = MultiView.keyEventActor.VideoFocusKeyEventActorForStandardMode.create();
        
        me.videoFocusKeyEventActorForMainSubMode = MultiView.keyEventActor.VideoFocusKeyEventActorForMainSubMode.create();
        
        me.menuFocusKeyEventActor = MultiView.keyEventActor.MenuFocusKeyEventActor.create();
        
        me.menuDialogKeyEventActor = MultiView.keyEventActor.MenuDialogKeyEventActor.create();
        
        me.registrationButtonBarFocusKeyEventActor = MultiView.keyEventActor.RegistrationButtonBarFocusKeyEventActor.create();
        
        me.emptyDialogKeyEventActor = MultiView.keyEventActor.EmptyDialogKeyEventActor.create();

        me.regDialogKeyEventActor = MultiView.keyEventActor.RegDialogKeyEventActor.create();

    },
    
    getKeyEventActor: function() {
        var me = this;

        if (UiRenderer.visibledRegDialog) {
            return me.regDialogKeyEventActor;
        }
        
        if (UiRenderer.visibledMenuDialog) {
        	return me.menuDialogKeyEventActor;
        }
        
        if (UiRenderer.visibledEmptyDialog && UiRenderer.focusedEmptyDialog) {
        	return me.emptyDialogKeyEventActor;
        }
        
        if (me._isConditionsForVideoFocusKeyEventActorForStandardMode()) {
        	return me.videoFocusKeyEventActorForStandardMode;
        } else if (me._isConditionsForVideoFocusKeyEventActorForMainSubMode()) {
        	return me.videoFocusKeyEventActorForMainSubMode;
        } else if (me._isConditionsForMenuFocusKeyEventActor()) {
        	return me.menuFocusKeyEventActor;
        } else if (me._isConditionsForRegistrationButtonBarFocusKeyEventActor()) {
        	return me.registrationButtonBarFocusKeyEventActor;
        } 
    },
    
    _isConditionsForRegistrationButtonBarFocusKeyEventActor: function() {
    	var isMenuFocus = window.KeyBinder.focusInfo.focusType === MultiView.enums.FocusType.MENU,
			isNotPopDialog = !window.UiRenderer.visibledDialog;
    	return Main.isEditMode && isMenuFocus && isNotPopDialog;
    },
    
    _isConditionsForVideoFocusKeyEventActorForStandardMode: function() {
    	var isStandardMode = Main.viewMode === MultiView.enums.ViewMode.STANDARD,
    		isFixedChannel = ChannelDataManager.currentChannelDatum && ChannelDataManager.currentChannelDatum.isFixed,
    		isVideoFocus = window.KeyBinder.focusInfo.focusType === MultiView.enums.FocusType.VIDEO,
    		isNotPopDialog = !window.UiRenderer.visibledDialog;
    	
    	return (isStandardMode || isFixedChannel) && isVideoFocus && isNotPopDialog;
    },
    
    _isConditionsForVideoFocusKeyEventActorForMainSubMode: function() {
    	var isMainSubMode = Main.viewMode === MultiView.enums.ViewMode.MAIN_SUB,
			isMosaicChannel = ChannelDataManager.currentChannelDatum && !ChannelDataManager.currentChannelDatum.isFixed,
			isVideoFocus = window.KeyBinder.focusInfo.focusType === MultiView.enums.FocusType.VIDEO,
    		isNotPopDialog = !window.UiRenderer.visibledDialog;
    	
    	return isMainSubMode && isMosaicChannel && isVideoFocus && isNotPopDialog;
    },
    
    _isConditionsForMenuFocusKeyEventActor: function() {
    	var isMenuFocus = window.KeyBinder.focusInfo.focusType === MultiView.enums.FocusType.MENU,
			isNotPopDialog = !window.UiRenderer.visibledDialog;
    	return !Main.isEditMode && isMenuFocus && isNotPopDialog;
    }
        
});
'use strict';
App.defineClass('MultiView.channelTuner.AbstractChannelTuner', {
    changeCategory: function() {
    	
    },
    
    changeAudio: function() {
    	
    }, 

    mute: function() {},
    release: function() {}
});
'use strict';
App.extendClass('MultiView.channelTuner.AbstractChannelTuner', 'MultiView.channelTuner.FixedChannelTuner', {
	
	videoObject: undefined,
	
	audioComponents: undefined,
	
	createObject: function() {
		var me = this;
		
		me.videoObject = oipfObjectFactory.createVideoBroadcastObject();
		
		me.videoObject.setAttribute('id', 'videoObject');
		
		me.videoObject.addEventListener('ChannelChangeSucceeded', function(e){

			me.audioComponents = me.videoObject.getComponents(MediaExtension.COMPONENT_TYPE_AUDIO);
			Timer.end('fixedChannelTuner');
			App.commons.EventBus.fire('changedCategory');
			me.changeAudio();
		});
		
		document.body.appendChild(me.videoObject);
	},
	
	changeCategory : function() {
		Timer.start('fixedChannelTuner');
		var me = this;
		
		if (!me.videoObject) {
			me.createObject();
		}

		if (me.channelDatum.isUHD) {
			me.videoObject.className = 'uhdVideo';
		} else {
			me.videoObject.className = 'video';	
		}

		me.videoObject.setChannel(STBService.getChannel(me.channelDatum), true, true);
	},
	
	mute: function(isOn) {
		var me = this;
		
		if (!me.audioComponents) {
			me.audioComponents = me.videoObject.getComponents(MediaExtension.COMPONENT_TYPE_AUDIO);
		}
		
		if (isOn || ChannelDataManager.currentSubChannelDatum.limitType) {
			me.videoObject.selectComponent(me.audioComponents[0]);	
		} else {
			try {
				me.videoObject.selectComponent(me.audioComponents[ChannelDataManager.currentSubChannelDataIndex + 1]);		
			} catch (e) {
				console.error('not existed audio component');
			}
			
		}
		
	},

	changeAudio : function() {
		var me = this;
		
		// 채널이 존재하지 않아 검정 영상이 흐른다면 종료.
		if (!me.audioComponents) {
			return;
		}
		
		if (ChannelDataManager.currentSubChannelDatum.limitType) {
    		me.videoObject.selectComponent(me.audioComponents[0]);
    	} else {
    		try {
    			Timer.start('change Fixed Audio ' + ChannelDataManager.currentSubChannelDataIndex);
    			me.videoObject.selectComponent(me.audioComponents[ChannelDataManager.currentSubChannelDataIndex + 1]);
    			Timer.end('change Fixed Audio ' + ChannelDataManager.currentSubChannelDataIndex);
    		} catch (e) {
    			console.error('not existed audio component');
    		}
    		
    	}
	},
	
	release: function() {
		var me = this;

		document.body.removeChild(me.videoObject);
		me.videoObject = null;
	
	}
});

'use strict';

function ScreenPosition(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

App.extendClass('MultiView.channelTuner.AbstractChannelTuner', 'MultiView.channelTuner.MosaicChannelTuner', {

	videoObject: undefined,

	_construct: function() {
		var me = this;
		EventBus.register(me, 'changeSubToMain', function(targetIndex) {
			var channelDatum = ChannelDataManager.currentChannelDatum;

			if (channelDatum.channels[0].limitType) {
				me.videoObject.stop(0);
			} else {
				me.videoObject.setChannel(0, STBService.getChannel(channelDatum.channels[0]));
			}

			if (channelDatum.channels[targetIndex].limitType) {
				me.videoObject.stop(targetIndex);
			} else {
				me.videoObject.setChannel(targetIndex, STBService.getChannel(channelDatum.channels[targetIndex]));
			}

			Utils.change(me.prevChannels, 0, targetIndex);
		});

		EventBus.register(me, 'tuneMosaicChannel', function(channelDatum) {

			var videoObject = me.videoObject.getVideoBroadcastObjects()[ChannelDataManager.currentSubChannelDataIndex],
				onChannelChangeComplete = function(e) {

					me.changeAudio();

					console.log('error state : ', e.errorState);

					EventBus.fire('tunedMosaicChannel', channelDatum);

					console.log('succeeded tune Mosaic Channel', e.channel);

					videoObject.removeEventListener('ChannelChangeSucceeded', onChannelChangeComplete);
					videoObject.removeEventListener('ChannelChangeError', onChannelChangeComplete2);
				},
				onChannelChangeComplete2 = function(e) {

					me.changeAudio();

					console.log('error state : ', e.errorState);

					EventBus.fire('tunedMosaicChannel', channelDatum);

					console.log('succeeded tune Mosaic Channel', e.channel);

					videoObject.removeEventListener('ChannelChangeSucceeded', onChannelChangeComplete);
					videoObject.removeEventListener('ChannelChangeError', onChannelChangeComplete2);
				};

			if (channelDatum.limitType) {
				me.videoObject.stop(ChannelDataManager.currentSubChannelDataIndex);
				setTimeout(function() {
					EventBus.fire('tunedMosaicChannel', channelDatum);
				}, 100);

			} else {
				videoObject.addEventListener('ChannelChangeSucceeded', onChannelChangeComplete);
				videoObject.addEventListener('ChannelChangeError', onChannelChangeComplete2);

				videoObject.setChannel(STBService.getChannel(channelDatum));
			}

			me.prevChannels[ChannelDataManager.currentSubChannelDataIndex] = channelDatum;

		}, 2);

		EventBus.register(me, 'destroyApp', function() {
			console.log('called destroyApp in MosaicChannelTuner');
			if (me.videoObject) {
				me.release();
			}
		});
	},

	createObject: function() {
		var info = Main.viewMode === ViewMode.STANDARD ? [
			new ScreenPosition(43, 24, 598, 336),
			new ScreenPosition(642, 24, 598, 336),
			new ScreenPosition(43, 361, 598, 336),
			new ScreenPosition(642, 361, 598, 336)
		] : [
			new ScreenPosition(45, 45, 862, 488),
			new ScreenPosition(909, 47, 332, 190),
			new ScreenPosition(909, 250, 332, 190),
			new ScreenPosition(909, 453, 332, 190)
		];

		try {

			// 시간이 지연된다... 비동기적이 아닌, 동기적으로 작동한다.
			this.videoObject = global.oipfObjectFactory.createMosaicWindow(info);
		} catch (e) {
			throw new Error(e);
		}
	},

	changeCategory: function(channelDataIndex, subChannelDataIndex) {
		Timer.start('create Mosaic Window');
		Timer.start('create Mosaic Window2');
		var me = this,
			mosaicVideoObjects = document.querySelectorAll('object');

		if (mosaicVideoObjects.length !== 4) {
			me.createObject();
		}

		for (var i = 0; i < 4; i++) {
			if (me.channelDatum.limitType) {
				me.videoObject.stop(i);
			} else {
				if (me.prevChannels && me.prevChannels.length === 4) {
					if (!(me.prevChannels[i].no === me.channelDatum.channels[i].no && me.prevChannels[i].type === me.channelDatum.channels[i].type)) {
						me.videoObject.setChannel(i, window.STBService.getChannel(me.channelDatum.channels[i]));
					}
				} else {
					me.videoObject.setChannel(i, window.STBService.getChannel(me.channelDatum.channels[i]));
				}

			}
		}

		Timer.end('create Mosaic Window2');

		me.changeAudio();

		Timer.end('create Mosaic Window');

		me.prevChannels = (function() {
			var result = [];
			for (var i = 0; i < 4; i++) {
				result.push(me.channelDatum.channels[i]);
			}
			return result;
		})();

		App.commons.EventBus.fire('changedCategory');
	},

	changeAudio: function() {
		var me = this;

		if (ChannelDataManager.currentSubChannelDatum.limitType) {
			me.videoObject.stop(ChannelDataManager.currentSubChannelDataIndex);
			me.videoObject.selectMosaicAudio(ChannelDataManager.currentSubChannelDataIndex);
		} else {
			try {
				Timer.start('change Mosaic Audio');
				me.videoObject.selectMosaicAudio(ChannelDataManager.currentSubChannelDataIndex);
				Timer.end('change Mosaic Audio');
			} catch (e) {
				console.error('not existed audio component');
			}

		}
	},

	mute: function(isOn) {
		var me = this;
		if (isOn || ChannelDataManager.currentSubChannelDatum.limitType) {
			me.videoObject.stop(ChannelDataManager.currentSubChannelDataIndex);	
			me.indexForMuted = ChannelDataManager.currentSubChannelDataIndex;
		} else if (typeof me.indexForMuted !== 'undefined' && me.indexForMuted !==  null) {
			me.videoObject.setChannel(me.indexForMuted, window.STBService.getChannel(me.channelDatum.channels[me.indexForMuted]));
			me.indexForMuted = null;
		}
		
	},

	release: function() {
		var me = this;

		if (me.videoObject) {
			me.videoObject.stopAll();
			me.videoObject.close();

			me.videoObject = null;
		}

	}
});
'use strict';
App.defineClass('MultiView.channelTuner.ChannelTunerProvider', {
    _construct: function() {
        var me = this;
        
        me.fixedChannelTuner = MultiView.channelTuner.FixedChannelTuner.create();
        me.mosaicChannelTuner = MultiView.channelTuner.MosaicChannelTuner.create();
        
    },
    
    getInstance: function(channelDatum) {
        var me = this;
        
        if (channelDatum.isFixed) {
        	me.fixedChannelTuner.channelDatum = channelDatum;
        	return me.fixedChannelTuner;
        } else {
        	me.mosaicChannelTuner.channelDatum = channelDatum;
        	return me.mosaicChannelTuner;
        }
    }
});
'use strict';


App.defineClass('MultiView.app.channelDataManager.ViewModeChannelDataManager', {

	_construct: function(eventBus) {

		var me = this,

			channelData = [],

			currentChannelDatum,

			currentChannelDataIndex = -1,

			currentSubChannelDatum,

			currentSubChannelDataIndex = -1,

			prevChannelDataIndex,

			/**
			 * 서브 채널에 대한 정보를 수정한다.
			 * @param  {Object} channelDatum [description]
			 * @param  {Number} index        [description]
			 */
			initializeSubChannel = function(channelDatum, index) {
				var j, jLength, limitType;

				for (j = 0, jLength = channelDatum.channels.length; j < jLength; j++) {

					limitType = STBService.getLimitType(channelDatum.channels[j]);

					channelDatum.channels[j].limitType = limitType;

				}

				// index 가 지정되어 있다면 서브채널 상태와 상관없이 해당 채널에 포커스를 지정하게 된다.
				if (typeof index !== 'undefined') {
					currentSubChannelDatum = channelDatum.channels[index];
					currentSubChannelDataIndex = index;
					return;
				}

				// 채널 셀렉트/포커스를 결정한다.
				if (limitedAllSubChannel()) {
					// nothing..
				} else if (currentSubChannelDatum.limitType !== LimitType.NONE) {
					for (var i = 0, length = currentChannelDatum.channels.length; i < length; i++) {
						if (currentChannelDatum.channels[i].limitType === LimitType.NONE) {
							currentSubChannelDatum = currentChannelDatum.channels[i];
							currentSubChannelDataIndex = i;
							break;
						}
					}
				}
			},

			limitedAllSubChannel = function() {
				for (var i = 0, length = currentChannelDatum.channels.length; i < length; i++) {
					if (currentChannelDatum.channels[i].limitType === LimitType.NONE) {
						return false;
					}
				}
				return true;
			},

			parseChannelData = function(channelDataArray, stbType, stbMode) {

				var type = stbType || STBType.OTV,
					mode = stbMode || type,
					result = [],
					getSTBPropertyForSubChannel = function(channel) {

						if (type === STBType.OTS && mode === STBType.OTV) {
							return STBType.OTV;
						}

						if (type === STBType.UHD && channel[STBType.UHD]) {
							return STBType.UHD;
						} else if (type === STBType.OTS && channel[STBType.OTS]) {
							return STBType.OTS;
						} else {
							return STBType.OTV;
						}
					},
					i, length, multiChannel, item, j, jLength, subChannel, subChannelSTBType;

				for (i = 0, length = channelDataArray.length; i < length; i++) {
					multiChannel = channelDataArray[i];

					item = {};

					item.name = multiChannel.name;

					if (multiChannel[type] && Utils.toNumber(multiChannel[type])) {
						item.isFixed = true;
						item.no = Utils.toNumber(multiChannel[type]);

						if (type === STBType.UHD && multiChannel[STBType.OTV] !== multiChannel[type]) {
							item.isUHD = true;
						}
					}

					if (multiChannel[type] && Utils.toBoolean(multiChannel[type]) === false) {
						continue;
					}

					if (multiChannel.channel) {
						item.channels = [];

						for (j = 0, jLength = multiChannel.channel.length; j < jLength; j++) {
							subChannel = multiChannel.channel[j];

							subChannelSTBType = getSTBPropertyForSubChannel(subChannel);

							var channel;

							if (subChannel[subChannelSTBType].type === 'sid') {
								channel = STBService.getChannelBySid(subChannel[subChannelSTBType].value, subChannelSTBType);
							} else {
								channel = STBService.getChannel({
									type: subChannelSTBType,
									no: Utils.toNumber(subChannel[subChannelSTBType].value)
								});
							}
							var name = channel ? channel.name : subChannel.name;

							item.channels.push({
								name: name,
								type: subChannelSTBType,
								no: channel ? channel.majorChannel : 0
							});

						}
					}

					result.push(item);
				}

				// channelDataArray.filter(function(multiChannel) {
				// 	return multiChannel[type] && Utils.toBoolean(multiChannel[type]) === false;
				// }).forEach(function(multiChannel) {
				// 	var item = {};

				// 	item.name = multiChannel.name;

				// 	if (multiChannel[type] && Utils.toNumber(multiChannel[type])) {
				// 		item.isFixed = true;
				// 		item.no = Utils.toNumber(multiChannel[type]);

				// 		if (type === STBType.UHD && multiChannel[STBType.OTV] !== multiChannel[type]) {
				// 			item.isUHD = true;
				// 		}
				// 	}

				// 	if (multiChannel.channel) {
				// 		item.channels = [];

				// 		multiChannel.channel.forEach(function(subChannel) {
				// 				var subChannelSTBType = getSTBPropertyForSubChannel(subChannel);
				// 				var channel;
				// 				if (subChannel[subChannelSTBType].type === 'sid') {
				// 					channel = STBService.getChannelBySid(subChannel[subChannelSTBType].value, subChannelSTBType);
				// 				} else {
				// 					channel = STBService.getChannel({
				// 						type: subChannelSTBType,
				// 						no: Utils.toNumber(subChannel[subChannelSTBType].value)
				// 					});
				// 				}

				// 				var name = channel ? channel.name : subChannel.name;

				// 				item.channels.push({
				// 					name: name,
				// 					type: subChannelSTBType,
				// 					no: channel.majorChannel
				// 				});
				// 			});
				// 	}

				// 	result.push(item);
				// });

				return result;

			},

			tempChannelData,

			servicedChannelData;

		// eventBus.register(me, 'enterEditMode', function () {

		// 	if (typeof prevChannelDataIndex === 'undefined') {
		// 		prevChannelDataIndex = 0;	
		// 	} else if (channelData[currentChannelDataIndex]) {
		// 		prevChannelDataIndex = currentChannelDataIndex;
		// 	}

		// }, 0);

		// eventBus.register(me, 'openEmptyDialog', function () {

		// 	if (typeof prevChannelDataIndex === 'undefined') {
		// 		prevChannelDataIndex = 0;	
		// 	} else if (channelData[currentChannelDataIndex]) {
		// 		prevChannelDataIndex = currentChannelDataIndex;
		// 	}

		// }, 0);


		eventBus.register(me, 'loadedChannelData', function(data) {
			var originChannelData = Array.isArray(data) ? data : [data];

			Timer.start('parsing');

			servicedChannelData = parseChannelData(originChannelData, STBService.getSTBType(), STBService.getCurrentSTBMode());
			Timer.end('parsing');
			channelData = servicedChannelData.concat(UserChannelService.getUserChannels());

			tempChannelData = Utils.clone(channelData);

			currentChannelDataIndex = 0;
			currentChannelDatum = tempChannelData[0];

			currentSubChannelDataIndex = 0;
			currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];

			eventBus.fire('parsedChannelData', tempChannelData[0]);
		});

		eventBus.register(me, 'changedUserChannelData', function(isRemoveRequest) {
			channelData = servicedChannelData.concat(UserChannelService.getUserChannels());
			tempChannelData = Utils.clone(channelData);

			if (!isRemoveRequest) {
				currentChannelDatum = tempChannelData[currentChannelDataIndex];
				currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];
			}

		}, 1);

		eventBus.register(me, 'parsedChannelData', function(channelDatum) {
			Timer.start('subChannelInitailize');
			initializeSubChannel(channelDatum);
			Timer.end('subChannelInitailize');
			eventBus.fire('initializedChannelData', currentChannelDatum, currentSubChannelDatum);
		});


		eventBus.register(me, 'moveFocus', function(from, to) {
			// 같은 영역에서의 동작일때만 영향을 끼친다.
			if (to.focusType === FocusType.VIDEO && from.focusType === FocusType.VIDEO) {
				currentSubChannelDataIndex = to.index;
				currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];
			}
		}, 1, function() {
			return !Main.isEditMode;
		});

		EventBus.register(me, 'changeSubToMain', function(targetIndex) {
			var targetChannels = tempChannelData[currentChannelDataIndex].channels;

			Utils.change(targetChannels, 0, targetIndex);

			initializeSubChannel(tempChannelData[currentChannelDataIndex]);
		}, 1, function() {
			return !Main.isEditMode;
		});

		eventBus.register(me, 'changeCategory', function(channelIndex, subChannelIndex, changeOptions) {

			// [+등록] 에서 다른 [+등록] 으로 이동하는 경우는 현재 포커스 처리만 등록하고 이전 카테고리는 유지를 한다.
			if (!channelData[currentChannelDataIndex] && !channelData[channelIndex]) {
				currentChannelDataIndex = channelIndex;
				return false;
			}

			// 같은 카테고리를 호출하지 않을때만 이전 카테고리 정보를 갱신한다.
			if (currentChannelDataIndex !== channelIndex) {
				prevChannelDataIndex = currentChannelDataIndex;

				currentChannelDataIndex = channelIndex;
			}

			// [+등록] 으로 이동하였을 경우 이전 정보는 무시하지만 현재 정보는 넣는다.
			if (!channelData[channelIndex]) {
				currentChannelDataIndex = channelIndex;
				return false;
			}

			// 동일한 카테고리로 전환하려고 하면 막는다.
			// changeOptions : 보기 방식 전환이랑 관련 있다. 보기 방식 전환인 경우 무조건 true 혹은 object 를 값으로 들어온다. 물론 꼼수다.
			// exitEditMode 인 경우에도 true로 들어온다...물론 꼼수다...하~
			// if (!changeOptions && Main.initialized) {
			// 	return false;
			// }

			// 이전 채널로 넣을 것만 넣자는 의미.
			// if (prevChannelDataIndex !== currentChannelDataIndex && channelIndex !== currentChannelDataIndex && channelData[channelIndex] && channelData[currentChannelDataIndex]) {
			// 	prevChannelDataIndex = currentChannelDataIndex;
			// }

			tempChannelData = Utils.clone(channelData);

			currentChannelDataIndex = channelIndex;
			currentChannelDatum = tempChannelData[channelIndex];

			if (changeOptions && typeof changeOptions === 'object') {
				Utils.change(currentChannelDatum.channels, changeOptions.target1, changeOptions.target2);
			}

			currentSubChannelDataIndex = subChannelIndex || 0;
			currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];

			initializeSubChannel(currentChannelDatum, subChannelIndex);
		}, 1, function() {
			return !Main.isEditMode;
		});

		eventBus.register(me, 'changedViewMode', function(viewMode) {
			var realSubChannelDataIndex = me.getRealSubChannelDataIndex(currentSubChannelDataIndex);

			// 포커싱된 서브 채널을 가리키면 된다.
			if (viewMode === ViewMode.STANDARD) {
				eventBus.fire('changeCategory', currentChannelDataIndex, realSubChannelDataIndex, true);
			} else {
				// 무조건 포커싱된 놈이 주채널이고 포커스 대상이다.
				eventBus.fire('changeCategory', currentChannelDataIndex, 0, {
					target1: 0,
					target2: realSubChannelDataIndex
				});
			}
		});

		me.getRealSubChannelDataIndex = function(subChannelIndex) {
			var targetSubChannelDatum = currentChannelDatum.channels[subChannelIndex],
				originalSubChannelData = channelData[currentChannelDataIndex].channels;

			for (var i = 0, length = originalSubChannelData.length; i < length; i++) {
				if (targetSubChannelDatum.no === originalSubChannelData[i].no && targetSubChannelDatum.type === originalSubChannelData[i].type) {
					return i;
				}
			}

			return channelData[currentChannelDataIndex].channels.indexOf(targetSubChannelDatum);
		};

		me.__defineGetter__('prevChannelDataIndex', function() {
			return prevChannelDataIndex;
		});

		me.__defineGetter__('channelData', function() {
			return tempChannelData;
		});

		me.__defineGetter__('currentChannelDatum', function() {
			return currentChannelDatum;
		});

		me.__defineGetter__('currentChannelDataIndex', function() {
			return currentChannelDataIndex;
		});

		me.__defineGetter__('currentSubChannelDatum', function() {
			return currentSubChannelDatum;
		});

		me.__defineGetter__('currentSubChannelDataIndex', function() {
			return currentSubChannelDataIndex;
		});

		me.__defineGetter__('defaultChannelData', function() {
			return servicedChannelData;
		});
	}
});
'use strict';

App.defineClass('MultiView.app.channelDataManager.EditModeChannelDataManager', {

	_construct: function(eventBus) {
	
		var me = this,

			channelData,

			currentChannelDatum,
		
		    currentChannelDataIndex = 0,
		
		    currentSubChannelDataIndex = 0,
		    
		    /**
		     * 서브 채널에 대한 정보를 수정한다.
		     * @param  {Object} channelDatum [description]
		     * @param  {Number} index        [description]
		     */
		    initializeSubChannel = function (channelDatum) {
				var j, jLength, limitType;
				
				for (j = 0, jLength = channelDatum.channels.length; j < jLength; j++) {
					
					limitType = STBService.getLimitType(channelDatum.channels[j]);
					
					channelDatum.channels[j].limitType = limitType;
				}
			};

		eventBus.register(me, 'tuneMosaicChannel', function (subChannelDatum) {
			currentChannelDatum.channels[currentSubChannelDataIndex] = subChannelDatum;
			subChannelDatum.limitType = STBService.getLimitType(subChannelDatum);
		}, 1);

		eventBus.register(me, 'enterEditMode', function (channelDatum, subChannelDataIndex, channelDataIndex) {
			if (channelDatum) {
				currentChannelDatum = channelDatum;
			} else {
				currentChannelDatum = STBService.getFavoriteList();
			}

			// id 가 존재 하지 않는다면, 어떤 경로로 들어오든 유저 채널 수정 이 아니다. 이름을 지어준다.
			if (!currentChannelDatum.id) {
				currentChannelDatum.name = (function() {
		    		var nextIndex = UserChannelService.getUserChannels().length + 1;

		    		return '마이 채널 ' + nextIndex;

		    	})();
			}

			channelData = [currentChannelDatum];

			currentChannelDataIndex = channelDataIndex;

			currentSubChannelDataIndex = subChannelDataIndex || 0;

			initializeSubChannel(currentChannelDatum);

			eventBus.fire('changeCategory', 0, currentSubChannelDataIndex);
		});

		EventBus.register(me, 'changeSubToMain', function (targetIndex) {
			var targetChannels = channelData[0].channels;
			
			Utils.change(targetChannels, 0, targetIndex);
			
			initializeSubChannel(channelData[0]);
		}, 1, function() {
			return Main.isEditMode;
		});
		
		eventBus.register(me, 'moveFocus', function (from, to) {
			// 같은 영역에서의 동작일때만 영향을 끼친다.
			if (to.focusType === FocusType.VIDEO && from.focusType === FocusType.VIDEO) {
				currentSubChannelDataIndex = to.index;
				
			}
		}, 1, function() {
			return Main.isEditMode;
		});

		me.__defineGetter__('channelData', function() {
			return channelData;
		});
		
		me.__defineGetter__('currentChannelDatum', function() {
			return currentChannelDatum;
		});

		me.__defineGetter__('currentChannelDataIndex', function() {
			return currentChannelDataIndex;
		});

		me.__defineGetter__('currentSubChannelDatum', function() {
			return currentChannelDatum.channels[currentSubChannelDataIndex];
		});

		me.__defineGetter__('currentSubChannelDataIndex', function() {
			return currentSubChannelDataIndex;
		});
		
	}
});
'use strict';


App.defineClass('MultiView.app.ChannelDataManager', {

	_construct: function(eventBus) {
		var me = this,

			viewModeChannelDataManager = MultiView.app.channelDataManager.ViewModeChannelDataManager.create(eventBus),

			editModeChannelDataManager = MultiView.app.channelDataManager.EditModeChannelDataManager.create(eventBus),

			getChannelDataManager = function() {
				if (Main.isEditMode) {
					return editModeChannelDataManager;
				} else {
					return viewModeChannelDataManager;
				}
			};

		me.equal = function (channelDatum1, channelDatum2) {

			if (!channelDatum1 || !channelDatum2) {
				return false;
			}

			if (channelDatum1.id !== channelDatum2.id) {
				return false;
			}

			// if (channelDatum1.name !== channelDatum2.name) {
			// 	return false;
			// }

			if (channelDatum1.isFixed !== channelDatum2.isFixed) {
				return false;
			}

			for (var i =0; i < 4; i++) {
				if (channelDatum1.channels[i].id !== channelDatum2.channels[i].id) {
					return false;
				}

				if (channelDatum1.channels[i].name !== channelDatum2.channels[i].name) {
					return false;
				}

				if (channelDatum1.channels[i].no !== channelDatum2.channels[i].no) {
					return false;
				}
			}

			return true;
		};

		me.indexOf = function (channelDatum) {
			var i, length;

			for (i = 0, length = viewModeChannelDataManager.channelData.length; i < length; i++) {
				if (me.equal(viewModeChannelDataManager.channelData[i], channelDatum)) {
					return  i;
				}
			}

			return -1;
		};

		me.__defineGetter__('servicedChannelData', function() {
			return viewModeChannelDataManager.channelData;
		});			

		me.__defineGetter__('prevChannelDataIndex', function() {
			return viewModeChannelDataManager.prevChannelDataIndex;
		});
		
		me.__defineGetter__('channelData', function() {
			return getChannelDataManager().channelData;
		});

		me.__defineGetter__('currentChannelDatum', function() {
			return getChannelDataManager().currentChannelDatum;
		});

		me.__defineGetter__('currentChannelDataIndex', function() {
			return getChannelDataManager().currentChannelDataIndex;
		});

		me.__defineGetter__('currentSubChannelDatum', function() {
			return getChannelDataManager().currentSubChannelDatum;
		});

		me.__defineGetter__('currentSubChannelDataIndex', function() {
			return getChannelDataManager().currentSubChannelDataIndex;
		});

		me.__defineGetter__('defaultChannelData', function() {
			return viewModeChannelDataManager.defaultChannelData;
		});
		
	}
});
'use strict';

App.defineClass('MultiView.app.UiRenderer', {

	_construct: function (eventBus) {
		var me = this;
		
		me.eventBus = eventBus;
		
		// ViewPort Defining
		me.viewPort = document.querySelector('#viewPort');
		
		me.viewPort.className = Main.viewMode;
		
		// A/V Area Defining
		me.display = MultiView.components.Display.create(eventBus);
		
		me.viewPort.appendChild(me.display.element);
		
		me.display.show();
		
		// Edit Button
		me.editButton = MultiView.components.EditButton.create(eventBus);
		
		// Menu Dialog
		me.menuDialog = MultiView.components.MenuDialog.create(eventBus);
		
		// Empty Dialog
		me.emptyDialog = MultiView.components.EmptyDialog.create(eventBus);
		
		// Message Dialog
		me.messageDialog = MultiView.components.MessageDialog.create(eventBus);

		// Registration Dialog
		me.regDialog = MultiView.components.RegDialog.create(eventBus);
		
		// Event registerd
		me.registerEventActors();

		// 5ch button
		if (Main.enable5chTrigger && STBService.support5chMosaicWindow() && !(Main.isEditMode)) {
			me.switchChannel = MultiView.components.SwitchChannel.create(eventBus);	
		}

		// Define Read Only Properties
		me.__defineGetter__('visibledMenu', function() {
			return me.menu.visible;
		});

		me.__defineGetter__('visibledRegButtonBar', function() {
			return me.registrationButtonBar.visible;
		});
		
		me.__defineGetter__('visibledMenuDialog', function() {
			return me.menuDialog.visible;
		});
		
		me.__defineGetter__('visibledEmptyDialog', function() {
			return me.emptyDialog.visible;
		});

		me.__defineGetter__('focusedEmptyDialog', function() {
			return me.emptyDialog.focused;
		});

		me.__defineGetter__('visibledRegDialog', function() {
			return me.regDialog.visible;
		});
		
	},

	registerEventActors: function() {
		var me = this;
		
		me.eventBus.register(me, 'changedViewMode', function(viewMode) {
			
			if (ChannelDataManager.currentChannelDatum.isFixed) {
				me.viewPort.className = ViewMode.STANDARD;
			} else {
				me.viewPort.className = viewMode;
			}
		});
		
		me.eventBus.register(me, 'changeCategory', function() {
			
			if (ChannelDataManager.currentChannelDatum.isFixed) {
				me.viewPort.className = ViewMode.STANDARD;
			} else {
				me.viewPort.className = Main.viewMode;
			}
		}, 2);
		
		me.eventBus.register(me, 'initializedChannelData', function() {
			me.menu = MultiView.components.Menu.create(me.eventBus);
			me.menu.initialize();
			
			me.registrationButtonBar = MultiView.components.RegistrationButtonBar.create(me.eventBus);
		});	

		me.eventBus.register(me, 'destroyApp', function() {
			document.querySelector('#viewPort').style.display = 'none';
		}, 1);
		
	}
});

'use strict';

App.defineClass('MultiView.app.STBService', {

	_construct: function(eventBus) {

		var me = this,

			channelConfig = window.oipfObjectFactory.createChannelConfig(),

			appConfiguration = window.oipfObjectFactory.createConfigurationObject().configuration,

			supportSkyLife,

			sdChannels = {
				otv: [],
				ots: []
			},

			channelsForSID = {
				otv: {},
				ots: {}
			},

			skippedChannels,

			channels = (function() {
				var i, length, stbChannels, channels;

				channels = {
					otv: {},
					ots: {}
				};

				// stbChannels = channelConfig.channelList;
				stbChannels = (function() {
					var channels;
					// SKyLife 인 경우 다른 곳에서 채널 리스트를 가지고 온댄다.
					supportSkyLife = App.commons.Utils.toBoolean(appConfiguration.getText('skylife_support'));

					if (supportSkyLife) {
						channels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SATELLITE'));
						skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SKIP'));
					} else {
						channels = Utils.toArray(channelConfig.channelList);
						skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKIPPED'));
					}

					skippedChannels.forEach(function (channel) {
						console.log(channel.isHidden);
					});

					// 일시 주석처리?
					// return _.difference(channels, skippedChannels);
					return channels;
				})();

				for (i = 0, length = stbChannels.length; i < length; i++) {

					if (stbChannels[i].idType === Channel.ID_IPTV_SDS || stbChannels[i].idType === Channel.ID_IPTV_URI) {
						channels.otv[stbChannels[i].majorChannel] = stbChannels[i];
						channelsForSID.otv[stbChannels[i].sid] = stbChannels[i];
						if (stbChannels[i].hasSDChannel) {
							sdChannels.otv.push(stbChannels[i]);
						}

					} else if (stbChannels[i].idType === Channel.ID_DVB_S) {
						channels.ots[stbChannels[i].majorChannel] = stbChannels[i];
						channelsForSID.ots[stbChannels[i].sid] = stbChannels[i];
						if (stbChannels[i].hasSDChannel) {
							sdChannels.ots.push(stbChannels[i]);
						}

					}
				}

				sdChannels.otv.reverse();
				sdChannels.ots.reverse();

				return channels;
			})(),

			getProgram = function(channel) {
				var currentTime = parseInt(new Date().getTime() / 1000),
					query, searchManager,
					result = {},
					getPercent = function(startTime, duration) {
						var percent,
							currentTime = parseInt(new Date().getTime() / 1000);

						if (currentTime - parseInt(startTime) < 0) {
							percent = 100;
						} else {
							percent = Math.round((currentTime - parseInt(startTime)) / parseInt(duration) * 100);
						}

						if (percent < 3) {
							percent = 3;
						} else if (percent > 100) {
							percent = 100;
						}

						return percent;

					},

					getAge = function(programInfo) {
						var age = 0,
							siDesc, tmpAge;

						siDesc = programInfo.getSIDescriptors(0x55)[0];

						tmpAge = siDesc.charCodeAt(5);

						if (programInfo.channel.idType === Channel.CHANNEL_ID_IPTV_SDS) {
							// OTV에서는 16세 이하의 나이로 나오면 3세를 추가해야 한다?
							if (tmpAge > 0 && tmpAge <= 16) {
								age = tmpAge + 3;
							}
						} else {
							if (tmpAge < 4) {
								age = 0;
							} else if (tmpAge < 7) {
								age = 7;
							} else if (tmpAge < 10) {
								age = 12;
							} else if (tmpAge < 13) {
								age = 15;
							} else if (tmpAge > 13) {
								age = 19;
							}
						}

						return age;

					};

				if (!channel) {
					return {
						channelName: ChannelDataManager.currentSubChannelDatum.name,
						channelNumber: ChannelDataManager.currentSubChannelDatum.no
					};
				} else {
					result.channelNumber = channel.majorChannel;
					result.channelName = channel.name;
				}

				searchManager = window.oipfObjectFactory.createSearchManagerObject().createSearch(1);

				query = searchManager.createQuery('programme.startTime', 5, currentTime);
				query = query.and(searchManager.createQuery('(programme.startTime + programme.duration)', 2, currentTime));


				searchManager.setQuery(query);
				searchManager.addChannelConstraint(channel);
				searchManager.result.getResults(0, 1);

				if (searchManager.result.length > 0) {
					var programInfo = searchManager.result[0],
						programStartTime = new Date(parseInt(programInfo.startTime) * 1000),
						startTime = App.commons.Utils.fillZero(programStartTime.getHours(), 2) + ':' + App.commons.Utils.fillZero(programStartTime.getMinutes(), 2),
						programEndTime = new Date(parseInt(programInfo.startTime) * 1000 + (parseInt(programInfo.duration) * 1000)),
						endTime = App.commons.Utils.fillZero(programEndTime.getHours(), 2) + ':' + App.commons.Utils.fillZero(programEndTime.getMinutes(), 2);

					result.name = programInfo.name;
					result.percent = getPercent(programInfo.startTime, programInfo.duration);
					result.startTime = startTime;
					result.endTime = endTime;
					result.limitedByAge = limitedAge !== 0 && limitedAge <= getAge(programInfo);
				}

				return result;
			},

			limitedAge = window.oipfObjectFactory.createParentalControl().getParentalRating(),

			isLimitedChannelByAge = function(channel) {
				var program;

				// STB의 연령 설정이 없으면, 제한이 없다.
				if (limitedAge === 0) {
					return false;
				}

				program = getProgram(channel);

				// 프로그램 정보가 존재하지 않는 경우 제한이 없다. 
				if (!program) {
					return false;
				}

				return program.limitedByAge;
			},

			isLimitedChannel = function(channel) {
				var favouriteLists = channelConfig.favouriteLists,
					limitedChannelListBySky = favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_LIMITED'),
					blockedChannelListByUser = favouriteLists.getFavouriteList('favourite:BLOCKED'),
					i, length;

				for (i = 0, length = limitedChannelListBySky.length; i < length; i++) {
					if (channel.ccid === limitedChannelListBySky[i].ccid) {
						return true;
					}
				}

				for (i = 0, length = blockedChannelListByUser.length; i < length; i++) {
					if (channel.ccid === blockedChannelListByUser[i].ccid) {
						return true;
					}
				}

				return false;
			},

			createFavoriteChannelList = function() {
				var toArray = function(channelList) {
						var result = [],
							i, length;

						for (i = 0, length = channelList.length; i < length; i++) {
							result.push(channelList[i]);
						}

						return result;

					},
					favoriteChannelList,
					i, length;

				if (me.getCurrentSTBMode() === STBType.OTV) {
					favoriteChannelList = channelConfig.favouriteLists.getFavouriteList('favourite:FAVORITE');
				} else {
					favoriteChannelList = channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_FAVORITE');
				}

				var filterdFavoriteChannelList = _.values(favoriteChannelList).filter(function(element) {
					return element.hasSDChannel === true;
				});

				// 숨김처리 일시 주석?
				// filterdFavoriteChannelList = _.difference(filterdFavoriteChannelList, skippedChannels);

				if (filterdFavoriteChannelList.length >= 4) {
					return {
						channels: me.convertChannelsToChannelData(filterdFavoriteChannelList.slice(0, 4))
					};
				} else {
					var type = me.getCurrentSTBMode(),
						// 종편, 지상파, 쇼핑 중 채널리스트에 존재하는 것 리턴
						channels = (function () {
							var result = [];
							
							filterdFavoriteChannelList.forEach(function (channel) {
								result.push({
									type: type,
									no: channel.majorChannel
								});
							});

							return result;
						})(),
						channelType = AppConfig.myChannel[type].type,
						channelDatum, channel;

					for (i = 0, length = AppConfig.myChannel[type].channels.length; i < length; i++) {
						channelDatum = AppConfig.myChannel[type].channels[i];

						channel = me.getChannelByConfigInfo({
							type: channelDatum.type || channelType,
							value: channelDatum.value
						});

						if (!channel) {
							continue;
						}

						channels.push({
							type: type,
							no: channel.majorChannel,
							name: channel.name,
							sid: channel.sid
						});

						if (channels.length === 4) {
							break;
						}
					}

					return {
						channels: channels
					};
				}
			},

			keyDownEventReceived = function(e) {
				eventBus.fire('keyDown', e);
			},

			channelTunerProvider = MultiView.channelTuner.ChannelTunerProvider.create(),

			changeAudioChannel = function() {
				channelTuner.changeAudio();
			},

			channelTuner,

			changeCategory = function(index, subChannelDataIndex) {
				var channelDatum = window.ChannelDataManager.channelData[index],
					temp = channelTunerProvider.getInstance(channelDatum);

				if (channelTuner && channelTuner !== temp) {
					channelTuner.release();

				}

				channelTuner = temp;
				channelTuner.changeCategory(index, subChannelDataIndex);

			},

			appManager,

			ownerApp,

			appId,

			fiveChannelNo;

		//			BMT_APP_ID = 13896,

		//			LIVE_APP_ID = 12870,


		eventBus.register(this, 'completeInitializing', function() {

			appManager = window.oipfObjectFactory.createApplicationManagerObject();

			ownerApp = appManager.getOwnerApplication(window.document);

			appId = appManager.discoveredAITApplications[0] ? appManager.discoveredAITApplications[0].appId : undefined;

			ownerApp.onApplicationDestroyRequest = function() {
				console.log('called onApplicationDestroyRequest');

				var mainArea = document.querySelector('#viewPort');
				mainArea.style.display = 'none';
				RPCService.sendEndMessage();

				channelTuner.release();

			};

			var aKeySet = ownerApp.privateData.keyset;

			var keySet = (aKeySet.RED + aKeySet.GREEN + aKeySet.NAVIGATION + aKeySet.NUMERIC + aKeySet.OTHER);

			aKeySet.setValue(keySet, [global.VK_CHANNEL_UP, global.VK_CHANNEL_DOWN]);

			ownerApp.onKeyDown = keyDownEventReceived;

			window.document.addEventListener('keydown', keyDownEventReceived);

			ownerApp.show();
			ownerApp.activateInput(true);
		});			
		
		eventBus.register(this, 'notRecievedPKGList', function() {
			appManager = window.oipfObjectFactory.createApplicationManagerObject();

			ownerApp = appManager.getOwnerApplication(window.document);

			ownerApp.onApplicationDestroyRequest = function() {
				console.log('called onApplicationDestroyRequest');

				var mainArea = document.querySelector('#viewPort');
				mainArea.style.display = 'none';
				RPCService.sendEndMessage();
			};

			var aKeySet = ownerApp.privateData.keyset;

			var keySet = (aKeySet.RED + aKeySet.GREEN + aKeySet.NAVIGATION + aKeySet.NUMERIC + aKeySet.OTHER);

			aKeySet.setValue(keySet, [global.VK_CHANNEL_UP, global.VK_CHANNEL_DOWN]);

			document.querySelector('#alarm').style.display = 'block';

			var keyDown = function(e) {
				if (e.keyCode === global.VK_ENTER) {
					eventBus.fire('destroyApp');
				}
			};

			ownerApp.onKeyDown = keyDown;

			window.document.addEventListener('keydown', keyDown);

			ownerApp.show();
			ownerApp.activateInput(true);
		});

		eventBus.register(me, 'initializedChannelData', function(currentChannelDatum) {

			document.querySelector('body').removeChild(document.getElementById('tempObject'));
			document.querySelector('#viewPort').style.display = 'block';


			// 현재 STB 의 채널과 ChannelData 의 채널이 맞지 않으면 채널을 이동시킨다.
			// 4k 멀티 채널의 메인 채널이 HD OTV 이므로, UHD STB 로 접속했을때를 대비한 것이다.
			eventBus.fire('changeCategory', ChannelDataManager.channelData.indexOf(currentChannelDatum));
		});


		eventBus.register(me, 'moveFocus', function(from, to) {
			if (MultiView.enums.FocusMovingType.getType(from.focusType, to.focusType) === FocusMovingType.VIDEO_TO_VIDEO) {
				changeAudioChannel(ChannelDataManager.currentSubChannelDataIndex, me.getLimitType(ChannelDataManager.currentSubChannelDatum));
			}
		}, 999);

		eventBus.register(me, 'changeCategory', changeCategory);

		eventBus.register(me, 'changedCategory', function() {
			// HD -> UHD 로 변경할 때에는 변경이 된 후에 channelTuner를 변경한다.
			// 일단 미들웨어 차원에서 해결해야 할 문제라 생각되므로 앱에서는 가만히 냅둔다.
			//		   	if (ChannelDataManager.currentChannelDatum.isUHD) {
			//		   		document.querySelector('object').className = 'uhdVideo';
			//		   		document.querySelector('object').className = 'uhdVideo after';
			//		   	} else if (ChannelDataManager.currentChannelDatum.isFixed) {
			//		   		document.querySelector('object').className = 'video';
			//		   		document.querySelector('object').className = 'video after';
			//		   	}
		});

		eventBus.register(me, 'changedViewMode', function() {
			channelTuner.release();
		}, 1);

		eventBus.register(me, 'goChannel', function() {
			var channel = me.getChannel(ChannelDataManager.currentSubChannelDatum);

			// 해당 채널이 존재하지 않을 경우 이동 시키지 않는다. 
			if (channel) {
				channelTuner.release();

				var tempVideoObject = global.oipfObjectFactory.createVideoBroadcastObject();

				tempVideoObject.className = 'video';

				document.querySelector('body').appendChild(tempVideoObject);

				tempVideoObject.setChannel(channel, true);


				// 채널 이동의 딜레이가 되는 경우가 있으므로, 명시적으로 앱을 종료 시킨다.

				ownerApp.destroyApplication();
			}
		});

		eventBus.register(me, 'going5ch', function() {
			console.log('eventBus going5ch');
			var channel = me.getChannel({
				type: 'otv',
				no: fiveChannelNo
			});
			if (channel && (document.getElementById('sportChannel').style.display !== 'none')) {

				channelTuner.release();

				var tempVideoObject = global.oipfObjectFactory.createVideoBroadcastObject();

				tempVideoObject.className = 'video';

				document.querySelector('body').appendChild(tempVideoObject);

				tempVideoObject.setChannel(channel, true);

				// 채널 이동의 딜레이가 되는 경우가 있으므로, 명시적으로 앱을 종료 시킨다.

				ownerApp.destroyApplication();
			}

		});

		eventBus.register(me, 'mute', function(isOn) {
			channelTuner.mute(isOn);
		});

		eventBus.register(me, 'destroyApp', function() {
			var obs = appManager.findApplications('dvb.appId', '4e30.3000')[0];
			obs.window.postMessage({
				'method': 'obs_setPromoChannel'
			}, '*');
			obs.window.postMessage({
				'method': 'obs_startUnboundApplication',
				'target': '4e30.3001'
			}, '*');

			// AppId 가 존재한다면, 채널을 타고 온 BoundApp 이라는 의미.
			// 존재하지 않다면, 개발모드 이므로 명시적으로 앱을 종료시킨다.
			// if (!appId) {
				// ownerApp.destroyApplication();
			// }
		});

		me.support5chMosaicWindow = function() {
			/*OTV SMART STB인 경우에도 OnGoingGame 실행하도록 수정 By 문상현*/
//			return me.isUHDDevice() && me.getConfigBy('mosaic_count') === '5';
			return true;
		};

		me.isUHDDevice = function() {
			return !me.isOTSDevice() && App.commons.Utils.toBoolean(me.getConfigBy('support.uhd'));
		};

		me.getChannel = function(channelDatum, isSDChannel) {
			var channelProperty = channelDatum.type === STBType.OTS ? STBType.OTS : STBType.OTV;

			if (isSDChannel && channels[channelProperty][channelDatum.no] && !channels[channelProperty][channelDatum.no].hasSDChannel) {
				return;
			}

			return channels[channelProperty][channelDatum.no];
		};

		me.getChannelByConfigInfo = function(obj) {
			if (obj.type === 'sid') {
				return me.getChannelBySid(obj.value);
			} else {
				return me.getChannel({
					type: me.getCurrentSTBMode(),
					no: obj.value
				});
			}
		};

		me.getChannelBySid = function(sid) {
			var type = me.getCurrentSTBMode();

			return channelsForSID[type][sid];
		};

		me.getChannels = function() {
			return channels;
		};

		me.getCurrentChannel = function() {
			return channelConfig.currentChannel;
		};

		me.isOTSMode = function() {
			return me.getCurrentSTBMode() === 'ots';
		};

		me.isOTVMode = function() {
			return me.getCurrentSTBMode() === 'otv';
		};

		me.isOTSDevice = function() {
			if (typeof supportSkyLife === 'undefined') {
				supportSkyLife = App.commons.Utils.toBoolean(me.getConfigBy('skylife_support'));
			}
			return supportSkyLife;
		};

		me.getSTBType = function() {
			if (me.isOTSDevice()) {
				return STBType.OTS;
			} else if (me.isUHDDevice()) {
				return STBType.UHD;
			} else {
				return STBType.OTV;
			}
		};

		me.getCurrentSTBMode = function() {
			if (me.isOTSDevice() && Object.keys(channels.ots).length > 0) {
				return 'ots';
			}

			return 'otv';
		};

		me.getConfigBy = function(key) {
			return appConfiguration.getText(key);
		};

		me.getProgramByIndex = function(index) {
			var channel = me.getChannel(ChannelDataManager.currentChannelDatum.channels[index]);
			return getProgram(channel);
		};

		me.getLimitType = function(channelDatum) {
			var channel = me.getChannel(channelDatum);

			if (!channel || isNotExistChannel(channel.majorChannel)) {
				return LimitType.NOT_EXIST;
			}

			if (isLimitedChannel(channel)) {
				return LimitType.LIMITED;
			}

			if (isLimitedChannelByAge(channel)) {
				return LimitType.AGE;
			}

			return LimitType.NONE;
		};

		me.__defineGetter__('appId', function() {
			return appId;
		});

		me.getSDChannels = function() {
			if (me.isOTVMode()) {
				return sdChannels.otv;
			} else {
				return sdChannels.ots;
			}
		};

		me.getSDChannelsForDisplayItem = function(channelDatum) {
			var channelLength = (function() {
					if (Main.viewMode === ViewMode.STANDARD || ChannelDataManager.currentChannelDatum.isFixed) {
						return 5;
					} else if (Main.viewMode === ViewMode.MAIN_SUB && ChannelDataManager.currentSubChannelDataIndex === 0) {
						return 7;
					} else {
						return 3;
					}
				})(),
				targetChannel = me.getChannel(channelDatum),
				index = sdChannels[me.getCurrentSTBMode()].indexOf(targetChannel),
				startIndex = index - ((channelLength - 1) / 2),
				endIndex = startIndex + channelLength,
				isEmptyBefore = false,
				fillArrayToEmptyObject = function(array, totalCnt, isBefore) {

					if (array.length === totalCnt) {
						return array;
					}

					var tempArray = [],
						sdChannels = me.getSDChannels(),
						emptyCnt = totalCnt - array.length,
						i;



					if (isBefore) {
						i = sdChannels.length;

						tempArray = sdChannels.slice(i - emptyCnt, sdChannels.length);

						return tempArray.concat(array);
					} else {
						tempArray = sdChannels.slice(0, emptyCnt);

						return array.concat(tempArray);
					}


				};

			if (startIndex < 0) {
				startIndex = 0;
				isEmptyBefore = true;
			}

			return me.convertChannelsToChannelData(
				fillArrayToEmptyObject(sdChannels[me.getCurrentSTBMode()].slice(startIndex, endIndex), channelLength, isEmptyBefore)
			);
		};

		me.convertChannelToChannelDatum = function(channel) {
			return me.convertChannelsToChannelData(channel)[0];
		};

		me.convertChannelsToChannelData = function(channels) {
			var targetChannels = Array.isArray(channels) ? channels : [channels],
				result = [],
				i, length, channel,
				getType = function(idType) {
					if (idType === Channel.ID_IPTV_SDS || idType === Channel.ID_IPTV_URI) {
						return STBType.OTV;
					} else {
						return STBType.OTS;
					}
				};

			for (i = 0, length = targetChannels.length; i < length; i++) {
				channel = targetChannels[i];
				result.push({
					no: channel.majorChannel,
					name: channel.name,
					ccid: channel.ccid,
					sid: channel.sid,
					tsid: channel.tsid,
					type: getType(channel.idType)
				});
			}

			return result;
		};

		me.getFavoriteList = function() {
			if (!me.favoriteChannelList) {
				me.favoriteChannelList = createFavoriteChannelList();
			}

			return Utils.clone(me.favoriteChannelList);
		};

		me.setFiveChannelNo = function(no) {
			fiveChannelNo = no;
		};

		// 5월 중 신규 SD채널 스크램블 설정이 되어지면 삭제될 코드 (start)
		// isNotExistChannel 호출하는 getLimitType 메소드도 수정 되어야 한다.

		var unavailableChannelList = [],
			isNotExistChannel = function(channelNumber) {
				return unavailableChannelList.indexOf(channelNumber) > -1;
			};

		me.__defineGetter__('unavailableChannelList', function() {
			return unavailableChannelList;
		});

		me.setPackageList = function(packageList) {
			var pkgList = Array.isArray(packageList) ? packageList : [packageList],
				packageInfos = AppConfig.packages[me.getCurrentSTBMode()],
				channelType = packageInfos.type;

			unavailableChannelList =  _(packageInfos.channels).map(function (info) {
				return info.value.split(',');
			}).flatten().uniq().map(function (str) {
				var channel = me.getChannelByConfigInfo({
					type: channelType,
					value:Utils.toNumber(str)
				});
				return channel ? channel.majorChannel : undefined;
			}).value();

			var availableChannelList = _(packageInfos.channels).filter(function(obj) {
				var exist = _(pkgList).map(function(pkg) {
					return pkg.pkgCode;
				}).filter(function(pkgCode) {
					return pkgCode === obj.id;
				}).first();
				return typeof exist !== 'undefined';
			}).map(function(obj) {
				return _(obj.value.split(',')).map(function(value) {
					if (channelType === 'no') {
						return Utils.toNumber(value);
					} else {

						var channel = me.getChannelBySid(Utils.toNumber(value));
						return channel.majorChannel;
					}
				}).value();
			}).flatten().uniq().value();

			unavailableChannelList = _.difference(unavailableChannelList, availableChannelList);

			console.log('unavailableChannelList', unavailableChannelList);
		};

		// 5월 중 신규 SD채널 스크램블 설정이 되어지면 삭제될 코드 (end)

	}
});
'use strict';

/**
 * [_construct description]
 * @type {[type]}
 */
App.defineClass('MultiView.app.UserChannelService', {

	_construct : function() {
		var me = this;

		/**
		 * [userChannels description]
		 * @type {Array}
		 */
		 me._initUserChannels();
	},

	clearAll: function () {
		localStorage.clear();
	},

	_initUserChannels: function() {
		var me = this,
			savedUserChannels = JSON.parse(localStorage.getItem(me.storageKey));

		if (Array.isArray(savedUserChannels)) {

			me._bindChannelNumber(savedUserChannels);

			me.userChannels = savedUserChannels;
		} else {
			me.userChannels = [];
		}
	},

	_bindChannelNumber: function(channelData) {
		var i, j, length, channelDatum, subChannelDatum, channel;

		for (i = 0, length = channelData.length; i < length; i++) {
			channelDatum = channelData[i];

			for(j = 0; j < 4; j++) {
				subChannelDatum = channelDatum.channels[j];

				channel = STBService.getChannelBySid(subChannelDatum.sid);

				// 채널 리스트에 해당 채널이 존재할때만 no 를 넣는다.
				// 없다면 등록시의 no 를 그대로 하되, 존재하지 않으므로 미등록 채널로 블럭될 것으로 기대된다.
				if (channel) {
					subChannelDatum.no = channel.majorChannel;	
				}
			}

		}
	},

	storageKey: 'userChannels',
	
	getUserChannels: function() {
		return this.userChannels;
	},

	_isValidForMaxLength: function(channelDatum) {
		if (channelDatum.name.length > 10) {
			throw new Error('Max Length');
		}
	},

	_isValidForDuplicatedName: function(channelDatum) {
		var i, length;

		for (i = 0, length = ChannelDataManager.servicedChannelData.length; i < length; i++) {

			if (typeof channelDatum.id !== 'undefined' && ChannelDataManager.servicedChannelData[i].id === channelDatum.id) {
				continue;
			}

			if (channelDatum.name.trim() === ChannelDataManager.servicedChannelData[i].name) {
				throw new Error('Duplicated Name');
			}
		}

		return true;
	},

	_isValidForMinLength: function (channelDatum) {
		if (!channelDatum.name || channelDatum.name.trim().length === 0) {
			throw new Error('Min Length');
		}
	},

	valid: function (channelDatum) {
		var me = this;

		me._isValidForMinLength(channelDatum);

		me._isValidForMaxLength(channelDatum);

		me._isValidForDuplicatedName(channelDatum);

		return true;
	},

	saveUserChannel: function (channelDatum, success, failure) {
		var me = this,
			modify = typeof channelDatum.id !== 'undefined';

		me._bindSID(channelDatum.channels);

		try {

			me.valid(channelDatum);

			if (!modify) {
				me._addUserChannel(channelDatum);
			} else {
				me._modifyUserChannel(channelDatum);
			}	
		} catch (e) {
			failure(e);
			return;
		}

		success();
	},

	_bindSID: function(subChannelData) {
		var i, length, subChannelDatum;

		for (i = 0, length = subChannelData.length; i < length; i++) {
			subChannelDatum = subChannelData[i];

			if (!subChannelDatum.sid) {
				var channel = STBService.getChannel(subChannelDatum);

				// 기본제공 되는 채널이 송출이 안되는 경우 해당 채널을 저장이 시도되는 케이스가 있다.
				// 예) 영화 장르에서 Sky Drama 는 기본 제공되는 채널이지만, 송출이 안된다고 하고 해당 채널을 변경안하고 저장이 되는 경우
				//     sid 를 가지고 올수 없다. 이경우 그냥 비워두도록 한다.
				// 채널이 존재한다면 sid 를 넣도록 한다.
				if (channel) {
					subChannelDatum.sid = channel.sid;	
				}
				
			}
		}

	},
	
	_addUserChannel: function(userChannel) {
		var me = this;

		if (!me._isValid(userChannel)) {
			throw new Error('Bad Request');
		}

		userChannel.id = Utils.generateUUID();

		me.userChannels.push(userChannel);

		me._applyLocalStorage();
		
	},
	
	_isValid: function(userChannel, modify) {

		var hasDuplicatedChannelNumber = function (channels) {
				var i, length, channelNumbers = [];
				for (i = 0, length = channels.length; i < length; i++) {
					if (channelNumbers.indexOf(channels[i].no) > -1) {
						return true;
					}
					channelNumbers.push(channels[i].no);
				}

				return false;
			};

		if (modify && !userChannel.id) {
			return false;
		}

		if (!userChannel || !userChannel.name ) {
			return false;
		}

		if (!Array.isArray(userChannel.channels) || userChannel.channels.length !== 4) {
			return false;
		}

		// TODO 일단 중복 허용?
		// if (hasDuplicatedChannelNumber(userChannel.channels)) {
		// 	return false;
		// }

		return true;
	},

	_modifyUserChannel: function(userChannel) {
		var me = this;

		if (!me._isValid(userChannel, true)) {
			throw new Error('Bad Request');
		}

		var originalUserChannel = me.getUserChannelBy(userChannel.id);

		if (!originalUserChannel) {
			throw new Error('Not Found');
		}
		
		me.userChannels[me.getUserChannelIndexBy(originalUserChannel)] = userChannel;

		me._applyLocalStorage();
	},

	getUserChannelIndexBy: function(value) {
		var me = this;

		if (typeof value === 'string') {
			return me.userChannels.indexOf(me.getUserChannelBy(value));
		} else if (typeof value === 'object') {
			return me.userChannels.indexOf(value);
		}

		return -1;
	},

	getUserChannelBy: function(value) {
		var me = this,
			matchedById = false, 
			matchedByIndex = false,
			i, length;

		for (i = 0, length = me.userChannels.length; i < length; i++) {

			matchedById = typeof value === 'string' && me.userChannels[i].id === value;
			matchedByIndex = typeof value === 'number' && i === value;
			if (matchedById || matchedByIndex) {
				return me.userChannels[i];
			}
		}
	},

	removeUserChannel: function(id) {
		var me = this,
			originalUserChannelIndex = me.getUserChannelIndexBy(id);

		if (originalUserChannelIndex === -1) {
			throw new Error('Not Found');
		}

		me.userChannels.splice(originalUserChannelIndex, 1);

		me._applyLocalStorage();
	},

	_applyLocalStorage: function() {
		var me = this;
		localStorage.setItem(me.storageKey, JSON.stringify(me.userChannels));
	}
	
	
});
'use strict';
App.defineClass('MultiView.app.RPCService', {
    _construct: function() {
        /**
         * 최대 HTTP Get 재요청 횟수
         * @type {Number}
         */
        var me = this,
            /**
             * xhr 의 timeout 프로퍼티 설정값
             * @type {Number} 단위 ms
             */
            waitTime = 3000,
            /**
             * [requestCount description]
             * @type {Number}
             */
            requestCount = 0,
          
            getTimeStamp = function() {
                var a = new Date(),
                    result = [],
                    leadingZeros = function(a, c) {
                        var b = '', d;
                        a = a.toString();
                        if (a.length < c) {
                            for (d = 0; d < c - a.length; d++) {b += '0';}
                        }
                        return b + a;
                    };
                result.push(leadingZeros(a.getFullYear(), 4));
                result.push(leadingZeros(a.getMonth() + 1, 2));
                result.push(leadingZeros(a.getDate(), 2));
                result.push(leadingZeros(a.getHours(), 2));
                result.push(leadingZeros(a.getMinutes(), 2));
                result.push(leadingZeros(a.getSeconds(), 2));
                return result.join('');
            },
            usageId,
            startTime,
            /**
             *
             * @param type
             */
            sendMessageTo = function(type) {
                var xhr = new XMLHttpRequest(),
                    saId = STBService.getConfigBy('SAID'),
                    sid = 'ITV4CHSVC',
                    /* var sid = v.getChannelConfig().currentChannel.sid; */
                    host = 'http://webui.ktipmedia.co.kr:8080/rp-api/',
                    WMOCKey = 'ChMulti',
                    url, data;
                if (type === 'start') {
                    url = 'start-service';
                    startTime = getTimeStamp();
                    data = 'WMOCKey=' + WMOCKey + '&saId=' + saId + '&pinNo=&serviceId=' + sid + '&startTime=' + startTime;
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            var result = JSON.parse(xhr.responseText);
                            if (typeof result.usageId !== 'undefined') {
                                usageId = result.usageId;
                            }
                        }
                    };
                } else {
                    if (usageId !== 0) {
                        url = 'end-service';
                        data = 'WMOCKey=' + WMOCKey + '&usageId=' + usageId + '&endTime=' + getTimeStamp();
                        usageId = 0;
                    } else {
                        url = 'create-service';
                        data = 'WMOCKey=' + WMOCKey + '&saId=' + saId + '&pinNo=&serviceId=' + sid + '&startTime=' + startTime + '&endTime=' + getTimeStamp();
                        usageId = 0;
                    }
                }
                xhr.open('POST', host + url, true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xhr.send(data);
            },

            triggerUrl,

            onGoingGame = function(callback) {
                var xhr = new XMLHttpRequest(),
                    saId = STBService.getConfigBy('SAID'),
                    host = triggerUrl,
                    url, data;

                url = '/mashup_baseball/ongoingGame';
//                url = '/ongoingGame';
                
                data = 'said=' + saId + '&stb_type=1&tv_type=1&mashup_id=' + AppConfig.fiveChannel.id;
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback(JSON.parse(xhr.responseText));
                    }
                };
                xhr.timeout = 10000;
            
                xhr.ontimeout = function() {
                    callback({result: 'FALSE'});
                };
                console.log(url + "?" + data)
                xhr.open('GET', host + url + "?" + data, true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xhr.send(data);
            };

        me.goingGameinterval = function(callback) {
            onGoingGame(callback);
        };

        me.sendEndMessage = function(callback) {
            sendMessageTo('end', callback);
        };
        me.sendStartMessage = function(callback) {
            sendMessageTo('start', callback);
        };
        /**
         * @param Multi
         *            Channel 의 Json 객체를 파라미터로 넣어주는 함수
         */
        me.loadAppConfig = function(callback) {
            var channelDataFileName = 'appConfig.xml',
                url = channelDataFileName + '?t=' + Math.random(), //getUrlForCurrentChannel(channelDataFileNam/e),//STBService.currentChannel, channelDataFileName), 
                //url = getUrlForCurrentChannel(STBService.getCurrentChannel(), channelDataFileName),
                xhr = new XMLHttpRequest(),
                dom;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                   console.log('loaded'); 
                }

                if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)) {
                    var responseText = xhr.responseText;
                    xhr.abort();
                    requestCount = 0;
                    App.commons.Timer.end('xhr loading');
                    if (callback) {
                        console.log(responseText);
                        callback(Utils.convertXmlToJson(responseText, 'multiView'));
                    }
                } else if (xhr.readyState === 4 && xhr.status === 404) {
                    console.log('404 error');
                    xhr.abort();
                    xhr.open('GET', channelDataFileName);
                    xhr.send(null);
                } else if (xhr.readyState === 4 && xhr.status === 0) {
                    console.log('waring');
                }
            };
                      xhr.timeout = waitTime;
            
                      xhr.ontimeout = function() {
                         xhr.abort();
                         xhr.open('GET', channelDataFileName);
                         xhr.send(null);
                      };
            App.commons.Timer.start('xhr loading');
            xhr.open('GET', url, true);
            xhr.send(null);
        };

        me.setFiveChannelTriggerUrl = function (url) {
            triggerUrl = url;
        };
        
        me.getPKGList = function (callback) {
            var xhr = new XMLHttpRequest(),
                url = 'http://webui.ktipmedia.co.kr:8080/amoc-api/vod/subscriber/pkg-list',
                saId = STBService.getConfigBy('SAID');

                xhr.timeout = 3000;
                xhr.addEventListener('timeout', function () {
                    console.log('================================');
                    console.log('User\'s Package List Error');
                    console.log('================================');

                    EventBus.fire('notRecievedPKGList');
                }, false);

                xhr.open('POST', url, true);

                // xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
                // xhr.setRequestHeader('Pragma', 'no-cache');
                xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        App.commons.Timer.end('xhr loading2');
                        if (xhr.status === 200) {
                            var responseText = xhr.responseText;

                            try {
                                STBService.setPackageList(JSON.parse(responseText).pkgList);
                            } catch (e) {
                                console.log('================================');
                                console.log(e);
                                console.log('================================');                                
                            }

                            callback();  
                        } else {
                            EventBus.fire('notRecievedPKGList');
                        }
                    } 
                };

                // xhr.timeout = 10000;
            
                // xhr.ontimeout = function() {
                //     xhr.abort();
                //     console.log('================================');
                //     console.log('User\'s Package List Timeout Error');
                //     console.log('================================');
                //     EventBus.fire('notRecievedPKGList');
                // };

                App.commons.Timer.start('xhr loading2');
                xhr.send('saId=' + encodeURI(saId) + '&WMOCKey=' + encodeURI('ChMulti'));
        };
    }
});
'use strict';

App.defineClass('MultiView.app.KeyBinder', {

	_construct: function (eventBus) {
		var me = this,
		
			focusInfo = {
				focusType: FocusType.VIDEO,
				index: -1
			},
			
			readyForInput = false,
			
			movingChannel = false,

			provider = MultiView.keyEventActor.KeyEventActorProvider.create(eventBus),

			keyDown = function(e) {
	            var keyCode = e.keyCode,
	            	stopEvent = function () {
	            		e.preventDefault();
	            		e.stopPropagation();
	            	};

	            if (keyCode === global.VK_BACK_SPACE) {
	            	return;
	            }
	            
	        	if (!readyForInput) {
					return;
				}

				if (!(keyCode === VK_BACK || keyCode === VK_CHANNEL_DOWN || keyCode === VK_CHANNEL_UP || (keyCode >= VK_0 && keyCode <= VK_9))) {
					stopEvent();
				}

	            if (keyCode === VK_ENTER) {
	            	delegate('pressedEnterKey', e);
	            } else if (keyCode === VK_CHANNEL_DOWN || keyCode === VK_CHANNEL_UP) {
	            	delegate('pressedChannelUpAndDownKey', e);
	            } else if (keyCode >= VK_LEFT && keyCode <= VK_DOWN) {
	            	delegate('pressedNavigationKey', e);
	            } else if (keyCode >= VK_0 && keyCode <= VK_9) {
	            	delegate('pressedNumberKey', e);
	            } else if (keyCode === VK_GREEN) {
	            	delegate('pressedGreenKey', e);
	            } else if (keyCode === VK_BACK) {
	            	delegate('pressedBackKey', e);
	            } else if (keyCode === VK_RED) {
	            	delegate('pressedRedKey', e);
	            }
	        },

	        delegate = function(methodName, event) {
	            provider.getKeyEventActor()[methodName](event, focusInfo);
	        };

	    eventBus.register(me, 'forcedToMove', function(channelDataIndex) {

	    	// (임시 삭제)마이 채널을 삭제하고, 그 이전 카테고리로 이동한 경우이다.
	    	// if (!ChannelDataManager.channelData[channelDataIndex]) {
	    	//  	eventBus.fire('showMessage', '이전 카테고리 정보가 존재하지 않습니다.');
	    	//  	return false;
	    	// }

	    	var currentFocusType = focusInfo.focusType;
				   			
	   			var nextFocusInfo = {
	   				focusType: FocusType.MENU,
	   				index: channelDataIndex
	   			};
	   			eventBus.fire('moveFocus', {
	   				focusType: FocusType.MENU,
	   				index: ChannelDataManager.currentChannelDataIndex
	   			}, nextFocusInfo, currentFocusType === FocusType.VIDEO);

	   			focusInfo = nextFocusInfo;

	   			eventBus.fire('changeCategory', nextFocusInfo.index);

	   			if (currentFocusType === FocusType.VIDEO) {

	   				eventBus.fire('moveFocus',  focusInfo, {
		   				focusType: FocusType.VIDEO,
		   				index: ChannelDataManager.currentSubChannelDataIndex
		   			});
		   			
		   			focusInfo =  {
		   				focusType: FocusType.VIDEO,
		   				index: ChannelDataManager.currentSubChannelDataIndex
			   		};
		   			
		   			// [+등록] 으로 이동한 경우가 아닌 경우에만 메뉴를 잠깐 보여라
	   				if (ChannelDataManager.channelData[channelDataIndex]) {
	   					eventBus.fire('movedPrevChannel');
	   				} else {
	   					eventBus.fire('movedPrevChannel');
	   					eventBus.fire('focusEmptyDialog');
	   				}
		   			
	   			}

	   			readyForInput = true;
	    });

		eventBus.register(me, 'moveFocus', function(nextFocusInfo) {
			readyForInput = false;
		}, 0);

	    eventBus.register(me, 'finishedFocusMoving', function(nextFocusInfo) {
			focusInfo = nextFocusInfo;
			readyForInput = true;
		});

		eventBus.register(me, 'changeCategory', function() {
			movingChannel = true;
		}, 0);
		
		eventBus.register(me, 'changedCategory', function() {
			if (focusInfo.focusType === FocusType.VIDEO) {
				focusInfo.index = ChannelDataManager.currentSubChannelDataIndex;
			}
			movingChannel = false;
		});

		// ChannelData 초기화가 완료되었다면 focus 를 현재 SubChannel 의 인덱스로 설정한다.
		eventBus.register(me, 'initializedChannelData', function(currentChannelDatum, currentSubChannelDatum) {
			focusInfo.index = currentChannelDatum.channels.indexOf(currentSubChannelDatum);
		});
		
		eventBus.register(me, 'completeInitializing', function() {
			readyForInput = true;
		});

		eventBus.register(me, 'disableForKeyInput', function(disable) {
			readyForInput = !disable;
		});
		
		eventBus.register(me, 'keyDown', keyDown);

		me.__defineGetter__('focusInfo', function() {
			return focusInfo;
		});
		
		me.__defineGetter__('movingChannel', function() {
			return movingChannel;
		});

		me.__defineGetter__('readyForInput', function() {
			return readyForInput;
		});

	}
});