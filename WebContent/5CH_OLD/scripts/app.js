'use strict';

var Beans = Beans || {};

/**
 * [BaseObject description]
 * @type {Object}
 */
Beans.BaseObject = {
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
        if (typeof methodName !== 'string') {
            args = methodName;
            methodName = '_construct';
        }
 
        return Object.getPrototypeOf(definedOn)[methodName].apply(this, args);
    }
};

/**
 *
 * 클래스를 정의한다.
 * 
 * @method define
 * @param  {String} namespace 해당 클래스의 namespace
 * @param  {Function|Object} constructor 생성자 함수 혹은 BaseObject 기반의 정의 객체
 */
Object.defineProperty(Beans, 'defineClass', {
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
	    	throw 'already existed window[name] : ' + className;
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
	    	parent[className] = Beans.BaseObject.extend(constructFunction);

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
 * @param  {String} newClassNameSpace    생성하려는 클래스의 네임스페이스
 * @param  {String} parentClassNameSpace 부모 클래스의 네임스페이스
 * @param  {Object} definition           생성하려는 클래스의 BaseObject 기반 정의 객체
 */
Object.defineProperty(Beans, 'extendClass', {
	value: function(newClassNameSpace, parentClassNameSpace, definition) {

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
	    } else if (!(Beans.BaseObject.isPrototypeOf(parentClass))) {
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

Beans.defineClass('Beans.commons.EventBus', function EventBus() {
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
                }
            }
        }
    };
    return me;
});
'use strict';

Beans.defineClass('Beans.commons.KeyEventActorProvider', function KeyEventActorProvider () {
    var me = this,
        actors = [];

    me.getKeyEventActor = function () {
    	return actors[actors.length - 1];
    };

    me.register = function (instance) {
    	actors.push(instance);
    };

    me.remove = function (instance) {
        actors.splice(actors.indexOf(instance), 1);
    };
});
'use strict';

Beans.defineClass('Beans.commons.Timer', function Timer () {
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

Beans.defineClass('Beans.components.UiComponent', {
	
	createElement: function(options) {
		var me = this,
			element = document.createElement(options.elementName);

		if (options.className) {
			element.className = options.className;
		}
		
		if (options.innerHtml) {
			element.innerHTML = options.innerHtml;
		}

		if (options.hide === true) {
			me.hideElement(element);
		} else {
			me.showElement(element);
		}

		return element;
	},

	createDIV: function(className, hide) {
		return this.createElement({
			elementName: 'div',
			className: className,
			hide: hide
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
		var targets = Beans.commons.Utils.isAbstractArrayList(elements) ? elements : [elements],
			i, length, target;
		
		for (i = 0, length = targets.length; i < length; i++) {
			target = targets[i];
			if (target && target.parentNode) {
				target.parentNode.removeChild(target);
			}	
		}
	},

	$: function(query, parentNode) {
		var parent = parentNode || this.element || document;
		return parent.querySelector(query);
	},

	$$: function(query, parentNode) {
		var parent = parentNode || this.element || document;
		return parent.querySelectorAll(query);
	},
	
	show: function() {
		var me = this;

		if (!me.element) {
			return;
		}
		
		me.element.style.display = 'block';
		me.visible = true;
	
		if (me.isKeyEventActor) {
			Beans.commons.KeyEventActorProvider.register(me);
		}

		return me.element;
	},
	
	hide: function() {
		var me = this;

		if (!me.element) {
			return;
		}
		
		me.element.style.display = 'none';
		me.visible = false;
		
		if (me.isKeyEventActor) {
			Beans.commons.KeyEventActorProvider.remove(me);
		}

		return me.element;
	},

	setText: function(element, text) {
		element.innerHTML = text;

		return element;
	},

	setImage: function(element, url) {
		element.style.backgroundImage = 'url(' + url + ')';

		return element;
	}
});
'use strict';

Beans.defineClass('Beans.commons.Utils', function Utils () {
    var me = this;

    me.isEmpty = function(obj) {
        if (typeof obj === 'undefined' || obj === null || obj === '') {
            return true;
        }

        if (obj instanceof Array && obj.length === 0) {
            return true;
        }

        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }

        return true;
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

    me.isNotEmpty = function (obj) {
        return !me.isEmpty(obj);
    };

    me.convertMSToTime = function (duration) {
        var seconds = parseInt((duration/1000)%60),
            minutes = parseInt((duration/(1000*60))%60),
            hours = parseInt((duration/(1000*60*60))%24);

        hours = (hours < 10) ? '0' + hours : hours;
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        seconds = (seconds < 10) ? '0' + seconds : seconds;

        return hours + ':' + minutes + ':' + seconds;
    };

    me.trim = function (value) {
        if (typeof value !== 'string' || !value) {
            return value;
        }

        return value.trim();
    };

    me.convertKeyCodeToNumber = function (keyCode) {
        if (keyCode < 48 || keyCode > 57) {
            return NaN;
        }

        return keyCode - 48;
    };
    
    me.change = function (array, target1Index, target2Index) {
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

    me.clone = function (obj) {
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

    me.getTimeStamp = function() {
        var a = new Date(),
            result = [],
            leadingZeros = function(a, c) {
                var b = '',
                    d;
                a = a.toString();
                if (a.length < c) {
                    for (d = 0; d < c - a.length; d++) {
                        b += '0';
                    }
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
    }

    return me;
});
'use strict';
Beans.defineClass('Beans.commons.Http', function Http() {
	var me = this;

	me.waitTime = 10000;

	me.request = function(options) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)) {
					resolve(xhr.responseText);
				} else if (xhr.readyState === 4) {
					reject();
				}
			};
			xhr.timeout = me.waitTime;
			xhr.ontimeout = function () {
				reject();
			};
			xhr.open(options.method, options.url);
			if (options.headers) {
				for (var key in options.headers) {
					xhr.setRequestHeader(key, options.headers[key]);
				}
			}
			xhr.send(options.data);
		});
	};

	me.get = function(options) {
		options.method = 'GET';
		return me.request(options);
	};

	me.post = function(options) {
		options.method = 'POST';
		return me.request(options);
	};
});
'use strict';
var global = window;

global.onload = function() {
	var app = global.Main = KBO.app.Main.create();
	app.init();
};

Beans.defineClass('KBO.app.Main', {

	isDebug: false, // true - brower, false - stb

	_construct: function() {

		var me = this;

		me.__defineGetter__('version', function() {
			return AppConfig.version;
		});

	},
	init: function() {

		global.DataLoader = KBO.app.DataLoader.create();

		global.STBService = KBO.app.STBService.create();

		global.PlayDataManager = KBO.app.PlayDataManager.create();

		global.ViewPort = KBO.components.ViewPort.create();

		// 1. appConfig Getting
		DataLoader.loadAppConfig().then(function(responseText) {
			try {
				console.log(Utils.convertXmlToJson(responseText));
				global.AppConfig = Utils.convertXmlToJson(responseText, 'multiView');
				console.log(global.AppConfig.fourChannelApp);
			} catch (e) {
				throw e;
			}
			// 2. TodayGameList Getting
		}).then(DataLoader.getTodayGameList).then(function(responseText) {
			console.log(responseText);
			try {
				PlayDataManager.todayDataJson = JSON.parse(responseText);
			} catch (e) {
				throw e;
			}
			// 3. WebSocket Url Getting
		}).then(DataLoader.loadWebSocketUrl).then(function(responseText) {

			try {
				var wsUrl = JSON.parse(responseText).wsocketInfo;
				console.log(wsUrl);

				global.RealtimeData = KBO.app.RealtimeData.create(wsUrl);

				return global.RealtimeData.init();
			} catch (e) {
				throw e;
			} 


		}).then(DataLoader.getRealTimeData).then(function(responseText) {

			try {
				var json = JSON.parse(responseText);

				var channels = (function() {
					var result = [],
						channelNumbers = [],
						i, length;

					if (json) {
						PlayDataManager.playDataJson = json;
					}
					channelNumbers = PlayDataManager.getChannelData();

					for (i = 0, length = channelNumbers.length; i < length; i++) {
						console.log('channels : ' + channelNumbers[i]);
						result.push(STBService.getChannel(channelNumbers[i]));
					}

					return result;
				})();

				DataLoader.sendStartMessage();

				EventBus.fire('completedInitializing', channels);
			} catch (e) {
				throw e;
			}
		}).catch(function(e) {
			console.error(e);
			EventBus.fire('occuredErrorOnInitializng');
		});
	}
});
'use strict';

Beans.defineClass('KBO.enums.DeviceType', function DeviceType () {
	return {
		SMART: 'smart',
		
		UHD: 'uhd'
	};
});

'use strict';

Beans.defineClass('KBO.enums.LimitType', function LimitType () {
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

Beans.defineClass('KBO.enums.STBMode', function STBMode () {
	return {
		OTV: 'otv',
		
		OTS: 'ots'
	};
});

'use strict';

Beans.extendClass('KBO.components.ViewPort', 'Beans.components.UiComponent', {

	_construct: function() {

		var me = this;

		me.videoListPanel = KBO.components.VideoListPanel.create();
		me.boardPanel = KBO.components.BoardPanel.create();
		// me.channelInfoPanel = KBO.components.ChannelInfoPanel.create(eventBus);
		me.subChannelInfoPanel = KBO.components.SubChannelInfoPanel.create();
		me.popup = KBO.components.Popup.create();

		me._initializeElement();

		EventBus.register(me, 'completedInitializing', function() {
			me.show();
			me.videoListPanel.show();
		});

		EventBus.register(me, 'occuredErrorOnInitializng', function () {
			me.show();
			me.videoListPanel.show();
		}, 1);

	},

	_initializeElement: function() {
		var me = this;

		me.element = me.createDIV('viewPort', true);

		me.$('body', document).appendChild(me.element);

		me.element.appendChild(me.videoListPanel.element);
		// me.element.appendChild(me.channelInfoPanel.element);
		me.element.appendChild(me.boardPanel.element);
		me.element.appendChild(me.subChannelInfoPanel.element);
		me.element.appendChild(me.popup.element);
	}


});
'use strict';

Beans.extendClass('KBO.components.VideoListPanel', 'Beans.components.UiComponent', {

    isKeyEventActor: true,

    videoCount: 5,

    videos: [],

    currentIndex: 0,

    _construct: function() {

        var me = this;

        me._initializeElement();

        EventBus.register(me, 'completedInitializing', function() {
            me.videos[me.currentIndex].focusIn(0);
        });
    },

    _initializeElement: function() {
        var me = this,
            i, video;

        me.element = me.createDIV('videoList', true);

        for (i = 0; i < me.videoCount; i++) {
            video = KBO.components.VideoPanel.create();

            me.videos.push(video);

            me.element.appendChild(video.element);
        }
    },

    pressedEnterKey: function(keyCode) {
        var me = this;
        if (me.currentIndex === 0) {
            EventBus.fire('goChannel', PlayDataManager.currentChannelNumber);
            return;
        }

        EventBus.fire('changeSubToMain', me.currentIndex);

        me.videos[me.currentIndex].focusOut();
        me.videos[0].focusIn(0);

        me.currentIndex = 0;
    },

    pressedNavigationKey: function(keyCode) {
        var me = this,
            secondIndex = 1,
            lastIndex = me.videoCount - 1,
            nextIndex = me.currentIndex;

        switch (keyCode) {
            case VK_LEFT:
                if (me.currentIndex === 0) {
                    break;
                }
                nextIndex = me.currentIndex === secondIndex ? lastIndex : nextIndex - 1;
                break;
            case VK_RIGHT:
                if (me.currentIndex === 0) {
                    break;
                }
                nextIndex = me.currentIndex === lastIndex ? secondIndex : nextIndex + 1;
                break;
            case VK_UP:
                if (me.currentIndex === 0) {
                    break;
                }
                nextIndex = 0;
                break;
            case VK_DOWN:
                if (me.currentIndex !== 0) {
                    break;
                }
                nextIndex = secondIndex;
                break;
        }

        if (nextIndex === me.currentIndex) {
            return;
        }

        me.videos[me.currentIndex].focusOut();
        me.videos[nextIndex].focusIn(nextIndex);

        me.currentIndex = nextIndex;

        EventBus.fire('changedFocus', me.currentIndex);
    }


});
'use strict';

Beans.extendClass('KBO.components.VideoPanel', 'Beans.components.UiComponent', {

	_construct: function () {
		var me = this;

		me._initializeElement();
	},

	_initializeElement: function () {
		var me = this;

		me.channelInfoPanel = KBO.components.ChannelInfoPanel.create();

		me.element = me.createDIV('video');
		me.focusElement = me.createDIV('focus');
		
		me.limitElement = me.createDIV('limit');
		me.existLimitElement = me.createDIV('existLimit');
		me.settingLimitElement = me.createDIV('settingLimit');
		
		me.limitElement.style.display = 'none';
		me.existLimitElement.style.display = 'none';
		me.settingLimitElement.style.display = 'none';
		
		me.element.appendChild(me.channelInfoPanel.element);
		me.element.appendChild(me.limitElement);
		me.element.appendChild(me.existLimitElement);
		me.element.appendChild(me.settingLimitElement);
	},

	focusIn: function (idx) {
		var me = this;
		me.element.appendChild(me.focusElement);
		me.channelInfoPanel.focusIn(idx);
	},

	focusOut: function () {
		var me = this;
		me.removeElement(me.focusElement);
		me.channelInfoPanel.focusOut();
	},
	
	limitIn:function(idx){
		var me = this;
		me.limitElement.style.display = 'block';
	}
});
'use strict';

Beans.extendClass('KBO.components.ChannelInfoPanel', 'Beans.components.UiComponent', {

	displayTimer: new Object(),

	_construct: function () {
		var me = this;

		me._initializeElement();
	},

	_initializeElement: function () {
		var me = this, 
		big_name,
		ch_Box_bar, fl_rBox
		;

		me.element = me.createDIV('channelInfo');
		me.focusElement = me.createDIV('focus_Info');

		me.setText(me.focusElement, "");

		big_name = me.createDIV('ch_Big_name');
		me.big_name_number = me.createDIV('ch_number');
		me.big_name_info = me.createDIV('ch_info');
		big_name.appendChild(me.big_name_number);
		big_name.appendChild(me.big_name_info);
		
		me.ch_Box = me.createDIV('ch_Box');
		me.ch_Box_name = me.createDIV('ch_Box_name');
		ch_Box_bar = me.createDIV('ch_Box_bar');
		me.ch_L = me.createDIV('ch_L');
		fl_rBox = me.createDIV('rBox');
		me.ch_R = me.createDIV('ch_R');
		
		me.rBar = me.createDIV('rBar');
		fl_rBox.appendChild(me.rBar);

		ch_Box_bar.appendChild(me.ch_L);
		ch_Box_bar.appendChild(fl_rBox);
		ch_Box_bar.appendChild(me.ch_R);

		me.ch_Box.appendChild(me.ch_Box_name);
		me.ch_Box.appendChild(ch_Box_bar);
		

		me.focusElement.appendChild(big_name);
		me.focusElement.appendChild(me.ch_Box);
	},

	getChannelData: function(idx) {
		var me = this,
			index = idx,
			info;

		PlayDataManager.currentChannelNumber = PlayDataManager.channelsList[idx];

		var channel = STBService.getChannel(PlayDataManager.currentChannelNumber);

		info = channel ? STBService.getProgram(channel) : {};

		me.setText(me.big_name_number, info.channelNumber);
		me.setText(me.big_name_info, info.channelName);

		if(info.name == null || info.startTime == null || info.endTime == null) {
			me.ch_Box.style.display = 'none';
		} else {
			me.ch_Box.style.display = 'block';
			me.setText(me.ch_Box_name, info.name);
			me.setText(me.ch_L, info.startTime);
			me.setText(me.ch_R, info.endTime);
			me.rBar.style.width = info.percent + '%';
		}
	},

	focusIn: function (idx) {
		var me = this;
		me.getChannelData(idx);
		me.element.appendChild(me.focusElement);
		if(idx == 0) {
			me.ch_Box.style.display = 'block';
		} else {
			me.ch_Box.style.display = 'none';
		}
		clearTimeout(me.displayTimer);
		me.displayTimer = setTimeout(function() {
			me.focusOut();
		}, 3000);
	},

	focusOut: function () {
		var me = this;
		clearTimeout(me.displayTimer);
		me.removeElement(me.focusElement);
	}
});
'use strict';

Beans.extendClass('KBO.components.SubChannelInfoPanel', 'Beans.components.UiComponent', {

    subChannelCount : 4,

    _construct: function () {
        var me = this;

        me._initializeElement();

    },

    _initializeElement: function () {
        var me = this, i, item;
        
        me.element = me.createDIV('sub_channel');

        for (i = 0; i < me.subChannelCount; i++) {
            item = KBO.components.displayitem.SubChannel.create();
            item.idx = i;
            me.element.appendChild(item.element);
        }
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.SubChannel', 'Beans.components.UiComponent', {

    idx: 0,

    _construct: function () {
        var me = this;

        me._initializeElement();

        EventBus.register(me, 'realtimeData', function (playData) {
            var item = playData.subChanelInfo[me.idx + 1],
                away, home, score, iState;
            // STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
            iState = me.element.getElementsByClassName('sub_info')[0];
            away = me.element.getElementsByClassName('sub_info')[1];
            score = me.element.getElementsByClassName('sub_info')[2];
            home = me.element.getElementsByClassName('sub_info')[3];
            
            if(item != null) {
                if(item.state == 2) {
                	me.setText(iState, item.inningState);
                    me.setText(away, item.away);
                    me.setText(score, item.awayScore + ' : ' + item.homeScore);
                    me.setText(home, item.home);
                    away.style.width='36px';
                    score.style.width='70px';
                    score.style.padding = "0 10px";
                    score.style.fontWeight="bold";
                } else {
                	me.setText(iState, '');
                    me.setText(away, '');
                    me.setText(home, '');
                    score.style.width='100px';
                    score.style.padding = "0 20px";
                    score.style.fontWeight="";
                    if(item.state == 0 || item.state == 1) {
                    //     me.setText(score, '실시간전');
                    // } else if(item.state == 1) {
                    	score.style.padding = "0 33px";
                        me.setText(score, '경기전');
                    } else if(item.state == 3) {
                        me.setText(score, '경기 종료');
                    } else if(item.state == 4) {
                        me.setText(score, '경기 취소');
                    } else if(item.state == 5) {
                        me.setText(score, '서스펜디드');                  
                    } else if(item.state == 6) {
                    	me.setText(score, '경기 없음');  
                    }             
                }
            } else {
            	score.style.width='100px';
                score.style.padding = "0 20px";
                score.style.fontWeight="";
            	me.setText(iState, '');
                me.setText(away, '');
                me.setText(home, '');
                me.setText(score, '경기 없음');
            }
        });
    },

    _initializeElement: function () {
        var me = this, i;
        
        me.element = me.createDIV('sub_channel_item');

        for(i = 0; i <= 3; i++) {
            me.element.appendChild(me.createDIV('sub_info'));
        }
    },

    focusIn: function () {
        var me = this;
        me.setText(me.element.getElementsByClassName("inning"), '');
        me.setText(me.element.getElementsByClassName("score"), '');
        me.element.appendChild(me.focusElement);
    },

    focusOut: function () {
        var me = this;
        me.removeElement(me.focusElement);
    }
});
'use strict';

Beans.extendClass('KBO.components.BoardPanel', 'Beans.components.UiComponent', {

    _construct: function () {
        var me = this;

        me._initializeElement();

        EventBus.register(me, 'realtimeData', function (playData) {

            var i, idx;
            for(i = 0; i < playData.channelsList.length; i++) {
                if(playData.channelsList[i] == playData.currentChannelNumber) {
                    idx = i;
                    break;
                }
            }
            var item = playData.subChanelInfo[idx];
            //me.focusElement.style.fontSize = 28 + 'px';
            //me.focusElement.style.paddingTop = 30 + 'px';
            me.focusOut();
            
            me.focusElement.style.fontSize = '28px';

            // STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
            // console.log('==============' + item);
            if(item != null) {
                // me.setText(me.focusElement, '');
                if(item.state == 4) {
                    me.setText(me.focusElement, '경기가 취소되었습니다.');
                    me.focusIn();
                } else if(item.state == 6){
                	me.setText(me.focusElement, '프로야구 중계가 없습니다.');
                    me.focusIn();
                }
            } else {
                me.setText(me.focusElement, '프로야구 중계가 없습니다.');
                me.focusIn();
            }
        });

        EventBus.register(me, 'notRecievedPKGList', function () {
            // console.log('notRecievedPKGList');
            // 서비스 장애
            me.setText(me.focusElement, '현지사정으로 서비스 제공이 <br/>원활하지 않습니다.');
            me.focusElement.style.fontSize = 24 + 'px';
            //me.focusElement.style.paddingTop = 18 + 'px';
            me.focusIn();
        });
    },

    _initializeElement: function () {
        var me = this, playInfo, score;
        
        me.element = me.createDIV('board');

        me.finishElement = me.createDIV('finish');
        me.focusElement = me.createDIV('alarm_box');
        me.focusBgElement = me.createDIV('alarm_bg');
        
        me.finishElement.appendChild(me.focusBgElement);
        me.finishElement.appendChild(me.focusElement);

        playInfo = KBO.components.displayitem.PlayInfoPanel.create();
        score = KBO.components.displayitem.InningPanel.create();

        me.element.appendChild(playInfo.element);
        me.element.appendChild(score.element);
    },

    focusIn: function () {
        var me = this;
        me.element.appendChild(me.finishElement);
    },

    focusOut: function () {
        var me = this;
        me.removeElement(me.finishElement);
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.PlayInfoPanel', 'Beans.components.UiComponent', {

	// taggiaMap: new Object(),
	// pitcherMap: new Object(),

	_construct: function () {
		var me = this;

		me._initializeElement();

		EventBus.register(me, 'realtimeData', function (playData) {
			// home 오른쪽 , away 왼쪽
			var i, idx;
            for(i = 0; i < playData.channelsList.length; i++) {
                if(playData.channelsList[i] == playData.currentChannelNumber) {
                    idx = i;
                    break;
                }
            }
			var item = playData.subChanelInfo[idx];
            // STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
            if(item != null) {
	            if(item.state == 0) {
	            	me.setText(me.inning, '경기전');
	            } else if(item.state == 1) {
	                me.setText(me.inning, '경기전');
	            } else if(item.state == 2 || item.state == 5) {
	            	me.setText(me.inning, playData.inningNum + "회 " + playData.inningState);
	            } else if(item.state == 3) {
	            	me.setText(me.inning, '경기 종료');
	            } else if(item.state == 4) {
	            	me.setText(me.inning, '경기 취소');
	            // } else if(item.state == 5) {
	            //     me.setText(me.inning, '서스펜디드');
	            }else if(item.state == 6) {
	            	me.setText(me.inning, '경기 없음');
	            }
        	}
		});
	},

	_initializeElement: function () {
		var me = this, 
			// player 정보
			player_away = KBO.components.displayitem.Player.create(),
			player_home = KBO.components.displayitem.Player.create(),
			score_big = KBO.components.displayitem.TeamNScore.create(),
			info = KBO.components.displayitem.CountPanel.create();

		player_away.type = 'Away';
		player_home.type = 'Home';
		me.element = me.createDIV('r_con');

		// 회차
		me.inning = me.createDIV('r_con_p');

		me.element.appendChild(me.inning);

		me.element.appendChild(player_away.element);
		me.element.appendChild(player_home.element);

		me.element.appendChild(score_big.element);
		me.element.appendChild(info.element);
	}
});
'use strict';

Beans.extendClass('KBO.components.displayitem.Player', 'Beans.components.UiComponent', {

	type: '',

	_construct: function () {
		var me = this;

		me._initializeElement();

		EventBus.register(me, 'realtimeData', function (playData) {
			// var item = playData.subChanelInfo[0];
			// if(item.state == 0 || item.state == 1) {
                // me.setText(me.inning, '경기전');

    //             me.setText(me.player, playData[me.type + 'Pitcher']);
				// me.setText(me.player_sta, playData[me.type + 'Pitcher']);
				// me.setText(me.stat, playData[me.type + 'Pitcher']);

            // } else if(item.state == 2 || item.state == 4 || item.state == 5) {
            	// me.setText(me.inning, playData.inningNum + "회 " + playData.inningState);
            	me.setText(me.player, playData['player' + me.type]);
				me.setText(me.player_sta, playData['playerSta'+ me.type]);
				me.setText(me.stat, playData['playerStat' + me.type]);
			// } else if(item.state == 3) {
            	// me.setText(me.inning, '경기 종료');
    //         	me.setText(me.player, playData[me.type + 'Pitcher']);
				// me.setText(me.player_sta, playData[me.type + 'Pitcher']);
				// me.setText(me.stat, playData[me.type + 'Pitcher']);
			// } else if(item.state == 4) {
            	// me.setText(me.inning, '경기 취소');
            // } else if(item.state == 5) {
                // me.setText(me.inning, '경기 중지');
            // }
		});
	},

	_initializeElement: function () {
		var me = this;
		
		me.element = me.createDIV('player_con');

		me.player = me.createDIV('player');
		me.player_sta = me.createDIV('player_sta');
		me.stat = me.createDIV('stat');

		me.element.appendChild(me.player);
		me.element.appendChild(me.player_sta);
		me.element.appendChild(me.stat);
	}
});
'use strict';

Beans.extendClass('KBO.components.displayitem.TeamNScore', 'Beans.components.UiComponent', {

	_construct: function () {
		var me = this;

		me._initializeElement();

		EventBus.register(me, 'realtimeData', function (playData) {

			if(playData.teamHome != '') {
				me.setImage(me.team_home, './images/teams/' + playData.teamHome + '.png');
			} else {
				me.setImage(me.team_home, '');
			}
			if(playData.teamAway != '') {
				me.setImage(me.team_away, './images/teams/' + playData.teamAway + '.png');
			} else {
				me.setImage(me.team_away, '');
			}

			me.setText(me.score_num_home, playData.scoreHome);
			me.setText(me.score_num_away, playData.scoreAway);
			
			me.setText(me.team_rank_home, playData.rankHome);
			me.setText(me.team_rank_away, playData.rankAway);
		});
	},

	_initializeElement: function () {
		var me = this;
		// 왼쪽
		me.element = me.createDIV('score_big');

		me.ranking_away = me.createDIV('ranking');
		me.ranking_home  = me.createDIV('ranking');
		me.score_num_away = me.createDIV('score_num');
		me.score_num_home = me.createDIV('score_num');
		me.vs = me.createDIV('vs');

		me.team_rank_away = me.createDIV('team_rank');
		me.team_away = me.createDIV('team_icon');
		me.team_rank_home = me.createDIV('team_rank');
		me.team_home = me.createDIV('team_icon');
		

		me.element.appendChild(me.ranking_away);
		me.ranking_away.appendChild(me.team_away);
		me.ranking_away.appendChild(me.team_rank_away);
		me.element.appendChild(me.score_num_away);
		me.element.appendChild(me.vs);
		me.element.appendChild(me.score_num_home);
		me.ranking_home.appendChild(me.team_home);
		me.ranking_home.appendChild(me.team_rank_home);
		me.element.appendChild(me.ranking_home);
	}
});
'use strict';

Beans.extendClass('KBO.components.displayitem.CountPanel', 'Beans.components.UiComponent', {

    _construct: function () {
        var me = this;

        me.count_type = type;
        me._initializeElement();

    },

    _initializeElement: function () {
        var me = this;
        
        me.element = me.createDIV('info');
    },

    focusIn: function () {
        var me = this;
        me.element.appendChild(me.focusElement);
    },

    focusOut: function () {
        var me = this;
        me.removeElement(me.focusElement);
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.CountPanel', 'Beans.components.UiComponent', {

    baseCount: 3,
    ballCount: 3,
    strictCount: 2,
    outCount: 2,

    _construct: function () {
        var me = this;

        me._initializeElement();
    },

    _initializeElement: function () {
        var me = this, i, item,
            base, 
            ball, strike, out,
            ball_title, strike_title, out_title;
        
        me.element = me.createDIV('info');
        base = me.createDIV('base_con');

        ball = me.createDIV('ball');
        strike = me.createDIV('strike');
        out = me.createDIV('out');
        ball_title = me.createDIV('ball_title');
        strike_title = me.createDIV('strike_title');
        out_title = me.createDIV('out_title');
        me.setText(ball_title, 'B');
        me.setText(strike_title, 'S');
        me.setText(out_title, 'O');

        ball.appendChild(ball_title);
        strike.appendChild(strike_title);
        out.appendChild(out_title);

        for(i = 0; i < me.baseCount; i++) {
            item = KBO.components.displayitem.Base.create();
            item.idx = i;
            base.appendChild(item.element);
        }

        for(i = 0; i < me.ballCount; i++) {
            item = KBO.components.displayitem.Count.create();
            item.idx = i;
            item.type = 'ball';
            ball.appendChild(item.element);
        }

        for(i = 0; i < me.strictCount; i++) {
            item = KBO.components.displayitem.Count.create();
            item.idx = i;
            item.type = 'strike';
            strike.appendChild(item.element);
        }

        for(i = 0; i < me.outCount; i++) {
            item = KBO.components.displayitem.Count.create();
            item.idx = i;
            item.type = 'out';
            out.appendChild(item.element);
        }

        me.element.appendChild(base);
        me.element.appendChild(ball);
        me.element.appendChild(strike);
        me.element.appendChild(out);
    },

    focusIn: function () {
        var me = this;
        me.element.appendChild(me.focusElement);
    },

    focusOut: function () {
        var me = this;
        me.removeElement(me.focusElement);
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.Count', 'Beans.components.UiComponent', {

    idx: 0,
    type: '',

    _construct: function () {
        var me = this;

        me._initializeElement();

        EventBus.register(me, 'realtimeData', function (playData) {
            me.focusOut(me.type);

            var i, focusedIndex;
            for(i = 0; i < playData.channelsList.length; i++) {
                if(playData.channelsList[i] == playData.currentChannelNumber) {
                    focusedIndex = i;
                    break;
                }
            }
            var item = playData.subChanelInfo[focusedIndex];
            // STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
            if(item != null) {
                if(item.state == 2 || item.state == 5) {
                    if(playData[me.type + 'Count'] > me.idx) {
                        me.focusIn(me.type);
                    }
                }
            }
        });
    },

    _initializeElement: function () {
        var me = this;
        
        me.element = me.createDIV('count');
        me.ballfocusElement = me.createDIV('ball_focus');
        me.strikefocusElement = me.createDIV('strike_focus');
        me.outfocusElement = me.createDIV('out_focus');
    },

    focusIn: function (type) {
        var me = this;
        if(type == 'ball') {
            me.element.appendChild(me.ballfocusElement);
        } else if(type == 'strike') {
            me.element.appendChild(me.strikefocusElement);
        } else {
            me.element.appendChild(me.outfocusElement);
        }
    },

    focusOut: function (type) {
        var me = this;
        if(type == 'ball') {
            me.removeElement(me.ballfocusElement);
        } else if(type == 'strike') {
            me.removeElement(me.strikefocusElement);
        } else {
            me.removeElement(me.outfocusElement);
        }
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.Base', 'Beans.components.UiComponent', {

    idx: 0,

    _construct: function () {
        var me = this;

        me._initializeElement();

        EventBus.register(me, 'realtimeData', function (playData) {
            me.focusOut();
            var i, focusedIndex;
            for(i = 0; i < playData.channelsList.length; i++) {
                if(playData.channelsList[i] == playData.currentChannelNumber) {
                    focusedIndex = i;
                    break;
                }
            }

            var item = playData.subChanelInfo[focusedIndex];
            // STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
            if(item != null) {
                if(item.state == 2 || item.state == 5) {
                    if(playData['base' + (me.idx + 1)]) {
                        me.focusIn();
                    }
                } else {
                    me.focusOut();
                }
            }
        });
    },

    _initializeElement: function () {
        var me = this;
        
        me.element = me.createDIV('base');
        me.focusElement = me.createDIV('focus');
    },


    focusIn: function () {
        var me = this;
        me.element.appendChild(me.focusElement);
    },

    focusOut: function () {
        var me = this;
        me.removeElement(me.focusElement);
    }
});
'use strict';

Beans.extendClass('KBO.components.displayitem.InningPanel', 'Beans.components.UiComponent', {

	_construct: function () {
		var me = this;

		me._initializeElement();
	},

	_initializeElement: function () {
		var me = this, i, j, item,
				teamScoreCon, teamScore;

		me.element = me.createDIV('score_rb');
		
		for (i = 0; i < 3; i++) {
			teamScore = me.createDIV('team_score');
			for (j = 0; j < 14; j++) {
				item = KBO.components.displayitem.Digit.create();
				if(i == 0) {
					item.type = 'inning';
					// if(j > 0 && j < 10) me.setText(item.element, j);
					// if(j == 10) me.setText(item.element, 'R');
					// if(j == 11) me.setText(item.element, 'H');
					// if(j == 12) me.setText(item.element, 'E');
					// if(j == 13) me.setText(item.element, 'B');
				} else if (i == 1) {
					item.type = 'away';
					// item.registEvent();
				} else {
					item.type = 'home';
					// item.registEvent();
				}
				item.idx = j;
				teamScore.appendChild(item.element);
			}
			me.element.appendChild(teamScore);
		}
	}
});
'use strict';

Beans.extendClass('KBO.components.displayitem.Digit', 'Beans.components.UiComponent', {

    idx: 0,
    type: '', // inning, home, away

    _construct: function () {
        var me = this;

        me._initializeElement();
    },

    _initializeElement: function () {
        var me = this;
        
        me.element = me.createDIV('inning');

        me.registEvent();
    },

    registEvent: function () {
        var me = this;
        EventBus.register(me, 'realtimeData', function (playData) {

            me.focusOut();

            // 초기화
            if(me.type != 'inning' && me.idx > 0 && me.idx < 10) {
                me.element.style.color = '#7d7d7d';
                me.setText(me.element, '');
            }
            // 입력
            me.setText(me.element, playData[me.type + 'Inning'][me.idx]);
            if(me.type != 'inning') {
                if(playData[me.type + 'Inning'][me.idx] > 0 && me.idx < 10) {
                    me.element.style.color = '#bd9700';
                }
            }
            
            // 현재 inning 표시
            if(me.type == (playData.inningState == '말'? 'home' : 'away') && playData.inningNum != 0 && playData.inningNum == me.idx && playData.inningNum < 10) {
                me.element.style.color = '#fff';
                me.focusIn();
            }else if(me.type == (playData.inningState == '말'? 'home' : 'away') && playData.inningNum >= 10 && me.idx == 9){
            	me.element.style.color = '#fff';
            	me.focusIn();
            }
        });
    },

    focusIn: function () {
        var me = this;
        me.element.style.background = '#ac2f2f';
    },

    focusOut: function () {
        var me = this;
        me.element.style.background = '';
    }
});
'use strict';

Beans.extendClass('KBO.components.Popup', 'Beans.components.UiComponent', {

    isKeyEventActor: true,

    isVisibility: false,

    _construct: function() {
        var me = this;

        me._initializeElement();
    },

    _initializeElement: function() {
        var me = this;

        me.element = me.createDIV('popupDIV', true);
        me.titleElement = me.createDIV('title');
        me.focusElement = me.createDIV('focus');
        me.popupElement = me.createDIV('popup');
        me.dimElement = me.createDIV('dim');

        me.setText(me.titleElement, '오늘 경기가 모두 종료되어<br/> 프로모션 채널로 이동합니다.');
        me.setText(me.focusElement, '확인');
        me.popupElement.appendChild(me.titleElement);
        me.popupElement.appendChild(me.focusElement);
        me.element.appendChild(me.popupElement);
        me.element.appendChild(me.dimElement);

        EventBus.register(me, 'completedInitializing', function() {
            me._onGoingGame();

            setInterval(function() {
                if (!me.isVisibility) {
                    me._onGoingGame();
                }
            }, 120000);
        });

        EventBus.register(me, 'occuredErrorOnInitializng', function () {
            me.is4chAppForReturned = true;
            me._showClosingPopup();
        });
    },

    _showClosingPopup: function () {
        var me = this

        me.setText(me.titleElement, '현지사정으로 경기 데이터<br/> 제공이 원활하지 않아<br/> 4채널 서비스로 이동합니다.');
        me.isVisibility = true;
        me.show();
    },

    _showPopup: function(jsonText) {
        var me = this,
            json = jsonText ? JSON.parse(jsonText) : undefined;
        console.log('json', json);

        if (json && json.result === 'FALSE') {
            me.isVisibility = true;
            me.setText(me.titleElement, '오늘 경기가 모두 종료되어<br/> 프로모션 채널로 이동합니다.');
            me.show();
        }
    },

    _onGoingGame: function() {
        var me = this;
        DataLoader.onGoingGame().then(function (responseText) {
            me._showPopup(responseText)
        }).catch(function (e) {
            console.error('occured error: onGoingGame', e);
        });
    },

    pressedEnterKey: function(keyCode) {
        var me = this;
        // console.log("popup ok");
        me.hide();

        if (me.is4chAppForReturned) {
            EventBus.fire('goChannel', Utils.toNumber(AppConfig.fourChannelApp));
        } else {
            EventBus.fire('destroyApp');    
        }
    }
});
'use strict';

Beans.defineClass('KBO.app.STBService', {

	_construct: function() {

		if (Main.isDebug) {
			return;
		}

		var me = this,

			channelConfig = window.oipfObjectFactory.createChannelConfig(),

			appConfiguration = window.oipfObjectFactory.createConfigurationObject().configuration,

			appManager = window.oipfObjectFactory.createApplicationManagerObject(),

			ownerApp = appManager.getOwnerApplication(window.document),

			channelTuner = KBO.app.ChannelTuner.create(),

			appId = appManager.discoveredAITApplications[0] ? appManager.discoveredAITApplications[0].appId : undefined,

			channels = {
				otv: {},
				ots: {}
			},

			channelsForSID = {
				otv: {},
				ots: {}
			},

			skippedChannels,

			initializeChannels = function() {
				var stbChannels = (function() {
						var channels,
							// SKyLife 인 경우 다른 곳에서 채널 리스트를 가지고 온댄다.
							supportSkyLife = Beans.commons.Utils.toBoolean(appConfiguration.getText('skylife_support'));

						if (supportSkyLife) {
							channels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SATELLITE'));
							skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SKIP'));
						} else {
							channels = Utils.toArray(channelConfig.channelList);
							skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKIPPED'));
						}

						skippedChannels.forEach(function(channel) {
							console.log(channel.isHidden);
						});

						// 일시 주석처리.
						// return _.difference(channels, skippedChannels);
						return channels;
					})(),
					i, length;

				for (i = 0, length = stbChannels.length; i < length; i++) {
					// SD 채널이 아닌 채널은 서비스 대상이 아니다.
					// if (!stbChannels[i].hasSDChannel) {
					// 	continue;
					// }

					if (stbChannels[i].idType === Channel.ID_IPTV_SDS || stbChannels[i].idType === Channel.ID_IPTV_URI) {
						channels.otv[stbChannels[i].majorChannel] = stbChannels[i];
						channelsForSID.otv[stbChannels[i].sid] = stbChannels[i];
					} else if (stbChannels[i].idType === Channel.ID_DVB_S) {
						channels.ots[stbChannels[i].majorChannel] = stbChannels[i];
						channelsForSID.ots[stbChannels[i].sid] = stbChannels[i];
					}
				}

			},

			initializeKeySet = function() {
				console.log('==================initializeKeySet==================');
				var original = ownerApp.privateData.keyset,
					keyDownEventReceived = function(e) {
						var keyCode = e.keyCode,
							keyEventActor = Beans.commons.KeyEventActorProvider.getKeyEventActor();

						console.log('keycode : ' + keyCode);

						// 일단 '이전'키는 건드리지 않는다.
						if (keyCode === global.VK_BACK) {
							return;
						}

						// 모든 이벤트를 막는다.
						e.preventDefault();
						e.stopPropagation();

						if (!keyEventActor) {
							return;
						}

						if (keyEventActor.pressedKey) {
							keyEventActor.pressedKey(keyCode);
						}

						if (keyEventActor.pressedEnterKey && keyCode === global.VK_ENTER) {
							keyEventActor.pressedEnterKey();
						} else if (keyEventActor.pressedNavigationKey && keyCode >= global.VK_LEFT && keyCode <= global.VK_DOWN) {
							keyEventActor.pressedNavigationKey(keyCode);
						}
					};

				original.setValue(original.maximumValue);

				ownerApp.onKeyDown = keyDownEventReceived;
				document.addEventListener('keydown', keyDownEventReceived);

				ownerApp.show();

				ownerApp.activateInput(true);

			},

			initialized = false,

			initilaize = function() {

				if (initialized) {
					return;
				}

				initializeKeySet();

				ownerApp.onApplicationDestroyRequest = function() {
					// console.log('called onApplicationDestroyRequest');
					DataLoader.sendEndMessage();
					channelTuner.release();
				};

				initialized = true;

			},
			limitedAge = window.oipfObjectFactory.createParentalControl().getParentalRating(),
			isLimitedChannelByAge = function(channel) {
				var program;

				// STB의 연령 설정이 없으면, 제한이 없다.
				if (limitedAge === 0) {
					return false;
				}

				program = me.getProgram(channel);

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
			};

		initializeChannels();

		me.getProgram = function(channel) {
			if (!channel) {
				return;
			}
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
			result.channelNumber = channel.majorChannel;
			result.channelName = channel.name;

			searchManager = window.oipfObjectFactory.createSearchManagerObject().createSearch(1);

			query = searchManager.createQuery('programme.startTime', 5, currentTime);
			query = query.and(searchManager.createQuery('(programme.startTime + programme.duration)', 2, currentTime));


			searchManager.setQuery(query);
			searchManager.addChannelConstraint(channel);
			searchManager.result.getResults(0, 1);

			if (searchManager.result.length > 0) {
				var programInfo = searchManager.result[0],
					programStartTime = new Date(parseInt(programInfo.startTime) * 1000),
					startTime = Beans.commons.Utils.fillZero(programStartTime.getHours(), 2) + ':' + Beans.commons.Utils.fillZero(programStartTime.getMinutes(), 2),
					programEndTime = new Date(parseInt(programInfo.startTime) * 1000 + (parseInt(programInfo.duration) * 1000)),
					endTime = Beans.commons.Utils.fillZero(programEndTime.getHours(), 2) + ':' + Beans.commons.Utils.fillZero(programEndTime.getMinutes(), 2);

				result.name = programInfo.name;
				result.percent = getPercent(programInfo.startTime, programInfo.duration);
				result.startTime = startTime;
				result.endTime = endTime;

				result.limitedByAge = limitedAge !== 0 && limitedAge <= getAge(programInfo);
			}

			return result;
		};


		EventBus.register(me, 'goChannel', function(channelNumber) {
			var channel = me.getChannel(channelNumber);

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

		EventBus.register(me, 'occuredErrorOnInitializng', function() {
			initilaize();
		}, 0);

		EventBus.register(me, 'destroyApp', function() {
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
			// 	ownerApp.destroyApplication();
			// }
		});

		me.getLimitType = function(channel) {
			
			/*if (!channel || isNotExistChannel(channelNum)) {
				return LimitType.NOT_EXIST;
			}*/

			if (isLimitedChannel(channel)) {
				return LimitType.LIMITED;
			}

			if (isLimitedChannelByAge(channel)) {
				return LimitType.AGE;
			}

			return LimitType.NONE;
		};

		me.getConfigBy = function(key) {
			return appConfiguration.getText(key);
		};

		me.isOTSMode = function() {
			return me.getCurrentSTBMode() === 'ots';
		};

		me.isOTVMode = function() {
			return me.getCurrentSTBMode() === 'otv';
		};

		me.isUHDDevice = function() {
			return Beans.commons.Utils.toBoolean(me.getConfigBy('support.uhd'));
		};

		me.isOTSDevice = function() {
			return Beans.commons.Utils.toBoolean(me.getConfigBy('skylife_support'));
		};

		me.getCurrentSTBMode = function() {
			if (me.isOTSDevice() && Object.keys(channels.ots).length > 0) {
				return 'ots';
			}
			return 'otv';
		};

		me.getChannel = function(channelNo) {
			var channelProperty;

			if (me.isOTVMode) {
				channelProperty = STBMode.OTV;
			} else {
				channelProperty = STBMode.OTS; //channelDatum.type === STBMode.OTS ? STBMode.OTS : STBMode.OTV;
			}


			return channels[channelProperty][channelNo];
		};

		me.getChannelByConfigInfo = function(obj) {
			if (obj.type === 'sid') {
				return me.getChannelBySid(obj.value);
			} else {
				return me.getChannel(obj.value);
			}
		};

		EventBus.register(me, 'completedInitializing', initilaize);

		me.getChannels = function() {
			return channels;
		};

		me.getSAID = function() {
			return appConfiguration.getText('SAID');
		};

		me.getChannelBySid = function(sid, stbType) {
			var type = stbType || me.getCurrentSTBMode();

			return channelsForSID[type][sid];
		};
	}
});
'use strict';
Beans.defineClass('KBO.app.DataLoader', {

    _construct: function() {
        var me = this;

        me.startTime = Utils.getTimeStamp();
    },

    loadAppConfig: function() {
        return Http.get({
            url: 'appConfig.xml'
        });
    },

    loadWebSocketUrl: function (callback) {
        var saId = STBService.getConfigBy('SAID');
        return Http.get({
            url: AppConfig.mashUpApi.url + '/wsocketInfo?type=LIVE&said=' + saId
        });
    },

    onGoingGame: function(callback) {
        return Http.get({
            url: AppConfig.mashUpApi.url + '/ongoingGame?' + DataLoader.getCommonQueryString()
        });
    },

    getCommonQueryString: function() {
        var saId = STBService.getConfigBy('SAID'),
            tvType = STBService.getCurrentSTBMode() === STBMode.OTV ? 1 : 2,
            queryString = 'said=' + saId + '&stb_type=1&tv_type=' + tvType + '&mashup_id=' + AppConfig.mashUpApi.id;

        return queryString;
    },

    getTodayGameList: function() {
        return Http.get({
            url: AppConfig.mashUpApi.url + '/todayGameList?' + DataLoader.getCommonQueryString()
        });
    },

    getRealTimeData: function(callback) {
        return Http.get({
            url: AppConfig.mashUpApi.url + '/realtimeData?' + DataLoader.getCommonQueryString()
        });
    },

    sendMessageTo: function(type) {
        var me = this,
            saId = STBService.getSAID(),
            rpInfo = AppConfig.rpApi,
            WMOCKey = rpInfo.wmocKey,
            sid = rpInfo.serviceId,
            url, data, success;

        if (type === 'start') {
            url = '/start-service';
            me.startTime = Utils.getTimeStamp();
            data = 'WMOCKey=' + WMOCKey + '&saId=' + saId + '&pinNo=&serviceId=' + sid + '&startTime=' + me.startTime;
            success = function(responseText) {
                var result = JSON.parse(responseText);
                if (typeof result.usageId !== 'undefined') {
                    me.usageId = result.usageId;
                }
            };
        } else {
            if (me.usageId !== 0) {
                url = '/end-service';
                data = 'WMOCKey=' + WMOCKey + '&usageId=' + me.usageId + '&endTime=' + Utils.getTimeStamp();
            } else {
                url = '/create-service';
                data = 'WMOCKey=' + WMOCKey + '&saId=' + saId + '&pinNo=&serviceId=' + sid + '&startTime=' + me.startTime + '&endTime=' + Utils.getTimeStamp();
            }
        }

        return Http.post({
            url: rpInfo.url + url,
            data: data,
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            }
        }).then(success);

    },

    sendEndMessage: function() {
        var me = this;
        return me.sendMessageTo('end');
    },

    sendStartMessage: function() {
        var me = this;
        return me.sendMessageTo('start');
    }
});
'use strict';

function ScreenPosition(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

Beans.defineClass('KBO.app.ChannelTuner', {

	videoObject: undefined,

	_construct: function() {
		var me = this;

		EventBus.register(me, 'changeSubToMain', function(index) {

			Beans.commons.Utils.change(PlayDataManager.channelsList, 0, index);

			me.videoObject.setChannel(0, STBService.getChannel(PlayDataManager.channelsList[0]));
			me.videoObject.setChannel(index, STBService.getChannel(PlayDataManager.channelsList[index]));


			//================================죄송합니다~~~~~~~~~~~~~~~==================//
			var tempLimit = document.getElementsByClassName("limit")[0].style.display;
			var tempSettingLimit = document.getElementsByClassName("settingLimit")[0].style.display;
			var tempExistLimit = document.getElementsByClassName("existLimit")[0].style.display;

			document.getElementsByClassName("limit")[0].style.display = document.getElementsByClassName("limit")[index].style.display;
			document.getElementsByClassName("limit")[index].style.display = tempLimit;

			document.getElementsByClassName("settingLimit")[0].style.display = document.getElementsByClassName("settingLimit")[index].style.display;
			document.getElementsByClassName("settingLimit")[index].style.display = tempSettingLimit;

			document.getElementsByClassName("existLimit")[0].style.display = document.getElementsByClassName("existLimit")[index].style.display;
			document.getElementsByClassName("existLimit")[index].style.display = tempExistLimit;
			//================================죄송합니다~~~~~~~~~~~~~~~==================//

			if (document.getElementsByClassName("limit")[0].style.display != "none") {
				me.changeAudio(0, 'block');
			} else {
				me.changeAudio(0, 'none');
			}

		});

		EventBus.register(me, 'destroyApp', function() {
			console.debug('called destroyApp in ChannelTuner');
			if (me.videoObject) {
				me.release();
			}
		});

		EventBus.register(me, 'completedInitializing', function(channels) {
			me.createObject();
			var tempLimit = 'none';
			channels.forEach(function(channel, idx) {
				var tempLimit;
				if (channel) {
					tempLimit = STBService.getLimitType(channel);	
				} else {
					tempLimit = 'notExist';
				}

				document.getElementsByClassName("limit")[idx].style.display = "";
				document.getElementsByClassName("settingLimit")[idx].style.display = "";
				document.getElementsByClassName("existLimit")[idx].style.display = "";

				if (tempLimit == 'age') {
					document.getElementsByClassName("limit")[idx].style.display = "block";
				} else if (tempLimit == 'limited') {
					document.getElementsByClassName("settingLimit")[idx].style.display = "block";
				} else if (tempLimit == 'notExist') {
					document.getElementsByClassName("existLimit")[idx].style.display = "block";
				} else {
					document.getElementsByClassName("limit")[idx].style.display = "none";
				}

				me.videoObject.setChannel(idx, channel);
			});

			if (document.getElementsByClassName("limit")[0].style.display != "none") {
				tempLimit = 'block';
			}

			me.changeAudio(0, tempLimit);

			me.checkLimitInterval = setInterval(function() {

				EventBus.fire('checkLimit');

			}, 20000);
		});

		EventBus.register(me, 'changedFocus', function(idx) {
			var tempLimit = document.getElementsByClassName("limit")[idx].style.display;
			me.changeAudio(idx, tempLimit);

		});

		EventBus.register(me, 'checkLimit', function() {
			var result = [],
				i, length;
			for (i = 0, length = PlayDataManager.channelsList.length; i < length; i++) {
				result.push(STBService.getChannel(PlayDataManager.channelsList[i]));
			}

			result.forEach(function(channel, idx) {
				var tempLimit;
				if (channel) {
					tempLimit = STBService.getLimitType(channel);	
				} else {
					tempLimit = 'notExist';
				}

				if (tempLimit == 'age') {
					document.getElementsByClassName("limit")[idx].style.display = "block";
				} else if (tempLimit == 'limited') {
					document.getElementsByClassName("settingLimit")[idx].style.display = "block";
				} else if (tempLimit == 'notExist') {
					document.getElementsByClassName("existLimit")[idx].style.display = "block";
				} else {
					document.getElementsByClassName("limit")[idx].style.display = "none";
					if (PlayDataManager.currentChannelIndex == idx) {
						//me.changeAudio(idx,tempLimit);
					}
				}
				if (PlayDataManager.currentChannelIndex == idx && document.getElementsByClassName("limit")[idx].style.display != "none") {
					me.videoObject.stop(idx);
				}

			});

		});
	},

	createObject: function() {
		var info = [
			new ScreenPosition(45, 32, 765, 430),
			new ScreenPosition(45, 472, 296, 166),
			new ScreenPosition(344, 472, 296, 166),
			new ScreenPosition(644, 472, 296, 166),
			new ScreenPosition(943, 472, 296, 166)
		];

		try {
			this.videoObject = global.oipfObjectFactory.createMosaicWindow(info);
		} catch (e) {
			console.error(e);
			throw new Error(e);
		}
	},

	changeAudio: function(index, visibleElement) {
		var me = this;

		try {
			me.videoObject.selectMosaicAudio(index);

			if (visibleElement == 'block') {
				me.videoObject.stop(index);
			}

		} catch (e) {
			console.error('not existed audio component');
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
		/*,mute: function(isOn) {
			var me = this;
			if (isOn) {
				me.videoObject.stop(PlayDataManager.currentChannelNumber);	
			} else {
				me.videoObject.setChannel(PlayDataManager.currentChannelNumber, window.STBService.getChannel(me.channelDatum.channels[ChannelDataManager.currentSubChannelDataIndex]));
			}
		}*/
});
'use strict';

Beans.defineClass('KBO.app.PlayDataManager', {
	displayFocusTime: 200, // 포거스 이동시 delay time
	timer: undefined, // focus 이동 timer
	intervalTime: 10000, // realtimedate interval time

	playDataJson: undefined, // realtimedata json
	todayDataJson: undefined, // todaydata json

	channelsList: [], // display channel list
	currentChannelNumber: undefined, // 정보 패널에 보여지는 정보의 체널
	currentChannelIndex: undefined, // 정보 패널에 보여지는 정보의 체널
	channelMap: {}, // channel no : game info

	playerMap: {}, // player id : player info

	// gameid : '', // game id

	requestIntervar: {},
	checkLimitInterval: {},
	// gui에 보여주는 정보
	inning: '',
	inningNum: '',
	inningState: '',
	teamHome: '',
	teamAway: '',
	inningInning: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'R', 'H', 'E', 'B'],
	homeInning: ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
	awayInning: ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
	playerHome: '',
	playerAway: '',
	scoreHome: 0,
	scoreAway: 0,
	rankHome: '0 위',
	rankAway: '0 위',
	playerStaHome: '',
	playerStaAway: '',
	playerStatHome: '',
	playerStatAway: '',
	base1: 0,
	base2: 0,
	base3: 0,
	ballCount: 0,
	strikeCount: 0,
	outCount: 0,
	subChanelInfo: [],
	retryCount: 0,
	_construct: function() {
		var me = this;

		me._initializeElement();
	},

	_initializeElement: function() {
		var me = this;

		EventBus.register(me, 'completedInitializing', function() {
			me.getCurrentPlayData();

			// return;

			// me.requestIntervar = setInterval(function() {

			// 	me.requestRealtimeDate();

			// }, me.intervalTime);

			// me.checkLimitInterval = setInterval(function() {

			// 	EventBus.fire('checkLimit');

			// }, me.intervalTime);
		});

		EventBus.register(me, 'reloadedData', function(data) {
			me.playDataJson = data;
			me.getCurrentPlayData();
		});

		EventBus.register(me, 'changeSubToMain', function() {
			me.getCurrentPlayData();
		});

		EventBus.register(me, 'changedFocus', function(index) {
			me.currentChannelNumber = me.channelsList[index];
			me.getCurrentPlayData();
		});

		EventBus.register(me, 'notRecievedPKGList', function() {
			me.playDataJson = null;
		});
	},

	requestRealtimeDate: function() {
		var me = this;
		// DataLoader.getTodaysGameList (function (json) {
		//   		PlayDataManager.todayDataJson = json;
		DataLoader.getRealTimeData(function(json) {
			console.log('retryCount : ' + me.retryCount);
			if (me.retryCount > 2) {
				me.retryCount = 0;
				EventBus.fire('notRecievedPKGList');
			}
			if (json !== '') {
				PlayDataManager.playDataJson = json;
				me.retryCount = 0;
			} else {
				me.retryCount++;
			}
			me.getCurrentPlayData();
		});
		// });
	},

	getChannelData: function() {
		var me = this,
			key, item, ch, idx, inIdx,
			channelsJson,
			//OTV --> 51: SPOTV 1, 52: SPOTV2, 53: Ib sport, 54: SKY SPORTS, 58: SBS SPORTS, 59: KBS N SPORTS, 60: MBC Sports +
			//OTS --> 49:SPOTV1, 50:SKY SPORTS , 52:MBC Sports +, 51:KBS N SPORTS, 53:SBS SPORTS
			defaultChannelList = (function() {
				var channelData = STBService.isOTVMode() ? AppConfig.channels.otv : AppConfig.channels.ots,
					result = [];

				channelData.forEach(function(datum) {
					var channel = STBService.getChannelByConfigInfo(datum);
					if (channel) {
						result.push(channel);
					} else {
						result.push(null);
					}
				});

				// 제한채널 순서 변경
				result.sort(function(a, b) {

					if (b === null) {
						return -1;
					}

					var limitType = STBService.getLimitType(b);
					return limitType !== LimitType.NONE ? -1 : 1;
				});

				return result.map(function(channel) {
					return channel ? channel.majorChannel : null;
				});

			})();

		channelsJson = me.playDataJson.STT_L;

		var playingGameArr = [],
			beforeGameArr = [],
			finishedGameArr = [];

		var returnList = [];

		console.log('defaultChannelList', defaultChannelList);

		defaultChannelList.forEach(function(channelNo) {
			for (key in channelsJson) {
				if (channelNo === Utils.toNumber(key)) {
					returnList.push(channelNo);
					break;
				}
			}
		});
		// for (var outIdx in defaultChannelList) {
		// 	for (key in channelsJson) {
		// 		if( key == 52 || key == 53 || key == 48 ){
		// 			continue;
		// 		}
		// 		if (defaultChannelList[outIdx] === Utils.toNumber(key)) {
		// 			returnList.push(defaultChannelList[outIdx]);
		// 			break;
		// 		}
		// 	}
		// }
		console.log('rhj returnList : ' + returnList);
		for (key in returnList) {

			item = channelsJson[returnList[key]];
			console.log('key : ' + returnList[key]);
			me.channelMap['' + returnList[key]] = item;
			// 채널 번호 수집
			// console.log('me.channelsList.length : ' + me.channelsList.length);
			// console.log('VideoListPanel.videoCount : ' + VideoListPanel.videoCount);
			// console.log('item.G_ID : ' + item.G_ID);
			// console.log('gameIdMap[item.G_ID] : ' + gameIdMap[item.G_ID]);

			/*if(!gameIdMap[item.G_ID]) {*/
			console.log('item.STT_ID : ' + item.STT_ID);
			// STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
			if (item.STT_ID === 2) {
				playingGameArr.push(returnList[key]);
				//} else if(item.STT_ID == 0 || item.STT_ID == 1) {
				//	beforeGameArr.push(returnList[key]);
			} else {
				finishedGameArr.push(returnList[key]);
			}
			/*gameIdMap[item.G_ID] = true;
			}else {
				finishedGameArr.push(returnList[key]);
			}*/
		}

		//playingGameArr.sort();
		//beforeGameArr.sort();
		//finishedGameArr.sort();


		for (key in playingGameArr) {
			if (me.channelsList.length < VideoListPanel.videoCount) {
				me.channelsList.push(playingGameArr[key]);
			} else {
				break;
			}
		}

		if (me.channelsList.length < VideoListPanel.videoCount) {
			for (key in beforeGameArr) {
				if (me.channelsList.length < VideoListPanel.videoCount) {
					me.channelsList.push(beforeGameArr[key]);
				} else {
					break;
				}
			}
		}

		if (me.channelsList.length < VideoListPanel.videoCount) {
			for (key in finishedGameArr) {
				if (me.channelsList.length < VideoListPanel.videoCount) {
					me.channelsList.push(finishedGameArr[key]);
				} else {
					break;
				}
			}
		}

		console.log('playingGameArr : ' + playingGameArr);
		console.log('beforeGameArr : ' + beforeGameArr);
		console.log('finishedGameArr : ' + finishedGameArr);
		console.log('me.channelsList : ' + me.channelsList);

		// 목록에 채널 여부 체크
		function isContain(val) {
			for (idx in me.channelsList) {
				if (me.channelsList[idx] === val) {
					return true;
				}
			}
			return false;
		}

		console.log(me.channelsList);

		// 5개가 안되는 경우 default 채널 중에 입력
		if (me.channelsList.length < VideoListPanel.videoCount) {

			for (idx in defaultChannelList) {
				var bPushCheck = true;

				for (inIdx in me.channelsList) {
					if (me.channelsList[inIdx] === defaultChannelList[idx]) {
						bPushCheck = false;
						break;
					}
				}
				if (bPushCheck) {
					me.channelsList.push(defaultChannelList[idx]);
					console.log('defaultChannelList[idx] : ' + defaultChannelList[idx]);
					//me.channelMap['' + defaultChannelList[idx]] = null;
				}
			}
		}

		while (me.channelsList.length < VideoListPanel.videoCount) {
			me.channelsList.push(null);
		}

		// 현재 번호 초기화
		me.currentChannelNumber = me.channelsList[0];
		me.currentChannelIndex = 0;
		// console.log('me.currentChannelNumber : ' + me.currentChannelNumber);


		// 숨김채널 처리
		me.channelsList.sort(function(a, b) {
			return b === null ? -1 : 1;
		});

		console.log(' ==== channelsList : ' + me.channelsList);

		//console.log(' ==== channelsList2 : ' + returnList);
		//me.channelsList = returnList;
		return me.channelsList;
	},

	// display 데이터 초기화
	reset: function() {
		var me = this;
		me.inning = '';
		me.inningNum = '';
		me.inningState = '';
		me.homeInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
		me.awayInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
		me.playerHome = '';
		me.playerAway = '';
		me.playerStaHome = '';
		me.playerStaAway = '';
		me.playerStatHome = '';
		me.playerStatAway = '';
		me.teamHome = '';
		me.teamAway = '';
		me.scoreHome = 0;
		me.scoreAway = 0;
		me.rankHome = '';
		me.rankAway = '';
	},

	getCurrentPlayData: function() {

		var me = this,
			item, i, gameid,
			channelsJson,
			focusedIndex, key;


		// for(i = 0; i < me.channelsList.length; i++) {
		//           if(me.channelsList[i] == me.currentChannelNumber) {
		//               focusedIndex = i;
		//               break;
		//           }
		//       }
		for (focusedIndex in me.channelsList) {
			// console.log('index : ' + focusedIndex);
			// console.log('me.channelsList[focusedIndex] : ' + me.channelsList[focusedIndex]);
			// console.log('me.currentChannelNumber : ' + me.currentChannelNumber);
			if (me.channelsList[focusedIndex] === me.currentChannelNumber) {
				// console.log('==');
				me.currentChannelIndex = focusedIndex;
				break;
			}
		}

		try {
			channelsJson = me.playDataJson.STT_L;
			for (key in channelsJson) {
				item = channelsJson[key];
				me.channelMap['' + key] = item;
			}
		} catch (e) {
			console.log('exception : ' + e);
		}

		// console.log('focused index : ' + focusedIndex);
		me.reset();

		// 보여줄 정복의 게임 id
		if (me.channelMap[me.currentChannelNumber] !== undefined) {
			gameid = me.channelMap[me.currentChannelNumber].G_ID;
		}
		console.log('gameid : ' + gameid);

		var todayGameList,
			game, // 볼 카운트
			pitcherVs, // 투수대타자상대전적
			taggiaVs, //타자대팀상대전적리스트
			inning, // inning 정보
			gameRecord, // 경기 레코드
			taggia, // 타자 목록
			pitcher; // 투수 목록


		todayGameList = me.todayDataJson.todayGameList;
		// console.log('todayGameList : ' + JSON.stringify(me.todayDataJson));
		// console.log('todayGameList : ' + todayGameList);
		console.log('me.playDataJson : ' + me.playDataJson);
		if (me.playDataJson == null) {
			return;
		}

		if (gameid) {
			game = me.playDataJson.B_C_L[gameid];
			pitcherVs = me.playDataJson.HT_VS_PT[gameid];
			taggiaVs = me.playDataJson.HT_VS_TE[gameid];
			inning = me.playDataJson.INN_SC_L[gameid];
			gameRecord = me.playDataJson.G_R_L[gameid];
			taggia = me.playDataJson.BT_L[gameid];
			pitcher = me.playDataJson.PT_L[gameid];

		}


		// STT_ID - 0: 실시간전, 1: 경기전, 2: 경기중, 3: 경기 종료, 4: 경기 취소, 5: 서스펜디드
		// 경기 상태 정보 channel data
		for (i = 0; i < me.channelsList.length; i++) {
			var subChGameId,
				subGame,
				subGameRecord,
				subItem = {},
				subHomeScore = 0,
				subAwayScore = 0;

			// console.log('i : ' + i);
			// console.log('me.channelsList[i] : ' + me.channelsList[i]);
			// console.log('me.channelMap[me.channelsList[i]] : ' + me.channelMap[me.channelsList[i]]);
			if (me.channelMap[me.channelsList[i]] != undefined) {
				subChGameId = me.channelMap[me.channelsList[i]].G_ID;
				subGame = me.playDataJson.B_C_L[subChGameId];
				subGameRecord = me.playDataJson.G_R_L[subChGameId];
				subItem.state = me.channelMap[me.channelsList[i]].STT_ID;
				//me.subChanelInfo[focusedIndex] != undefined? me.subChanelInfo[focusedIndex].state : '';
				if (subGameRecord != null) {
					if (subGameRecord[0].H_V == 1) { // home
						subHomeScore = subGameRecord[0].R;
						subAwayScore = subGameRecord[1].R;
					} else {
						subHomeScore = subGameRecord[1].R;
						subAwayScore = subGameRecord[0].R;
					}
				}
				if (subGame != null) {
					subItem.away = subGame.V;
					subItem.home = subGame.H;
					console.log(subGame.TB_SC + '<<<<<<<<<<');
					subItem.inningState = (subGame.TB_SC == 'T' ? subGame.INN_NO + '회 초' : subGame.INN_NO + '회 말');
				}
				subItem.awayScore = subAwayScore;
				subItem.homeScore = subHomeScore;
				me.subChanelInfo[i] = subItem;
			} else {
				subItem.state = 6;
				me.subChanelInfo[i] = subItem;
			}
		}

		// console.log('me.subChanelInfo : ' + me.subChanelInfo);

		var state = 0;
		if (me.subChanelInfo != null) {
			state = me.subChanelInfo[focusedIndex] != undefined ? me.subChanelInfo[focusedIndex].state : '';
		}

		// console.log('state : ' + state);
		// console.log('todayGameList : ' + todayGameList);
		// player 정보
		if (todayGameList != null) {
			// console.log('state : ' + state);
			for (i = 0; i < todayGameList.length; i++) {
				item = todayGameList[i];

				if (('' + item.GMKEY) == ('' + gameid)) {
					// 순위
					me.rankAway = item.VISIT_RANK + ' 위';
					me.rankHome = item.HOME_RANK + ' 위';
					// 팀 로고
					me.teamHome = item.HOME_KEY;
					me.teamAway = item.VISIT_KEY;
					// console.log('me.teamHome : ' + me.teamHome);
					// console.log('me.teamAway : ' + me.teamAway);

					// 경기전 정보
					if (state == 0 || state == 1) {
						// 	var resultArr = item.HOME_RESULT.split('-');
						me.playerHome = '선발: ' + item.HPNAME;
						// 	me.playerStaHome = resultArr[0] + '승 ' + resultArr[1] + '패 ' + resultArr[2] + '무'; // 승 패 무
						me.playerStaHome = '';
						me.playerStatHome = '';
						// 	resultArr = item.VISIT_RESULT.split('-');
						me.playerAway = '선발: ' + item.VPNAME;
						// 	me.playerStaAway = resultArr[0] + '승 ' + resultArr[1] + '패 ' + resultArr[2] + '무'; // 승 패 무
						me.playerStaAway = '';
						me.playerStatAway = '';

						me.homeInning[0] = item.HOME;
						me.awayInning[0] = item.VISIT;
					}
					break;
				}
			}
		}

		// console.log('===== game : ' + game);
		var tempHome, tempAway;
		if (state === 0 || state === 1) {

		} else if (state === 4 || state === 6) {

		} else if (state === 3) {
			if (gameRecord != null) {

				if (gameRecord[0].H_V === 1) { // home
					tempHome = gameRecord[0];
					tempAway = gameRecord[1];
				} else {
					tempHome = gameRecord[1];
					tempAway = gameRecord[0];
				}

				me.playerHome = tempHome.PT;
				me.playerAway = tempAway.PT;

				if (tempHome.R > tempAway.R) {
					me.playerStaHome = '승리(' + tempHome.W + ' 승 ' + tempHome.L + ' 패)';
					me.playerStaAway = '패전(' + tempAway.W + ' 승 ' + tempAway.L + ' 패)';
				} else {
					me.playerStaHome = '패전(' + tempHome.W + ' 승 ' + tempHome.L + ' 패)';
					me.playerStaAway = '승리(' + tempAway.W + ' 승 ' + tempAway.L + ' 패)';
				}
			}
		} else {
			// player 정보
			for (i = 0; i < taggia.V.length; i++) {
				me.playerMap['' + taggia.V[i].PY_ID] = 'V';
				me.playerMap['' + taggia.V[i].PY_ID + 'V'] = taggia.V[i];
			}
			for (i = 0; i < taggia.H.length; i++) {
				me.playerMap['' + taggia.H[i].PY_ID] = 'H';
				me.playerMap['' + taggia.H[i].PY_ID + 'H'] = taggia.H[i];
			}
			me.playerMap['' + pitcher.V.PY_ID] = 'V';
			me.playerMap['' + pitcher.V.PY_ID + 'V'] = pitcher.V;
			me.playerMap['' + pitcher.H.PY_ID] = 'H';
			me.playerMap['' + pitcher.H.PY_ID + 'H'] = pitcher.H;

			// console.log('pitcherVs : ' + pitcherVs);
			// console.log('taggiaVs : ' + taggiaVs);


			if (game != null) {
				if (me.playerMap[game.PT] === 'H') {
					tempHome = me.playerMap[game.PT + 'H'];
					tempAway = me.playerMap[game.BT + 'V'];

					me.playerHome = '투수: ' + tempHome.PY_N;
					me.playerStaHome = (tempHome.S_ERA == undefined ? '' : '방어율: ' + tempHome.S_ERA);

					me.playerAway = '타자: ' + tempAway.PY_N;
					me.playerStaAway = (tempAway.S_HRA == undefined ? '' : '타율: ' + tempAway.S_HRA);
				} else {
					tempHome = me.playerMap[game.BT + 'H'];
					tempAway = me.playerMap[game.PT + 'V'];

					me.playerHome = '타자: ' + tempHome.PY_N;
					me.playerStaHome = (tempHome.S_HRA == undefined ? '' : '타율: ' + tempHome.S_HRA);

					me.playerAway = '투수: ' + tempAway.PY_N;
					me.playerStaAway = (tempAway.S_ERA == undefined ? '' : '방어율: ' + tempAway.S_ERA);
				}

				// console.log('pitcherVs : ' + pitcherVs);
				if (pitcherVs != null) {
					if (me.playerMap[game.PT] == 'H') {

						me.playerStatAway = pitcherVs.PA + '타석 ' + pitcherVs.AB + '타수 ' + pitcherVs.HT + '안타';

						me.playerStatHome = '상대 타율: ' + pitcherVs.HRA;

					} else {

						me.playerStatHome = pitcherVs.PA + '타석 ' + pitcherVs.AB + '타수 ' + pitcherVs.HT + '안타';

						me.playerStatAway = '상대 타율: ' + pitcherVs.HRA;

					}
				}
			}
		}

		// 게임중 이닝 표시
		if (state === 2 || state === 5) {
			if (game != null) {
				me.inningNum = game.INN_NO;
				me.inningState = (game.TB_SC === 'T' ? '초' : '말');
			}
		}

		// score panel 임시정보
		var tempHinning = [],
			tempAinning = [];

		if (game != null) {
			// 팀 로고
			me.teamHome = game.H_K;
			me.teamAway = game.V_K;

			// console.log('me.teamHome : ' + me.teamHome);
			// console.log('me.teamAway : ' + me.teamAway);

			// 진루 표시
			me.base1 = game.BS_1;
			me.base2 = game.BS_2;
			me.base3 = game.BS_3;

			// 볼 카운트 표시
			me.ballCount = game.B;
			me.strikeCount = game.ST;
			me.outCount = game.O;

			// console.log('me.ballCount : ' + me.ballCount);
			// console.log('me.strikeCount : ' + me.strikeCount);
			// console.log('me.outCount : ' + me.outCount);

			// score panel 팀명
			me.homeInning[0] = game.H;
			me.awayInning[0] = game.V;
		}


		// 이닝 스코어
		var homeFBallCount = 0,
			awayFBallCount = 0;
		if (inning != null) {
			for (i = 0; i < inning.length; i++) {
				item = inning[i];
				if (item.H_V == 1) { // home
					tempHinning[item.INN] = item.S;
					homeFBallCount = item.B_F;
					// homeFBallCount += item.B_F;
					me.scoreHome = item.R;
				} else {
					tempAinning[item.INN] = item.S;
					awayFBallCount = item.B_F;
					// awayFBallCount += item.B_F;
					me.scoreAway = item.R;
				}
			}

			// 연장전 정보 표시하기
			var gap = 0;
			if (tempAinning.length > 9) {
				gap = tempAinning.length - 1 - 9;
			}
			for (i = 1; i < 10; i++) {
				me.inningInning[i] = i + gap;
				me.homeInning[i] = tempHinning[i + gap] == null ? '' : tempHinning[i + gap];
				me.awayInning[i] = tempAinning[i + gap] == null ? '' : tempAinning[i + gap];
			}
		}

		// RHEB // 10 = r, 11 = h, 12 = e, 13 = b
		// 게임 레코드 정보 표시
		console.log('gameRecord : ' + gameRecord);
		if (gameRecord != null) {
			console.log('tempHome : ' + gameRecord[0]);
			console.log('tempAway : ' + gameRecord[1]);
			// 4 사구
			if (gameRecord[0].H_V == 1) {
				tempHome = gameRecord[0];
				tempAway = gameRecord[1];
			} else {
				tempHome = gameRecord[1];
				tempAway = gameRecord[0];
			}
			try {
				me.homeInning[10] = tempHome.R;
				me.homeInning[11] = tempHome.HT;
				me.homeInning[12] = tempHome.E;
				me.awayInning[10] = tempAway.R;
				me.awayInning[11] = tempAway.HT;
				me.awayInning[12] = tempAway.E;
			} catch (e) {
				console.log('exception : ' + e);
				me.homeInning[10] = '';
				me.homeInning[11] = '';
				me.homeInning[12] = '';
				me.awayInning[10] = '';
				me.awayInning[11] = '';
				me.awayInning[12] = '';
				homeFBallCount = '';
				awayFBallCount = '';
			}
		} else {
			homeFBallCount = '';
			awayFBallCount = '';
		}

		me.homeInning[13] = homeFBallCount;
		me.awayInning[13] = awayFBallCount;



		EventBus.fire('realtimeData', me);
	}
});
'use strict';
Beans.defineClass('KBO.app.RealtimeData', {
    _construct: function(url) {
        var me = this;
        me.url = url;
        me.initialized = false;
    },
    init: function() {
        var me = this;
        
        me.lastRecivedDataTime = Date.now();
        
        me.interval = setInterval(function() {
        	if ((Date.now() - me.lastRecivedDataTime) > 30000 ) {
        		EventBus.fire('notRecievedPKGList');
        	}
        }, 30000);
        
        return new Promise(function(resolve, reject) {
            me.ws = new WebSocket('ws://' + me.url + '/said=' + STBService.getSAID());
            me.ws.onopen = function() {
                console.log('WS Connected');
                me.initialized = true;
                Timer.start('firstDataGettingTime');
                resolve();
            };
            me.ws.onmessage = function(e) {
                // console.log('WS Response: ' + e.data);
                me.lastRecivedDataTime = Date.now();
                
                Timer.end('firstDataGettingTime');
                
                EventBus.fire('reloadedData', JSON.parse(e.data).body.message);
            };
            me.ws.onerror = function(e) {
                if (!me.initialized) {
                    // 초기화가 완료되어 있지 않다는 것은 앱 로딩시 요청 중 에러가 발생한 것으로 간주한다.
                    // reject 를 호출하여 Main.js 에서 catch 가 호출될 수 있도록 한다.
                    reject();
                    return;
                }
                console.log(e);
            };
            me.ws.onclose = function(e) {
                console.log('WS Connection Closed', e);
                if (!me.initialized) {
                    return;
                }
                setTimeout(function() {
                    RealtimeData.init().then(DataLoader.getRealTimeData).then(function(responseText) {
                        EventBus.fire('reloadedData', JSON.parse(responseText));
                    });
                }, 10000);
            };
        });
    }
});