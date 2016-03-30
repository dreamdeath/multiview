var buttons = [];
var focusedItemIndex;

function initKeys() {
    console.log("Initializing key...");

    var am = window.oipfObjectFactory.createApplicationManagerObject();
    var app = am.getOwnerApplication(window.document);
    var aKeySet = app.privateData.keyset;
    var keySet = (aKeySet.NAVIGATION);

    aKeySet.setValue(keySet);
    app.onKeyDown = keyDownEventReceived;
    window.document.addEventListener("keydown", keyDownEventReceived)
    app.show();
    app.activateInput(true);
}

function init() {
    initKeys();
    var menu = document.getElementById('menu');
                        
    for(i = 0; i < 2; i++) {
        var b = document.createElement("input");
        b.type = "button";
        b.value = "CH" + ((i==0)?"-":"+");
        buttons[i] = b;
        buttons[i].onfocus = function() {this.style.background="yellow";}
        buttons[i].onblur = function() {this.style.background="white";}
        buttons[i].onclick = ((i==0)?onPrevChannel:onNextChannel);
        menu.appendChild(buttons[i]);
    }
    focusedItemIndex = 0;
    buttons[0].focus();
}

function consumeEvent(e) {
    console.log("consumeEvent: " + e);
    e.preventDefault();
    e.stopPropagation();
}

function keyDownEventReceived(e) {
    console.log("keyDownEventReceived : " + e.keyCode);
    switch(e.keyCode) {
       	case VK_ENTER :
       	case 13 :
       	    onClicked();
       	    consumeEvent(e);
       	    break;
        case VK_LEFT : 
            focusShiftLeft();
            consumeEvent(e);
            break;
        case VK_RIGHT :
            focusShiftRight();
            consumeEvent(e);
            break;
    }
}

function onClicked() {
    messageclear();
    buttons[focusedItemIndex].click();
}

function focusShiftLeft() {
    focusedItemIndex--;
    if(focusedItemIndex < 0) {
        focusedItemIndex = 0;
    }
    buttons[focusedItemIndex].focus();   
}

function focusShiftRight() {
    focusedItemIndex++;
    if(focusedItemIndex >= buttons.length) {
        focusedItemIndex = buttons.length - 1;
    }
    buttons[focusedItemIndex].focus();
}

messagelog = function(msg) {
    chmsg.innerHTML += msg + '<br>';
    console.log(msg);
}

messageclear = function() {
    chmsg.innerHTML = '';
}

var chdiv = document.getElementById('chinfo');
var chmsg = document.getElementById('chmessage');
var v = document.getElementById('content');
var cc = v.getChannelConfig();
var chlist = cc.channelList;

channelChangeError = function(evt) {
    messagelog("ChannelChangeError, channel="+evt.channel+", errorState="+evt.errorState);
}

playStateChange = function(evt) {
    messagelog("PlayStateChange, state="+evt.state+", error="+evt.error+", v.playState="+v.playState);
}

channelChangeSucceeded = function(evt) {
    messagelog("ChannelChangeSucceeded, channel="+evt.channel+", v.playState="+v.playState);
    updateChannelInfo();
}

fullScreenChange = function(evt) {
    messagelog("fullScreenChange, v.fullScreen="+v.fullScreen);
}

dumpProgrammes = function() {
    var p = v.programmes;

    messagelog("v.programmes.length="+p.length);

    for(var i = 0; i < p.length; i++) {
        messagelog('Programme['+i+']='+p[i].name+', '+p[i].startTime+', '+p[i].duration+', '+p[i].channelID);
    }
}

onNextChannel = function() {
    messageclear();
    messagelog('Next channel');
    v.nextChannel();
    updateChannelInfo();
}

onPrevChannel = function() {
    messageclear();
    messagelog('Prev channel');
    v.prevChannel();
    updateChannelInfo();
}

updateChannelInfo = function() {
    var curch = v.currentChannel;

    console.log('updateChannelInfo, curch='+curch+', CC.currentChannel='+v.getChannelConfig().currentChannel);

    if(curch != null) {
        console.log('updateChannelInfo, curch='+curch.majorChannel+curch.minorChannel+' '+curch.name);
        chdiv.innerHTML = '<h3><p align=center>CH ' + curch.majorChannel + '<br><br>' + curch.name + '</p></h3>';
    } else {
        chdiv.innerHTML = '<h3><p align=center>Unknown channel</p></h3>';
    }
}

v.addEventListener('ChannelChangeError', channelChangeError);
v.addEventListener('PlayStateChange', playStateChange);
v.addEventListener('ChannelChangeSucceeded', channelChangeSucceeded);
v.addEventListener('FullScreenChange', fullScreenChange);
v.addEventListener('ProgrammesChanged', dumpProgrammes);

if(v.bindToCurrentChannel() == null) {
    messagelog('Video is not presenting, play the 1\'st channel');
    v.setChannel(v.getChannelConfig().channelList[0]);
}
v.setFullScreen(false);

updateChannelInfo();