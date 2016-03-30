'use strict';

/**
 * Class 생성을 관장하는 클래스
 * @module Class
 * @class
 * @static
 */

var Class = Class || {};

/**
 *
 * 클래스를 정의한다.
 * 
 * @method define
 * @param  {String} namespace 해당 클래스의 namespace
 * @param  {Function|Object} constructor 생성자 함수 혹은 BaseObject 기반의 정의 객체
 */
Object.defineProperty(Class, 'define', {
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

		    parent[className] = new constructFunction(Class.EventBus);
		    // static 성격을 지니고 있으므로, window 자식 프로퍼티로 등록한다.
		    window[className] = parent[className];
		    
	    } else if (constructFunction instanceof Object) { 
	    	// 일반 Object 정의인 경우 이렇게 한다. 주로 Component Class 를 표현할 때 쓰인다.
	    	parent[className] = Class.BaseObject.extend(constructFunction);
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
 * @param  {String} NewClassNameSpace    생성하려는 클래스의 네임스페이스
 * @param  {Object} definition           생성하려는 클래스의 BaseObject 기반 정의 객체
 */
Object.defineProperty(Class, 'extend', {
	value: function(parentClassNameSpace, NewClassNameSpace, definition) {

		// Parameter Validation
		if (arguments.length !== 3) {
			throw 'Arguments\' length should be 3!!!';
		} else if (!(typeof parentClassNameSpace === 'string')) {
			throw 'Parent Class Namespace should be String!!!';
		} else if (!(typeof NewClassNameSpace === 'string') ){
			throw 'New Class Namespace should be String!!!';
		} else if (!(definition instanceof Object) || definition instanceof Array) {
			throw 'Definition should be plain object!!';
		}

		var parentClass = window, 
			parentClassSections = parentClassNameSpace.split('.'),
			newClassSections = NewClassNameSpace.split('.'),
			parentNode = window, 
			newClassName, i, lengh; 

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
	    	throw 'Parent Class is not existed!!!';
	    } else if (!(Class.BaseObject.isPrototypeOf(parentClass))) {
	    	throw 'Parent Class is not extended BaseObject Class!!';
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
	    window[newClassName] = parentNode[newClassName];

	    return parentNode[newClassName];
	}
});

/**
 * @class
 * @static
 * @return {[type]} [description]
 */
Class.EventBus = new function (){
	var me = this,

		messages = {},

		stopedMessages = [],

		stopedMessagesForClasses = [];

	me.__defineGetter__('messages', function() {
		return messages;
	});

    /**
     * 이벤트를 등록.
     * @param  {Object}   instance 이벤트를 발생시키는 주체
     * @param  {String}   name     이벤트 이름
     * @param  {Function} callback 이벤트시 발생시키는 메소드
     * @param  {Number}   priority 이벤트 발생 우선 순위, 삭제될 예정
     */
    me.register = function(instance, name, callback, priority) {
        if (messages[name] === undefined) {
            messages[name] = [];
        }

        messages[name].push({
            instance: instance,
            callback: callback,
            priority: typeof priority === 'number' ? priority : 999
        });
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
            i, length, j, jLength, isContinue;

        if (stopedMessages.indexOf(name) > -1) {
        	return;
        }

        // 첫번째 파라미터인 name 을 제거한 나머지를 표현한다.
        for(i = 0, length = arguments.length; i < length; i++) {
        	if (i !== 0) {
        		args.push(arguments[i]);
        	}
        }

        if (events) {
            // priority 우선 순위에 맞추어 재정렬한다.
        	events.sort(function(beforeObject, afterObject){
                return beforeObject.priority - afterObject.priority;
            });

            for (i = 0, length = events.length; i < length; i++) {
            	isContinue = false;

            	if (stopedMessagesForClasses.length > 0) {
            		for (j = 0, jLength = stopedMessagesForClasses.length; j < jLength; j++) {
						if (Class.equals({
		            		className: events[i].instance.toString(),
		            		messageName: name
		            	}, stopedMessagesForClasses[j])) {
		            		console.log(events[i].instance.toString() + '\'s ' + name + ' event Listner is canceled!');
							isContinue = true;
							break;
		            	}
					}

					if (isContinue) {
						continue;
					}
            	}

            	events[i].callback.apply(events[i].instance, args);    
                
            }
        }
    };

    /**
     * 테스트를 위한 코드.
     * 이벤트를 발생시키지 않게 특정 이벤트를 지정.
     * @param  {String} name 등록된 이벤트명
     */
    me.stopEventFiring = function(name) {
    	var i, length;
    	for (i = 0, length = arguments.length; i < length; i++) {
    		stopedMessages.push(arguments[i]);	
    	}
    };

    /**
     * 테스트를 위한 코드
     * 정지된 특정 이벤트를 다시 작동하게 설정.
     * @param  {String} name 등록된 이벤트명
     */
    me.cancelForStoppedEvent = function(name) {
    	var index = stopedMessages.indexOf(name);

    	if (index > -1) {
    		stopedMessages.splice(index, 1);
    	}
    };

    /**
     * 테스트를 위한 코드
     * 정지된 모든 이벤트를 해제한다.
     */
    me.cancelForStoppedAllEvents = function() {
    	stopedMessages = [];
    	stopedMessagesForClasses = [];
    };

    /**
     * 테스트용 메소드.
     * Event Listner Instance 에 상관없이 target과 일치하는 instance 에게만 이벤트를 전달한다.
     * @param  {String} name   Event Name
     * @param  {Object} target EventBus 에 등록된 instance
     */
    me.executionOnlyOne = function(name, target) {
        var me = this,
            messages = me.messages[name],
            args = [], 
            i, length;
        
        if (messages) {

            for (i = 0, length = messages.length; i < length; i++) {
                if (target === messages[i].instance) {
                    messages[i].callback.apply(target.instance, args);        
                }
            }
        }
    };

    me.stopEventFiringFor = function(className, messageName) {
    	stopedMessagesForClasses.push({
    		className: className,
    		messageName: messageName
    	});
    };

    return me;	
};

/**
 *
 * 구간 별 시간 측정 클래스
 * 
 * @class
 * 
 */
Class.Timer = (function() {

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


		// window.performance polly fill
		(function() {
			if (typeof window.performance === 'undefined') {
				window.performance = {};
			}
			 
			if (!window.performance.now){
			    
				var nowOffset = Date.now();

				if (performance.timing && performance.timing.navigationStart){
	  				nowOffset = performance.timing.navigationStart
				}

				window.performance.now = function now(){
				  return Date.now() - nowOffset;
				}
			}
		})();

	return {
		start: start,
		end: end,
		report: report,
		reset: reset,
		execute: execute
	};
})();

Class.Utils = new function() {
	var me = this;

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
	me.toNumber = function(value) {
        if (value === 'true' || value === 'false') {
            return NaN;
        }
        return Number(value);
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

	return me;
};

Class.equals = function(origin, target) {
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

    function sort (o) {
        var result = {};

        if (typeof o !== 'object') {
            return o;
        }

        Object.keys(o).sort().forEach(function (key) {
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
                    if (origin[p] !== null 
                            && target[p] !== null 
                            && (origin[p].constructor.toString() !== target[p].constructor.toString() 
                                    || !origin[p].equals(target[p]))) {
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
            };

        }
    }

    // at least check them with JSON
    return JSON.stringify(sort(origin)) === JSON.stringify(sort(target));
};

/**
 * [BaseObject description]
 * @type {Object}
 */
Class.BaseObject = {
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
            methodName = "_construct";
        }
 
        return Object.getPrototypeOf(definedOn)[methodName].apply(this, args);
    }
};
'use strict';

Class.define('MultiView.enum.LimitType', function LimitType () {
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

Class.define('MultiView.enum.FocusType', function FocusType () {
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

Class.define('MultiView.enum.FocusMovingType', function FocusMovingType () {
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

Class.define('MultiView.enum.STBType', function STBType () {
	return {
		OTV: 'otv',
		
		OTS: 'ots',

		UHD: 'uhd'
	};
});

'use strict';

Class.define('MultiView.enum.MenuStatus', function MenuStatus () {
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

Class.define('MultiView.enum.DisplayStatus', function DisplayStatus () {
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

/**
 * [description]
 * @return {[type]} [description]
 */
Class.define('MultiView.app.Main', function Main (eventBus) {
	
	var me = this,

		version = '2.5.1',

		/**
		 * @private
		 * @event
		 */
		destoryApplication = function() {
		},

		initialized = false,
		enable5chTrigger,
		isOTSSignal,
		initializeClasses = function(eventBus) {
			var global = window;
			
			global.STBService = STBService.create(eventBus);
			global.ChannelDataManager = ChannelDataManager.create(eventBus);
			global.KeyBinder = KeyBinder.create(eventBus);
			global.UiRenderer = UiRenderer.create(eventBus);
			
		};


	me.__defineGetter__('initialized', function() {
		return initialized;
	});
	me.__defineGetter__('enable5chTrigger', function() {
		return enable5chTrigger;
	});
	
	me.__defineGetter__('isOTSSignal', function() {
		return isOTSSignal;
	});
	
	/**
	 * @public
	 * Document 로딩 완료 후 호출된다.
	 */
	me.init = function() {
		var global = window;
		global.RPCService = RPCService.create(eventBus);
		RPCService.loadChannelData(function(channelData) {
			global.AppConfig = channelData;
			enable5chTrigger = Class.Utils.toBoolean(AppConfig.fiveChannel.enable);

//			RPCService.setFiveChannelNo(Class.Utils.toNumber(AppConfig.fiveChannel.no));
			RPCService.setFiveChannelTriggerUrl(AppConfig.fiveChannel.triggerUrl);
			initializeClasses(eventBus);
			console.log('loadedChannelData');
			//위성신호 체크 후 팝업
			isOTSSignal = RPCService.checkOTSSignal();
			if(isOTSSignal) {
				eventBus.fire('loadedChannelData', AppConfig.multiChannel);		
				console.log('completeInitializing');
				eventBus.fire('completeInitializing');			
			}
			RPCService.sendStartMessage();

			initialized = true;
		});
		
	};
	
	/**
	 * @public
	 * @return {String} App's Version
	 */
	me.getVersion = function() {
		return version;
	};

	eventBus.register(me, 'destoryApplication', destoryApplication);

	return me;
});
'use strict';

Class.define('MultiView.components.UiComponent', {
	createElement: function(options) {
		var element = document.createElement(options.elementName);

		if (options.className) {
			element.className = options.className;
		}

		return element;
	},

	createDIV: function(className) {
		return this.createElement({
			elementName: 'div',
			className: className
		});
	},

	removeElement: function(element) {
		this.removeElements(element);
	},

	removeElements: function(elements) {
		var targets = Class.Utils.isAbstractArrayList(elements) ? elements : [elements],
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
	}
});
'use strict';

Class.extend('MultiView.components.UiComponent', 'MultiView.components.MenuItem', {
	
	eventBus: undefined,

	index: -1,

	channelDatum: undefined,

	element: undefined,

	_construct: function(eventBus, index, channelDatum) {
		var me = this;

		me.eventBus = eventBus;
		me.index = index;
		me.channelDatum = channelDatum;

		me.initializeElement();

		me.eventBus.register(me, 'moveChannel', function() {
			if (me.element.className.indexOf(MenuStatus.SELECT) !== -1) {
				me.element.className = MenuStatus.generateClassName(MenuStatus.BASIC);
			}
		});

		me.eventBus.register(me, 'canceledChannelMoving', function() {
			if (me.element.className.indexOf(MenuStatus.SELECT) !== -1) {
				me.focusIn(true);
			} else if (me.element.className.indexOf(MenuStatus.FOCUS) !== -1) {
				me.focusOut();
			}
		});
	},

	/**
	 * @private
	 */
	initializeElement: function() {
		var me = this;

		me.element = me.createElement({
			elementName: 'li',
			className: MenuStatus.generateClassName(MenuStatus.BASIC)
		});

		if (me.channelDatum.isUHD) {
			me.element.innerHTML = '<span class="name">' + me.channelDatum.name + '<img src="img/uhd_logo.png"></span>';
		} else {
			me.element.innerHTML = '<span class="name">' + me.channelDatum.name + '</span>';
		}
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

Class.extend('MultiView.components.UiComponent', 'MultiView.components.DisplayItem', {

	element: undefined,

	programElement: undefined,

	timerProcessors: [],

	_construct: function(eventBus, index) {
		var me = this;

		me.eventBus = eventBus;
		me.index = index;
		me.element = me.$('.' + DisplayStatus.DEFAULT)[index];
		
		me.programElement = me.createProgramElement();

		me.eventBus.register(me, 'convertToLimitedChannel', me.convertToLimitedChannel);

		me.eventBus.register(me, 'resetChannelDisplay', me.resetDisplay);

		me.eventBus.register(me, 'unselectDisplayItem', function(index) {
			if (index === me.index) {
				me.element.className = DisplayStatus.generateClassName(DisplayStatus.BASIC);
			}
		});

		me.eventBus.register(me, 'selectDisplayItem', function(index) {
			if (index === me.index) {
				me.focusIn(DisplayStatus.SELECT);
			}
		});

		me.eventBus.register(me, 'focusDisplayItem', function(index) {
			if (index === me.index) {
				me.focusIn(DisplayStatus.FOCUS);
			}
		});

		me.eventBus.register(me, 'movedChannel', function() {
			
		});
		
		me.eventBus.register(me, 'moveChannel', function() {
//			me.element.className = DisplayStatus.generateClassName(DisplayStatus.BASIC);
			if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
				me.focusIn(KeyBinder.focusInfo.focusType === FocusType.VIDEO ? DisplayStatus.FOCUS : DisplayStatus.SELECT);
			} else {
				me.focusOut();
			}
		}, 2);
	},

	resetDisplay: function(index) {
		var me = this;
		
		if (index !== me.index) {
			return;
		}
		
		me.removeElements(me.$('.' + LimitType.DEFAULT, me.element.parentNode));
	},

	convertToLimitedChannel: function(index, limitType) {
		var me = this;
		
		if (index !== me.index) {
			return;	
		}
		me.removeElements(me.$('.' + LimitType.DEFAULT, me.element));
		
		me.element.parentNode.appendChild(me.createDIV(LimitType.generateClassName(limitType)));
	},

	/**
	 * Display 영역의 테두리에 Focusing Effect 를 준다.
	 * @param  {DisplayStatus} Focus 상태, undefined 이면 변경되지 않는다.
	 */
	focusIn: function(displayStatus) {
		var me = this,
			program = STBService.getProgramByIndex(me.index);
		
		if (displayStatus) {
			me.element.className = DisplayStatus.generateClassName(displayStatus);	
		}

		me.displayProgramInfo(program);

		var processNumber = me.timerProcessors.push(setTimeout(function() {
			if (me.programElement && me.timerProcessors.pop() !== processNumber) {
				me.removeElement(me.programElement);
			}
		}, 3000));
	},

	setText: function(element, text) {
		element.innerHTML = text;
	},

	createProgramElement: function() {
		var programElement = this.createDIV('program'),
			programElementInnerHtmlBuilder = [];
		
		programElementInnerHtmlBuilder.push('<span id="channelName" class="ch_Name"></span>');
		programElementInnerHtmlBuilder.push('<ul class="ch_Box">');
		programElementInnerHtmlBuilder.push('<li id="name" class="ch_Box_name"></li>');
		programElementInnerHtmlBuilder.push('<li class="ch_Box_bar">');
		programElementInnerHtmlBuilder.push('	<div id="startTime" class="ch_L"></div>');
		programElementInnerHtmlBuilder.push('	<div class="fl rBox">');
		programElementInnerHtmlBuilder.push('	    <div id="prograssbar" class="rBar"></div>');
		programElementInnerHtmlBuilder.push('	</div>');
		programElementInnerHtmlBuilder.push('	<div id="endTime" class="ch_R"></div>');
		programElementInnerHtmlBuilder.push('</li>');
		programElementInnerHtmlBuilder.push('</ul>');

		programElement.innerHTML = programElementInnerHtmlBuilder.join('');

		return programElement;

	},

	displayProgramInfo: function(program) {
		var me = this;
		
		if (!program) {
			if (ChannelDataManager.currentSubChannelDatum.limitType !== LimitType.NONE) {
				me.setText(me.$1('#channelName', me.programElement), ChannelDataManager.currentSubChannelDatum.name);
				me.$1('.ch_Box', me.programElement).style.display = 'none';
			} else {
				me.$1('.ch_Box', me.programElement).style.display = 'block';
				me.setText(me.$1('#name', me.programElement), ChannelDataManager.currentSubChannelDatum.name);
				me.$1('.ch_Box_bar', me.programElement).style.display = 'none';
			}
		} else {
			me.$1('.ch_Box', me.programElement).style.display = 'block';
			me.$1('.ch_Box_bar', me.programElement).style.display = 'block';
			me.setText(me.$1('#name', me.programElement), program.name);
			me.setText(me.$1('#startTime', me.programElement), program.startTime);
			me.setText(me.$1('#endTime', me.programElement), program.endTime);	
			me.$1('#prograssbar', me.programElement).style.width = program.percent + '%';
		}

		me.element.appendChild(me.programElement);
	},

	focusOut: function() {
		var me = this,
			i, length;

		// 등록된 timer processor 들을 모두 삭제한다.
		for (i = 0, length = me.timerProcessors.length - 1; i < length; i++) {
			clearTimeout(me.timerProcessors[i]);
		}

		me.removeElement(me.programElement);

		if (ChannelDataManager.currentSubChannelDataIndex === me.index) {
			me.element.className = DisplayStatus.generateClassName(DisplayStatus.SELECT);
		} else {
			me.element.className = DisplayStatus.generateClassName(DisplayStatus.BASIC);
		}
	},

	toString: function() {
		return 'DisplayItem';
	}
});
	
'use strict';

Class.define('MultiView.app.UiRenderer', {


	_construct: function (eventBus) {
		var me = this,

			/**
			 * @config
			 * 메뉴 페이지당 최대 갯수
			 * @type {Number}
			 */
			maxMenuSizePerPage = 4,
		
			menuSizePerPage = -1,

			menuCount = -1,
			
			currentMenuPage = -1,
			
			currentMenuIndexPerPage = 0,
			
			menuElement,

			menuItems = [],

			visibledMenu = false,

			displayItems = [],

			initialize = function() {
				menuCount = ChannelDataManager.channelData.length;
				currentMenuPage = 1;
				menuSizePerPage = menuCount >= maxMenuSizePerPage ? maxMenuSizePerPage : menuCount;
				currentMenuIndexPerPage = getMenuIndex(ChannelDataManager.currentChannelDataIndex);
				menuElement = $1('#menu');

				// 메뉴 아이템 생성
				for (var i = 0; i < menuCount; i++) {
					menuItems.push(MenuItem.create(eventBus, i, ChannelDataManager.channelData[i]));
				}
			},

			getMenuIndex = function(channelIndex) {
				return Math.abs(((currentMenuPage * menuSizePerPage) - menuSizePerPage) - channelIndex);
			},

			getMenuPageBy = function(channelIndex) {
				return Math.floor(channelIndex / menuSizePerPage) + 1;
			},

			getDefaultMenuClassName = function(display) {
				if (menuCount >= 4) {
					return 'menu4 ' + display;
				} else {
					return 'menu3 ' + display;
				}
			},

			initializeMenu = function() {
				menuElement.className = getDefaultMenuClassName('hide');
				
				renderMenu(currentMenuIndexPerPage);

				showMenuForAMoment();
			},

			removeMenuElements = function() {
				for (var i = 0; i < menuCount; i++) {
					removeElement(menuItems[i].element);
				}
			},

			renderMenu = function(focusedIndex, selectedIndex) {
				var startIndex = (currentMenuPage * menuSizePerPage ) - menuSizePerPage,
					menuItemParentElement = $1('.menu_box', menuElement),
					i, menuIndex, menuItem, channelDatum;

				removeMenuElements();

				for(i = startIndex, length = startIndex + menuSizePerPage; i < length; i++) {
					menuItem = menuItems[i];

					// 메뉴 아이템이 2개 이하이거나, 2페이지 이상에서 4개가 안될시 undefined 이다.
					if (!menuItem) {
						continue;
					}

					if (i === focusedIndex) {
						menuItem.focusIn(true);
					} else {
						menuItem.focusOut();
					}

					menuItemParentElement.appendChild(menuItem.element);
				}
			},

			showMenu = function() {
				eventBus.fire('disableForKeyInput', true);
				visibledMenu = true;
				$1('#menuBtn').style.display = 'none';
				menuElement.className = getDefaultMenuClassName('show');
				setTimeout(function() {
					eventBus.fire('disableForKeyInput', false);	
				}, 300);
			},

			hideMenu = function() {
				eventBus.fire('disableForKeyInput', true);
				visibledMenu = true;
				menuElement.className = getDefaultMenuClassName('hide');
				$1('#menuBtn').style.display = 'block';
				setTimeout(function() {
					eventBus.fire('disableForKeyInput', false);	
				}, 300);
			},
		
			removeElement = function(element) {
				removeElements(element);
			},

			removeElements = function(elements) {
				var targets = Class.Utils.isAbstractArrayList(elements) ? elements : [elements],
					i, length, target;
				
				for (i = 0, length = targets.length; i < length; i++) {
					target = targets[i];
					if (target && target.parentNode) {
						target.parentNode.removeChild(target);
					}	
				}
			},

			$1 = function(query, parentNode) {
				var parent = parentNode || document;
				return parent.querySelector(query);
			},
			
			timeCnt = undefined,
			
			/**
			 * 메뉴를 5초 동안 보여준다.
			 */
			showMenuForAMoment = function(time) {
				var duration = time | 5000;
				showMenu();
				
				if (timeCnt) {
					clearTimeout(timeCnt);
				}

				timeCnt = setTimeout(function() {
					if (KeyBinder.focusInfo.focusType !== FocusType.MENU) {
						hideMenu();
					}
				}, duration);
			};

		// Display Item 생성
		// 최초 생성시에 명시되어야 첫 화면에서 화면 블럭이 일어날 수 있는 현재의 구조이다.
		for (var i = 0; i < 4; i++) {
			displayItems.push(DisplayItem.create(eventBus, i));
		}

		eventBus.register(me, 'movedPrevChannel', showMenuForAMoment);
		
		eventBus.register(me, 'initializedChannelData', function() {
			initialize();
		});	
		
		eventBus.register(me, 'completeInitializing', function() {
			displayItems[ChannelDataManager.currentSubChannelDataIndex].focusIn(DisplayStatus.FOCUS);
			initializeMenu();
		});
		
// 5ch button
		console.log("Main.enable5chTrigger :"+Main.enable5chTrigger)
		if (Main.enable5chTrigger) {
			
			try {
			me.switchChannel = MultiView.components.SwitchChannel.create(eventBus);	
			}catch(e){
				console.log(e);
			}
		}
		
		eventBus.register(me, 'moveFocus', function(from, to, keepSelectMode) {
			switch(FocusMovingType.getType(from.focusType, to.focusType)) {
				case FocusMovingType.MENU_TO_MENU: 
					var nextMenuPage = getMenuPageBy(to.index); 
					
					// 메뉴 페이지가 변경되었다면
					if (nextMenuPage !== currentMenuPage) {
						currentMenuPage = nextMenuPage;
						renderMenu(to.index);
					} else {
						menuItems[from.index].focusOut();
						menuItems[to.index].focusIn(keepSelectMode);
					}

					break;
				case FocusMovingType.VIDEO_TO_VIDEO:
					if (visibledMenu) {
						hideMenu();
					}
					displayItems[from.index].focusOut();
					displayItems[to.index].focusIn(DisplayStatus.FOCUS);
					
					break;
				case FocusMovingType.VIDEO_TO_MENU:
					menuItems[to.index].focusIn();
					showMenu();
					displayItems[from.index].focusOut();
					break;
				case FocusMovingType.MENU_TO_VIDEO:
					menuItems[from.index].focusIn(true);
					hideMenu();
					displayItems[to.index].focusIn(DisplayStatus.FOCUS);
					break;
			}
			
		});
		
		eventBus.register(me, 'destroyApp', function() {
			var mainArea = document.querySelector('div.main');
			mainArea.style.display = 'none';
		}, 1);

		eventBus.register(me, 'canceledChannelMoving', function() {
			var realMenuPage = getMenuPageBy(ChannelDataManager.currentChannelDataIndex);

			if (realMenuPage !== currentMenuPage) {
				currentMenuPage = realMenuPage;
				renderMenu(ChannelDataManager.currentChannelDataIndex);
			}
		});
		
		eventBus.register(me, 'convertToUHD', function() {
			var contentObject = document.getElementById('videoObject');

			contentObject.className = 'uhdVideo before';
			contentObject.className = 'uhdVideo after';
		});
		
		eventBus.register(me, 'convertToHD', function() {
			document.getElementById('videoObject').className = 'video';
		});

		me.__defineGetter__('visibledMenu', function() {
			return visibledMenu;
		});
		
	}
});

'use strict';

/**
 * [description]
 * @return {[type]} [description]
 */
Class.define('MultiView.app.STBService', { 

	_construct: function (eventBus) {

		var me = this,

			contentObject = document.getElementById('videoObject'),

			channelConfig = contentObject.getChannelConfig(),

			currentChannel = channelConfig.currentChannel,
			
			appConfiguration =  window.oipfObjectFactory.createConfigurationObject().configuration,
			
			/**
			 * [tempOTVChannelNumbers description]
			 * @type {Array}
			 */
			tempOTVChannelNumbers = [],

			channels = (function(){
				var i, length, stbChannels, channels;
				
				channels = {
					otv: {},
					ots: {}
				};
				
				stbChannels = channelConfig.channelList;
				
				for (i = 0, length = stbChannels.length; i < length; i++) {
					if (stbChannels[i].idType === Channel.ID_IPTV_SDS || stbChannels[i].idType === Channel.ID_IPTV_URI) {
						channels.otv[stbChannels[i].majorChannel] =  stbChannels[i];
					} else if(stbChannels[i].idType === Channel.ID_DVB_S) {
						channels.ots[stbChannels[i].majorChannel] =  stbChannels[i];
					}
				}

				return channels;
			})(),
			
			addTempOTVChannelNumber = function(channelNumber) {
				tempOTVChannelNumbers.push(channelNumber);
			},
			
			supportSkyLife  = undefined,
			
			getProgram = function(channel) {
				var currentTime = parseInt(new Date().getTime()/1000),
	    		query, searchManager, result,
	    		getPercent = function(startTime, duration) {
					var percent,
						currentTime = parseInt(new Date().getTime()/1000);
					
					if (currentTime - parseInt(startTime) < 0) {
						percent = 100;
					} else {
						percent = Math.round((currentTime - parseInt(startTime)) / parseInt(duration) * 100);
					}
					
					if(percent < 3){
						percent = 3;
					} else if(percent > 100){
						percent = 100;
					}
					
					return percent;
					
				},
				
				getAge = function(programInfo) {
		    		var age = 0,
		    			siDesc, tmpAge;
					
					siDesc = programInfo.getSIDescriptors(0x55)[0];
					
					tmpAge = siDesc.charCodeAt(5);
					
					if (programInfo.channel.idType == Channel.CHANNEL_ID_IPTV_SDS) {
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
				
				//채널이 존재하지 않는 다면 - STB 에서 채널 정보를 주지 않는 경우 - undefined를 리턴해야 한다. 
				if (! channel) {
					return;
				}
				
				searchManager = oipfObjectFactory.createSearchManagerObject().createSearch(1);
				
				query = searchManager.createQuery('programme.startTime', 5, currentTime);
				query = query.and(searchManager.createQuery('(programme.startTime + programme.duration)', 2, currentTime));
				
	    		
	    		searchManager.setQuery(query); 
	    		searchManager.addChannelConstraint(channel);
	    		searchManager.result.getResults(0, 1);
	    		
	    		if (searchManager.result.length > 0) {
	    			var programInfo = searchManager.result[0],
		    			programStartTime = new Date(parseInt(programInfo.startTime)*1000),
						startTime = Class.Utils.fillZero(programStartTime.getHours(), 2) + ':' + Class.Utils.fillZero(programStartTime.getMinutes(), 2),
						programEndTime = new Date(parseInt(programInfo.startTime)*1000 + (parseInt(programInfo.duration)*1000)),
						endTime = Class.Utils.fillZero(programEndTime.getHours(), 2) + ':' + Class.Utils.fillZero(programEndTime.getMinutes(), 2);
	    			
	    			result = {
	    				channelName: channel.name,
	    				name: programInfo.name,
	    				percent: getPercent(programInfo.startTime, programInfo.duration),
	    				startTime: startTime,
	    				endTime: endTime,
	    				limitedByAge: limitedAge !== 0 && limitedAge <= getAge(programInfo)//limitedByAge(programInfo)
	    			};
	    		}
	    		
	    		return result;
			},
			
			limitedAge = oipfObjectFactory.createParentalControl().getParentalRating(),
			
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

		    isLimitedChannel =  function(channel) {
		    	var favouriteLists = channelConfig.favouriteLists,
		    		limitedChannelListBySky = favouriteLists.getFavouriteList('favourite:SKYLIFE_CHANNELS_LIMITED'),
					blockedChannelListByUser = favouriteLists.getFavouriteList('favourite:BLOCKED'),
					i, length;

				for (i = 0, length = limitedChannelListBySky.length; i < length; i++) {
					if (channel.ccid == limitedChannelListBySky[i].ccid) {
						return true;
					}
				}

				for (i = 0, length = blockedChannelListByUser.length; i < length; i++) {
					if (channel.ccid == blockedChannelListByUser[i].ccid) {
						return true;
					}
				}
				
				return false;
		    },
		    
		    keyDownEventReceived = function(e) {
			    eventBus.fire('keyDown', e);
		    },
		    
		    audioComponents = undefined,
		    
		    changeAudioChannel = function(index, isLimitedChannel) {
		    	if (typeof audioComponents === 'undefined' || audioComponents.length === 0) {
		    		audioComponents = contentObject.getComponents(MediaExtension.COMPONENT_TYPE_AUDIO);
		    	}
		    	
		    	if (isLimitedChannel) {
		    		contentObject.selectComponent(audioComponents[0]);
		    	} else {
		    		try {
		    			contentObject.selectComponent(audioComponents[index + 1]);	
		    		} catch (e) {
		    			console.error('not existed audio component');
		    		}
		    		
		    	}
		    },
		    
		    moveChannel = function(index) {
		    	var channelDatum = ChannelDataManager.channelData[index],
		    		channel = me.getChannel(channelDatum.no, true);
		    		
		    	console.log("channelDatum.no :"+channelDatum.no)
		    		contentObject.setChannel(channel, true, true);
		    },
			
		    appManager = undefined,
			
		    ownerApp = undefined,
			
			appId = undefined;
			
//			BMT_APP_ID = 13896,
			
//			LIVE_APP_ID = 12870,

			
		eventBus.register(this, 'completeInitializing', function() {
			
			appManager = window.oipfObjectFactory.createApplicationManagerObject();
			
		    ownerApp = appManager.getOwnerApplication(window.document);
			
		    appId = appManager.discoveredAITApplications[0] ? appManager.discoveredAITApplications[0].appId : undefined;
			
			ownerApp.onApplicationDestroyRequest = function() {
				console.log('called onApplicationDestroyRequest');
				var mainArea = document.querySelector('div.main');
				mainArea.style.display = 'none';
				RPCService.sendEndMessage();
			};
			
			// 멀티 채널 변경 후의 이벤트는 무조건 이 이벤트를 타야 함.
			// 그렇지 않으면 소리가 나지 않는 문제가 발생됨.
			contentObject.addEventListener('ChannelChangeSucceeded', function(event){
				audioComponents = undefined;
				// KeyBinder.readyForInput 값이 True 라면 번호키를 눌러 앱을 진입했다고 가정한다.
				// 사용자에게 공개되어 있는 키는 메인채널뿐이므로 이 경우는 무조건 메인채널로 진입했다 간주한다.
				
				function isMultiChannel(channel) {
					var channelData = ChannelDataManager.channelData,
						i, length;
					
					if (ChannelDataManager.masterChannel === channel.majorChannel) {
						return true;
					}
					
					for (i = 0, length = channelData.length; i < length; i++) {
						if (channelData[i].no === channel.majorChannel) {
							return true;
						}
					}
					
					return false;
				}
				
				if (!KeyBinder.movingChannel && isMultiChannel(event.channel) && (typeof ChannelDataManager.prevChannelDataIndex !== 'undefined' || ChannelDataManager.masterChannel === event.channel.majorChannel)) {
					// eventBus.fire('forcedToMove', 0);
					changeAudioChannel(ChannelDataManager.currentSubChannelDataIndex, ChannelDataManager.currentSubChannelDatum.limitType);
				} else {
					eventBus.fire('movedChannel', event.channel);
					changeAudioChannel(ChannelDataManager.currentSubChannelDataIndex, ChannelDataManager.currentSubChannelDatum.limitType);
				}


			});
			
			contentObject.addEventListener('FullScreenChange', function(event, a, b, c){
				console.log('called FullScreenChange');
				console.log('fullScreen : ' + contentObject.fullScreen);
				
			});
			
			var aKeySet = ownerApp.privateData.keyset;
		    var keySet = (aKeySet.GREEN|aKeySet.NAVIGATION|aKeySet.RED);//5채널 경기시 RED 버튼 사용을 위해 추가함
		    /*var keySet = (aKeySet.NAVIGATION);*/

		    aKeySet.setValue(keySet);
		    ownerApp.onKeyDown = keyDownEventReceived;
		    
		    window.document.addEventListener('keydown', keyDownEventReceived);
		    
		    ownerApp.show();
		    ownerApp.activateInput(true);
		});
		eventBus.register(this, 'NoOTSSignal', function() {

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
			document.querySelector('#alarm2').style.display = 'block';
			aKeySet.setValue(keySet, [VK_UP, VK_DOWN]);
			
			var keyDown = function(e) {

				if (e.keyCode === VK_ENTER) {

					eventBus.fire('destroyApp');

				}

			};
			ownerApp.onKeyDown = keyDown;
			window.document.addEventListener('keydown', keyDown);
			ownerApp.show();
			ownerApp.activateInput(true);

		});
		eventBus.register(me, 'initializedChannelData', function(currentChannelDatum, currentSubChannelDatum) {
			// 현재 STB 의 채널과 ChannelData 의 채널이 맞지 않으면 채널을 이동시킨다.
			// 4k 멀티 채널의 메인 채널이 HD OTV 이므로, UHD STB 로 접속했을때를 대비한 것이다. 
			if (currentChannel.majorChannel !== currentChannelDatum.no) {
				moveChannel(ChannelDataManager.channelData.indexOf(currentChannelDatum));
				if (currentChannelDatum.isUHD) {
					eventBus.fire('convertToUHD');
				}
			} else {
				eventBus.fire('changeAudioChannel', ChannelDataManager.currentSubChannelDataIndex, STBService.getLimitType(currentSubChannelDatum));
			}
		});
			
		eventBus.register(me, 'addTempOTVChannelNumber', addTempOTVChannelNumber);
		
		eventBus.register(me, 'changeAudioChannel', changeAudioChannel);
		
		eventBus.register(me, 'moveChannel', moveChannel);
		
		eventBus.register(me, 'goChannel', function() {
			var channel = me.getChannel(ChannelDataManager.currentSubChannelDatum);
			
			// 해당 채널이 존재하지 않을 경우 이동 시키지 않는다. 
			if (channel) {
				contentObject.setChannel(channel, true);
				// 채널 이동의 딜레이가 되는 경우가 있으므로, 명시적으로 앱을 종료 시킨다.
				ownerApp.destroyApplication();	
			}
		});
		eventBus.register(me, 'going5ch', function() {
			
			var channel = me.getChannel({
				type: 'ots',
				no: AppConfig.fiveChannel.no
			});
//			console.log(AppConfig.fiveChannel.no+","+document.getElementById('sportChannel').style.display);
			if (channel && (document.getElementById('sportChannel').style.display !== 'none')) {
//				
//				channelTuner.release();
//
//				var tempVideoObject = global.oipfObjectFactory.createVideoBroadcastObject();
//
//				tempVideoObject.className = 'video';
//
//				document.querySelector('body').appendChild(tempVideoObject);
				var tempVideoObject= document.getElementById("videoObject");
				tempVideoObject.setChannel(channel, true);

				// 채널 이동의 딜레이가 되는 경우가 있으므로, 명시적으로 앱을 종료 시킨다.

				ownerApp.destroyApplication();
			}

		});
		eventBus.register(me, 'destroyApp', function() {
				var obs = appManager.findApplications('dvb.appId', '4e30.3000')[0];
				obs.window.postMessage({'method':'obs_setPromoChannel'}, '*');
	   			obs.window.postMessage({'method':'obs_startUnboundApplication',  'target':'4e30.3001'}, '*');
	   			
	   		// AppId 가 존재한다면, 채널을 타고 온 BoundApp 이라는 의미.
				// 존재하지 않다면, 개발모드 이므로 명시적으로 앱을 종료시킨다.
				if (!appId) {
					ownerApp.destroyApplication();	
				}
		});

		me.isUHDDevice = function () {
			return !me.isOTSDevice() &&  Class.Utils.toBoolean(me.getConfigBy('support.uhd'));
		};

		me.getChannel = function(channelDatum, forceOTV) {

			if (typeof channelDatum === 'number') {
				var channelNumber = channelDatum;
				var isOTSModeForChannel = me.isOTSMode();

				// STB 가 OTS Mode 이지만, 4채널 서비스에서 OTS 채널 카테고리를 제공하지 않아 임시 OTV 채널로 동작하는 경우라면
				if (isOTSModeForChannel && tempOTVChannelNumbers.indexOf(channelNumber) !== -1) {
					isOTSModeForChannel = false;
				}

				// 강제로 OTV 채널을 가지고 와야 할때, 4채널 메뉴는 무조건 OTV 채널이다.
				if(forceOTV){
				 	isOTSModeForChannel = false;
				}
				
				if(isOTSModeForChannel){
					return channels.ots[channelNumber];	
				} else {
					return channels.otv[channelNumber];
				} 
			}

			var channelProperty = channelDatum.channelType === STBType.OTS ? STBType.OTS : STBType.OTV;

			return channels[channelProperty][channelDatum.no];	 
		};
		
		me.getChannelsBySid = function(sid) {
			var result = [];
			
			for (var par in channels.ots) {
				if (channels.ots[par].sid === sid) {
					result.push(channels.ots[par]);
				}
			}
			
			for (var par in channels.otv) {
				if (channels.otv[par].sid === sid) {
					result.push(channels.otv[par]);
				}
			}
			
			return result;
		};
		
		me.getChannels = function () {
			return channels;
		};

		me.getCurrentChannel = function () {
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
				supportSkyLife = Class.Utils.toBoolean(me.getConfigBy('skylife_support'));
			}
			return supportSkyLife;
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

	    	if (!channel) {
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
	    
	    me.__defineGetter__( 'appId', function () {
	    	return appId;
	    });

	}
});
'use strict';


Class.define('MultiView.app.RPCService', {

	_construct: function (eventBus) {

		/**
		 * 최대 HTTP Get 재요청 횟수
		 * @type {Number}
		 */
		var me = this,

			maxRequestCount = 1,

			/**
			 * xhr 의 timeout 프로퍼티 설정값
			 * @type {Number} 단위 ms
			 */
//			waitTime = 20000,

			/**
			 * [requestCount description]
			 * @type {Number}
			 */
			requestCount = 0,

			getUrlForCurrentChannel = function(channel, channelDataFileName) {
		        var decodeToHex = function(str) {
					return str.toString(16);
		        };
		        
		        if (typeof channel === 'undefined') {
		        	return channelDataFileName;
		        }

		        return 'dvb://' + decodeToHex(channel.onid) + '.' + decodeToHex(channel.sid) + '.' + decodeToHex(channel.tsid) + '/' + channelDataFileName;
//		        return channelDataFileName;
		    },

			/**
			 * @private xml 을 Javasript Object 로 변환 이때 attribure는 '@' 가 붙게 된다.
			 * @param
			 * @return
			 */
			convertToJsonWith = function(xml, tab) {
				var X = {
					toObj : function(xml) {
						var self = this,
							o = {};
						if (xml.nodeType == 1) { // element node ..
							if (xml.attributes.length) // element with attributes ..
								for (var i = 0; i < xml.attributes.length; i++)
									o[xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || '')
											.toString();
							if (xml.firstChild) { // element has child nodes ..
								var textChild = 0, cdataChild = 0, hasElementChild = false;
								for (var n = xml.firstChild; n; n = n.nextSibling) {
									if (n.nodeType == 1)
										hasElementChild = true;
									else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/))
										textChild++; // non-whitespace text
									else if (n.nodeType == 4)
										cdataChild++; // cdata section node
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
											if (n.nodeType == 3) // text node
												o['#text'] = self.self.cape(n.nodeValue);
											else if (n.nodeType == 4) // cdata node
												o['#cdata'] = self.escape(n.nodeValue);
											else if (o[n.nodeName]) { // multiple
																		// occurence of
																		// element ..
												if (o[n.nodeName] instanceof Array)
													o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
												else
													o[n.nodeName] = [ o[n.nodeName],
															self.toObj(n) ];
											} else
												// first occurence of element..
												o[n.nodeName] = self.toObj(n);
										}
									} else { // mixed content
										if (!xml.attributes.length)
											o = self.escape(self.innerXml(xml));
										else
											o['#text'] = self.escape(self.innerXml(xml));
									}
								} else if (textChild) { // pure text
									if (!xml.attributes.length)
										o = self.escape(self.innerXml(xml));
									else
										o['#text'] = self.escape(self.innerXml(xml));
								} else if (cdataChild) { // cdata
									if (cdataChild > 1)
										o = self.escape(self.innerXml(xml));
									else
										for (n = xml.firstChild; n; n = n.nextSibling)
											o['#cdata'] = self.escape(n.nodeValue);
								}
							}
							if (!xml.attributes.length && !xml.firstChild)
								o = null;
						} else if (xml.nodeType == 9) { // document.node
							o = self.toObj(xml.documentElement);
						} else {
							console.error('unhandled node type: ' + xml.nodeType);
						}
						return o;
					},
					toJson : function(o, name, ind) {
						var self = this,
							json = name ? ('\"' + name + '\"') : '';
						if (o instanceof Array) {
							for (var i = 0, n = o.length; i < n; i++)
								o[i] = self.toJson(o[i], '', ind + '\t');
							json += (name ? ':[' : '[') + (o.length > 1 ? ('\n' + ind + '\t' + o.join(',\n' + ind + '\t') + '\n' + ind) : o.join('')) + ']';
						} else if (o === null) {
							json += (name && ':') + 'null';
						} else if (typeof (o) === 'object') {
							var arr = [];
							for ( var m in o) {
								arr[arr.length] = self.toJson(o[m], m, ind + '\t');
							}
							json += (name ? ':{' : '{') + (arr.length > 1 ? ('\n' + ind + '\t' + arr.join(',\n' + ind + '\t') + '\n' + ind) : arr.join('')) + '}';
						} else if (typeof (o) === 'string') {
							json += (name && ':') + '\"' + o.toString() + '\"';
						} else {
							json += (name && ':') + o.toString();
						}
						return json;
					},
					innerXml : function(node) {
						var s = '';
						if ('innerHTML' in node)
							s = node.innerHTML;
						else {
							var asXml = function(n) {
								var s = '';
								if (n.nodeType == 1) {
									s += '<' + n.nodeName;
									for (var i = 0; i < n.attributes.length; i++)
										s += ' ' + n.attributes[i].nodeName + '=\"' + (n.attributes[i].nodeValue || '').toString() + '\"';
									if (n.firstChild) {
										s += '>';
										for (var c = n.firstChild; c; c = c.nextSibling)
											s += asXml(c);
										s += '</' + n.nodeName + '>';
									} else
										s += '/>';
								} else if (n.nodeType == 3)
									s += n.nodeValue;
								else if (n.nodeType == 4)
									s += '<![CDATA[' + n.nodeValue + ']]>';
								return s;
							};
							for (var c = node.firstChild; c; c = c.nextSibling)
								s += asXml(c);
						}
						return s;
					},
					escape : function(txt) {
						return txt.replace(/[\\]/g, '\\\\').replace(/[\"]/g, '\\"').replace(/[\n]/g, '\\n').replace(/[\r]/g, '\\r');
					},
					removeWhite : function(e) {
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
								} else
									n = n.nextSibling;
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
				return '{\n' + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, '')) + '\n}';
			},

			getTimeStamp = function() {
				var a = new Date(), 
					result = [],
					leadingZeros = function(a, c) {
						var b = '';
						a = a.toString();
						
						if (a.length < c)
							for (var d = 0; d < c - a.length; d++)
								b += '0';
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
			/* New Logic */
			triggerUrl,
			
			onGoingGame = function(callback) {
                var xhr = new XMLHttpRequest(),
                    saId = STBService.getConfigBy('SAID'),
                    host = triggerUrl,
                    url, data;

                url = '/mashup_baseball/ongoingGame';
                
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

                console.log(host +url + "?" + getCommonQueryString())
                xhr.open('GET', host + url + "?" + getCommonQueryString(), true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                xhr.send(data);
            },
            getCommonQueryString=function() {
                var saId = STBService.getConfigBy('SAID'),
                    tvType = STBService.getCurrentSTBMode() === STBType.OTV ? 1 : 2,
                    queryString = 'said=' + saId + '&stb_type=1&tv_type=' + tvType + '&mashup_id=' + AppConfig.fiveChannel.id;

                return queryString;
            },
            //--------------------------------------------------------------------------------
			/**
			 * 
			 * @param type
			 */
			sendMessageTo = function(type, callback) {
				var xhr = new XMLHttpRequest(), 
					saId = STBService.getConfigBy('SAID'),
					sid = 'ITV4CHSVC', /* var sid = v.getChannelConfig().currentChannel.sid; */
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
			};
			/* New Logic */
			me.goingGameinterval = function(callback) {
	            onGoingGame(callback);
	        };
		        
			me.setFiveChannelTriggerUrl = function (url) {
	            triggerUrl = url;
	        };

		/* 위성케이블 연결 여부 체크 */
        me.checkOTSSignal = function (){
			var isOTSSTB = STBService.isOTSDevice();
			var config = oipfObjectFactory.createConfigurationObject();

			if(isOTSSTB === true)
			{
				var OTSSignal = config.localSystem.tuners[0].enableTuner;
				if(OTSSignal !== true)
				{
//						console.log("EventBus=========>"+EventBus);
					eventBus.fire('NoOTSSignal');
					return false;
				}
			}

			return true;

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
	    me.loadChannelData = function(callback) {
			var channelDataFileName = 'channelData.xml',
				url = channelDataFileName + '?t=' + Math.random(), //getUrlForCurrentChannel(channelDataFileNam/e),//STBService.currentChannel, channelDataFileName), 
				// url = getUrlForCurrentChannel(STBService.getCurrentChannel(), channelDataFileName), 
				xhr = new XMLHttpRequest(),
				dom;
			
			xhr.onreadystatechange = function() {
				
				xhr.readyState === 4 && console.log('loaded');
				
				if (xhr.readyState === 4 && ( xhr.status === 200 || xhr.status === 0)) {
						var responseText = xhr.responseText;
						xhr.abort();
						requestCount = 0;
						
						Class.Timer.end('xhr loading');
						if (callback) {
//							console.log(responseText);
							dom = (new DOMParser()).parseFromString(responseText, 'text/xml');
							
							callback(JSON.parse(convertToJsonWith(dom, '')).multiView);
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

//			 xhr.timeout = waitTime;
//
//			 xhr.ontimeout = function() {
//			 	xhr.abort();
//			 	xhr.open('GET', channelDataFileName);
//			 	xhr.send(null);
//			 };
			
			Class.Timer.start('xhr loading');

			xhr.open('GET', url, true);

			xhr.send(null);
		};

	}
});
'use strict';


Class.define('MultiView.app.ChannelDataManager', {

	_construct: function(eventBus) {
	
		var me = this,

			channelData,
		
			currentChannelDatum,
		
		    currentChannelDataIndex = -1,
		
		    currentSubChannelDatum,
		
		    currentSubChannelDataIndex = -1,
		    
		    prevChannelDataIndex,
		    
		    masterChannel,

		    initializeChannelData = function(originChannelData) {
			
				var isOtsDevice = STBService.isOTSDevice(),
			        isOTSMode = STBService.isOTSMode(),
			        isUHDDevice = STBService.isUHDDevice(),
			        ignoreKeyword = 'X',
			        i, length,
			        multiChannel, isUHDMultiChannel,
			        item, subItems, result = [],
			        createSubChannelData = function(channels, disabled) {
			            var j, jLength,  no, sid, name, tempNo, tempSid, channel, channelProperty, tempCh,
			            result = [];
			            

			            for (j = 0, jLength = channels.length; j < jLength; j++) {
			                channel = channels[j];

			                channelProperty = getSTBPropertyForSubChannel(channel);
			                
			                // 설정된 채널 항목이 존재하지 않을 시에는 서브채널을 아에 만들지 않는다.
			                // 4 채널 서비스 이므로, 빼지 않고, 통채로 날려버린다.
			                // getSTBProperty 에서 otv 라고 판명냈는데 otv 채널이 없으면 걸린다.
			                if (!channel[channelProperty]) {
			                	return;
			                }

			                no = Number(channel[channelProperty].no);
			                sid = channel[channelProperty].sid;
			                name = channel.name;

			                // 1. disabled 가 true 인 경우 각 서브 채널들의 sid 유효성을 체크한다. 
			                // 2. 현재 시점(14.08.13)에서는 지상파 채널만 해당된다.
			                // 3. 14.10.02 - disabled 이 false 인데 sid 가 존재하지 않는 경우에 대해서는 코드상 명시가 전혀 되어있지 않다.
			                // 	이 경우는 발생 되어서는 안되는 설정상의 문제이기 때문에 이 주석으로 명시만 한다. 
			                // 	disable 값에 상관없이 모든 채널에 대한 조사를 한다는 것은 현 상황에서는 낭비인듯 하다.
			                if (disabled) {
			                	tempCh = STBService.getChannel(no);

			                	var subSidArry = sid.replace(/(\s*)/g, '').split(',');

			                	// 명시된 sid 가 존재하지 않으면 서브메뉴 자체를 생성하지 않고 undefined 를 리턴한다.
			                    if (subSidArry.indexOf(String(tempCh.sid)) === -1) {
			                    	return;
			                    } else {
			                    	
			                    }
			                }

			                // 1. ots 모드로 작동하는데 채널은 otv 에서 가져오게 되는 경우(현재 시점(14.08.13)에서는 스포츠 채널의 SPOTV 만 해당된다.) 예외 채널을 등록해준다.
			                // 2. SPOTV와 KBS N Sports 채널의 51번으로 동일하다.
			                if (isOTSMode && channelProperty === STBType.OTV) {
			                	eventBus.fire('addTempOTVChannelNumber', no, sid);
			                }

			                result.push({
			                    no: no,
			                    name: name,
			                    channelType: channelProperty
			                });

			            }

			            return result;
			        },
			        getSTBProperty = function(channel) {
		            	if (isUHDDevice && channel.uhd) {
		            		return STBType.UHD;
		            	} else if (isOtsDevice && channel.ots) {
		            		return STBType.OTS;
		            	} else {
		            		return STBType.OTV;
		            	}
		            },
		            getSTBPropertyForSubChannel = function(channel) {
		            	if (isUHDDevice && channel.uhd) {
		            		return STBType.UHD;
		            	} else if (isOTSMode && channel.ots) {
		            		return STBType.OTS;
		            	} else {
		            		return STBType.OTV;
		            	}
		            },
		            hasNotChannelProperty = function(multiChannel) {
						if (isOtsDevice) {
			                return !multiChannel.hasOwnProperty(STBType.OTS);
			            } else if (isUHDDevice) {
			            	return !multiChannel.hasOwnProperty(STBType.UHD);
			            } else if (!isOTSMode && !isUHDDevice) {
			            	return !multiChannel.hasOwnProperty(STBType.OTV);
			            } else {
			            	return false;
			            }
		            };
			
			    if (Array.isArray(originChannelData) && originChannelData.length > 0) {
			        for (i = 0, length = originChannelData.length; i < length; i++) {
			        	
			            multiChannel = originChannelData[i];
			            
			            if (!masterChannel) {
			            	masterChannel = Number(multiChannel.otv);	
			            }
			        	
			
			            // 장비에 맞는 해당 채널넘버를 - 채널 어트리뷰트를 - 가지고 있지 않다면 제외 시킨다.
			            if (hasNotChannelProperty(multiChannel)) {
			                continue;
			            } 

			            // UHD Device 이고, OTV 채널번호와 UHD 채널번호가 다르다면, 해당 멀티채널은 UHD 채널이다.
			            isUHDMultiChannel = isUHDDevice && multiChannel[STBType.UHD] !== multiChannel[STBType.OTV];
			
			            subItems = createSubChannelData(multiChannel.channel, Class.Utils.toBoolean(multiChannel.disable));
			
			            // subItems 가 존재하지 않을 경우 메뉴에 해당되는 Multi Channel 자체를 생성하지 않는다.
			            if (subItems) {
			            	var channelType = getSTBProperty(multiChannel);
			                item = {
			                    no: Number(multiChannel[channelType]),
			                    name: multiChannel.name,
			                    isUHD: isUHDMultiChannel,
			                    channelType: channelType,
			                    channels: subItems
			                };
			
			                result.push(item);
			            }
			
			        }
			    }
			    
			    channelData = result;
			},
			
			initializeSubChannel = function(channelDatum) {
				var j, jLength, limitType;
				
				for (j = 0, jLength = channelDatum.channels.length; j < jLength; j++) {
					
					limitType = STBService.getLimitType(channelDatum.channels[j]);
					console.log("limitType===========>");
					channelDatum.channels[j].limitType = limitType;
					
					if (limitType || limitType !== LimitType.NONE) {
						eventBus.fire('convertToLimitedChannel', j, limitType);
					} else {
						eventBus.fire('resetChannelDisplay', j);
					}
				}
				
				// 채널 셀렉트/포커스를 결정한다.
				if (limitedAllSubChannel()) {
					// nothing..
				} else if (currentSubChannelDatum.limitType !== LimitType.NONE) {
					eventBus.fire('unselectDisplayItem', currentSubChannelDataIndex);
					for (var i = 0, length = currentChannelDatum.channels.length; i < length; i++) {
						if (currentChannelDatum.channels[i].limitType === LimitType.NONE) {
							currentSubChannelDatum = currentChannelDatum.channels[i];
							currentSubChannelDataIndex = i;
							eventBus.fire(Main.initialized ? 'selectDisplayItem' : 'focusDisplayItem', i);
							break;
						}
		 			}
				}
			},
			
			getChannelDataIndex = function(channel) {
				for (var i =0, length = channelData.length; i < length; i++) {
					if (channelData[i].no === channel.majorChannel ) {
						return i;
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
			};
			
		
		eventBus.register(me, 'loadedChannelData', function(data) {
			var originChannelData = Array.isArray(data) ? data : [data];
			
			initializeChannelData(originChannelData);
			
			currentChannelDataIndex = 0;
			currentChannelDatum = channelData[0];
			
			currentSubChannelDataIndex = 0;
			currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];
			
			eventBus.fire('parsedChannelData', channelData[0])
		});

		eventBus.register(me, 'parsedChannelData', function(channelDatum) {
			initializeSubChannel(channelDatum);
			eventBus.fire('initializedChannelData', currentChannelDatum, currentSubChannelDatum);
		});

		eventBus.register(me, 'moveFocus', function(from, to) {
			// 같은 영역에서의 동작일때만 영향을 끼친다.
			if (to.focusType === FocusType.VIDEO && from.focusType === FocusType.VIDEO) {
				currentSubChannelDataIndex = to.index;
				currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];
				
				eventBus.fire('changeAudioChannel', currentSubChannelDataIndex, STBService.getLimitType(currentSubChannelDatum));
			}
		}, 1);
		
		eventBus.register(me, 'moveChannel', function (channelIndex) {

			if (currentChannelDataIndex !== channelIndex) {
				prevChannelDataIndex = currentChannelDataIndex;

				currentChannelDataIndex = channelIndex;
			}
			currentChannelDatum = channelData[channelIndex];

			currentSubChannelDataIndex = 0;
			currentSubChannelDatum = currentChannelDatum.channels[currentSubChannelDataIndex];
			initializeSubChannel(currentChannelDatum, channelIndex);
		}, 1);
		
		eventBus.register(me, 'movedChannel', function() {
			// HD -> UHD 로 변경할 때에는 변경이 된 후에 videoObject를 변경한다.
			if (currentChannelDatum.isUHD) {
				eventBus.fire('convertToUHD');
			} else if (!currentChannelDatum.isUHD) {
				eventBus.fire('convertToHD');
			}
		});
		
		eventBus.register(me, 'resetClass', function() {
			channelData = undefined;
		
			currentChannelDatum = undefined;
		
		    currentChannelDataIndex = -1;
		
		    currentSubChannelDatum = undefined;
		
		    currentSubChannelDataIndex = -1;
		});
		
		

		me.__defineGetter__('prevChannelDataIndex', function() {
			return prevChannelDataIndex;
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
			return currentSubChannelDatum;
		});

		me.__defineGetter__('currentSubChannelDataIndex', function() {
			return currentSubChannelDataIndex;
		});
		
		me.__defineGetter__('masterChannel', function() {
			return masterChannel;
		});
	}
});
'use strict';

Class.define('MultiView.app.KeyBinder', {

	_construct: function (eventBus) {
		var me = this,
		
			focusInfo = {
				focusType: FocusType.VIDEO,
				index: -1
			},
			
			beforeMenuIndex,
			
			/**
			 * Menu 의 채널이 변경되기까지의 Delay time (ms)
			 */
			channelMovingTime = 300,
			
			readyForInput = false,
			
			movingChannel = false,
			
			keyDown = function(e) {
				
				
			    // 애플리케이션이 키입력 준비가 되지 않았다면 키입력 이벤트는 모두 무시한다.
				if (!readyForInput) {
					return;
				}
				
				e.preventDefault();
			    e.stopPropagation();
				
				
				var nextFocusInfo = {
						focusType: focusInfo.focusType,
						index: focusInfo.index
				};
				console.log(e.keyCode+","+VK_ENTER)
				switch(e.keyCode) {
				
				    case VK_ENTER :
				    	if(focusInfo.focusType === FocusType.VIDEO){
				    		eventBus.fire('goChannel');
				    	}
				    	break;
				    case VK_LEFT :
				   		
				    	if(focusInfo.focusType === FocusType.VIDEO){
				    		nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex - 1< 0 ? 3 : ChannelDataManager.currentSubChannelDataIndex - 1;
				    	} else {
				    		nextFocusInfo.index = focusInfo.index - 1 < 0 ? ChannelDataManager.channelData.length - 1 : focusInfo.index - 1;
				    	}
				   	    break;
				   	case VK_RIGHT :
				   		if(focusInfo.focusType === FocusType.VIDEO){
				   			nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex + 1> 3 ? 0 : ChannelDataManager.currentSubChannelDataIndex + 1;
				    	} else {
				    		nextFocusInfo.index = focusInfo.index + 1 > ChannelDataManager.channelData.length - 1 ? 0 : focusInfo.index + 1;
				    	}
				   	    break;
				   	case VK_UP :
				   		if(focusInfo.focusType === FocusType.VIDEO && (focusInfo.index === 0 || focusInfo.index === 1)){
				   			nextFocusInfo.focusType = FocusType.MENU;
				   			nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;			    		
				    	} else if(focusInfo.focusType === FocusType.VIDEO && (focusInfo.index === 2 || focusInfo.index === 3)){
				    		nextFocusInfo.index = focusInfo.index === 2 ? 0 : 1;
						} else {
							nextFocusInfo.focusType = FocusType.VIDEO;
							nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;
				    	}
				   	    break;
				   	case VK_DOWN :
				   		if (focusInfo.focusType === FocusType.VIDEO && (focusInfo.index === 0 || focusInfo.index === 1)) {
				   			nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex + 2;
				   		} else if (focusInfo.focusType === FocusType.VIDEO && (focusInfo.index === 2 || focusInfo.index === 3)) {
				   			nextFocusInfo.focusType = FocusType.MENU;
				   			nextFocusInfo.index = ChannelDataManager.currentChannelDataIndex;
				   		} else {
				   			nextFocusInfo.focusType = FocusType.VIDEO;
				   			nextFocusInfo.index = ChannelDataManager.currentSubChannelDataIndex;
				   		}
				   	    break;
				   	case VK_BACK :
				   		
				   		if(typeof ChannelDataManager.prevChannelDataIndex !== 'undefined'){
				   			eventBus.fire('forcedToMove', ChannelDataManager.prevChannelDataIndex);
				   			return;
				   		} else {
				   			eventBus.fire('destroyApp');	
				   		}
				   	    break;
				   	case VK_RED :
				   		if (ChannelDataManager.currentChannelDataIndex < 4) {
				            eventBus.fire('going5ch');
				        }
				   		break;
				   	case VK_GREEN :
				   		// nothing
				   		break;
			    }

			    if (!Class.equals(focusInfo, nextFocusInfo)) {
					eventBus.fire('moveFocus', focusInfo, nextFocusInfo);
					eventBus.fire('finishedFocusMoving', nextFocusInfo);
			    }
			};

	    eventBus.register(me, 'forcedToMove', function(channelDataIndex) {
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
	   			
	   			movingChannel = true;
	   			eventBus.fire('moveChannel', nextFocusInfo.index);
	   			
	   			if (currentFocusType === FocusType.VIDEO) {
	   				eventBus.fire('moveFocus',  focusInfo, {
		   				focusType: FocusType.VIDEO,
		   				index: ChannelDataManager.currentSubChannelDataIndex
		   			});
		   			
		   			focusInfo =  {
			   				focusType: FocusType.VIDEO,
			   				index: ChannelDataManager.currentSubChannelDataIndex
			   		};
		   			
		   			eventBus.fire('movedPrevChannel');
	   			}
	    });

		eventBus.register(me, 'finishedFocusMoving', function(nextFocusInfo) {
			var isMenuChanging = focusInfo.focusType === FocusType.MENU && nextFocusInfo.focusType === FocusType.MENU;
			
			focusInfo = nextFocusInfo;
			
			if (isMenuChanging) {
				
				beforeMenuIndex = nextFocusInfo.index;
				
				setTimeout(function() {
					if (beforeMenuIndex === nextFocusInfo.index) {
						if (UiRenderer.visibledMenu) {
							movingChannel = true;
							eventBus.fire('moveChannel', nextFocusInfo.index);	
						} else {
							eventBus.fire('canceledChannelMoving');	
						}
					}
				}, channelMovingTime);
			}
		});
		
		eventBus.register(me, 'movedChannel', function() {
			movingChannel = false;
		});

		// ChannelData 초기화가 완료되었다면 focus 를 현재 SubChannel 의 인덱스로 설정한다.
		eventBus.register(me, 'initializedChannelData', function(currentChannelDatum, currentSubChannelDatum) {
			focusInfo.index = currentChannelDatum.channels.indexOf(currentSubChannelDatum);
		});
		
		eventBus.register(me, 'completeInitializing', function() {
			readyForInput = true;
		});

		// KeyBinder 초기화 이벤트, 현재는 테스트를 위한 놈이다.
		eventBus.register(me, 'resetClass', function() {
			focusInfo = {
				focusType: FocusType.VIDEO,
				index: -1
			};
			readyForInput = false;
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
/*	New Logic 
 *	5채널 Switch 
 */
'use strict';

Class.extend('MultiView.components.UiComponent', 'MultiView.components.SwitchChannel', {
	
	intervalEvent: new Object(),
	intervalTime: 120000,
	isResult: false,
	isChVisibility: false,
	isVideoVisibility: true,
	
	_construct : function(eventBus) {

		 console.log('STBService.isUHDDevice() : ' + STBService.isUHDDevice()); // ?????
		// if (STBService.isUHDDevice()) {
		// 	return;
		// }

		var me = this;

		me.eventBus = eventBus;

		me.element = me.$1('#sportChannel');

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
		/*	New Logic 
		 *	서버 타입은 에디터 모드가 없음*/
//		if(json.result == 'TRUE') {
//			// if (ChannelDataManager.currentChannelDataIndex < 4) {
//				me.isResult = true;	
//				me.show();
//			// }
//			// clearInterval(me.intervalEvent);
//		} else {
//			me.isResult = false;
//			me.hide();
//		}
		
		RPCService.goingGameinterval(function(json) {
			
			//	New Logic 
			//	서버 타입은 에디터 모드가 없음
			console.log(json.API.RESULT)
			if(json.API.RESULT == 'TRUE') {
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