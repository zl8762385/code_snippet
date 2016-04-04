//剧本任务关系图
!function( $, w) {
    var story = function ( instance ) {
        //节点元素字典
        this._map = {};

        //连线点字典
        this._endpoints = {};

        //存储节点 字典
        this.node = {};

    };

    //对象操作
    var action ={
        /**
         * 节点元素的字典
         * @param object data {'wid': 节点唯一ID, 'el':节点的操作对象};
         * */
        "insert_map": function ( data ) {

            var el = data.el,
                left = el.style.left.replace('px', '')*1,
                top = el.style.top.replace('px', '')*1,
                _data = {};

            //对进来的数组重组 保持对象的一致性
            _data.wid = data.wid;//节点唯一ID
            _data.pos = [left,top];//坐标
            _data.targets = [];//目标
            _data.el = el;//元素对象

            window.story._map[ data.wid ] = _data;
        },
        /**
         * 更新MAP的 X,Y POS位置
         * */
        "update_pos_map": function (wid, pos) {
            if( !wid ) return "wid is null";

            window.story._map[wid].pos = pos;
            //console.log( window.story._map[wid].pos )
        },
        /**
         * 操作MAP 进行关联,目标和源
         * @param string sourceid 源WID
         * @param string targetid 目标WID
         * */
        "conn_node": function (sourceid, targetid) {
            if( !sourceid) return false;

            var targetid = (!targetid) ? 0 : targetid;
            window.story._map[sourceid].targets.push( targetid )
        },
        /**
         * 分离关联节点
         * @param string sourceid 源WID
         * @param string targetid 目标WID
         * */
        "detached_node": function ( sourceid, targetid ) {
            if( !sourceid) return false;

            var targets = window.story._map[sourceid].targets,
                _target = [],
                _map = window.story._map;

            //如果源==目标  表示当前是删除节点,找到所有WID相关数据 删除
            if( sourceid == targetid ) {
                for( var i in _map) {
                    var er = [];
                   for( var n in  _map[i].targets) {
                       if( _map[i].targets[n] == targetid ) continue;

                       er.push( _map[i].targets[n] );
                   }

                    _map[i].targets = er;
                }

                return true;
            }

            //对正常源 和 目标数据重组
            for( var n in targets ) {
                if( targets[n] == targetid ) continue;

                _target.push( targets[n] );
            }

            window.story._map[sourceid].targets = _target;
        },
        "save": function () {
            var map_data = window.story._map;
            console.log(map_data)
        }
    };

    //jsPlumb初始化执行数据
    var jsplumb = {
        "init": function ( _story ) {

            //基础方法
            this._story = _story;

            //连接操作对象
            this.connection();

            //双击连线操作
            this.dbclick();

            //分离节点
            this.connectionDetached();
        },
        /**
         * 分离节点
         * */
        "connectionDetached": function () {
            var self = this;
            self._story.instance.bind("connectionDetached", function (conn) {
                //console.log(conn)
                var sourceid = conn.sourceId,
                    targetid = conn.targetId;

                action.detached_node( sourceid, targetid )
                //return confirm("Delete connection?");
            });
        },
        "beforeDetach": function () {
            var self = this;

            self._story.instance.bind("beforeDetach", function (conn) {
                console.log( conn )
                //return confirm("Delete connection?");
            });

        },
        /**
         * 连接
         * */
        "connection": function () {
            var self = this;

            self._story.instance.bind( "connection", function ( rs ) {
                var sourceid = rs.sourceId,
                    targetid = rs.targetId;
                self._story._endpoints[ rs.connection.canvas.nextSibling.id ] = rs.connection;

                action.conn_node( sourceid, targetid )
                //self.instance.detach( rs.connection );
            } );
        },
        /**
         * 双击连线操作
         * */
        "dbclick": function () {
            var self = this;

            self._story.instance.bind("dbclick", function (c) {
                console.log(c)
                //清空连线
                //self.instance.detach(c);
            });
        }
    };


    //layer相关方法
    var _layer = {

        /***/
        "edit": function ( jq_object, title, type ) {
            var self = this,
                func = false;

            switch( type ) {
                case 1://关系备注
                    func = function( index ){ //或者使用btn1
                        var introduce = $('#edit_introduce').val(),
                            edit_id = $('#edit_id').val();

                        if( !introduce ) {
                            self.alert( "请输入备注内容" );
                            return ;
                        }

                        //修改数据
                        $('#'+edit_id).html( introduce );
                        layer.msg( "更新成功", {time: 1000,icon: 1});
                        layer.close(index);
                    }
                    break;
                case 2://节点
                    func = function ( index ) {
                        var introduce = $('#edit_introduce').val(),
                            edit_id = $('#edit_id').val();

                        if( !introduce ) {
                            self.alert( "请输入备注内容" );
                            return ;
                        }

                        //修改数据
                        $('#'+edit_id).find('span').html( introduce );
                        layer.msg( "更新成功", {time: 1000,icon: 1});
                        layer.close(index);
                    }
                    break;
            }

            if( !func ) {
                self.alert( "_layer: 没有相关函数" );
                return ;
            }

            layer.open({
                type: 1,
                title: title,
                shift: 2,
                area: '500px',
                shadeClose: true,
                btn: ['确定','取消'],
                content: jq_object,
                yes: func,
                cancel: function(index){ //或者使用btn2
                    return true;
                }
            });
        },
        "alert": function ( title ) {
            var title = !title ? "未知标题" : title ;
            layer.alert(title);
        }
    };


    $.extend( story.prototype, {
        /**
         * 初始化
         */
        "init": function (jsPlumb_instance ) {

            //jsPlumb 方法
            this.instance = jsPlumb_instance.instance;

            //jsPlumb 常规绑定
            jsplumb.init( this);

        },
        /**
         * 删除连线,和节点相关的连线
         * @param object selector 当前选择的操作对象
         * @param int type 类型1=备注,连线   2=节点相关所有的连线和当前节点
         * */
        "delete_context": function ( selector, type ) {

            var wid = selector.attr("id");

            switch( type ) {
                case 1://删除备注连线

                    var points = this._endpoints[ wid ];
                    this.instance.detach( points );
                    delete this._endpoints[ wid ];

                    //分离
                    action.detached_node( points.sourceId, points.targetId )

                    break;
                case 2://节点相关连线和当前节点

                    //从节点分离
                    action.detached_node( wid, wid )

                    this.instance.remove( this._map[wid].el );
                    delete this._map[ wid ];
                    break;
            }
            console.log(this._map)

        },
        "edit_context": function ( selector, type ) {
            var id = selector.context.id;

            switch( type ) {
                case 1://修改关联备注

                    var points = this._endpoints[ id ],
                        source_text = points.source.innerText,
                        target_text = points.target.innerText,
                        text = ["<b>编辑[",source_text,"&nbsp; - &nbsp;", target_text,"]的关系</b>"].join("");

                    break;
                case 2://修改节点备注
                    var text = ["<b>编辑【",selector.context.innerText,"】</b>"].join("");

                    break;

            }

            $("#edit_id").val( id );
            $("#edit_introduce").val( "" );

            window.story.layer_edit( $('#edit_view'), text, type );
        },
        /**
         * 写入MAP
         * @param string wid 节点唯一ID
         * @param object d 节点操作数据
         * */
        "insert_map": function ( wid, d ) {
            if( !wid ) return 'save: wid is null';

            var data = {'wid': wid, 'el':d};

            action.insert_map( data );
        },
        /**
         * 保存数据
         * */
        "save": function () {

            action.save();
        },
        /**
         * jsplumb常规操作
         * */
        /**
         * 关系label点击事件处理 作废
         * @param object e jsplumb
         * */
        "event_label": function(e) {

            //var source_text = e.component.source.innerText,
            //    target_text = e.component.target.innerText,
            //    id = e.canvas.id,
            //    text = ["<b>编辑[",source_text,"&nbsp; - &nbsp;", target_text,"]的关系</b>"].join("");
            //
            //$("#edit_id").val( id );
            //$("#edit_introduce").val( "" );
            //story.layer_edit( $('#edit_view'), text );
        },
        /**
         * 创建元素
         * @param  int x  
         * @param  int y      
         * @param  object value {character_id:'', character:''}
         * @return object 
         */
        "new_node": function (x, y, value) {
            var id = "wid_" + value.character_id,
                el_postion = this.new_el_postion(x,y),//新元素的x y位置
                x = (el_postion) ? el_postion.x : x ,
                d = document.createElement("div");

            //检查节点
            if( this.check_node( id ) ) return ;

            d.className = "w";
            d.id = id;
            d.innerHTML = [ '<span>',id,value.character,'</span>  <div class="ep"></div>' ].join("");
            d.style.left = x + "px";
            d.style.top = y + "px";
            d.setAttribute( "title-data", value.character );
            this.instance.getContainer().appendChild(d);
            this.init_node(d);//初始化

            //保存
            this.insert_map( id, d );
        },
        /**
         * 检查节点是否在BOX存在
         * @param string id 节点ID
         * */
        "check_node": function ( id ) {
           if(!id) {
               _layer.alert( "节点错误" );
               return ;
           }

            var title = $("#"+id).attr('title-data');
            if(title) {
                layer.msg( title+'已存在', { time: 2000, icon: 0})
                return true;
            }
        },
        /**
         * 新元素XY  position
         * @param int x
         * @param int y
         * */
        "new_el_postion": function (x,y) {
            var len = $('[id^=wid_]').length,
                x = (len+2)*x;

            return {"x":x, "y":y};
        },
        /**
         * 初始化节点
         * @param  object el 元素object
         * @return 
         */
        "init_node": function (el) {
            var self = this;

            //拖拽
            self.instance.draggable(el, {
                start: function ( e ) {
                    //console.log(e)
                },
                drag: function ( e ) {
                    //console.log(e)
                },
                stop: function ( e ) {
                    var el = e.el,
                        id = el.id;

                    //更新pos
                    action.update_pos_map( id, e.pos )
                }
            });

            //设置连接源节点
            self.make_source( el );

            //设置连接目标节点
            self.make_target( el );

            self.instance.fire("jsPlumbDemoNodeAdded", el);
        },
        /**
         * 设置连接源节点
         * @param object newid 操作对象
         * */
        "make_source": function ( newid ) {
            return this.instance.makeSource( newid, {
                filter: ".ep",
                anchor: "Continuous",
                connectorStyle: { strokeStyle: "#5c96bc", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4 },
                connectionType:"basic",
                extract:{
                    "action":"the-action"
                },
                maxConnections: 9,
                deleteEndpointsOnDetach:false,
                onMaxConnections: function (info, e) {
                    _layer.alert( "Maximum connections (" + info.maxConnections + ") reached" )
                },
                detachable:true//连接状态,可拆下 分开
            });

        },
        /**
         * 设置连接目标节点
         * @param object newid 操作对象
         * */
        "make_target": function ( newid ) {
            return this.instance.makeTarget( newid, {
                dropOptions: { hoverClass: "dragHover" },
                anchor: "Continuous",
                allowLoopback: true,
                deleteEndpointsOnDetach:false,
                endpoint:["Dot", { radius:5 }],
                paintStyle:{ fillStyle:"#ff0000"},//设置连接点的颜色
            });
        },
        /**
         * 编辑 - 弹出层
         * @param object jq_object jq对象操作
         * */
        "layer_edit": function (jq_object, title, type) {
            if(!jq_object) alert( "请提供对象" );

            var title = (!title) ? '编辑' : title ;

            _layer.edit( jq_object, title, type );
        },
        /**
         * 增加新角色 - 弹出层
         * @param object jq_object jq对象操作
         * */
        "layer_character": function () {
            var self = this;

            layer.open({
                type: 1,
                title: "添加角色",
                shift: 2,
                area: '500px',
                shadeClose: true,
                btn: ['确定','取消'],
                content: $('#add_character'),
                yes: function(index){ //或者使用btn1
                    var character_name = $('#character_name').val(),
                        id = jsPlumbUtil.uuid(),
                        obj = {"character_id": "newid_"+id, "character": character_name};

                    if( !character_name ) {
                        _layer.alert( "请输入角色名称" )
                        return ;
                    }

                    window.story.new_node(25, 10, obj);
                    layer.msg( "操作成功", {time: 1000,icon: 1});
                    layer.close(index);
                },cancel: function(index){ //或者使用btn2
                    return true;
                }
            });
        }

    } );

    w.story = new story();
}(jQuery, window);


//jsPlumb
jsPlumb.ready( function () {


    //jsPlumb默认配置文件.
    var instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 2}],
        Connector:"StateMachine",
        HoverPaintStyle: {strokeStyle: "#1e8151", lineWidth: 2 },
        ConnectionOverlays: [
            [ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            } ],
            [ "Label", {
                label: "备注",
                id: "label",
                cssClass: "aLabel wid_context",
                events:{
                    click:window.story.event_label
                }
            }]
        ],
        Container: "canvas"
    });


    //右键操作
    context.init({preventDoubleContext: false});
    context.settings({compress: true});
    context.attach('[id^=wid_],[id^=jsPlumb_]', [

        {header: '菜单'},

        {text: '编辑',  action: function(e, selector){
            e.preventDefault();

            if( selector.hasClass('wid_context') ) {
                window.story.edit_context( selector, 1 )
            } else {
                window.story.edit_context( selector, 2 )
            }

            //console.log(e)
            //console.log(selector)
        }},
        {text: '删除',  action: function(e, selector){
            e.preventDefault();

            if( selector.hasClass('wid_context') ) {
                window.story.delete_context( selector, 1 )
            } else {
                window.story.delete_context( selector, 2 )
            }
            //window.story.delete_context( selector )
        }}
    ]);

    //初始化story
    window.story.init({
        "instance": instance
    });

    //角色操作
    $( "[node-data=character] li" ).bind('click', function () {
        var character_id = $(this).attr( "v-data" ),
        character = $(this).html(),
        obj = {"character_id": character_id, "character": character};

        //创建新元素到指定区域 
        window.story.new_node(25, 10, obj);
    });

    //增加角色
    $('[action-data=add_character]').bind('click', function () {

        $('#character_name').val( "" );
        window.story.layer_character();
    });

    //保存数据
    $('[action-data=save_data]').bind('click', function () {
        window.story.save();
    });

    $('[action-data=showdata]').bind('click', function () {
        console.log( window.story._map )
    });

     //instance.batch(function () {
         //for (var i = 0; i < windows.length; i++) {
         //    initNode(windows[i], true);
         //}
         // and finally, make a few connections
         // instance.connect({ source: "opened", target: "phone1", type:"basic" });
         // instance.connect({ source: "phone1", target: "phone1", type:"basic" });
         // instance.connect({ source: "zhang", target: "zhang1", type:"basic" });
         //instance.connect({ source: "zhang", target: "zhang2", type:"basic" });
         //instance.connect({ source: "zhang", target: "zhang3", type:"basic" });
         //instance.connect({ source: "zhang1", target: "zhang3", type:"basic" });
    //
    //      instance.connect({
    //          source:"phone2",
    //          target:"rejected",
    //          type:"basic"
    //      });
    // });


    jsPlumb.fire("jsPlumbDemoLoaded", instance);
    // instance.bind("connection", function (info) {
        // info.connection.getOverlay("label").setLabel(info.connection.id);
    // });
    //instance.bind("click", function (c) {
    //    instance.detach(c);
    //});
    // instance.bind("connection", function (info) {
         //info.connection.getOverlay("label").setLabel(info.connection.id);
     //});


    // var windows = jsPlumb.getSelector(".statemachine-demo .w");


    // // suspend drawing and initialise.  初始化数据
    // instance.batch(function () {
    //     for (var i = 0; i < windows.length; i++) {
    //         initNode(windows[i], true);
    //     }
    //     // and finally, make a few connections
    //     // instance.connect({ source: "opened", target: "phone1", type:"basic" });
    //     // instance.connect({ source: "phone1", target: "phone1", type:"basic" });
    //     // instance.connect({ source: "phone1", target: "inperson", type:"basic" });

    //     // instance.connect({
    //     //     source:"phone2",
    //     //     target:"rejected",
    //     //     type:"basic"
    //     // });
    // });

    //this.instance.deleteEndpoint(wid);
            //this.instance.detachAllConnections( this.map[wid].target );
            //this.instance.deleteEndpoint( this.instance.targetEndpointDefinitions );
            //console.log( this.map[wid].source )
            //$('#'+wid).remove();
            //this.instance.deleteEndpoint( this.instance.targetEndpointDefinitions );

} );