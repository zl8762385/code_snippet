/**
 * Created by zhangliang on 16/3/15.
 */
var SETTING={
    DefaultAvatar:"logo.png",
}

$(document).ready(function(){
    jsPlumb.ready(function () {

        var TypeSet={
            "red":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#F44336"},
                HoverPaintStyle:{ strokeStyle:"#F44336", lineWidth:5 },
            },
            "yellow":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#FF9800"},
                HoverPaintStyle:{ strokeStyle:"#FF9800", lineWidth:5 }
            },
            "blue":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#2196F3"},
                HoverPaintStyle:{ strokeStyle:"#2196F3", lineWidth:5 }
            },
            "green":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#009688"},
                HoverPaintStyle:{ strokeStyle:"#009688", lineWidth:5 }
            },
            "purple":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#673AB7"},
                HoverPaintStyle:{ strokeStyle:"#673AB7", lineWidth:5 },
            },
            "black":{
                PaintStyle:{lineWidth: 2,strokeStyle:"#888"},
                HoverPaintStyle:{ strokeStyle:"#888", lineWidth:5 },
            },
        };
        var RelMenu=[
            {header: '关系'},
            {text: '<span  data-toggle="modal" data-target="#edit-modal">编辑</span>', action: function(e,selector){
                var sid = getSid(selector);
                generateForm("relation",sid);
            }},
            {text: '删除', action: function(e,selector){
                var c = getConnectionByCxtId(getSid(selector));
                plumb.detach(c);
            }},
            {text: '颜色',subMenu:[
                {text: getSubmenu('黑'), action: function(e,selector){
                    chameleon(getSid(selector),"black");
                }},
                {text: getSubmenu('红'), action: function(e,selector){
                    chameleon(getSid(selector),"red");
                }},
                {text: getSubmenu('黄'), action: function(e,selector){
                    chameleon(getSid(selector),"yellow");
                }},
                {text: getSubmenu('蓝'), action: function(e,selector){
                    chameleon(getSid(selector),"blue");
                }},
                {text: getSubmenu('绿'), action: function(e,selector){
                    chameleon(getSid(selector),"green");
                }},
                {text: getSubmenu('紫'), action: function(e,selector){
                    chameleon(getSid(selector),"purple");
                }},
            ]}
        ];
        var STORE={
            DefaultNode:{id:143,name:"角色名称",age:"年龄",desc:"人物描述",gender:"男",imgsrc:SETTING.DefaultAvatar},
            lockStorage: false,
            DefaultCO: "blue",
            avatarID: -1,
            ctrled: false,
            loaded: false,
            copy:[],
            mousePos:{},
            nodeOriginalPos:{left:0,top:0},
            beforeDrop: -1,
            saveHandle:false,
            newNodePos:{},
            isLogin:false,
            selectStart:{left:0,top:0},
            dragging:false,
            doingText:false,
        }
        //Show Message
        function showMessage(type, msg, options){
            options = options || {}
            Messenger().post({
                hideAfter: options.hideAfter || 3,
                hideOnNavigate: true,
                message: msg,
                type: type,
                showCloseButton: true
            });
        }
        //Login
        if (document.cookie && document.cookie.match(/login=.*.true/)) {
            STORE.isLogin=true;
        }
        sessionLive();

        function sessionLive(){
            $.ajax({
                type:'GET',
                url:'/do/keepLive',
                error:function(jqXHR, textStatus, error){
                    keepLive(jqXHR,textStatus,error);
                }
            });
        }
        setInterval(sessionLive,1000*60*15);
        //jsPlumb配置
        var config={
            allowLoopback: true,
            Anchor: ["Continuous", { faces:[ "bottom","right","top", "left" ] } ],
            Connector:["Straight", { curviness: 11 }],
            ConnectionOverlays: [
                [ "Arrow", {
                    location: 0.9,
                    id: "arrow",
                    width: 10,
                    length: 15,
                    foldback: 0.9
                } ],
                [ "Label", {
                    label: "关系?",
                    location: 0.4,
                    id: "label",
                    cssClass: "relationship",
                    events: {
                        click:function(labelOverlay, originalEvent) {
                            // console.log("label clicked...");
                        },
                        contextmenu:function(labelOverlay, originalEvent) {
                            // console.log(labelOverlay.component.id);
                        }
                    }
                }],
            ],
            Container: "canvas",
            Endpoint: ["Dot",{radius:10}],
            PaintStyle: TypeSet[STORE.DefaultCO].PaintStyle,
            HoverPaintStyle: TypeSet[STORE.DefaultCO].HoverPaintStyle,
            ReattachConnections: true,
            dropOptions: {
                hoverClass: "dragHover",
                over: function(event, ui){
                    $('.w').not(self.$el).droppable("disable");
                },
                out: function(event, ui){
                    $('.w').droppable("enable");
                },
            }
        };
        var plumb = jsPlumb.getInstance(config);
        for (var color in TypeSet) {
            plumb.registerConnectionType(color,TypeSet[color] || TypeSet['blue']);
        }

        window.jsp = plumb;
        //intro = introJs();
        Messenger.options = {
            extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-center',
            theme:'air',
        }
        window.localStorage.setItem("map","");

        //处理右键菜单
        $('.change-avatar').hide();
        context.init({preventDoubleContext: false});
        context.settings({compress: true});
        context.attach('body', [
            {header: '关系图'},
            {text: '<span  data-toggle="modal" data-target="#edit-modal">添加人物</span>', action: function(e,selector){
                STORE.newNodePos = STORE.mousePos;
                generateForm("node",null);
            }},
            {text: '保存',action: function(e, selector){
                saveData(true);
            }},
        ]);
        $('#save').on('click', function(){
            saveData(false);//手动保存
            STORE.saveHandle=true;
        });
        $('#export').on('click',function(){
            var relinfo = JSON.parse(window.localStorage.getItem("map"));
            var record = JSON.parse(window.localStorage.getItem("record"));

            var title = relinfo.map.name;
            var content = record[record.length-1];
            var lastedit = relinfo._edittime;
            var map={
                title: title,
                map: content,
                createtime: relinfo._createtime,
                edittime: relinfo._edittime
            }

            var blob = new Blob([JSON.stringify(map)], {type:'application/octet-stream'});
            saveAs(blob, title+'.ior' );
        });
        $('#print').bind('click',function(){
            if (window.localStorage.getItem("map")=="") {
                showMessage("error","当前没有关系图可供打印！");
                return;
            }
            var printData = $('#canvas').html();
            var bodyData = $('body').html();
            $('body').html(printData);
            window.print();
            $('body').html(bodyData);
        });
        $('#new-map').click(function(){
            generateForm("relmap",null);
        });

        $('#avatarfile').bind('change',function(){
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var files = $(this)[0].files;
                var file;
                if (files.length==1) {
                    file = files[0];
                    if (!file.type.match('image.*')) {
                        showMessage("error","图片格式不支持，请使用.png或.jpg类型");
                        return false;
                    }
                }

                $('#avatarfile').hide();
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function(tFile){
                    var $avatar = $('#avatar-crop');
                    $avatar.attr("src",tFile.target.result);
                    $('#launch-avatar').click();

                    $('#save-avatar').unbind('click').bind('click',function(){
                        var cropdata = $avatar.cropper('getData');
                        var canvas = $('#cropped-avatar')[0];
                        var context = canvas.getContext('2d');
                        context.drawImage($avatar[0],
                            cropdata.x,
                            cropdata.y,
                            cropdata.width,
                            cropdata.height,
                            0,0,100,100);
                        var udata = canvas.toDataURL("image/jpg");
                        if (udata) {
                            // $('#avatar-crop').cropper('disable');
                            $('#'+STORE.avatarID).find('.avatar > img').attr("src",udata);
                            saveData(true);
                            $('#avatar-change-modal').modal('hide');
                            //上传
                        }

                    });
                }
            }
        });
        $('#avatar-change-modal')
            .on('shown.bs.modal', function () {
                var $avatar = $('#avatar-crop');
                $avatar.cropper({
                    aspectRatio: 1 / 1,
                    autoCropArea: 0.5,
                    zoomable: false
                });
            }).on('hidden.bs.modal', function () {
            var $avatar = $('#avatar-crop');
            $avatar.cropper('destroy');
        });
        $('#login').click(function(e){
            e.preventDefault();
            $.ajax({
                type:"POST",
                url:'/do/login',
                data:{
                    'account': $("#email").val(),
                    'password': $("#password").val(),
                },
                success:function(data){
                    if(window.localStorage.user){
                        if(JSON.parse(window.localStorage.user)._id != data.result.user._id)
                            window.localStorage.clear();
                    }
                    $("#password").val("");
                    $("#page-login").modal("hide");
                    STORE.isLogin=true;
                    loadRel();
                },
                error:function(jqXHR, textStatus, error){
                    if(error == 'Forbidden'){
                        showMessage("error","邮箱或密码不正确，请重新输入");
                        $("#email").val("");
                        $("#password").val("");
                    }
                }
            });
        })
        $('#password').keydown(function(e){
            if (e.keyCode==13) {
                if ($(this).val()=="" || $('#email').val()=="") {
                    showMessage("error","密码或邮箱不能为空");
                    return;
                }
                $('#login').click();
            }
        })
        $('#page-login').on('hidden.bs.modal',function(e){
            if (!STORE.isLogin) {
                $('#page-login').modal('show');
            }
        });
        $('#edit-modal').on('hidden.bs.modal',function(e){
            STORE.doingText=false;
        });
        $('#edit-modal').on('show.bs.modal',function(e){
            STORE.doingText=true;
        });

        //撤销
        $(document).keydown(function(e){
            if (!STORE.doingText) {
                if (e.keyCode == 91 || e.keyCode == 17) {
                    STORE.ctrled=true;
                }
                if (e.keyCode==90 && STORE.ctrled) {//CTRL+Z
                    loadData(true,null);
                }
                if (e.keyCode==46) {//DELETE
                    $('.wfocus').each(function(){
                        plumb.remove($(this).attr('id'));
                    });
                    saveData(true);
                }
                if (e.keyCode==8) {
                    if ($(e.target)[0].tagName=="BODY") {
                        $('.wfocus').each(function(){
                            plumb.remove($(this).attr('id'));
                        });
                        saveData(true);
                        e.preventDefault();
                    }
                }
                if (e.keyCode==67 && STORE.ctrled) {//CTRL+C
                    $('.wfocus').each(function(){
                        var data = getNodeData($(this).attr('id'));
                        data.pos = $(this).offset();
                        STORE.copy.push(data);
                    });
                }
                if (e.keyCode==86 && STORE.ctrled) {//CTRL+V
                    $('.wfocus').each(function(){
                        $(this).removeClass('wfocus');
                    });
                    var copy = STORE.copy;
                    for (var i = 0; i < copy.length; i++) {
                        copy[i].id = uniqueId();
                        var chdata = new CharacterNode(copy[i]);
                        chdata.generateHTML(id);
                        copy[i].pos.left = copy[i].pos.left+50;
                        copy[i].pos.top = copy[i].pos.top+50;
                        newNode(chdata,copy.length==1?STORE.mousePos:copy[i].pos);
                    }
                    saveData(true);
                }

                if (e.keyCode==65 && STORE.ctrled) {//CTRL+A
                    $('.w').each(function(){
                        $(this).addClass('wfocus');
                    });
                }
            }
        }).keyup(function(e){
            if (e.keyCode == 91 || e.keyCode == 17) {
                STORE.ctrled=false;
            }
        }).mousemove(function(e){
            STORE.mousePos={left:e.pageX,top:e.pageY};
        });
        $('#canvas').bind('mousedown',function(e){
            $('body>.dropdown-menu').each(function(){
                $(this).css({'display':'none'});
            });
            if (!STORE.dragging && $.find('#selection').length==0 &&$.find('.w:hover').length==0) {
                var div = "<div id='selection'></div>";
                $(this).append($(div));
                STORE.selectStart = {left:e.pageX,top:e.pageY};
                $('#selection').css({'position':'absolute','left':e.pageX,'top':e.pageY});
            }
        }).bind('mousemove', function(e){
            if (!STORE.dragging && $.find('#selection')!=0) {
                $(this).data('move','true');
                var width = e.pageX-STORE.selectStart.left;
                var height = e.pageY-STORE.selectStart.top;
                var left=STORE.selectStart.left,top=STORE.selectStart.top;
                if (width < 0) {
                    left += width;
                }
                if (height < 0) {
                    top += height;
                }
                $('#selection').css({'width':Math.abs(width),'height':Math.abs(height),'left':left,'top':top});
                $('.w').each(function(){
                    var offset = $(this).offset();
                    var isIn = isInSelection(e,$(this));
                    if ($(this).hasClass('wfocus') && !isIn) {
                        $(this).removeClass('wfocus');
                    }
                    if (!$(this).hasClass('wfocus') && isIn) {
                        $(this).addClass('wfocus');
                    }
                })
            }
        }).bind('mouseup', function(e){
            if ($.find('#selection')!=0) {
                $('#selection').remove();
                if ($(this).data('move')=='true') {
                    $(this).data('move','false');
                }else {
                    $('.wfocus').each(function(){
                        $(this).removeClass('wfocus');
                    });
                }
                console.log("CON UP");
            }
        })

        function isInSelection(e,div){
            var width = div.width(),height=div.height(),offset=div.offset();
            var wcenter = {x:offset.left+width/2,y:offset.top+height/2};
            var scenter = {x:(e.pageX+STORE.selectStart.left)/2,y:(e.pageY+STORE.selectStart.top)/2};
            var wdh = (width+Math.abs(e.pageX-STORE.selectStart.left))/2;
            var hgt = (height+Math.abs(e.pageY-STORE.selectStart.top))/2;
            if (Math.abs(wcenter.x - scenter.x) < wdh && Math.abs(wcenter.y - scenter.y)<hgt) {
                return true;
            }else {
                return false;
            }
        }

        plumb.bind('connection', function(info){
            context.attach('._jsPlumb_connector', RelMenu);
            context.attach('.relationship', RelMenu);
            // console.log(info.connection);
            $('.relationship').css({visibility:'visible'});
            var sel = getSelFromConId(info.connection.id);
            sel.bind('keydown',function(e){
                if (e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                };
            });
            sel.bind('blur',function(e){
                STORE.doingText=false;
                if ($(this).html()=="") {
                    showMessage("error","关系名不能为空");
                    $(this).html($(this).attr('title'));
                    return false;
                }
                setLabelOverlay($(this).attr('id'),$(this).html());
                $(this).attr('contenteditable',"false");
                saveData(true);
            });
            sel.bind('dblclick',function(){
                console.log(1111, this);
                STORE.doingText=true;
                $(this).attr('contenteditable',"true");
                $(this).attr('title',$(this).html());
                $(this).focus();
                if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
                {
                    console.log("dbl");
                    var range = document.createRange();
                    range.selectNodeContents($(this)[0]);
                    range.collapse(false);
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                else if(document.selection)//IE 8 and lower
                {
                    var range = document.body.createTextRange();
                    range.moveToElementText(this);
                    range.collapse(false);
                    range.select();
                }
                document.execCommand('selectAll', false, false);
            });

            var dragging=null;//正在拖拽的节点
            var startPoint;//开始坐标
            var labelLocation;//开始时label的位置
            sel.on('mousedown',function(e){//
                if ($(e.target).hasClass('relationship')) {
                    STORE.dragging=true;
                    dragging = $(e.target);
                    startPoint = {left:e.screenX,top:e.screenY};
                    labelLocation=getConnectionByCxtId(dragging.attr('id')).getOverlays()[1].getLocation();
                }
            }).on('mousemove',function(e){
                if (dragging!=null) {
                    var c = getConnectionByCxtId(dragging.attr('id'));
                    var start=$(c.endpoints[0].canvas).offset();
                    var end = $(c.endpoints[1].canvas).offset();
                    var overlay = c.getOverlays()[1];
                    if (Math.abs(end.left-start.left) > Math.abs(end.top-start.top)) {
                        var location = (e.screenX-startPoint.left)/(end.left-start.left)+labelLocation;
                    }else {
                        var location = (e.screenY-startPoint.top)/(end.top-start.top)+labelLocation;
                    }

                    location = location>0.9 ? 0.9 : location;
                    location = location<0.1 ? 0.1 : location;
                    overlay.setLocation(location);
                    if (e.pageX < 10 || e.pageY < 10) {
                        $('#canvas').trigger('mouseup');
                    }
                }
            }).on('mouseup',function(){
                if (dragging != null) {
                    dragging=null;
                    STORE.dragging=false;
                    saveData(true);
                }
            });
            saveData(true);
        });
        plumb.bind('beforeDrop', function (info) {
            //无法自己连接自己
            console.log("beforeDrop...");
            if (info.sourceId == info.targetId) {
                STORE.beforeDrop=0;
                return false;
            }else {
                STORE.beforeDrop=1;
                return true;
            }
        });

        plumb.bind('connectionDetached', function(info){
            console.log('connectionDetached...');
            saveData(true);
        });
        plumb.bind('connectionDrag',function(con){
            console.log('connectionDrag...');
            if (con.suspendedElementId) {
                STORE.dragging = true;
            }
            var color = con.getPaintStyle().strokeStyle;
            plumb.importDefaults({
                // PaintStyle:TypeSet[color].PaintStyle,
                // HoverPaintStyle:TypeSet[color].HoverPaintStyle,
            });
        });
        plumb.bind('connectionDragStop',function(con){
            console.log('connectionDragStop...');
            if (STORE.dragging) {
                STORE.dragging = false;
                return;
            }

            if (STORE.beforeDrop==-1) {
                STORE.DefaultNode.id=uniqueId();
                var cnode = new CharacterNode(STORE.DefaultNode);
                var pos = {left:STORE.mousePos.left-50+$('#canvas').scrollLeft(),top:STORE.mousePos.top-100+$('#canvas').scrollTop()}
                newNode(cnode,pos);
                var c = plumb.connect({
                    source: con.sourceId,
                    target: STORE.DefaultNode.id,
                    paintStyle:TypeSet[STORE.DefaultCO].PaintStyle,
                    hoverPaintStyle:TypeSet[STORE.DefaultCO].HoverPaintStyle,
                });
                saveData(true);
            }else {
                STORE.beforeDrop=-1;
            }
            plumb.importDefaults({
                PaintStyle:TypeSet[STORE.DefaultCO].PaintStyle,
                HoverPaintStyle:TypeSet[STORE.DefaultCO].HoverPaintStyle,
            });
        });
        //通过jsPlumb初始化节点
        function initNode(el) {
            plumb.draggable(el,{
                start: function(e,ui){
                    // alert("tt");
                },
                drag: function(e,ui){
                    // console.log(ui);
                },
                stop: function(e,ui){
                    // console.log(e);
                    // console.log(ui);//$(ui.helper)
                    $('#canvas').scrollLeft(ui.position.left);
                    $('#canvas').scrollTop(ui.position.top);
                },
                revert: function(socketObj){

                },
            });//使可拖拽
            plumb.makeSource(el, {
                filter: ".ep",
                Anchor: ["Continuous"],
                maxConnections: 10,
                onMaxConnections: function (info, e) {
                    showMessage("error","已达最大连接数 ("+info.maxConnections+")");
                },
            });

            plumb.makeTarget(el, {
                dropOptions: {
                    hoverClass: "dragHover",

                },
                Anchor: ["Continuous"],
            });

            //节点
            context.attach('.w', [
                {header: '人物'},
                {text: '<span  data-toggle="modal" data-target="#edit-modal">编辑</span>', action: function(e,selector){
                    generateForm("node",selector.attr('id'));
                }},
                {text: '删除', action: function(e,selector){
                    plumb.remove(selector.attr('id'));
                    saveData(true);
                    e.preventDefault();
                }},
                {text: '<span onclick="avatarfile.click()">头像</span>',action:function(e,selector){
                    STORE.avatarID = selector.attr('id');
                }}
            ]);
            el.bind('dblclick',function(e){
                $('#edit-modal').modal('show');
                generateForm("node",$(this).attr('id'));
            }).bind('click',function(e){
                $('.w').each(function(){
                    if (!STORE.ctrled) {
                        if ($(this).hasClass('wfocus')) {
                            $(this).removeClass('wfocus');
                        }
                    }
                });
                $(this).addClass('wfocus');
                return false;
            }).bind('mousedown',function(e){
                $(this).data('mousedown','true');
            }).bind('mousemove',function(e){
                if ($(this).hasClass('wfocus') && $(this).data('mousedown')=="true") {
                    if (STORE.nodeOriginalPos.left==0) {
                        STORE.nodeOriginalPos = $(this).offset();
                        $('.wfocus').each(function(){
                            $(this).data("left",$(this).offset().left+"");
                            $(this).data("top",$(this).offset().top+"");
                        });
                    }else {
                        var offL = $(this).offset().left-STORE.nodeOriginalPos.left;
                        var offT = $(this).offset().top-STORE.nodeOriginalPos.top;
                        $('.wfocus').each(function(){
                            var left = parseFloat($(this).data("left"))+offL;
                            var top = parseFloat($(this).data("top"))+offT;
                            if (top < 0 || left < 0) {

                            }else {
                                $(this).css({"left":left,"top":top});
                            }
                            plumb.repaint($(this));
                        });
                    }
                }
            }).bind('mouseup',function(e){
                if ($(this).hasClass('wfocus') && $(this).data('mousedown')=="true"){
                    //saveData(true);
                    STORE.nodeOriginalPos.left=0;
                }
                $(this).data('mousedown','false');
                console.log("Mouse Up");
                saveData(true);
            });
        };

        function getConnectionByCxtId(id){
            var tmp = id.split('_');
            var oid = "con_"+(parseInt(tmp[tmp.length-1])-1);
            return getConnectionById(oid);
        }
        function getSelFromConId(id){
            var tmp = id.split('_');
            var cid = "jsPlumb_2_"+(parseInt(tmp[tmp.length-1])+1);
            return $('#'+cid);
        }
        //编辑关系标签
        function getConnectionById(conn_id){
            var conns = plumb.getConnections();
            for (var i = 0; i < conns.length; i++) {
                if (conns[i].id == conn_id) {
                    return conns[i];
                }
            }
            return null;
        }
        function setLabelOverlay(cxt_id,txt){
            var connection = getConnectionByCxtId(cxt_id);
            connection.getOverlay("label").setLabel(txt);
        }
        function chameleon(sid,color){
            var c = getConnectionByCxtId(sid);
            c.setPaintStyle(TypeSet[color].PaintStyle);
            c.setHoverPaintStyle(TypeSet[color].HoverPaintStyle);
            saveData(true);
        }
        function getSid(selector){
            if (selector.hasClass('relationship')) {
                return selector.context.id;
            }else {
                return selector.next()[0].id;
            }
        }
        function getSubmenu(color){
            var colors={
                "红":"red",
                "黑":"black",
                "黄":"yellow",
                "绿":"green",
                "紫":"purple",
                "蓝":"blue",
            };
            return color+'&nbsp;&nbsp;&nbsp;<span style="background-color:'+colors[color]+'">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
        }

        //创建节点
        function newNode(cnode,offset){
            if ($('#suggest')) {
                $('#suggest').remove();
            }
            var $div = cnode.generateNode(offset);
            $('#canvas').append($div);
            cnode.generateHTML(cnode.getID());
            var el = plumb.getSelector($div[0]);
            initNode(el);
        }

        function generateForm(type,id){
            var $title = $('#edit-title');
            var $body = $("#edit-body");
            $body.empty();
            switch (type) {
                case "relation":
                {
                    $title.html("编辑关系");
                    var div ='<form class="form-horizontal">\
            <div class="form-group">\
              <label class="col-sm-3 control-label">名称</label>\
              <div class="col-sm-9">\
                <input type="text" id="edit-rel-name" class="form-control" placeholder="关系名称">\
              </div>\
            </div>\
            </form>';
                    $body.append($(div));
                    var tmp = id.split('_');
                    var oid = "con_"+(parseInt(tmp[tmp.length-1])-1);
                    var label = getConnectionById(oid).getOverlay("label").getLabel();
                    $('#edit-rel-name').val( label == '关系?' ? "" : label );
                    $('#edit-save').unbind('click').bind('click',function(e){
                        var conn_id = oid;
                        setLabelOverlay(id,$('#edit-rel-name').val());
                        saveData(true);
                        $('#edit-modal').modal('hide');
                    });
                }
                    break;
                case "relmap":
                {
                    $title.html("新建关系图");
                    var div ='<form class="form-horizontal">\
              <div class="form-group">\
                <label class="col-sm-3 control-label">名称</label>\
                <div class="col-sm-9">\
                  <input type="text" id="edit-map-name" class="form-control" placeholder="关系图名称">\
                </div>\
              </div>\
              </form>';
                    $body.append($(div));
                    $('#edit-map-name').keydown(function(e){
                        if (e.keyCode==13) {
                            $('#edit-save').click();
                            return false;
                        }
                    });
                    $('#edit-save').unbind('click').bind('click',function(e){
                        var mapname = $('#edit-map-name').val();
                        if (mapname=="") {
                            showMessage("error","关系图名称不能为空");
                            return;
                        }
                        addRel(mapname);
                        $('#edit-modal').modal('hide');
                    });
                }
                    break;
                case "node":
                {
                    var div='<form class="form-horizontal">\
              <div class="form-group">\
                <label class="col-sm-3 control-label">姓名</label>\
                <div class="col-sm-9">\
                  <input type="text" id="edit-name" class="form-control" placeholder="姓名">\
                </div>\
              </div>\
              <div class="form-group">\
                <label class="col-sm-3 control-label">年龄</label>\
                <div class="col-sm-9">\
                  <input type="number"  min="0" step="10" id="edit-age" class="form-control" placeholder="年龄">\
                </div>\
              </div>\
              <div class="form-group">\
                <label class="col-sm-3 control-label">性别</label>\
                <div class="col-sm-9">\
                  <label class="radio-inline">\
                    <input type="radio" name="edit-gender" id="edit-male" value="男" checked> 男\
                  </label>\
                  <label class="radio-inline">\
                    <input type="radio" name="edit-gender" id="edit-female" value="女"> 女\
                  </label>\
                </div>\
              </div>\
              <div class="form-group">\
                <label class="col-sm-3 control-label">简介</label>\
                <div class="col-sm-9">\
                  <textarea class="form-control" rows="3" placeholder="人物小传，不超过30字" id="edit-desc"></textarea>\
                </div>\
              </div>\
            </form>';
                    $body.append($(div));
                    if (id != null) {//edit
                        $title.html("编辑人物");
                        var cdata = getNodeData(id);
                        $('#edit-body').find('#edit-name').first().val(cdata.name == '角色名称' ? '':cdata.name );
                        $('#edit-body').find('#edit-age').first().val( cdata.age );
                        $('input:radio[value="'+cdata.gender+'"]').attr('checked',"true");
                        // var gen= $('input[name="edit-gender"]:checked').val();//
                        $('#edit-body').find('#edit-desc').first().val(cdata.desc == '人物描述' ? '' : cdata.desc);
                    }else {//new
                        $title.html("新建人物");
                        $('#edit-body').find('#edit-age').first().val('');
                    }

                    $('#edit-save').unbind('click').bind('click',function(e){
                        var data={name:"",age:0,gender:"男",desc:"",id:(id == null?uniqueId():id),imgsrc:""}
                        data.name = $('#edit-name').val();
                        data.age = $('#edit-age').val();
                        data.gender = $('input[name="edit-gender"]:checked').val();
                        data.desc = $('#edit-desc').val();
                        if (data.desc.length > 30) {
                            showMessage("error","简介太长了");
                            $('#edit-desc').focus();
                            return;
                        }
                        if (parseInt(data.age) < 0) {
                            showMessage("error","年龄不能为负");
                            return;
                        }
                        if (data.name=="") {
                            showMessage("error","角色名字不可为空");
                            $('#edit-name').focus();
                            return;
                        }else if (data.age=="") {
                            showMessage("error","角色年龄必须为数字且不可为空");
                            $('#edit-age').focus();
                            return;
                        }
                        $('#edit-modal').modal('hide');
                        if (id != null) {
                            if (cdata.imgsrc=="") {
                                data.imgsrc =SETTING.DefaultAvatar;
                            }else {
                                data.imgsrc = cdata.imgsrc;
                            }
                            var chdata = new CharacterNode(data);
                            chdata.generateHTML(id);
                        }else {
                            data.imgsrc = SETTING.DefaultAvatar;
                            var chdata = new CharacterNode(data);
                            chdata.generateHTML(id);
                            newNode(chdata,STORE.newNodePos);
                        }
                        saveData(true);
                    });
                }
                    break;
                default://confirm
                {
                    $title.html("删除关系图");
                    var div = '<form class="form-horizontal">\
            <div class="form-group">\
            <h4 class="col-sm-offset-1 col-sm-10">确认删除此关系图吗？</h4>\
            </div>\
            </form>';
                    $body.append($(div));
                    $('#edit-save').unbind('click').bind('click',function(e){
                        $('#'+id).remove();
                        deleteRel(id);
                        $('#edit-modal').modal('hide');
                    });
                }
                    break;
            }
        }

        function saveData(isAuto){
            if (STORE.lockStorage) {
                return;//数据上锁，防止在回退或清空当前关系图时保存变动
            }
            var con = plumb.getConnections();
            var nodeList = $('#canvas').children('.w');
            var rel={name:"",nodes:[],connections:[]};
            for (var i = 0; i < nodeList.length; i++) {
                var node={id:"",name:"",age:0,gender:"",imgsrc:"",desc:"",offset:""};
                node.id = $(nodeList[i]).attr('id');
                node.name= $(nodeList[i]).children('.name').first().html();
                node.age= $(nodeList[i]).find('.age').first().html();
                node.gender = $(nodeList[i]).find('.gender').first().html();
                node.desc = $(nodeList[i]).find('.desc').first().html();
                node.imgsrc = $(nodeList[i]).find('img').first().attr('src');
                node.offset = {top:$(nodeList[i]).offset().top+$('#canvas').scrollTop(),left:$(nodeList[i]).offset().left+$('#canvas').scrollLeft()};
                rel.nodes.push(node);
            }
            for (var i = 0; i < con.length; i++) {
                var connection = {source:"",target:"",label:"",type:"",location:0.5}
                connection.source = con[i].sourceId;
                connection.label = con[i].getOverlay("label").getLabel();
                connection.target = con[i].targetId;
                connection.type = con[i].getPaintStyle().strokeStyle;
                connection.location=con[i].getOverlays()[1].getLocation();
                rel.connections.push(connection);
            }
            var relinfo = JSON.parse(window.localStorage.getItem("map"));
            var record = JSON.parse(window.localStorage.getItem("record"));
            if (record && record[record.length-1]!=JSON.stringify(rel)) {
                rel.name = relinfo.map.name;
                record.push(rel);
                window.localStorage.setItem("record",JSON.stringify(record));

                updateRel(relinfo._id,rel);
                relinfo.map = rel;
                window.localStorage.setItem("map",JSON.stringify(relinfo));
            }
        }

        function loadData(revert, obj){//revert 后退
            loading(true);
            var relinfo=null;
            var map=null;
            if (revert) {
                relinfo = JSON.parse(window.localStorage.getItem("map"));
                var record = JSON.parse(window.localStorage.getItem("record"));
                if (record.length > 1) {
                    STORE.lockStorage=true;
                    plumb.detachEveryConnection();
                    plumb.deleteEveryEndpoint();
                    $('#canvas').empty();
                    record.pop();

                    map = record[record.length-1];
                    relinfo.map = map;
                    window.localStorage.setItem("map",JSON.stringify(relinfo));
                    window.localStorage.setItem("record",JSON.stringify(record));
                    updateRel(relinfo._id,map);
                }else {
                    showMessage("error","没有更多历史");
                    return;
                }
            }else {
                relinfo = obj;
                var record = new Array();
                window.localStorage.setItem("map",JSON.stringify(relinfo));
                record.push(relinfo.map);
                window.localStorage.setItem("record",JSON.stringify(record));

                STORE.lockStorage=true;
                map = relinfo.map;
            }

            if (map && map.nodes) {
                for (var i = 0; i < map.nodes.length; i++) {
                    var mnd = map.nodes[i];
                    var cnode = new CharacterNode(mnd);
                    newNode(cnode,map.nodes[i].offset);
                }
                if (map.connections) {
                    for (var i = 0; i < map.connections.length; i++) {
                        var c = plumb.connect({
                            source: map.connections[i].source,
                            target: map.connections[i].target,
                            paintStyle:TypeSet[map.connections[i].type] ? TypeSet[map.connections[i].type].PaintStyle : TypeSet['blue'].PaintStyle,
                            hoverPaintStyle:TypeSet[map.connections[i].type] ? TypeSet[map.connections[i].type].HoverPaintStyle : TypeSet['blue'].HoverPaintStyle,
                        });
                        c.getOverlay("label").setLabel(map.connections[i].label);
                        var loc = parseFloat(map.connections[i].location)
                        c.getOverlays()[1].setLocation(loc);
                    }
                }
            }
            STORE.lockStorage=false;
            if ($('#canvas').children().length == 0) {
                // 默认添加一个 角色 并附加 基本使用提示，e.g 拖拽图中小黄点直接添加并链接新角色
                STORE.DefaultNode.id = uniqueId();
                var chdata = new CharacterNode(STORE.DefaultNode);
                chdata.generateHTML(null);
                var position = {'top':$(window).height()*0.3,'left':$(window).width()*0.4};
                newNode(chdata,position);
                showMessage("info","提示：拖动小黄点以添加新人物", {hideAfter:5});

                //showIntro();
            }
            loading(false);
        }

        function showIntro(){
            var isIntro = window.localStorage.getItem("intro");
            if (!isIntro) {
                window.localStorage.setItem("intro","done");
                intro.setOptions({
                    steps:[
                        {
                            element:$('.w').first()[0],
                            intro:
                            '<h4>使用技巧：</h4>'+
                            '<ul>'+
                            '<li><b>双击人物，可以打开编辑窗口</b></li>'+
                            '</ul>',
                            position: $(window).width() < 1001 ? 'floating' : 'left'
                        },
                        {
                            element:$('.w').first().find('.ep').first()[0],
                            intro:
                            '<h4>使用技巧：</h4>'+
                            '<ul>'+
                            '<li><b>点击黄点，并拖到空白处可创建新的人物</b></li>'+
                            '</ul>',
                            position: $(window).width() < 1001 ? 'floating' : 'left'
                        },
                    ],
                    prevLabel:"上一项",
                    nextLabel:"下一项",
                    skipLabel:"退出帮助",
                    doneLabel:"知道了！"
                });
                intro.start();
            }
        }

        function addRel(mapname){
            $.ajax({
                type:'POST',
                url:'/db/relation',
                data:{
                    map : { name: mapname}
                },
                success:function(data) {
                    var $ul = $('#dashboard').children('ul').first();
                    var rel = data.result;
                    var li = "<li id='"+rel._id+"' class='list-group-item rel-title'>\
              <span class='badge delete-rel'>删除</span>\
              <span>#</span>\
              <span class='rel-name' contenteditable='true'>"+rel.map.name+"</span>\
              <p>"+modifyTime(rel._edittime)+"编辑</p>\
          </li>";
                    $ul.append(li);
                    bindRelMenu();
                    if ($('.rel-title').length==1) {
                        loadRelById(rel._id);
                    }
                    showMessage("success",rel.map.name+"创建成功");
                }
            })
        }
        function deleteRel(id){
            loading(true);
            $.ajax({
                type:'DELETE',
                url:'/db/relation',
                data:{
                    where: {
                        _id: id, permanent : true
                    }
                },
                success:function(data){
                    loading(false);
                }
            });
            var relinfo = JSON.parse(window.localStorage.getItem("map"));
            if (relinfo && id == relinfo._id) {
                STORE.lockStorage=true;
                plumb.detachEveryConnection();
                plumb.deleteEveryEndpoint();
                $('#canvas').empty();
                STORE.lockStorage=false;
                window.localStorage.setItem("map","");

                var rels = $('.rel-title');
                if (rels.length > 0) {
                    loadRelById(rels.first().attr('id'));
                }
            }
        }
        function updateRel(id,data){
            if (STORE.saveHandle) {
                loading(true);
            }
            $.ajax({
                type:'PUT',
                url:'/db/relation',
                data:{
                    where: {_id: id},
                    data: {
                        map: data
                    }
                },
                error:function(){
                    showMessage("error","保存失败，请检查网络是否连接！");
                },
                success:function(data){
                    loading(false);
                    if (STORE.saveHandle) {
                        STORE.saveHandle=false;
                        showMessage("success","保存成功！");
                    }
                }
            });
        }
        function loadRel(){
            $.ajax({
                type:'GET',
                url: '/db/relationlists',
                data : {
                    limit: 30, // result number limit
                    skip : 0, // load from 0
                    digest:true // no map content return
                },
                error:function(){
                    showMessage("error","加载失败，请检查网络是否连接！");
                },
                success: function(data){
                    if (data.result.length>0) {
                        data.result.sort(function(rela,relb){
                            return rela._edittime < relb._edittime;
                        });
                        var $ul = $('#dashboard').children('ul').first();
                        var listContent = '';
                        for (var i = 0; i < data.result.length; i++) {
                            var rel = data.result[i];
                            var tm = modifyTime(rel._edittime);
                            var li = "<li id='"+rel._id+"' class='list-group-item rel-title'>\
                <span class='badge delete-rel'>删除</span>\
                <span>#</span>\
                <span class='rel-name' contenteditable='true'>"+rel.name+"</span>\
                <p>"+tm+"编辑</p>\
              </li>";
                            listContent += li;
                        }
                        $ul.html(listContent);
                        bindRelMenu();
                        loadRelById(data.result[0]._id)
                    }else {
                        addRel("未命名");
                    }
                }
            })
        };
        function loadRelById(id){
            var relinfo = window.localStorage.getItem("map");
            $('.rel-title').each(function(){
                if ($(this).attr('id') == id) {
                    $(this).addClass('active');
                }else {
                    if ($(this).hasClass('active')) {
                        $(this).removeClass('active');
                    }
                }
            });
            if (relinfo) {
                if (id != JSON.parse(relinfo)._id) {
                    STORE.lockStorage=true;
                    plumb.detachEveryConnection();
                    plumb.deleteEveryEndpoint();
                    $('#canvas').empty();
                    STORE.lockStorage=false;
                }else {
                    return;
                }
            }
            STORE.loaded=false;
            $.ajax({
                type:'GET',
                url:'/db/relation',
                data:{
                    where: {_id: id}
                },
                success:function(data){
                    loadData(false,data.result);
                }
            });
        }

        function modifyTime(tm){
            var tmf = new Date(parseInt(tm)).toLocaleString();
            var tms = tmf.split(' ');
            var dates = tms[0].split('/');
            var clocks = tms[1].split(':');

            var cur = new Date().toLocaleString();
            var cur_tms=cur.split(' ');

            var date;
            if (tms[0] == cur_tms[0]) {
                date = "今天";
            }else {
                if (parseInt(cur_tms[0].split('/')[2])==parseInt(dates[2])+1) {
                    date = "昨天";
                }else {
                    date = dates[1]+"月"+dates[2]+"日";
                }
            }

            return date+" "+clocks[0]+":"+clocks[1]+" ";
        }
        function bindRelMenu(){
            $('.rel-title').unbind('click').bind('click',function(){
                var id = $(this).attr('id');
                loadRelById(id);
            });
            $('.delete-rel').unbind('click').bind('click',function(e){
                $('#edit-modal').modal('show');
                var id = $(this).parent().attr('id');
                generateForm("del-rel",id);
                return false;
            });
            $('.rel-name').unbind('keydown').bind('keydown',function(e){
                if (e.keyCode == 13) {
                    e.preventDefault();
                    $(this).blur();
                };
            }).unbind('blur').bind('blur',function(e){
                STORE.doingText=false;
                if ($(this).text()=="") {
                    $(this).html($(this).attr('title'));
                }else{
                    var relinfo = JSON.parse(window.localStorage.getItem("map"));
                    relinfo.map.name = $(this).text();
                    updateRel($(this).parent().attr('id'),relinfo.map);
                    window.localStorage.setItem("map",JSON.stringify(relinfo));
                }
            }).unbind('dblckick').bind('dblclick',function(e){
                $(this).attr('title',$(this).html());
                STORE.doingText=true;
            });
        }

        if (STORE.isLogin) {
            loadRel();

            // Canvas movable

            // var $panzoom = $('.panzoom').panzoom({contain: false});
            // $panzoom.on('mousewheel.focal', function( e ) {
            //   e.preventDefault();
            //   var delta = e.delta || e.originalEvent.wheelDelta;
            //   var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
            //   $panzoom.panzoom('zoom', zoomOut, {
            //     increment: 0,
            //     animate: false,
            //     focal: e,
            //   });
            // });

        }

        function loading(open){
            if (open) {
                if ($('#loading').children().length>0) {
                    return;
                }
                var loader={
                    width: 200,
                    height: 200,
                    tepsPerFrame: 6,    // best between 1 and 5
                    trailLength: 0.9,    // between 0 and 1
                    pointDistance: 0.01, // best between 0.01 and 0.05
                    fillColor: '#66D9EF',
                    path: [
                        ['arc', 100, 100, 70, 0, 360]
                    ],
                    step: function(point, index, frame) {
                        var sizeMultiplier = 7;
                        this._.beginPath();
                        this._.moveTo(point.x, point.y);
                        this._.arc(
                            point.x, point.y,
                            index * sizeMultiplier, 0,
                            Math.PI*2, false
                        );
                        this._.closePath();
                        this._.fill();
                    }
                };
                var sonic = new Sonic(loader);
                $('#loading').append(sonic.canvas);
                sonic.play();
            }else {
                $('#loading').empty();
            }
        }
        function keepLive(jqXHR, textStatus, error){
            if(error == 'Forbidden' && jqXHR.responseText.match('session')){
                showMessage("error","您的登录超时，请重新登录");
                $('#page-login').modal('show');
            }
        }
    });
});

function getNodeData(id){
    var node = $('#'+id);
    var name = node.children('.name').first().html();
    var age = node.find('.age').first().html();
    var gender = node.find('.gender').first().html();
    var desc = node.find('.desc').first().html();
    var imgsrc = node.find('img').first().attr('src');
    return {id:id,name:name,age:age,gender:gender,desc:desc,imgsrc:imgsrc};
}

function CharacterNode(data){
    if (data.id) {
        self.id = data.id;
    }
    self.name = data.name;
    self.age = data.age;
    self.gender = data.gender;
    self.desc = data.desc;
    self.imgsrc = data.imgsrc;
}

CharacterNode.prototype.getID = function(){
    return self.id;
}

CharacterNode.prototype.generateHTML = function (id) {
    var selector = $('#'+id);
    selector.find('.name').first().html(self.name);
    selector.find('.age').first().html(self.age);
    selector.find('.gender').first().html(self.gender);
    var $img = selector.find('img').first();
    if ($img.attr('src')=="") {
        $img.attr('src',SETTING.DefaultAvatar);
    }else{
        $img.attr("src",self.imgsrc);
    }
    selector.find('.desc').first().html(self.desc);
};

CharacterNode.prototype.generateNode = function(offset){
    if (!self.id) {
        self.id = uniqueId();
    }
    var div = '<div class="w _jsPlumb_connected jsplumb-draggable jsplumb-droppable" id="'+self.id+'">\
    <p class="avatar">\
      <img src="'+self.imgsrc+'" width="71" height="71">\
    </p>\
    <p class="name"></p>\
    <p class="info">\
      <span class="age"></span>\
      <span>，</span>\
      <span class="gender"></span>\
    </p>\
      <p class="desc">'+self.desc+'</p>\
      <div class="ep"></div>\
  </div>';
    return $(div).css({'top':parseFloat(offset.top),'left':parseFloat(offset.left)});
}

function uniqueId() {
    var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
    do {
        var ascicode = Math.floor((Math.random() * 42) + 48);
        if (ascicode < 58 || ascicode > 64) {
            idstr += String.fromCharCode(ascicode);
        }
    } while (idstr.length < 32);
    return (idstr);
}