/**
* 	AniPlayer 
*	Version: 0.0.4
*	Date: 2014-11-05
*   Author:	sung-chul Park
*/
document.write('<script type="text/javascript" src="js/collie.min.js"></script>'); 
document.write('<script type="text/javascript" src="js/raphael-min.js"></script>'); 

var _animation_player;
var _cycle = 1;
AniPlayer = function() {
	//alert("New AniPlayer!!");
	this.version = "0.0.4";
	this.anidata = null;
	this.stage = null;
	this.container = null;
	this.objects = [];
	var displayObjectMap = new JMap();	//anidata정의 된 ObjectMap
	var objectMap = new JMap();	//displayObject로 생성된 ObjectMap

	collie.ImageManager.reset();
	collie.Renderer.removeAllLayer();	 	    
	
	_animation_player = this;  
	
	//Stage 설정
	this.initStage = function(){
		//init stage info
		this.stage = new collie.Layer({
		    width: this.anidata.stage.width,
		    height: this.anidata.stage.height
		});

		//init container info
		this.container = document.getElementById("container");
		this.container.style.backgroundColor = this.anidata.stage.color;
		this.container.style.width = this.anidata.stage.width + "px";
		this.container.style.height = this.anidata.stage.height + "px";			
			
		collie.Renderer.addLayer(this.stage);
		collie.Renderer.load(this.container);
	}
	
	//Object 설정
	this.initObject = function(){

		for(var i=0; i<this.anidata.object.length;i++){
			var object = this.anidata.object[i];
			var newObject;
			
			if(object.type == 'image'){
				var imgScaleX = 1;
				var imgScaleY = 1;
				var originImgHeight = 0;					    			

				
				collie.ImageManager.add("objimage_"+i, object.src);
				/*
				//비동기 이미지 로딩
				collie.ImageManager.addImage("objimage",object.src, function(elImage,sName,sURL){
					originImgWidth = elImage.width;
					originImgHeight = elImage.height;
				});
				*/
				
				//이미지 크기 비율 계산
				imgScaleX =  object.width / object.origin_width;
				imgScaleY =  object.height / object.origin_height;
				//alert(imgScaleX + ":" + imgScaleY)
				newObject = new collie.DisplayObject({
					name : object.id,
			        x : object.x - (object.origin_width/2) + (object.width/2),
			        y : object.y - (object.origin_height/2) + (object.height/2),
			        scaleX : imgScaleX,
			        scaleY : imgScaleY,
				    backgroundImage: "objimage_" + i,
			        opacity : object.opacity,
			        angle : object.angle,
			        zIndex : object.zindex,
			        visible : false,
			    	originX : "center",
			    	originY : "center"
					}).attach({
					    "click" : function (data) {
							var objectId = data.displayObject.get("name");
					    	if(objectMap.get(objectId).link!= undefined){
					        	window.open(objectMap.get(objectId).link);
					        }
					    }			        
				}).addTo(this.stage);	 	    				
	    				
			}else if(object.type == 'rectangle'){
			    newObject = new collie.DisplayObject({
					name : object.id,
			        x : object.x,
			        y : object.y,
			        width : object.width,
			        height : object.height,
			        backgroundColor : object.color,
			        opacity : object.opacity,
			        angle : object.angle,
			        zIndex : object.zindex,
			        visible : false,
					}).attach({
					    "click" : function (data) {
							var objectId = data.displayObject.get("name");
					    	if(objectMap.get(objectId).link!= undefined){
					        	window.open(objectMap.get(objectId).link);
					        }
					    }			        
			    }).addTo(this.stage);
				
			}else if(object.type == 'circle'){
			    newObject = new collie.Circle({
					name : object.id,
				    x : object.x,
				    y : object.y,
				    radius : object.radius,
				    fillColor: object.color,
				    zIndex : object.zindex,
			        visible : false,
					}).attach({
					    "click" : function (data) {
							var objectId = data.displayObject.get("name");
					    	if(objectMap.get(objectId).link!= undefined){
					        	window.open(objectMap.get(objectId).link);
					        }
					    }				        
			    }).addTo(this.stage);	
		    
			    			
			}else if(object.type == 'text'){
				
				var fontStyle = "";
				if(object.bold)
					fontStyle = "bold ";
				if(object.italic)	
					fontStyle += "italic";
				
			    newObject = new collie.Text({
					name : object.id,
				    x : object.x,
				    y : object.y,
			        width : object.width,
			        height : object.height,
					scaleX : object.scale_x,	
					scaleY : object.scale_y,
			    	originX : "center",
			    	originY : "center",		
			    	//originX : "left",
			    	//originY : "top",		
				    //backgroundColor: object.color,
			        opacity : object.opacity,
			        angle : object.angle,		
			        fontFamily : object.font,		    
			        fontSize : object.font_size,
			        fontColor : object.font_color,
			        fontWeight : fontStyle,
			        textAlign : object.text_align,
			        zIndex : object.zindex,
			        visible : false,
					}).attach({
					    "click" : function (data) {
							var objectId = data.displayObject.get("name");
					    	if(objectMap.get(objectId).link!= undefined){
					        	window.open(objectMap.get(objectId).link);
					        }
					    }				        
			    }).addTo(this.stage);
			    newObject.text (object.text);					
			}

			objectMap.put(object.id, object);	//anidata정의 된 ObjectMap
			displayObjectMap.put(object.id, newObject);	//displayObject로 생성된 ObjectMap
		}
	    
	}	
	
	//Timeline 설정
	this.initTimeline = function(){
	    var oTimer = collie.Timer.timeline();
	    var isLoop = this.anidata.stage.loop;
	    var loop_count = this.anidata.stage.loop_count;
	    
		for(var i=0; i<this.anidata.keyframe.length;i++){
			var keyframe = this.anidata.keyframe[i];
			var nextkeyframe = this.anidata.keyframe[i+1];

			//첫번째 Keyframe 처리 (DisplayObject 갱신)
			if(i==0){
				for(var n=0; n<keyframe.object.length;n++){
					displayObjectMap.get(keyframe.object[n].id).set("visible",true);
					
					if(objectMap.get(keyframe.object[n].id).type == "text"){
						var strVal = {};
						if (keyframe.object[n].x != undefined && keyframe.object[n].y != undefined) {
							if (keyframe.object[n].width != undefined && keyframe.object[n].height!= undefined) {
								strVal.x = (keyframe.object[n].x) + (keyframe.object[n].width / 2); 
								strVal.y = (keyframe.object[n].y) + (keyframe.object[n].height / 2);
								strVal.x = strVal.x - keyframe.object[n].font_size;
								strVal.y = strVal.y - keyframe.object[n].font_size / 1.6;
								strVal.x = strVal.x - (keyframe.object[n].width - 72) / 2;
								strVal.y = strVal.y - (keyframe.object[n].height - 36) / 2;
								//var textLen = (objectMap.get(keyframe.object[n].id)).text.length;
								//strVal.x = strVal.x - keyframe.object[n].width/textLen;
								
								//console.log(strVal.x + " : " + strVal.y);
							}else{
								strVal.x = keyframe.object[n].x; 
								strVal.y = keyframe.object[n].y;								
							}
						}
						if (keyframe.object[n].scale_x != undefined && keyframe.object[n].scale_y != undefined) {
							strVal.scaleX = keyframe.object[n].scale_x; 
							strVal.scaleY = keyframe.object[n].scale_y;
						}
						if (keyframe.object[n].opacity != undefined) {
							strVal.opacity = keyframe.object[n].opacity; 
						}
						if (keyframe.object[n].angle != undefined) {
							strVal.angle = keyframe.object[n].angle; 
						}
						if (keyframe.object[n].font_size != undefined) {
							strVal.fontSize = keyframe.object[n].font_size;
						}
						//console.log(strVal);
						displayObjectMap.get(keyframe.object[n].id).set(strVal);
						
					}else{
					
						if (keyframe.object[n].x != undefined && keyframe.object[n].y != undefined) {
							if (objectMap.get(keyframe.object[n].id).type == "image") {
								if (keyframe.object[n].width != undefined && keyframe.object[n].height != undefined) {
									var x1 = keyframe.object[n].x - (objectMap.get(keyframe.object[n].id).origin_width / 2) + (keyframe.object[n].width / 2);
									var y1 = keyframe.object[n].y - (objectMap.get(keyframe.object[n].id).origin_height / 2) + (keyframe.object[n].height / 2);
									displayObjectMap.get(keyframe.object[n].id).set("x", x1);
									displayObjectMap.get(keyframe.object[n].id).set("y", y1);
								}else{
									var x1 = keyframe.object[n].x - (objectMap.get(keyframe.object[n].id).origin_width / 2) + (objectMap.get(keyframe.object[n].id).width / 2);
									var y1 = keyframe.object[n].y - (objectMap.get(keyframe.object[n].id).origin_height / 2) + (objectMap.get(keyframe.object[n].id).height / 2);									
									displayObjectMap.get(keyframe.object[n].id).set("x", x1);
									displayObjectMap.get(keyframe.object[n].id).set("y", y1);
								}
							}else{
								displayObjectMap.get(keyframe.object[n].id).set("x", keyframe.object[n].x);
								displayObjectMap.get(keyframe.object[n].id).set("y", keyframe.object[n].y);
							}
						}
						
						if (objectMap.get(keyframe.object[n].id).type == "image") {
							if (keyframe.object[n].width != undefined && keyframe.object[n].height != undefined) {
								var imgScaleX = keyframe.object[n].width / objectMap.get(keyframe.object[n].id).origin_width;
								var imgScaleY = keyframe.object[n].height / objectMap.get(keyframe.object[n].id).origin_height;
								//alert(imgScaleX + ":" + imgScaleY);						
								displayObjectMap.get(keyframe.object[n].id).set("scaleX", imgScaleX);
								displayObjectMap.get(keyframe.object[n].id).set("scaleY", imgScaleY);
								displayObjectMap.get(keyframe.object[n].id).set("fitImage", true);
							}
						}else{
							if (keyframe.object[n].width != undefined && keyframe.object[n].height != undefined) {
								displayObjectMap.get(keyframe.object[n].id).set("width", keyframe.object[n].width);
								displayObjectMap.get(keyframe.object[n].id).set("height", keyframe.object[n].height);
							}
						}
						
						if (keyframe.object[n].scale_x != undefined && keyframe.object[n].scale_y != undefined) {
							displayObjectMap.get(keyframe.object[n].id).set("scaleX", keyframe.object[n].scale_x);
							displayObjectMap.get(keyframe.object[n].id).set("scaleY", keyframe.object[n].scale_y);
						}
						if (keyframe.object[n].font_size != undefined) {
							displayObjectMap.get(keyframe.object[n].id).set("fontSize", keyframe.object[n].font_size);
						}
						if (keyframe.object[n].radius != undefined) {
							displayObjectMap.get(keyframe.object[n].id).set("radius", keyframe.object[n].radius);
						}
						if (keyframe.object[n].angle != undefined) {
							displayObjectMap.get(keyframe.object[n].id).set("angle", keyframe.object[n].angle);
						}
						if (keyframe.object[n].opacity != undefined) {
							displayObjectMap.get(keyframe.object[n].id).set("opacity", keyframe.object[n].opacity);
						}
						
					}

				}
			}
			
			if(nextkeyframe != undefined) {
				var duration = nextkeyframe.time - keyframe.time;
				//console.log("nextkeyframe.time: " + nextkeyframe.time);
				//Keyframe내에 정의 된 Object 속성 처리
				for(var j=0; j<nextkeyframe.object.length;j++){
					
					var objectId = nextkeyframe.object[j].id;
					var velocity = undefined;
					//displayObjectMap.get(objectId).set("visible",true);
					var prevKeyframeTime = this.getPrevKeyframeTime(nextkeyframe.object[j].id, nextkeyframe.time);
					//console.log("nextkeyframe.time" + nextkeyframe.time + " prevKeyframeTime:" + prevKeyframeTime);
					duration = nextkeyframe.time - prevKeyframeTime;					
					
					if(nextkeyframe.object[j].velocity != undefined){
						velocity = eval("collie.Effect." + nextkeyframe.object[j].velocity);
					}

					//Display
				    if(nextkeyframe.object[j].visible == undefined || nextkeyframe.object[j].visible == true){
					    oTimer.add(prevKeyframeTime, "delay", function(){
							var objectId = this.option("objectId");
				        	displayObjectMap.get(objectId).set("visible",true);
					    }, duration, {objectId: objectId});					    
					}else{
					    oTimer.add(prevKeyframeTime, "delay", function(){
							var objectId = this.option("objectId");
				        	displayObjectMap.get(objectId).set("visible",false);
					    }, duration, {objectId: objectId});					    
					}	
															
					//Move 
					if(nextkeyframe.object[j].x != undefined && nextkeyframe.object[j].y != undefined){
						if (objectMap.get(nextkeyframe.object[j].id).type == "image") {
							
							if (nextkeyframe.object[j].width != undefined && nextkeyframe.object[j].height != undefined) {
								var x1 = nextkeyframe.object[j].x - (objectMap.get(nextkeyframe.object[j].id).origin_width / 2) + (nextkeyframe.object[j].width / 2);
								var y1 = nextkeyframe.object[j].y - (objectMap.get(nextkeyframe.object[j].id).origin_height / 2) + (nextkeyframe.object[j].height / 2);
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["x", "y"],
									to: [x1, y1],
									effect: velocity
								});
							}else{
								var x1 = nextkeyframe.object[j].x - (objectMap.get(nextkeyframe.object[j].id).origin_width / 2) + (objectMap.get(keyframe.object[j].id).width / 2);
								var y1 = nextkeyframe.object[j].y - (objectMap.get(nextkeyframe.object[j].id).origin_height / 2) + (objectMap.get(keyframe.object[j].id).height / 2);
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["x", "y"],
									to : [x1, y1],
									effect: velocity
								});								
							}
							
						}else if (objectMap.get(nextkeyframe.object[j].id).type == "text") {
							if (nextkeyframe.object[j].font_size != undefined) {
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["fontSize"],
									to: [nextkeyframe.object[j].font_size]
								});
							}
							
							if (nextkeyframe.object[j].scale_x != undefined && nextkeyframe.object[j].scale_y != undefined) {
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["scaleX", "scaleY"],
									to: [nextkeyframe.object[j].scale_x, nextkeyframe.object[j].scale_y]
								});
							}
							if (nextkeyframe.object[j].width != undefined && nextkeyframe.object[j].height != undefined) {
								
								var x1 = 0;
								var y1 = 0;
								x1 = (nextkeyframe.object[j].x) + (nextkeyframe.object[j].width / 2); 
								y1 = (nextkeyframe.object[j].y) + (nextkeyframe.object[j].height / 2);
								x1 = x1 - nextkeyframe.object[j].font_size;
								y1 = y1 - nextkeyframe.object[j].font_size / 1.6;
								x1= x1 - (nextkeyframe.object[j].width - 72) / 2;	
								y1 = y1 - (nextkeyframe.object[j].height - 36) / 2;							
								
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["x", "y"],
									to: [x1, y1],
									effect: velocity
								});
							}else{
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["x", "y"],
									to : [nextkeyframe.object[j].x, nextkeyframe.object[j].y],
									effect: velocity
								});
							}
												
						}else{
							oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
								set: ["x", "y"],
								to : [nextkeyframe.object[j].x, nextkeyframe.object[j].y],
								effect: velocity
							});
						}
						//console.log("ObjectID:" + nextkeyframe.object[j].id + "-start:" + prevKeyframeTime + "-duration:" + duration);
				  	}
			    
			    	//Resize
			    	if(displayObjectMap.get(objectId).get("backgroundImage") != "") {
					  	//Object 타입: 이미지
			    		//이미지 크기 비율 계산
						if (nextkeyframe.object[j].width != undefined && nextkeyframe.object[j].height != undefined) {
							var imgScaleX = nextkeyframe.object[j].width / objectMap.get(nextkeyframe.object[j].id).origin_width;
							var imgScaleY = nextkeyframe.object[j].height / objectMap.get(nextkeyframe.object[j].id).origin_height;
							if (nextkeyframe.object[j].width != undefined && nextkeyframe.object[j].height != undefined) {
								oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
									set: ["scaleX", "scaleY"],
									to: [imgScaleX, imgScaleY]
								});
							}
						}
				  	}else{
				  		//Object 타입: 이미지 외
				    	if(nextkeyframe.object[j].width != undefined && nextkeyframe.object[j].height != undefined){
				    		
				    		if(nextkeyframe.object[j].radius != undefined ){	//CIRCLE 인경우
							    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
				        			set : ["radius"],
				        			to : [nextkeyframe.object[j].radius]
							    });
				    		}else if(nextkeyframe.object[j].font_size != undefined ){	//TEXT 인경우
				    			
					    		//이미지 크기 비율 계산
							    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
				        			set : ["fontSize"],
				        			to : [nextkeyframe.object[j].font_size]
							    });
								
								if (nextkeyframe.object[j].scale_x != undefined && nextkeyframe.object[j].scale_y != undefined) {
   							    	oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
					        			set : ["scaleX", "scaleY"],
					        			to : [nextkeyframe.object[j].scale_x, nextkeyframe.object[j].scale_y]				        			
							    	});	
								}else{
						    		var prevTextWidth = objectMap.get(objectId).width / displayObjectMap.get(objectId).get("scaleX");
						    		var prevTextHeight = objectMap.get(objectId).height / displayObjectMap.get(objectId).get("scaleY");
									var textScaleX =  nextkeyframe.object[j].width / prevTextWidth;
									var textScaleY =  nextkeyframe.object[j].height / prevTextHeight;	
								    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
					        			set : ["scaleX", "scaleY"],
					        			to : [textScaleX, textScaleY]				        			
								    });								
								}	
															
				    		}else{
							    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
				        			set : ["width", "height"],
				        			to : [nextkeyframe.object[j].width, nextkeyframe.object[j].height]
							    });
				    		}
				    		
					  	}else{
					  			//width, height 속성대신 scale로 크기를 조정하는 Object는 별도 처리 
							    //alert(nextkeyframe.object[j].scale_x + ":" + nextkeyframe.object[j].scale_y);
							    if(nextkeyframe.object[j].font_size != undefined ){
								    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
					        			set : ["fontSize"],
					        			to : [nextkeyframe.object[j].font_size]
								    });							    
							  	}
							    
							    if(nextkeyframe.object[j].scale_x  != undefined && nextkeyframe.object[j].scale_y != undefined){
    							    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
					        			set : ["scaleX", "scaleY"],
					        			to : [nextkeyframe.object[j].scale_x, nextkeyframe.object[j].scale_y]				        			
							    	});					  		
								}
					  	}
					  	
				  	}
				  						
			    	//Rotation
				    if(nextkeyframe.object[j].angle != undefined){
					    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
		        			set : ["angle"],
							to : [nextkeyframe.object[j].angle]
					    });
					}
					
			    	//Opacity
				    if(nextkeyframe.object[j].opacity != undefined){
					    oTimer.add(prevKeyframeTime, "transition", displayObjectMap.get(objectId), duration, {
		        			set : ["opacity"],
							to : [nextkeyframe.object[j].opacity]
					    });
					}

				
				
				}//end loop (object)
				
			}
			
		}//end loop	(keyframe)    
		
			
		oTimer.complete = function(oEvent){
			//alert("complate: " + oTimer.getRunningTime());
			//alert(_cycle);
			//alert(loop_count);
			if(isLoop){
				if(loop_count == 0 || _cycle < loop_count ){
					//oTimer.reset();
					_cycle++;
					restart();
				}
			}
		};			
		
	}		
	
	//Animation 시작
	this.startAnimation = function() {
		collie.Renderer.start();
	}	
	
	this.getPrevKeyframeTime = function(objectId, time) {
		var prevKeyframeTime = 0;
		//console.log("objectId: " + objectId + "_time: " + time);
		for(var i=this.anidata.keyframe.length-1;i>=0;i--){
			//console.log("time: " + time + "_" + this.anidata.keyframe[i].time);
			if(this.anidata.keyframe[i].time < time){
				for(var j=0;j<this.anidata.keyframe[i].object.length;j++){
					if(this.anidata.keyframe[i].object[j].id == objectId){
						prevKeyframeTime = this.anidata.keyframe[i].time; 
						//console.log("v: " + prevKeyframeTime);
						return prevKeyframeTime;
					}
				}
			}
		}
		return prevKeyframeTime;
	}
	
}

//외부 노출 함수 선언
AniPlayer.prototype = {
	//Animation Data 설정
	setData: function(data){
		//alert("data: " + data.stage.width);	
		this.anidata = data;
		this.initStage();		
		this.initObject();
		this.initTimeline();
	},
	//Animation 시작
	start: function(){
		//alert("start!!: ");	
		collie.Renderer.removeAllLayer();
		_animation_player.initStage();		
		_animation_player.initObject();
		_animation_player.initTimeline();		
		this.startAnimation();
		//restart();
	},
	//Animation 종료
	stop: function(){
		//alert("stop!!: ");	
		collie.Renderer.stop();
	},
	//AniPlayer 버전
	version: this.version
}

var restart = function() {
	//collie.Renderer.removeAllLayer();
	//_animation_player.initStage();		
	//_animation_player.initObject();
	_animation_player.initTimeline();	
}

/**
	Javascript Map
*/
var JMap = function (obj) {
    
    /* Map Data 저장 각체 */
    var mapData = (obj != null) ? cloneObject(obj) : new Object();
    
    /**
     * public
     * 지정된 key 에 해당하는 value 를 넣는다
     * @param key 키
     * @param value 값
     */
    this.put = function(key, value) {
        mapData[key] = value;
    }
    
    /**
     * public
     * 지정된 key 에 해당하는 value 를 얻는다
     * @param key 키값
     * @return 키에 해당하는 값
     */
    this.get = function(key) {
        return mapData[key];
    }
    
    /**
     * public
     * 지정된 key 를 삭제한다
     * @param key 키값
     */
    this.remove = function(key) {
        for (var tKey in mapData) {
            if (tKey == key) {
                delete mapData[tKey];
                break;
            }
        }
    }
    
    /**
     * public
     * 맵의 전체 Key 값들을 배열로 얻는다
     * @return key 값들의 Array
     */
    this.keys = function() {
        var keys = [];
        for (var key in mapData) {
            keys.push(key);
        }
        return keys;
    }
    
    /**
     * public
     * 맵의 전체 값들을 배열로 얻는다.
     * @return key 값들의 Array
     */
    this.values = function() {
        var values = [];
        for (var key in mapData) {
            values.push(mapData[key]);
        }
        return values;
    }
    
    /**
     * public
     * Map에 key 가 포함되어 있다면 true
     * @param key 키값
     * @return 키값 포함 여부
     */
    this.containsKey = function(key) {
        for (var tKey in mapData) {
            if (tKey == key) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * public
     * Map이 비어있다면 true
     * @return 맵이 비었는지의 여부
     */
    this.isEmpty = function() {
        return (this.size() == 0);
    }
    
    /**
     * public
     * Map을 비운다
     */
    this.clear = function() {
        for (var key in mapData) {
            delete mapData[key];
        }
    }
    
    /**
     * public
     * Map을 크기를 얻는다
     * @return 맵의 크기
     */
    this.size = function() {
        var size = 0;
        for (var key in mapData) {
            size++;
        }
        return size;
    }
    
    /**
     * public
     * Object 객체를 얻는다 (JSON 과 같은 외부 작업을 위해..)
     * @return 문자열
     */
    this.getObject = function() {
        return cloneObject(mapData);
    }
    
    /**
     * private
     * Object 객체를 얻는다 (JSON 과 같은 외부 작업을 위해..)
     * @return 문자열
     */
    var cloneObject = function(obj) {
        var cloneObj = {};
        for (var attrName in obj) {
            cloneObj[attrName] = obj[attrName];
        }
        return cloneObj;
    }
} // End of JMap Class
