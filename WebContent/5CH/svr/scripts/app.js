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
                }
            }
        },
        execute = function(instance, executeFunction, args) {
            var startTime, endTime;
            startTime = window.performance.now();
            executeFunction.apply(instance, args);
            endTime = window.performance.now();
            // console.log(endTime - startTime);
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
		
		
		// console.log("DataLoader 생성");
		global.DataLoader = KBO.app.DataLoader.create();
		// console.log("STBService 생성");
		global.STBService = KBO.app.STBService.create();
		// console.log("PlayDataManager 생성");
		global.PlayDataManager = KBO.app.PlayDataManager.create();
		// console.log("ViewPort 생성");
		global.ViewPort = KBO.components.ViewPort.create();
		var isOTSSignal = STBService.checkOTSSignal();
//		console.log("isOTSMode===========>"+STBService.isOTSMode());
//		console.log("isOTSSignal===========>"+isOTSSignal);
		if(!STBService.isOTSMode() || (STBService.isOTSMode() && isOTSSignal)){

			//EventBus.fire('goChannelSvr', 802);
			// 1. appConfig Getting
			DataLoader.loadAppConfig().then(function(responseText) {
				try {
					global.AppConfig = Utils.convertXmlToJson(responseText, 'multiView');
				} catch (e) {
					
					throw e;
				}
				// 2. TodayGameList Getting
			}).then(DataLoader.getTodayGameList).then(function(responseText) {
				try {
					PlayDataManager.todayDataJson = JSON.parse(responseText);					
				} catch (e) {
					console.log("e ==============>"+e);
					throw e;
				}
				// 3. WebSocket Url Getting
			}).then(DataLoader.loadWebSocketUrl).then(function(responseText) {
	
				try {
					var wsUrl = JSON.parse(responseText).wsocketInfo;
					global.RealtimeData = KBO.app.RealtimeData.create(wsUrl);					
					return global.RealtimeData.init();
				} catch (e) {
					console.log("e ==============>"+e);
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
						console.log("channelNumbers :"+channelNumbers)
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
				console.log("Error===========>"+e);
				EventBus.fire('occuredErrorOnInitializng',false);
			});
		}
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
		me.subChannelInfoPanel1 = KBO.components.SubChannelInfoPanel1.create();
		me.subChannelInfoPanel2 = KBO.components.SubChannelInfoPanel2.create();
		me.popup = KBO.components.Popup.create();

		me._initializeElement();

		EventBus.register(me, 'completedInitializing', function() {
			me.show();
			me.videoListPanel.show();
            
		});

		EventBus.register(me, 'occuredErrorOnInitializng', function (isSocket) {
				me.show();
				me.videoListPanel.show();
		}, 1);
		
		EventBus.register(me, 'occuredErrorOnConnectingWSocket', function () {
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
		me.element.appendChild(me.subChannelInfoPanel1.element);

		me.element.appendChild(me.subChannelInfoPanel2.element);
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

        // console.log("videoList DIV 생성 완료");
    },

    pressedEnterKey: function(keyCode) {
        var me = this;
        	console.log("PlayDataManager.currentChannelNumber=======>"+PlayDataManager.currentChannelNumber)
            EventBus.fire('goChannel', PlayDataManager.currentChannelNumber);
            return;
    },

    pressedNavigationKey: function(keyCode) {
        var me = this,
            secondIndex = 1,
            thirdIndex = 2,
            lastIndex = me.videoCount - 1,
            nextIndex = me.currentIndex;
        
        console.log(me.currentIndex)
        switch (keyCode) {
            case VK_LEFT:
                if (me.currentIndex === 0) {
                	nextIndex = nextIndex + 1;
                	 break;
                } else if(me.currentIndex === 2) {
                	nextIndex = lastIndex;
                	 break;
                }
                nextIndex = nextIndex - 1;
                break;
            case VK_RIGHT:
            	if (me.currentIndex === 1) {
                	nextIndex = 0;
                	break;
                } else if(me.currentIndex === lastIndex) {
                	nextIndex = thirdIndex;
                	break;
                }
                nextIndex = me.currentIndex + 1;
                break;
            case VK_UP:
            	if (me.currentIndex === 0) {
                	nextIndex = nextIndex + 2;
                	break;
                } else if (me.currentIndex === secondIndex){ 
                	nextIndex = nextIndex + 3;
                	break;
                } else if (me.currentIndex === lastIndex) {
                	nextIndex =  nextIndex - 3;
                	break;
                } if (me.currentIndex === 3 ) {
                	break;
                }
            	nextIndex = nextIndex-2;
            	 break;
            case VK_DOWN:
            	if (me.currentIndex === secondIndex) {
                	nextIndex = nextIndex + 3;
                	break;
                } else if (me.currentIndex === thirdIndex){ 
                	nextIndex = nextIndex - 2;
                	break;
                } else if (me.currentIndex === lastIndex) {
                	nextIndex =  nextIndex - 3;
                	break;
                } else if (me.currentIndex === 3 ){
                	break;
                }
            	nextIndex = nextIndex+2;
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
		ch_Box_bar, fl_rBox;

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

		/* 주석처리 문상현 */

		/*
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

		*/
	},

	focusOut: function () {
		var me = this;
		clearTimeout(me.displayTimer);
		me.removeElement(me.focusElement);
	}
});
'use strict';

Beans.extendClass('KBO.components.SubChannelInfoPanel1', 'Beans.components.UiComponent', {

    subChannelTopCount : 2,
    _construct: function () {
        var me = this;

        me._initializeElement();

    },

    _initializeElement: function () {
        var me = this, i, j, item;
        
        me.element = me.createDIV('sub_channel_top');

        for (i = 0; i < me.subChannelTopCount; i++) {
            item = KBO.components.displayitem.SubChannel.create();
            item.idx = i;
            me.element.appendChild(item.element);
        }

    }
});



'use strict';



Beans.extendClass('KBO.components.SubChannelInfoPanel2', 'Beans.components.UiComponent', {

    subChannelBottomCount : 3,

    _construct: function () {

        var me = this;



        me._initializeElement();



    },



    _initializeElement: function () {

        var me = this, i, j, item;

        

        me.element = me.createDIV('sub_channel_bottom');

        for (j = 2; j < 5; j++) {

            item = KBO.components.displayitem.SubChannel.create();

            item.idx = j;

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
//            var item = playData.subChanelInfo[me.idx + 1], //임시 주석 기존 UI에서는 4개의 서브 채널의 정보만 보여주기때문에 idx에 1을 더하고 있음

        	var item = playData.subChanelInfo[me.idx],
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
//                    score.style.width='70px';
                    score.style.padding = "0 10px";
                    score.style.fontWeight="bold";
                } else {
                	me.setText(iState, '');
                    me.setText(away, '');
                    me.setText(home, '');
//                    score.style.width='180px';
//                    score.style.padding = "0 20px";
                    score.style.fontWeight="";
                    if(item.state == 0 || item.state == 1) {
                    //     me.setText(score, '실시간전');
                    // } else if(item.state == 1) {
//                    	score.style.padding = "0 33px";
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
//              score.style.padding = "0 20px";
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
            if(item != null) {
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
            // // console.log('notRecievedPKGList');
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

			console.log("item.state========>"+item.state);
            if(item != null && item !== 'undefined') {
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
//	            	me.hideElement(info.element);
	            }
        	} else {
        		me.setText(me.inning, '경기 없음');
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
		me.element.appendChild(info.element);

		me.element.appendChild(score_big.element);
		me.element.appendChild(player_away.element);
		me.element.appendChild(player_home.element);

		
		
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
//			console.log("playData :"+playData)
//			console.log("playData.scoreHome :"+playData.scoreHome)
			if(playData.scoreHome === undefined) {
				playData.scoreHome = "";
			}
			if(playData.scoreAway === undefined) {
				playData.scoreAway = "";
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

//        me.$('.r_con', 'body').appendChild(me.element);
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
            if(item != null && item != undefined) {

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
//            console.log("이닝 점수 : "+playData[me.type + 'Inning'][me.idx])
            var inScore = 	playData[me.type + 'Inning'][me.idx];
            if(inScore === undefined) {
            	inScore = "";
            }
            me.setText(me.element, inScore);
            if(me.type != 'inning') {
                if(inScore > 0 && me.idx < 10) {
                    me.element.style.color = '#bd9700';
                }
            }
            
            // 현재 inning 표시
            if(me.type == (playData.inningState == '말'? 'home' : 'away') && playData.inningNum != 0 && playData.inningNum == me.idx && playData.inningNum < 10) {
                me.element.style.color = '#fff';
                me.focusIn();
            }else if(me.type == (playData.inningState == '말'? 'home' : 'away') && playData.inningNum >= 10 && me.idx == 9){
//            }else if(me.type == (playData.inningState == '말'? 'home' : 'away') && playData.inningNum >= 10 && me.idx == playData.inningNum - 9){
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

        EventBus.register(me, 'occuredErrorOnInitializng', function (isSocket) {
        	if(isSocket) {
            	me.is4chAppForReturned = false;
//            	console.log("occuredErrorOnConnectingWSocket======================"+me.is4chAppForReturned);
            	me._showNoticePopup();
        	} else {
	            me.is4chAppForReturned = true;
	            me._showClosingPopup();
        	}
        });
        EventBus.register(me, 'occuredErrorOnConnectingWSocket', function () {
        	me.is4chAppForReturned = false;
//        	console.log("occuredErrorOnConnectingWSocket======================"+me.is4chAppForReturned);
        	me._showNoticePopup('데이터 제공이 원활하지 않아<br/> 프로모션 채널로 이동합니다.');
        });
        
        EventBus.register(me, 'occuredErrorOnOTSSignal', function () {
        	me.is4chAppForReturned = false;
        	me._showNoticePopup("위성신호가 미약하여 <br/>프로야구 5채널 보기가 종료됩니다 <br/>잠시 후 다시 이용해 주세요");
        });
        
    },

    _showClosingPopup: function () {
        var me = this
        me.setText(me.titleElement, '현지사정으로 경기 데이터<br/> 제공이 원활하지 않아<br/> 프로모션 채널로 이동합니다.');
        me.isVisibility = true;
        me.is4chAppForReturned = false;
        me.show();
    },
    _showNoticePopup: function(msg) {
    	console.log("팝업 띄우기")
        var me = this;        
            me.isVisibility = true;
            me.setText(me.titleElement, msg);
            me.show();
    },
    _showPopup: function(jsonText) {
        var me = this,
            json = jsonText ? JSON.parse(jsonText) : undefined;
        var jsonData = json?json.API:json;
        console.log("ongoing game RESULT ===>"+jsonData.RESULT)
       
        if (jsonData && jsonData.RESULT === 'FALSE') {
        	clearInterval(RealtimeData.interval);
            me.isVisibility = true;
            me.setText(me.titleElement, '오늘 경기가 모두 종료되어<br/> 프로모션 채널로 이동합니다.');
            me.is4chAppForReturned = false;
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
        console.log("pressedEnterKey")
        me.hide();

        if (me.is4chAppForReturned) {
            EventBus.fire('goChannel', Utils.toNumber(AppConfig.fourChannelApp));
        } else {
        	console.log("popup ok:"+me.is4chAppForReturned);
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

//						if (supportSkyLife) {
//							channels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SATELLITE'));
//							skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_SKIP'));
//						} else {
							channels = Utils.toArray(channelConfig.channelList);
							skippedChannels = Utils.toArray(channelConfig.favouriteLists.getFavouriteList('favourite:SKIPPED'));
//						}

						skippedChannels.forEach(function(channel) {
							// console.log(channel.isHidden);
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
//						console.log("OTV :"+stbChannels[i].majorChannel);
						channels.otv[stbChannels[i].majorChannel] = stbChannels[i];
						channelsForSID.otv[stbChannels[i].sid] = stbChannels[i];
					} else if (stbChannels[i].idType === Channel.ID_DVB_S) {
//						console.log("OTS :"+stbChannels[i].majorChannel);
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
					// // console.log('called onApplicationDestroyRequest');
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
				//channelTuner.release();

				//var tempVideoObject = global.oipfObjectFactory.createVideoBroadcastObject();
//video CLASS 주석처리 문상현
//				tempVideoObject.className = 'video';

				//document.querySelector('body').appendChild(tempVideoObject);
				var tempVideoObject= document.getElementById("videoObject");
				tempVideoObject.setChannel(channel, true);


				// 채널 이동의 딜레이가 되는 경우가 있으므로, 명시적으로 앱을 종료 시킨다.

				ownerApp.destroyApplication();
			}			
		});
		

		EventBus.register(me, 'goChannelSvr', function(channelNumber) {

			var channel = me.getChannel(channelNumber);



			// 해당 채널이 존재하지 않을 경우 이동 시키지 않는다. 

			if (channel) {

				//channelTuner.release();



//				var tempVideoObject = global.oipfObjectFactory.createVideoBroadcastObject();

//

//				tempVideoObject.className = 'video';

//				tempVideoObject.setAttribute('id', 'videoObject');

//				document.querySelector('body').appendChild(tempVideoObject);



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
			 if (!appId) {
			 	ownerApp.destroyApplication();
			 }
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
			if (me.isOTSDevice()){// && Object.keys(channels.ots).length > 0) {
				return 'ots';
			}
			return 'otv';
		};

		me.getChannel = function(channelNo) {
			var channelProperty;
			if (me.isOTVMode()) {				
				channelProperty = STBMode.OTV;
			} else {
				channelProperty = STBMode.OTS; //channelDatum.type === STBMode.OTS ? STBMode.OTS : STBMode.OTV;
			}
			
			if(channelNo == 802) {
				channelProperty =STBMode.OTV;
			}
//			console.log("channels[channelProperty]["+channelNo+"] ==============>"+channels[channelProperty][channelNo]);
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
		/* 위성케이블 연결 여부 체크 */
	    
		EventBus.register(me, 'NoOTSSignal', function() {
			appManager = window.oipfObjectFactory.createApplicationManagerObject();
			ownerApp = appManager.getOwnerApplication(window.document);
			ownerApp.onApplicationDestroyRequest = function() {

				//var mainArea = document.querySelector('#viewPort');
				//mainArea.style.display = 'none';
				DataLoader.sendEndMessage();

			};

			var aKeySet = ownerApp.privateData.keyset;
			var keySet = (aKeySet.RED + aKeySet.GREEN + aKeySet.NAVIGATION + aKeySet.NUMERIC + aKeySet.OTHER);
			
			aKeySet.setValue(keySet, [global.VK_CHANNEL_UP, global.VK_CHANNEL_DOWN]);
//			document.querySelector('#alarm2').style.display = 'block';
			var keyDown = function(e) {
				if (e.keyCode === global.VK_ENTER) {
					EventBus.fire('destroyApp');
				}

			};
			ownerApp.onKeyDown = keyDown;
			window.document.addEventListener('keydown', keyDown);
			ownerApp.show();
			ownerApp.activateInput(true);

		});
		
	    me.checkOTSSignal = function (){
			var isOTSSTB = STBService.isOTSDevice();
			var config = window.oipfObjectFactory.createConfigurationObject();
			
			if(isOTSSTB === true)
			{
				var OTSSignal = config.localSystem.tuners[0].enableTuner;
				
				if(OTSSignal !== true)
				{
					
					EventBus.fire('occuredErrorOnOTSSignal');		
					var mainArea = document.querySelector('.viewPort');
					var boardArea = document.querySelector('.board');
					boardArea.style.display = 'none';
					mainArea.style.display = 'block';
					EventBus.fire('NoOTSSignal');
					return false;
				}
			}

			return true;

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
        console.log("loadWebSocketUrl :"+AppConfig.mashUpApi.url + "/wsocketInfo?type=TEST&"+DataLoader.getCommonQueryString())
        return Http.get({
//           url: AppConfig.mashUpApi.url + '/wsocketInfo?type=LIVE&said=' + saId

        	//임시 주석 이후 TEST를 LIVE로 변경
        	
        	url: AppConfig.mashUpApi.url + '/wsocketInfo?type=TEST&'+DataLoader.getCommonQueryString()
        });
    },

    onGoingGame: function(callback) {

    	console.log(AppConfig.mashUpApi.url + '/ongoingGame?' + DataLoader.getCommonQueryString());
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
    	console.log(AppConfig.mashUpApi.url + '/todayGameList?' + DataLoader.getCommonQueryString());
        return Http.get({
           url: AppConfig.mashUpApi.url + '/todayGameList?' + DataLoader.getCommonQueryString()
//        	url: "../todayGameList.js"
        });
    },

    getRealTimeData: function(callback) {
    	console.log("getRealTimeData================================"+AppConfig.mashUpApi.url + '/realtimeData?' + DataLoader.getCommonQueryString());
        return Http.get({
        	url: AppConfig.mashUpApi.url + '/realtimeData?' + DataLoader.getCommonQueryString()
//        	url: "../realTimeData.js"
        });
    },
    getInningData: function(callback) {

//    	console.log("me.currentChannelNumber =================>"+PlayDataManager.currentChannelNumber);

//    	console.log("getInningData================================"+AppConfig.mashUpApi.url + '/inningScore?' + DataLoader.getCommonQueryString()+"&gameid="+PlayDataManager.getCurrentGameId());

        return Http.get({

        	url: AppConfig.mashUpApi.url + '/inningScore?' + DataLoader.getCommonQueryString()+"&gameid="+PlayDataManager.getCurrentGameId()

//        	url: "../inningScore.js"

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
	videoObject : undefined,
	audioComponents : undefined,
	_construct: function() {
		var me = this;

//		videoObject = document.getElementById('videoObject');


		EventBus.register(me, 'changeSubToMain', function(index) {

			Beans.commons.Utils.change(PlayDataManager.channelsList, 0, index);

			//me.videoObject.setChannel(0, STBService.getChannel(PlayDataManager.channelsList[0]));
			//me.videoObject.setChannel(index, STBService.getChannel(PlayDataManager.channelsList[index]));


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
//			console.debug('called destroyApp in ChannelTuner');
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
			});
			var channel = window.STBService.getChannel(802);

			

			// 해당 채널이 존재하지 않을 경우 이동 시키지 않는다. 

			// console.log("videoObject :"+videoObject)

			if (channel) {
				videoObject.setChannel(channel, true);
			}

			if (document.getElementsByClassName("limit")[0].style.display != "none") {
				tempLimit = 'block';
			}
			console.log("changeAudio : 처음 실행시 오디오 "+tempLimit);
			me.changeAudio(0, tempLimit);

			me.checkLimitInterval = setInterval(function() {

				EventBus.fire('checkLimit');

			}, 20000);

			

			// 멀티 채널 변경 후의 이벤트는 무조건 이 이벤트를 타야 함.

			// 그렇지 않으면 소리가 나지 않는 문제가 발생됨.

			var isReadyAudio = false;
			var chkAudioInterval;
			videoObject.addEventListener('ChannelChangeSucceeded', function(event){

				me.audioComponents = undefined;

				// KeyBinder.readyForInput 값이 True 라면 번호키를 눌러 앱을 진입했다고 가정한다.

				// 사용자에게 공개되어 있는 키는 메인채널뿐이므로 이 경우는 무조건 메인채널로 진입했다 간주한다.
				console.log("ChannelChangeSucceeded 이벤트 에서 오디오 실행 : "+PlayDataManager.currentChannelIndex+"-"+tempLimit);
				chkAudioInterval = setInterval(function(){
					
					isReadyAudio = me.changeAudio(PlayDataManager.currentChannelIndex, tempLimit);
					console.log("isReadyAudio :"+isReadyAudio);
					if(isReadyAudio == true){
						clearInterval(chkAudioInterval);
					}
				},500);
			//	me.changeAudio(PlayDataManager.currentChannelIndex, tempLimit);

			});
		});

		EventBus.register(me, 'changedFocus', function(idx) {

			console.log("changedFocus : "+idx);
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
					
//					console.log("STBService.getLimitType(channel):"+STBService.getLimitType(channel))
					
					if (PlayDataManager.currentChannelIndex == idx) {
//						me.changeAudio(idx,tempLimit);
					}
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
//			this.videoObject = global.oipfObjectFactory.createMosaicWindow(info);

//			this.videoObject = document.getElementById('videoObject');

			this.videoObject = global.oipfObjectFactory.createVideoBroadcastObject();

			//this.videoObject.className = 'video';

			this.videoObject.setAttribute('id', 'videoObject');

			document.querySelector('body').appendChild(this.videoObject);

			// console.log("videoObject 객체 생성 완료");

			

			
		} catch (e) {
			console.error(e);
			throw new Error(e);
		}
	},

	changeAudio: function(index, visibleElement) {
		var me = this;
		try {
			if (typeof me.audioComponents === 'undefined' || me.audioComponents.length === 0) {
	    		me.audioComponents = videoObject.getComponents(MediaExtension.COMPONENT_TYPE_AUDIO);
	    		console.log("me.audioComponents.length :"+me.audioComponents.length)
	    	}

			if (visibleElement != 'none') {	
				console.log("changeAudio selectComponent:"+document.getElementById("videoObject").selectComponent);
				videoObject.selectComponent(me.audioComponents[0]);
			} else {

	    		try {
	    			if(me.audioComponents[1] !== undefined) {
	    				videoObject.selectComponent(me.audioComponents[parseInt(index) + 1]);	
	    			} else {
	    				return false;
	    			}
	    		} catch (e) {
	    			console.error('not existed audio component');	    		
	    			return false;
	    		}
	    		
	    	}
			return true;
		} catch (e) {
			console.error('not existed audio component');
			return false;
		}
	},

	release: function() {
			var me = this;

			if (me.videoObject) {

				
//				me.videoObject.stopAll();
//				me.videoObject.close();

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

	inningDataJson : undefined, // all inning json for focused game 

	channelsList: [], // display channel list
	currentChannelNumber: undefined, // 정보 패널에 보여지는 정보의 체널
	currentChannelIndex: undefined, // 정보 패널에 보여지는 정보의 체널
	channelMap: {}, // channel no : game info

	playerMap: {}, // player id : player info

	curGameid : '', // game id

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
	retryCountRealTime: 0,
	retryCountInning: 0,
	allInning : [],  //현재 이닝 이전의 모든 이닝 정보
	tempHinning : [],
	tempAinning : [],
	_construct: function() {
		var me = this;

		me._initializeElement();
	},

	_initializeElement: function() {
		var me = this;

		EventBus.register(me, 'completedInitializing', function() {

//			me.getCurrentPlayData();

			me.requestInningData();
			// return;

//			 me.requestIntervar = setInterval(function() {
//				 console.log("requestRealtimeDate=============>")
//			 	me.requestRealtimeDate();
//			 }, 5000);

			// me.checkLimitInterval = setInterval(function() {

			// 	EventBus.fire('checkLimit');

			// }, me.intervalTime);
		});

		EventBus.register(me, 'reloadedData', function(data) {
			me.playDataJson = data;
			if(me.playDataJson != null) me.setChannelMapData();
			me.getCurrentPlayData();
		});

		EventBus.register(me, 'changeSubToMain', function() {
			me.getCurrentPlayData();
		});

		EventBus.register(me, 'changedFocus', function(index) {
			me.currentChannelNumber = me.channelsList[index];
			me.allInning = [];
			me.requestInningData();
//			me.getCurrentPlayData();
		});

		EventBus.register(me, 'notRecievedPKGList', function() {
			console.log("notRecievedPKGList")
			me.playDataJson = null;
//			EventBus.fire('notRecievedPKGList');
		});
	},

	requestRealtimeDate: function() {
		var me = this;
		// DataLoader.getTodaysGameList (function (json) {
		//   		PlayDataManager.todayDataJson = json;
		DataLoader.getRealTimeData().then(function(responseText) {
			var json = JSON.parse(responseText);
			try {
//			 console.log('responseText : ' + responseText);
			if (me.retryCountRealTime > 2) {
				me.retryCountRealTime = 0;
				EventBus.fire('notRecievedPKGList');
			}
			if (json !== '') {
				
				PlayDataManager.playDataJson = json;
				me.retryCountRealTime = 0;
			} else {
				me.retryCountRealTime++;
			}
			EventBus.fire('reloadedData', json);
//			me.requestInningData();
//			me.getCurrentPlayData();
			}catch(e){
				console.log("오류 "+e)
			}
		});
		// });
	},
	requestInningData: function() {		

		var me = this;

		// DataLoader.getTodaysGameList (function (json) {

		//   		PlayDataManager.todayDataJson = json;
		if(me.playDataJson != null) me.setChannelMapData();
//		if(PlayDataManager.getCurrentGameId() !== undefined) {
			DataLoader.getInningData().then(function(responseText) {	
				try {					
					me.inningDataJson = JSON.parse(responseText);
					me.getCurrentPlayData();
	
				} catch (e) {
	
					throw e;
	
				}
	
			});	
//		}else{
//			console.log("getCurrentGameId 없음");
//			me.getCurrentPlayData();
//		}
	},

    getCurrentGameId : function() {

    	 var me = this, currentGameId;

    	// 보여줄 정복의 게임 id
		if (me.channelMap[me.currentChannelNumber] !== undefined) {
			currentGameId = me.channelMap[me.currentChannelNumber].GAME_ID;

		}

		return currentGameId;

    },
    getOTVChannel : function(otsChNum){
    	var me = this,otvMapCh;
    	var sttListData = me.playDataJson.STT_L;
    	console.log("otsChNum : "+otsChNum);
    	if(sttListData != null) {
    		for (var key in sttListData) {
//    		    console.log("Key: " + key);
//    		    console.log("Value: " + sttListData[key]);
    		    if(sttListData[key].MAP_CHNL == otsChNum) {
    		    	otvMapCh =  key;
    		    	break;
    		    }
    		}
//	    		console.log(data)
//	    		if(data.OTS == otsChNum){
//	    			console.log("OTV CHANNEL : "+data.OTV+","+otsChNum);
//	    			otvMapCh = data.OTV;    	
//	    			return false;
//	    		}
	    		
//	    	});
    	}
    	return otvMapCh;
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
//					console.log( "channel getChannelData =============>"+channel);
					if (channel) {
						result.push(channel);
					} else {
						result.push(channel);
					}
				});
				
				// 제한채널 순서 변경

				/*
				result.sort(function(a, b) {

					if (b === null) {
						return -1;
					}

					var limitType = STBService.getLimitType(b);
					return limitType !== LimitType.NONE ? -1 : 1;
				});
				*/
				return result.map(function(channel) {
//					channel ? console.log("channel===>"+channel.majorChannel) : console.log("channel===>"+channel) ; 
					return channel ? channel.majorChannel : "";
				});
				
			})();

		channelsJson = me.playDataJson.STT_L;
		var channelSTTJson = me.playDataJson.G_STT_L;
		var playingGameArr = [],
			beforeGameArr = [],
			finishedGameArr = [];

		var returnList = [];

		var isExitChannel = false;
		defaultChannelList.forEach(function(channelNo) {
				returnList.push(channelNo);
		});


		var gSttLData;
		var isAirR = "TRUE";
		var keyChannel;
		if(channelsJson != null) {
			for (key in returnList) {	
				
				keyChannel = returnList[key];
				console.log("채널번호 :"+keyChannel);
				if(STBService.isOTSMode()) {
					keyChannel = me.getOTVChannel(keyChannel);
				}
				item = channelsJson[keyChannel];	
				if(item !== undefined){	
					gSttLData = me.getPlayDataByGameId(item.GAME_ID,channelSTTJson);
					item.STT_ID = gSttLData.STT_ID;
					
					console.log("경기 상태 : "+item.GAME_ID+","+item.STT_ID)
					if(item.AIR_R == "0") {
						isAirR = "FALSE";
					}
				}
				me.channelMap['' + returnList[key]] = item;
			}
		}
		
//		if(isAirR == "FALSE") {
//			Popup._showPopup('{"API":{"RESULT":"'+isAirR+'","NAME":"ongoingGame"}}');
//		}
		console.log("현재 게임 상태 : "+isAirR);
		//playingGameArr.sort();
		//beforeGameArr.sort();
		//finishedGameArr.sort();
		
		// 목록에 채널 여부 체크
		function isContain(val) {
			for (idx in me.channelsList) {
				if (me.channelsList[idx] === val) {
					return true;
				}
			}
			return false;
		}

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
					// console.log('defaultChannelList[idx] : ' + defaultChannelList[idx]);
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

		// 숨김채널 처리
		me.channelsList.sort(function(a, b) {
			return b === null ? -1 : 1;
		});
		
		return me.channelsList;
	},

	// display 데이터 초기화
	reset: function() {
		var me = this;
		me.inning = '';
		me.inningNum = '';
		me.inningState = '';
		//me.homeInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
		//me.awayInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
		me.playerHome = '';
		me.playerAway = '';
		me.playerStaHome = '';
		me.playerStaAway = '';
		me.playerStatHome = '';
		me.playerStatAway = '';
		me.teamHome = '';
		me.teamAway = '';
//		me.scoreHome = 0;
//		me.scoreAway = 0;
		me.rankHome = '';
		me.rankAway = '';
	},

	/*함수 추가 

	 * channelMap Data 

	 * */

	setChannelMapData : function(){
		var me = this,
			
			channelsJson = me.playDataJson.STT_L,

			channelSTTJson = me.playDataJson.G_STT_L, 

			gSttLData,item,key,isAirR = "TRUE";;


			console.log("channelsJson :"+channelsJson)
		for (key in channelsJson) {

			item = channelsJson[key];
			console.log("setChannelMapData ===========>"+key);
			if(item !== undefined){
				gSttLData = me.getPlayDataByGameId(item.GAME_ID,channelSTTJson);
				item.STT_ID = gSttLData.STT_ID;
				
				if(item.AIR_R == "0") {
					isAirR = "FALSE";
				}
				
				if(STBService.isOTSMode()) {
					key = item.MAP_CHNL;
				}
			} 
			
			
			me.channelMap['' + key] = item;

		}
//		if(isAirR == "FALSE") {
//			Popup._showPopup('{"API":{"RESULT":"'+isAirR+'","NAME":"ongoingGame"}}');
//		}
		console.log("현재 게임 상태 : "+isAirR);
		//return data;

	},

	/*함수 추가 

	 * 게임아이디로 데이티 추출 문상현

	 * */
	getPlayDataByGameId:function(gameId,jsonArrData){

		var idx, data={};

		for (idx in jsonArrData) {			

			if(gameId == jsonArrData[idx].GAME_ID) {

				data = jsonArrData[idx];

				break;

			}			

		}

		return data;

	},

	

	/*함수 추가 

	 * 게임아이디로 Array 데이타로 부터 추출 문상현

	 * */

	getPlayArrayDataByGameId:function(gameId,jsonArrData){

		// console.log("gameId=====================>"+gameId	);

		var idx,key, data;

		for (idx in jsonArrData) {		

//			console.log('jsonArrData[idx] : ' + jsonArrData[idx].GAME_ID+","+gameId);

			if(jsonArrData[idx].GAME_ID == gameId) {

				data = jsonArrData[idx];

				break;

			}

//			for(key in jsonArrData[idx]) {

//				

//				if(gameId == key) {

//					

//					data = jsonArrData[idx][key];

//					break;

//				}	

//			}

		}

		return data;

	},
	getCurrentPlayData: function() {
		try{
		var me = this,
			item, i, gameid,
			channelsJson,
			focusedIndex, key;
		for (focusedIndex in me.channelsList) {
			// // console.log('index : ' + focusedIndex);
			// // console.log('me.channelsList[focusedIndex] : ' + me.channelsList[focusedIndex]);
			// // console.log('me.currentChannelNumber : ' + me.currentChannelNumber);
			if (me.channelsList[focusedIndex] === me.currentChannelNumber) {
				// // console.log('==');
				me.currentChannelIndex = focusedIndex;
				break;
			}
		}
		

		me.reset();

		// 보여줄 정복의 게임 id
		console.log("me.channelMap[me.currentChannelNumber] :"+me.channelMap[me.currentChannelNumber])
		if (me.channelMap[me.currentChannelNumber] !== undefined) {

			// console.log('currentChannelNumber	 :: ' + me.currentChannelNumber);
			gameid = me.channelMap[me.currentChannelNumber].GAME_ID;
		}
		PlayDataManager.curGameid = gameid;

//		me.requestInningData();
		
		var todayGameList,
			game, // 볼 카운트
			pitcherVs, // 투수대타자상대전적
			taggiaVs, //타자대팀상대전적리스트
			inning, // inning 정보
			gameRecord, // 경기 레코드
			taggia, // 타자 목록
			pitcher, // 투수 목록

			

		
//		todayGameList = me.todayDataJson.todayGameList;

		todayGameList = me.todayDataJson.gameList;
		// // console.log('todayGameList : ' + JSON.stringify(me.todayDataJson));
		// // console.log('todayGameList : ' + todayGameList);
		// // console.log('me.playDataJson : ' + me.playDataJson);
		if (me.playDataJson == null) {
			return;
		}
		 console.log("PlayDataManager.curGameid== :"+PlayDataManager.curGameid);
		if (gameid) {



			game = me.getPlayDataByGameId(gameid,me.playDataJson.B_C_L);

//			pitcherVs = me.playDataJson.HT_VS_PT[gameid];

//			taggiaVs = me.playDataJson.HT_VS_TE[gameid];

			inning = me.getPlayDataByGameId(gameid,me.playDataJson.INN_SC);

			console.log("me.playDataJson.INN_SC ===========>"+inning.INN);
			console.log("me.playDataJson.이닝점수 ===========>"+inning.S);
			console.log("me.playDataJson.안타 HT ===========>"+inning.HT);
			console.log("me.playDataJson.실책 E ===========>"+inning.E);
			console.log("me.playDataJson.사사구 B_F ===========>"+inning.B_F);
			// console.log("me.playDataJson.INN_SC_L ===========>"+inning.INN);
			try {
			gameRecord = me.getPlayArrayDataByGameId(gameid,me.playDataJson.G_R_L);
			console.log("inning=================================>"+inning);
			}catch(e){
				console.log("error :"+e);
			}
			

			taggia = me.getPlayDataByGameId(gameid,me.playDataJson.BT_L);
			pitcher = me.getPlayDataByGameId(gameid,me.playDataJson.PT_L);

//			game = me.playDataJson.B_C_L[gameid];
//			pitcherVs = me.playDataJson.HT_VS_PT[gameid];
//			taggiaVs = me.playDataJson.HT_VS_TE[gameid];
//			inning = me.playDataJson.INN_SC_L[gameid];
//			gameRecord = me.playDataJson.G_R_L[gameid];
//			taggia = me.playDataJson.BT_L[gameid];
//			pitcher = me.playDataJson.PT_L[gameid];

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

			if (me.channelMap[me.channelsList[i]] != undefined) {

				if(me.channelMap[me.channelsList[i]] != null){

					// console.log(me.channelMap[me.channelsList[i]].GAME_ID);
					subChGameId = me.channelMap[me.channelsList[i]].GAME_ID;

					/* B_C_L 현재 볼 카운트 리스트 득점 정보 포함 */

					subGame = me.getPlayDataByGameId(subChGameId,me.playDataJson.B_C_L);
					subGameRecord = me.getPlayArrayDataByGameId(subChGameId,me.playDataJson.G_R_L);

					subItem.state = me.channelMap[me.channelsList[i]].STT_ID;
					
					if (subGameRecord != null) {

						subHomeScore = subGame.H_R;
						subAwayScore = subGame.V_R;

					}
//					console.log("subGame =========>"+subGame);
					if (subGame != null) {
						subItem.away  = me.getPlayDataByGameId(subChGameId,todayGameList).VISIT;
						subItem.home  = me.getPlayDataByGameId(subChGameId,todayGameList).HOME; 
						if(subGame.INN_NO !== undefined) {
							subItem.inningState = (subGame.TB_SC == 'T' ? subGame.INN_NO + '회 초' : subGame.INN_NO + '회 말');
						} else {
							subItem.inningState = "";
						}
//						console.log("subItem.inningState =========>"+subItem.inningState);
					}
					subItem.awayScore = subAwayScore;
					subItem.homeScore = subHomeScore;
					me.subChanelInfo[i] = subItem;

				}
			} else {
				subItem.state = 6;
				me.subChanelInfo[i] = subItem;
			}
		}

		var state = 0;
		if (me.subChanelInfo != null) {
			state = me.subChanelInfo[focusedIndex] != undefined ? me.subChanelInfo[focusedIndex].state : '';
		}

		// player 정보
		if (todayGameList != null) {
			for (i = 0; i < todayGameList.length; i++) {
				item = todayGameList[i];

				if (('' + item.GAME_ID) == ('' + gameid)) {
					// 순위
					me.rankAway = item.V_RANK + ' 위';
					me.rankHome = item.H_RANK + ' 위';
					// 팀 로고

					me.teamHome = item.H_CD;
					me.teamAway = item.V_CD;

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

		var tempHome, tempAway;
		
		if (state === 0 || state === 1) {

		} else if (state === 4 || state === 6) {

		} else if (state === 3) {
			if (gameRecord != null) {	

				tempHome = gameRecord["H"];
				tempAway = gameRecord["V"];

				me.playerHome = tempHome.PT;
				me.playerAway = tempAway.PT;

				var gSTTLData = me.getPlayDataByGameId(gameid,me.playDataJson.G_STT_L);
				console.log("gSTTLData.WIN_LOSE : "+gSTTLData.WIN_LOSE);
				var resultGame = gSTTLData.WIN_LOSE;
				console.log("게임 결과 :"+resultGame);
				//N 결과값 없음 , H 홈팀 승리 V 방문팀 승리 D 무승부
				if (resultGame == "H") {
					me.playerStaHome = '승리(' + tempHome.W + ' 승 ' + tempHome.L + ' 패)';
					me.playerStaAway = '패전(' + tempAway.W + ' 승 ' + tempAway.L + ' 패)';
				} else if (resultGame == "V") {
					me.playerStaHome = '패전(' + tempHome.W + ' 승 ' + tempHome.L + ' 패)';
					me.playerStaAway = '승리(' + tempAway.W + ' 승 ' + tempAway.L + ' 패)';
				} else if (resultGame == "D") {
					me.playerStaHome = '(' + tempHome.W + ' 승 ' + tempHome.L + ' 패)';
					me.playerStaAway = '(' + tempAway.W + ' 승 ' + tempAway.L + ' 패)';
				}
			}
		} else {
			// player 정보

			var taggiaVisitData = taggia["V"];
			var taggiaHomeData = taggia["H"];

			

			if(taggiaVisitData) {
				for (i = 0; i < taggiaVisitData.length; i++) {
					me.playerMap['' + taggiaVisitData[i].PY_ID] = 'V';

					if(i == 0) {
					me.playerMap['' + taggiaVisitData[i].PY_ID + 'V'] = taggiaVisitData[i];

					} else {

						me.playerMap['' + taggiaVisitData[i].PY_ID + 'V'] = taggiaVisitData[i];

					}

				}

			}

			if(taggiaHomeData) {
				for (i = 0; i < taggiaHomeData.length; i++) {
					me.playerMap['' + taggiaHomeData[i].PY_ID] = 'H';
					me.playerMap['' + taggiaHomeData[i].PY_ID + 'H'] = taggiaHomeData[i];
				}

			}

			var pitcherVisitData = pitcher["V"];

			var pitcherHomeData = pitcher["H"];

			if(pitcherVisitData) {
				me.playerMap['' + pitcherVisitData.PY_ID] = 'V';
				me.playerMap['' + pitcherVisitData.PY_ID + 'V'] = pitcherVisitData;

			}

			if(pitcherHomeData) {
				me.playerMap['' + pitcherHomeData.PY_ID] = 'H';
				me.playerMap['' + pitcherHomeData.PY_ID + 'H'] = pitcherHomeData;

			}

			if (game != null) {
				if (me.playerMap[game.PT] === 'H') {
					tempHome = me.playerMap[game.PT + 'H'];
					tempAway = me.playerMap[game.BT + 'V'];
//					임시주석 me.playerHome = '투수: ' + tempHome.PY_N;

					me.playerHome =  ((tempHome == undefined || tempHome.PY_N == undefined) ? '투수: ' +game.PT_N : '투수: ' + tempHome.PY_N); 					
					me.playerStaHome = ((tempHome == undefined || tempHome.S_ERA == undefined) ? '' : '방어율: ' + tempHome.S_ERA);
//					임시 주석 me.playerAway = '타자: ' + tempAway.PY_N;

					me.playerAway =  ((tempAway == undefined || tempAway.PY_N == undefined) ? '타자: ' + game.BT_N : '타자: ' + tempAway.PY_N);

					// console.log('pitcherVs ====================='+tempAway.S_HRA);
					me.playerStaAway = ((tempAway == undefined || tempAway.S_HRA == undefined) ? '' : '타율: ' + tempAway.S_HRA);

				} else {
					tempHome = me.playerMap[game.BT + 'H'];
					tempAway = me.playerMap[game.PT + 'V'];
					
//					임시 주석 me.playerHome =  '타자: ' + tempHome.PY_N;

					me.playerHome =  (tempHome == undefined ? '타자: ' + game.BT_N : '타자: ' + tempHome.PY_N); 
					me.playerStaHome = ((tempHome == undefined || tempHome.S_HRA == undefined) ? '' : '타율: ' + tempHome.S_HRA);
					
//					me.playerAway = '투수: ' + tempAway.PY_N;

					me.playerAway =  (tempAway == undefined ? '투수: ' +game.PT_N : '투수: ' + tempAway.PY_N); 
					me.playerStaAway = ((tempAway == undefined || tempAway.S_ERA == undefined) ? '' : '방어율: ' + tempAway.S_ERA);
					

				}


//				if (pitcherVs != null) {
				if (pitcherVs != null && pitcherVs !== "undefined") {
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
		// 이닝 스코어
//		var homeFBallCount = 0,
//			awayFBallCount = 0;

			console.log("me.inningDataJson ===================>"+me.inningDataJson);
			if(me.inningDataJson !== undefined) {
	
				// 이닝 스코어
	//			console.log("inning=================>"+allInning)
					
					
//					console.log(me.allInning +","+me.allInning.length );
					if(me.allInning === null ||  me.allInning.length == 0) {
						me.allInning = me.inningDataJson.INN_SC_L;
						console.log("전체 이닝점수 표시");
						me.homeInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
						me.awayInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
						me.scoreHome = 0;
						me.scoreAway = 0;
						me.tempHinning = [];
						me.tempAinning = [];
					
					 var homeFBallCount = "",	
						awayFBallCount = "";
					 console.log(" me.allInning.length ========>"+ me.allInning.length)
					for (i = 0; i < me.allInning.length; i++) {
	
						item = me.allInning[i];
	
						if (item.H_V == 1) { // home
	
							me.tempHinning[item.INN] = item.S;
	
							homeFBallCount = item.B_F;
	
							me.scoreHome = item.R;
							
	
							me.homeInning[10] = item.R;
	
							me.homeInning[11] = item.HT;
	
							me.homeInning[12] = item.E;
	
	//						console.log("홈공격 :"+item.INN+"-"+item.R);
	
							console.log("me.scoreHome :=============>"+me.scoreHome);
							
	
						} else {
	
							me.tempAinning[item.INN] = item.S;
	
							awayFBallCount = item.B_F;
	
							// awayFBallCount += item.B_F;
	
							me.scoreAway = item.R;
							
							me.awayInning[10] = item.R;
	
							me.awayInning[11] = item.HT;
	
							me.awayInning[12] = item.E;
	
	//						console.log("방문공격 :"+item.INN+"-"+item.R);
							console.log("me.scoreAway :=============>"+me.scoreAway);
						}
	
						 
	
					}
	
					 me.homeInning[13] = homeFBallCount;	
					 me.awayInning[13] = awayFBallCount;
				}
	
				
	
				// RHEB // 10 = r, 11 = h, 12 = e, 13 = b
	
				// 게임 레코드 정보 표시
	
				// console.log('gameRecord : ' + gameRecord);

				
			} else {
				me.homeInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
				me.awayInning = ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
				me.scoreHome = 0;
				me.scoreAway = 0;
			}
		} catch (e) {
			console.log("오류 :"+e);
			throw e;

		}
		
		try {
			
			
			if(inning != null && inning !== 'undefined') {
				
				var currentHScore = me.scoreHome;
				var currentAScore = me.scoreAway;
				
				var homeFBallCount = me.homeInning[13],
				awayFBallCount = me.awayInning[13];
				
				if(inning.H_V !== undefined){
					
					if (inning.H_V == 1) { // home
						me.tempHinning[inning.INN] = inning.S;		
						homeFBallCount = inning.B_F;	
						me.scoreHome = inning.R;		
						me.homeInning[10] = inning.R;	
						me.homeInning[11] = inning.HT;	
						me.homeInning[12] = inning.E;
						me.homeInning[13] = homeFBallCount;
		
					} else {					
						me.tempAinning[inning.INN] = inning.S;	
						awayFBallCount = inning.B_F;
						me.scoreAway = inning.R;		
						me.awayInning[10] = inning.R;		
						me.awayInning[11] = inning.HT;		
						me.awayInning[12] = inning.E;		
						me.awayInning[13] = awayFBallCount;
					}
					// 연장전 정보 표시하기					
					var gap = 0;
					if (me.tempAinning.length > 9) {	
						gap = me.tempAinning.length - 1 - 9;			
					}
	
					for (i = 1; i < 10; i++) {
	
						me.inningInning[i] = i + gap;	
						me.homeInning[i] = me.tempHinning[i + gap] == null ? '' : me.tempHinning[i + gap];	
						me.awayInning[i] = me.tempAinning[i + gap] == null ? '' : me.tempAinning[i + gap];
	
					}
				}
			}
			if (game != null) {
				// 팀 로고

				/*임시 주석 로고 정보 없음*/
//				me.teamHome = game.H_K;
//				me.teamAway = game.V_K;

				// // console.log('me.teamHome : ' + me.teamHome);
				// // console.log('me.teamAway : ' + me.teamAway);

				// 진루 표시
				me.base1 = game.BS_1;
				me.base2 = game.BS_2;
				me.base3 = game.BS_3;

				// 볼 카운트 표시
				me.ballCount = game.B;
				me.strikeCount = game.ST;
				me.outCount = game.O;

				// score panel 팀명

				me.homeInning[0]  = me.getPlayDataByGameId(gameid,todayGameList).HOME; 
				me.awayInning[0]  = me.getPlayDataByGameId(gameid,todayGameList).VISIT; 

			}
//			console.log("homeFBallCount ==================="+homeFBallCount);
//			console.log("awayFBallCount ==================="+awayFBallCount);
			console.log("me.scoreAway :2=============>"+me.scoreAway);
			
		} catch(e){
			console.log("error ====>"+e)
		}
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
        	console.log("setInterval================================")
        	if ((Date.now() - me.lastRecivedDataTime) > 30000 ) {

        		EventBus.fire('notRecievedPKGList');

        	}

        }, 30000);

        

        return new Promise(function(resolve, reject) {
        	
            me.ws = new WebSocket('ws://' + me.url + '/said=' + STBService.getSAID());
            
           // DataLoader.getCommonQueryString()
//        	me.ws = new WebSocket('ws://220.70.62.222:18080/said=TT150930010');

        	//mashup_baseball/todayGameList?said=TT150609005&stb_type=1&tv_type=1&mashup_id=101 

            me.ws.onopen = function() {

                console.log('WS Connected');
                me.initialized = true;
                Timer.start('firstDataGettingTime');

                resolve();

            };

            me.ws.onmessage = function(e) {

//                console.log('WS Response: ' + e.data);

                me.lastRecivedDataTime = Date.now();
                Timer.end('firstDataGettingTime');          
                EventBus.fire('reloadedData', JSON.parse(e.data).body.message);

            };

            me.ws.onerror = function(e) {

                if (!me.initialized) {
                	EventBus.fire('occuredErrorOnInitializng',true);
                    // 초기화가 완료되어 있지 않다는 것은 앱 로딩시 요청 중 에러가 발생한 것으로 간주한다.
                    // reject 를 호출하여 Main.js 에서 catch 가 호출될 수 있도록 한다.

                    reject();
                    return;
                }
            };

            me.ws.onclose = function(e) {

                console.log('WS Connection Closed', me.initialized);

                if (!me.initialized) {
                	 console.log('occuredErrorOnConnectingWSocket');
                	EventBus.fire('occuredErrorOnConnectingWSocket',true);
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