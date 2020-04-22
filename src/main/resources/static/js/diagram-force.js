var jsondata={"node":[{"name":"酷酷酷酷酷酷","uuid":"18147380","r":"100","color":"blue"},{"name":"KKKKK","uuid":"18147392"},{"name":"QQQQQ","uuid":"18147393"},{"name":"XXXXX","uuid":"18147394"}],"relationship":[{"sourceid":"18147380","targetid":"18147392","name":"下位","uuid":"48723709"},{"sourceid":"18147380","targetid":"18147393","name":"下位","uuid":"48723710"}]} ;
var app = new Vue({
    el: '#app',
    data: {
        svg:null,
        timer:null,
        editor:null,
        simulation:null,
        linkGroup:null,
        linktextGroup:null,
        nodeGroup:null,
        nodetextGroup:null,
        nodesymbolGroup:null,
        nodebuttonGroup:null,
        nodebuttonAction:'',
        txx:{},
        tyy:{},
        colorList: ["#ff8373", "#f9c62c", "#a5ca34", "#6fce7a", "#70d3bd", "#ea91b0"],
        color5: '#ff4500',
        predefineColors: ['#ff4500', '#ff8c00', '#90ee90', '#00ced1', '#1e90ff', '#c71585'],
        defaultcr: 30,
        selectnodeid: 0,
        selectnodename: '',
        selectsourcenodeid: 0,
        selecttargetnodeid: 0,
        graph: {
            nodes: [],
            links: []
        },
        graphEntity: {
            uuid: 0,
            name: '',
            color: 'ff4500',
            r: 30,
            x: "",
            y: ""
        },

        dialogFormVisible: false,
        headers: {},
    },
    //mounted钩子函数一般是用来向后端发起请求拿到数据以后做一些业务处理,该钩子函数是在挂载完成以后也就是模板渲染完成以后才会被调用
    mounted() {
        //上传图片使用
        // var token = $("meta[name='_csrf']").attr("content");
        // var header = $("meta[name='_csrf_header']").attr("content");
        // var str = '{ "' + header + '": "' + token + '"}';
        // this.headers = eval('(' + str + ')');

        //初始化
        this.initgraph();
        this.updategraph();
    },
    //created是在实例创建完成后立即调用,一般creadted钩子函数主要是用来初始化数据
    created() {
        this.graph.nodes = jsondata.node;
        this.graph.links = jsondata.relationship;
    },
    methods: {

        //右键空白部分js
        btnaddsingle(){
            d3.select('.graphcontainer').style("cursor", "crosshair");//进入新增模式，鼠标变成＋
        },
        btndeletelink() {
            this.isdeletelink = true;
            d3.select('.link').attr("class", "link linkdelete"); // 修改鼠标样式为"+"
        },
        btnquickaddnode() {
            this.isedit = false;
            this.isbatchcreate = true;
            $("#link_menubar").hide();
            this.operatetype = 3;
        },
        getmorenode() { //按钮编辑事件
            var _this = this;
            var data = {domain: _this.domain, nodeid: _this.selectnodeid};
            $.ajax({
                data: data,
                type: "POST",
                url: contextRoot + "getmorerelationnode",
                success: function (result) {
                    if (result.code == 200) {
                        var newnodes = result.data.node;
                        var newships = result.data.relationship;
                        var oldnodescount = _this.graph.nodes.length;
                        newnodes.forEach(function (m) {
                            var sobj = _this.graph.nodes.find(function (x) {
                                return x.uuid === m.uuid
                            })
                            if (typeof(sobj) == "undefined") {
                                _this.graph.nodes.push(m);
                            }
                        })
                        var newnodescount = _this.graph.nodes.length;
                        if (newnodescount <= oldnodescount) {
                            _this.$message({
                                message: '没有更多节点信息',
                                type: 'success'
                            });
                            return;
                        }
                        newships.forEach(function (m) {
                            var sobj = _this.graph.links.find(function (x) {
                                return x.uuid === m.uuid
                            })
                            if (typeof(sobj) == "undefined") {
                                _this.graph.links.push(m);
                            }
                        })
                        _this.updategraph();
                    }
                },
                error: function (data) {
                }
            });
        },
        getNodeDetail(nodeid) { //节点详细信息查询
            var _this = this;
            var data = {domainid: _this.domainid, nodeid: nodeid};
            $.ajax({
                data: data,
                type: "POST",
                url: contextRoot + "getnodedetail",
                success: function (result) {
                    if (result.code == 200) {
                        _this.editorcontent = result.data.content;
                        _this.showImageList = result.data.imagelist;
                    }
                }
            })
        },
        initgraph(){
            //创建画布
            var graphcontainer = d3.select(".graphcontainer");
            var width = graphcontainer._groups[0][0].offsetWidth;
            var height = window.screen.height - 154;
            this.svg = graphcontainer.append("svg");
            this.svg.attr("width", width);
            this.svg.attr("height", height);
            this.simulation = d3.forceSimulation()  //创建一个新的力学仿真（自动启动）
                .force("link", d3.forceLink().distance(function(d){  //创建一个 link(弹簧) 作用力,并设置 link 的距离
                    return Math.floor(Math.random() * (700 - 200)) + 200;
                }).id(function (d) {
                    return d.uuid
                }))
                .force("charge", d3.forceManyBody().strength(-400)) //节点之间相互作用力
                .force("collide", d3.forceCollide().strength(-30))  //创建一个圆形区域的碰撞检测力模型
                .force("center", d3.forceCenter(width / 2, (height - 200) / 2)); //创建一个中心作用力
            this.linkGroup = this.svg.append("g").attr("class", "line");
            this.linktextGroup = this.svg.append("g").attr("class", "linetext");
            this.nodeGroup = this.svg.append("g").attr("class", "node");
            this.nodetextGroup = this.svg.append("g").attr("class", "nodetext");
            this.nodesymbolGroup = this.svg.append("g").attr("class", "nodesymbol");
            this.nodebuttonGroup = this.svg.append("g").attr("class", "nodebutton");
            this.addmaker();//箭头定义
            this.addnodebutton();//为每一个节点定制按钮组
            this.svg.on('click',function(){ //子节点隐藏
                d3.selectAll("use").classed("circle_opreate", true);
            }, 'false');

        },
        updategraph() {
            var _this = this;
            var lks = this.graph.links;
            var nodes = this.graph.nodes;
            var links = [];
            lks.forEach(function (m) {//判断link绑定的两个节点是否存在,都存在的link放进links
                var sourceNode = nodes.filter(function (n) {
                    return n.uuid === m.sourceid;
                })[0];
                if (typeof(sourceNode) == 'undefined') return;
                var targetNode = nodes.filter(function (n) {
                    return n.uuid === m.targetid;
                })[0];
                if (typeof(targetNode) == 'undefined') return;
                links.push({source: sourceNode.uuid, target: targetNode.uuid, lk: m});
            });
            if(links.length>0){//判断是否有重复的link并作处理
                _.each(links, function(link) {
                    var same = _.where(links, {
                        'source': link.source,
                        'target': link.target
                    });
                    var sameAlt = _.where(links, {
                        'source': link.target,
                        'target': link.source
                    });
                    var sameAll = same.concat(sameAlt);
                    _.each(sameAll, function(s, i) {
                        s.sameIndex = (i + 1);
                        s.sameTotal = sameAll.length;
                        s.sameTotalHalf = (s.sameTotal / 2);
                        s.sameUneven = ((s.sameTotal % 2) !== 0);
                        s.sameMiddleLink = ((s.sameUneven === true) &&(Math.ceil(s.sameTotalHalf) === s.sameIndex));
                        s.sameLowerHalf = (s.sameIndex <= s.sameTotalHalf);
                        s.sameArcDirection = 1;
                        //s.sameArcDirection = s.sameLowerHalf ? 0 : 1;
                        s.sameIndexCorrected = s.sameLowerHalf ? s.sameIndex : (s.sameIndex - Math.ceil(s.sameTotalHalf));
                    });
                });
                var maxSame = _.chain(links)
                    .sortBy(function(x) {
                        return x.sameTotal;
                    })
                    .last()
                    .value().sameTotal;

                _.each(links, function(link) {
                    link.maxSameHalf = Math.round(maxSame / 2);
                });
            }
            // 更新连线 links
            var link = _this.linkGroup.selectAll(".line >path").data(links, function (d) {
                // return d.uuid;
                return d.lk.uuid;
            });
            link.exit().remove();
            var linkEnter = _this.drawlink(link); //link js事件触发
            link = linkEnter.merge(link); //集合合并
            // 更新连线文字
            var linktext = _this.linktextGroup.selectAll("text").data(links, function (d) {
                // return d.uuid;
                return d.lk.uuid;
            });
            linktext.exit().remove();
            var linktextEnter = _this.drawlinktext(linktext);//文字 js事件触发
            linktext = linktextEnter.merge(linktext).text(function (d) {
                return d.lk.name;
            });
            // 更新节点按钮组
            d3.selectAll(".nodebutton  >g").remove();
            var nodebutton = _this.nodebuttonGroup.selectAll(".nodebutton").data(nodes, function (d) {
                return d;
            });
            nodebutton.exit().remove();
            var nodebuttonEnter = _this.drawnodebutton(nodebutton);  //按钮 js事件触发
            nodebutton = nodebuttonEnter.merge(nodebutton);
            // 更新节点
            var node = _this.nodeGroup.selectAll("circle").data(nodes, function (d) {
                return d;
            });
            node.exit().remove();
            var nodeEnter = _this.drawnode(node); //节点 js事件触发
            node = nodeEnter.merge(node).text(function (d) {
                return d.name;
            });
            // 更新节点文字
            var nodetext = _this.nodetextGroup.selectAll("text").data(nodes, function (d) {
                return d.uuid
            });
            nodetext.exit().remove();
            var nodetextEnter = _this.drawnodetext(nodetext); //节点文字 js事件触发
            nodetext = nodetextEnter.merge(nodetext).text(function (d) {
                return d.name;
            });
            nodetext.append("title")// 为每个节点设置title
                .text(function (d) {
                    return d.name;
                });
            // 更新节点标识（目前没用到，文件使用）
            var nodesymbol = _this.nodesymbolGroup.selectAll("path").data(nodes, function (d) {
                return d.uuid;
            });
            nodesymbol.exit().remove();
            var nodesymbolEnter = _this.drawnodesymbol(nodesymbol);//节点标识 js事件触发
            nodesymbol = nodesymbolEnter.merge(nodesymbol);
            nodesymbol.attr("fill", "#e15500");
            nodesymbol.attr("display", function (d) {
                if (typeof(d.hasfile) != "undefined" && d.hasfile > 0) {
                    return "block";
                }
                return "none";
            })
            _this.simulation.nodes(nodes).on("tick", ticked);
            _this.simulation.force("link").links(links);
            _this.simulation.alphaTarget(0).restart();
            function linkArc(d) {
                var dx = (d.target.x - d.source.x),
                    dy = (d.target.y - d.source.y),
                    dr = Math.sqrt(dx * dx + dy * dy),
                    unevenCorrection = (d.sameUneven ? 0 : 0.5);
                var curvature = 2,
                    arc = (1.0/curvature)*((dr * d.maxSameHalf) / (d.sameIndexCorrected - unevenCorrection));
                if (d.sameMiddleLink) {
                    arc = 0;
                }
                var dd="M" + d.source.x + "," + d.source.y + "A" + arc + "," + arc + " 0 0," + d.sameArcDirection + " " + d.target.x + "," + d.target.y;
                return dd;
            }

            function ticked() {
                // 更新连线坐标
                /*link.attr("x1", function (d) {
                    return d.source.x;
                   })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });*/
                link.attr("d", linkArc); //连线位置计算
                // 刷新连接线上的文字位置
                /* linktext.attr("x", function (d) {
                     return (d.source.x + d.target.x) / 2;
                 })
                     .attr("y", function (d) {
                         return (d.source.y + d.target.y) / 2;
                     })*/


                // 更新节点坐标
                node.attr("cx", function (d) {
                    return d.x;
                })
                    .attr("cy", function (d) {
                        return d.y;
                    });
                // 更新节点操作按钮组坐标
                nodebutton.attr("cx", function (d) {
                    return d.x;
                })
                    .attr("cy", function (d) {
                        return d.y;
                    });
                nodebutton.attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y+ ") scale(1)";
                })

                // 更新文字坐标
                nodetext.attr("x", function (d) {
                    return d.x;
                })
                    .attr("y", function (d) {
                        return d.y;
                    });
                // 更新回形针坐标
                nodesymbol.attr("transform", function (d) {
                    return "translate(" + (d.x + 8) + "," + (d.y - 30) + ") scale(0.015,0.015)";
                })
            }
            // 鼠标滚轮缩放
            //_this.svg.call(d3.zoom().transform, d3.zoomIdentity);//缩放至初始倍数
            _this.svg.call(d3.zoom().on("zoom", function () {
                d3.selectAll('.node').attr("transform",d3.event.transform);
                d3.selectAll('.nodetext').attr("transform",d3.event.transform);
                d3.selectAll('.line').attr("transform",d3.event.transform);
                d3.selectAll('.linetext').attr("transform",d3.event.transform);
                d3.selectAll('.nodesymbol').attr("transform",d3.event.transform);
                d3.selectAll('.nodebutton').attr("transform",d3.event.transform);
                //_this.svg.selectAll("g").attr("transform", d3.event.transform);
            }));
            _this.svg.on("dblclick.zoom", null); // 静止双击缩放
            //按钮组事件
            _this.svg.selectAll(".buttongroup").on("click", function (d,i) {
                console.log(_this.nodebuttonAction);
                console.log(d);
                if (_this.nodebuttonAction) {
                    switch (_this.nodebuttonAction) {
                        case "EDIT":
                            _this.isedit = true;
                            _this.propactiveName = 'propedit';
                            _this.txx=d.x;
                            _this.tyy=d.y;
                            break;
                        case "MORE":
                            _this.getmorenode();
                            break;
                        case "CHILD":
                            _this.operatetype = 2;
                            _this.isbatchcreate = true;
                            _this.isedit = false;
                            break;
                        case "LINK":
                            _this.isaddlink = true;
                            _this.selectsourcenodeid=d.uuid;
                            break;
                        case "DELETE":
                            _this.selectnodeid=d.uuid;
                            var out_buttongroup_id='.out_buttongroup_'+i;
                            _this.deletenode(out_buttongroup_id);
                            break;
                    }
                    ACTION = '';//重置 ACTION
                }

            });
            //按钮组事件绑定
            _this.svg.selectAll(".action_0").on("click", function (d) {
                _this.nodebuttonAction='EDIT';
            });
            _this.svg.selectAll(".action_1").on("click", function (d) {
                _this.nodebuttonAction='MORE';
            });
            _this.svg.selectAll(".action_2").on("click", function (d) {
                _this.nodebuttonAction='CHILD';
            });
            _this.svg.selectAll(".action_3").on("click", function (d) {
                _this.nodebuttonAction='LINK';
            });
            _this.svg.selectAll(".action_4").on("click", function (d) {
                _this.nodebuttonAction='DELETE';
            });
        },
        createnode() { //创建节点
            var _this = this;
            var data = _this.graphEntity;
            data.domain = _this.domain;
            $.ajax({
                data: data,
                type: "POST",
                traditional: true,
                url: contextRoot + "createnode",
                success: function (result) {
                    if (result.code == 200) {
                        d3.select('.graphcontainer').style("cursor", "");
                        if (_this.graphEntity.uuid != 0) {
                            for (var i = 0; i < _this.graph.nodes.length; i++) {
                                if (_this.graph.nodes[i].uuid == _this.graphEntity.uuid) {
                                    _this.graph.nodes.splice(i, 1);
                                }
                            }
                        }
                        var newnode = result.data;
                        newnode.x = _this.txx;
                        newnode.y = _this.tyy;
                        newnode.fx = _this.txx;
                        newnode.fy = _this.tyy;
                        _this.graph.nodes.push(newnode);
                        _this.resetentity();
                        _this.updategraph();
                        _this.isedit = false;
                        _this.resetsubmit();
                    }
                }
            });
        },
        addmaker() {
            var arrowMarker = this.svg.append("marker")
                .attr("id", "arrow")
                .attr("markerUnits", "strokeWidth")
                .attr("markerWidth", "20")//
                .attr("markerHeight", "20")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", "22")// 13
                .attr("refY", "0")
                .attr("orient", "auto");
            var arrow_path = "M0,-5L10,0L0,5";// 定义箭头形状
            arrowMarker.append("path").attr("d", arrow_path).attr("fill", "#fce6d4");
        },
        addnodebutton(r) {
            //先删除所有为节点自定义的按钮组
            d3.selectAll("svg >defs").remove();
            var nodes = this.graph.nodes;
            var database = [1,1,1,1,1];
            var pie = d3.pie();
            var piedata = pie(database);
            var nodebutton = this.svg.append("defs");
            nodes.forEach(function(m){
                var nbtng=nodebutton.append("g")
                    .attr("id", "out_circle"+m.uuid);//为每一个节点定制一个按钮组，在画按钮组的时候为其指定该id
                var buttonEnter=nbtng.selectAll(".buttongroup")
                    .data(piedata)
                    .enter()
                    .append("g")
                    .attr("class", function (d, i) {
                        return "action_" + i ;
                    });
                var defaultR=30;
                if(typeof (m.r)=='undefined'){
                    m.r=defaultR;
                }
                var or = parseInt(m.r) * 1.5 + 10;//外半径计算
                var arc = d3.arc()
                    .innerRadius(m.r)
                    .outerRadius(or);
                buttonEnter.append("path")
                    .attr("d", function (d) {
                        return arc(d)
                    })
                    .attr("fill", "#D2D5DA")
                    .style("opacity", 0.6)
                    .attr("stroke", "#f0f0f4")
                    .attr("stroke-width", 2);
                buttonEnter.append("text")
                    .attr("transform", function (d, i) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .attr("text-anchor", "middle")
                    .text(function (d, i) {
                        var zi = new Array()
                        zi[0] = "编辑";
                        zi[1] = "展开";
                        zi[2] = "追加";
                        zi[3] = "连线";
                        zi[4] = "删除";
                        return zi[i]
                    })
                    .attr("font-size", parseInt(m.r) * 0.1 + 8);//文字根据半径大小进行变化
            })
        },
        dragstarted(d) {
            if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            d.fixed = true;
        },
        dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        },
        dragended(d) {
            if (!d3.event.active) this.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        },
        drawnode(node) {
            var _this = this;
            var nodeEnter = node.enter().append("circle");
            nodeEnter.attr("r", function (d) { //设置半径
                if (typeof(d.r) != "undefined" && d.r != '') {
                    return d.r
                }
                return 30;
            });
            nodeEnter.attr("fill", function (d) { //设置填充颜色
                if (typeof(d.color) != "undefined" && d.color != '') {
                    return d.color
                }
                return "#ff4500";
            });
            nodeEnter.style("opacity", 0.8);
            nodeEnter.style("stroke", function (d) {//设置轮廓颜色
                if (typeof(d.color) != "undefined" && d.color != '') {
                    return d.color
                }
                return "#ff4500";
            });
            nodeEnter.style("stroke-opacity", 0.6);
            nodeEnter.append("title")// 为每个节点设置title
                .text(function (d) {
                    return d.name;
                })
            nodeEnter.on("mouseover", function (d, i) {//停留3秒，显示详细信息
                _this.timer = setTimeout(function () {
                    d3.select('#richContainer')
                        .style('position', 'absolute')
                        .style('left', d.x + "px")
                        .style('top', d.y + "px")
                        .style('display', 'block');
                    _this.editorcontent = "";
                    _this.showImageList = [];
                    // _this.getNodeDetail(d.uuid); //详细信息
                }, 3000);
            });
            nodeEnter.on("mouseout", function (d, i) {
                clearTimeout( _this.timer);
            });
            nodeEnter.on("dblclick", function (d) {
                app.updatenodename(d);// 双击更新节点名称
            });
            nodeEnter.on("mouseenter", function (d) {
                var aa = d3.select(this)._groups[0][0];
                if (aa.classList.contains("selected")) return;
                d3.select(this).style("stroke-width", "6");
            });
            nodeEnter.on("mouseleave", function (d) {
                var aa = d3.select(this)._groups[0][0];
                if (aa.classList.contains("selected")) return;
                d3.select(this).style("stroke-width", "2");
            });
            nodeEnter.on("click", function (d,i) {
                d3.select('#nodedetail').style('display', 'block');
                var out_buttongroup_id='.out_buttongroup_'+i;
                _this.svg.selectAll(".buttongroup").classed("circle_opreate", true);
                _this.svg.selectAll(out_buttongroup_id).classed("circle_opreate", false);
                _this.graphEntity = d;
                _this.selectnodeid = d.uuid;
                _this.selectnodename = d.name;
                // 添加连线状态
                if (_this.isaddlink) {
                    _this.selecttargetnodeid = d.uuid;
                    if (_this.selectsourcenodeid == _this.selecttargetnodeid || _this.selectsourcenodeid == 0 || _this.selecttargetnodeid == 0) return;
                    _this.createlink(_this.selectsourcenodeid, _this.selecttargetnodeid, "RE")
                    _this.selectsourcenodeid = 0;
                    _this.selecttargetnodeid = 0;
                    d.fixed = false
                    d3.event.stopPropagation();
                }
            });
            nodeEnter.call(d3.drag() //创建一个拖拽交互.
                .on("start", _this.dragstarted)
                .on("drag", _this.dragged)
                .on("end", _this.dragended)
            );
            return nodeEnter;
        },
        drawnodetext(nodetext) {
            var _this = this;
            var nodetextenter = nodetext.enter().append("text")
                .style("fill", "#fff")
                .attr("dy", 4)
                .attr("font-family", "微软雅黑")
                .attr("text-anchor", "middle")
                .text(function (d) {
                    var length = d.name.length;
                    if (d.name.length > 4) { //截取前4位（目前没用，后续可能会用）
                        var s = d.name.slice(0, 4) + "...";
                        return s;
                    }
                    return d.name;
                });
            nodetextenter.on("mouseover", function (d, i) {
                _this.timer = setTimeout(function () {
                    d3.select('#richContainer')
                        .style('position', 'absolute')
                        .style('left', d.x + "px")
                        .style('top', d.y + "px")
                        .style('display', 'block');
                    _this.editorcontent = "";
                    _this.showImageList = [];
                    // _this.getNodeDetail(d.uuid);  //详细信息
                }, 3000);
            });

            nodetextenter.on("dblclick", function (d) {
                app.updatenodename(d);// 双击更新节点名称
            });
            nodetextenter.on("click", function (d) {
                $('#link_menubar').hide();// 隐藏空白处右键菜单
                _this.graphEntity = d;
                _this.selectnodeid = d.uuid;
                // 更新工具栏节点信息
                _this.getcurrentnodeinfo(d);
                // 添加连线状态
                if (_this.isaddlink) {
                    _this.selecttargetnodeid = d.uuid;
                    if (_this.selectsourcenodeid == _this.selecttargetnodeid || _this.selectsourcenodeid == 0 || _this.selecttargetnodeid == 0) return;
                    _this.createlink(_this.selectsourcenodeid, _this.selecttargetnodeid, "RE")
                    _this.selectsourcenodeid = 0;
                    _this.selecttargetnodeid = 0;
                    d.fixed = false
                    d3.event.stopPropagation();
                }
            });

            return nodetextenter;
        },
        getcurrentnodeinfo(node) {
            var _this = this;
            var data = {domain: _this.domain, nodeid: node.uuid};
            $.ajax({
                data: data,
                type: "POST",
                url: contextRoot + "getrelationnodecount",
                success: function (result) {
                    if (result.code == 200) {
                        _this.selectnode.name = node.name;
                        _this.selectnode.count = result.data;
                    }
                }
            });
        },
        drawnodesymbol(nodesymbol) {
            var _this = this;
            var symnol_path = "M566.92736 550.580907c30.907733-34.655573 25.862827-82.445653 25.862827-104.239787 0-108.086613-87.620267-195.805867-195.577173-195.805867-49.015467 0-93.310293 18.752853-127.68256 48.564907l-0.518827-0.484693-4.980053 4.97664c-1.744213 1.64864-3.91168 2.942293-5.59104 4.72064l0.515413 0.484693-134.69696 133.727573L216.439467 534.8352l0 0 137.478827-136.31488c11.605333-10.410667 26.514773-17.298773 43.165013-17.298773 36.051627 0 65.184427 29.197653 65.184427 65.24928 0 14.032213-5.33504 26.125653-12.73856 36.829867l-131.754667 132.594347 0.515413 0.518827c-10.31168 11.578027-17.07008 26.381653-17.07008 43.066027 0 36.082347 29.16352 65.245867 65.184427 65.245867 16.684373 0 31.460693-6.724267 43.035307-17.07008l0.515413 0.512M1010.336427 343.49056c0-180.25472-145.882453-326.331733-325.911893-326.331733-80.704853 0-153.77408 30.22848-210.418347 79.0528l0.484693 0.64512c-12.352853 11.834027-20.241067 28.388693-20.241067 46.916267 0 36.051627 29.16352 65.245867 65.211733 65.245867 15.909547 0 29.876907-6.36928 41.192107-15.844693l0.38912 0.259413c33.624747-28.030293 76.301653-45.58848 123.511467-45.58848 107.99104 0 195.549867 87.6544 195.549867 195.744427 0 59.815253-27.357867 112.71168-69.51936 148.503893l0 0-319.25248 317.928107 0 0c-35.826347 42.2912-88.654507 69.710507-148.340053 69.710507-107.956907 0-195.549867-87.68512-195.549867-195.805867 0-59.753813 27.385173-112.646827 69.515947-148.43904l-92.18048-92.310187c-65.69984 59.559253-107.700907 144.913067-107.700907 240.749227 0 180.28544 145.885867 326.301013 325.915307 326.301013 95.218347 0 180.02944-41.642667 239.581867-106.827093l0.13312 0.129707 321.061547-319.962453-0.126293-0.13312C968.69376 523.615573 1010.336427 438.71232 1010.336427 343.49056L1010.336427 343.49056 1010.336427 343.49056zM1010.336427 343.49056";// 定义回形针形状
            var nodesymbolEnter = nodesymbol.enter().append("path").attr("d", symnol_path);
            nodesymbolEnter.call(d3.drag()
                .on("start", _this.dragstarted)
                .on("drag", _this.dragged)
                .on("end", _this.dragended)
            );
            return nodesymbolEnter;
        },
        drawnodebutton(nodebutton) {
            var _this = this;
            var nodebuttonEnter = nodebutton.enter().append("g").append("use")//  为每个节点组添加一个 use 子元素
                .attr("r", function(d){
                    return d.r;
                })
                .attr("xlink:href", function (d) {
                    return "#out_circle"+d.uuid;
                }) //  指定 use 引用的内容
                .attr('class',function(d,i){
                    return 'buttongroup out_buttongroup_'+i;
                })
                .classed("circle_opreate", true);

            return nodebuttonEnter;
        },
        drawlink(link) {
            var _this = this;
            var linkEnter = link.enter().append("path")
                .attr("stroke-width", 1)
                .attr("stroke", "#fce6d4")
                .attr("fill", "none")
                .attr("id", function (d) {
                    return "invis_" + d.lk.sourceid + "-" + d.lk.name + "-" + d.lk.targetid;
                })
                .attr("marker-end", "url(#arrow)")// 箭头
            ;
            linkEnter.on("dblclick", function (d) {//双击连线
                _this.selectnodeid = d.lk.uuid;
                if (_this.isdeletelink) {
                    _this.deletelink();
                } else {
                    _this.updatelinkName();
                }
            });
            linkEnter.on("contextmenu", function (d) {//右键连线
                // var cc = $(this).offset();
                app.selectnodeid = d.lk.uuid;
                app.selectlinkname = d.lk.name;
                var left = d3.event.clientX;
                var top = d3.event.clientY;
                d3.select('#link_menubar')
                    .style('position', 'absolute')
                    .style('left', left + "px")
                    .style('top', top + "px")
                    .style('display', 'block');
                d3.event.preventDefault();// 禁止系统默认右键
                d3.event.stopPropagation();// 禁止空白处右键
            });
            linkEnter.on("mouseenter", function (d) {//鼠标经过
                d3.select(this).style("stroke-width", "6").attr("stroke", "#ff9e9e").attr("marker-end", "url(#arrow2)");
            });
            linkEnter.on("mouseleave", function (d) {//鼠标移开
                d3.select(this).style("stroke-width", "1").attr("stroke", "#fce6d4").attr("marker-end", "url(#arrow)");
            });
            return linkEnter;
        },
        drawlinktext(link) {
            var linktextEnter = link.enter().append('text')
                .style('fill', '#e3af85')
                .append("textPath")
                .attr("startOffset", "50%")
                .attr("text-anchor", "middle")
                .attr("xlink:href", function(d) {
                    return "#invis_" + d.lk.sourceid + "-" + d.lk.name + "-" + d.lk.targetid;
                })
                .style("font-size", 14)
                .text(function (d) {
                    if (d.lk.name != '') {
                        return d.lk.name;
                    }
                });

            linktextEnter.on("mouseover", function (d) { //鼠标位于文字上方
                app.selectnodeid = d.lk.uuid;
                app.selectlinkname = d.lk.name;
                var cc = $(this).offset();
                d3.select('#link_menubar')
                    .style('position', 'absolute')
                    .style('left', cc.left + "px")
                    .style('top', cc.top + "px")
                    .style('display', 'block');
            });

            return linktextEnter;
        },
        deletenode(out_buttongroup_id) {
            var _this = this;
            _this.$confirm('此操作将删除该节点及周边关系(不可恢复), 是否继续?', '三思而后行', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(function () {
                var data = {domain: _this.domain, nodeid: _this.selectnodeid};
                $.ajax({
                    data: data,
                    type: "POST",
                    url: contextRoot + "deletenode",
                    success: function (result) {
                        if (result.code == 200) {
                            _this.svg.selectAll(out_buttongroup_id).remove();
                            var rships = result.data;
                            // 删除节点对应的关系
                            for (var m = 0; m < rships.length; m++) {
                                for (var i = 0; i < _this.graph.links.length; i++) {
                                    if (_this.graph.links[i].uuid == rships[m].uuid) {
                                        _this.graph.links.splice(i, 1);
                                        i = i - 1;
                                    }
                                }
                            }
                            // 找到对应的节点索引
                            var j = -1;
                            for (var i = 0; i < _this.graph.nodes.length; i++) {
                                if (_this.graph.nodes[i].uuid == _this.selectnodeid) {
                                    j = i;
                                    break;
                                }
                            }
                            if (j >= 0) {
                                _this.selectnodeid = 0;
                                _this.graph.nodes.splice(i, 1);// 根据索引删除该节点
                                _this.updategraph();
                                _this.resetentity();
                                _this.$message({
                                    type: 'success',
                                    message: '操作成功!'
                                });
                            }

                        }
                    }
                })
            }).catch(function () {
                _this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        deletelink() {
            var _this = this;
            this.$confirm('此操作将删除该关系(不可恢复), 是否继续?', '三思而后行', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(function () {
                var data = {domain: _this.domain, shipid: _this.selectnodeid};
                $.ajax({
                    data: data,
                    type: "POST",
                    url: contextRoot + "deletelink",
                    success: function (result) {
                        if (result.code == 200) {
                            var j = -1;
                            for (var i = 0; i < _this.graph.links.length; i++) {
                                if (_this.graph.links[i].uuid == _this.selectnodeid) {
                                    j = i;
                                    break;
                                }
                            }
                            if (j >= 0) {
                                _this.selectnodeid = 0;
                                _this.graph.links.splice(i, 1);
                                _this.updategraph();
                                _this.isdeletelink = false;
                            }
                        }
                    }
                });
            }).catch(function () {
                _this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        createlink(sourceId, targetId, ship) {
            var _this = this;
            var data = {domain: _this.domain, sourceid: sourceId, targetid: targetId, ship: ''};
            $.ajax({
                data: data,
                type: "POST",
                url: contextRoot + "createlink",
                success: function (result) {
                    if (result.code == 200) {
                        var newship = result.data;
                        _this.graph.links.push(newship);
                        _this.updategraph();
                        _this.isaddlink = false;
                    }
                }
            });
        },
        updatelinkName() {//改名请求
            var _this = this;
            _this.$prompt('请输入关系名称', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: this.selectlinkname
            }).then(function (res) {
                value=res.value;
                var data = {domain: _this.domain, shipid: _this.selectnodeid, shipname: value};
                $.ajax({
                    data: data,
                    type: "POST",
                    url: contextRoot + "updatelink",
                    success: function (result) {
                        if (result.code == 200) {
                            var newship = result.data;
                            _this.graph.links.forEach(function (m) {
                                if (m.uuid == newship.uuid) {
                                    m.name = newship.name;
                                }
                            });
                            _this.selectnodeid = 0;
                            _this.updategraph();
                            _this.isaddlink = false;
                            _this.selectlinkname = '';
                        }
                    }
                });
            }).catch(function () {
                _this.$message({
                    type: 'info',
                    message: '取消输入'
                });
            });
        },
        updatenodename(d) {
            var _this = this;
            _this.$prompt('编辑节点名称', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: d.name
            }).then(function (res) {
                value=res.value;
                var data = {domain: _this.domain, nodeid: d.uuid, nodename: value};
                $.ajax({
                    data: data,
                    type: "POST",
                    url: contextRoot + "updatenodename",
                    success: function (result) {
                        if (result.code == 200) {
                            if (d.uuid != 0) {
                                for (var i = 0; i < _this.graph.nodes.length; i++) {
                                    if (_this.graph.nodes[i].uuid == d.uuid) {
                                        _this.graph.nodes[i].name = value;
                                    }
                                }
                            }
                            _this.updategraph();
                            _this.$message({
                                message: '操作成功',
                                type: 'success'
                            });
                        }
                    }
                });
            }).catch(function () {
                _this.$message({
                    type: 'info',
                    message: '取消操作'
                });
            });
        },
    }
})
$(function () {
    //空白部分右键隐藏
    $(".blankmenubar").click(function () {
        $('#blank_menubar').hide();
    })
    $(".blankmenubar").mouseleave(function () {
        $('#blank_menubar').hide();
    })
    $(".graphcontainer").bind("contextmenu", function (event) {//空白部分右键
        app.svg.selectAll("use").classed("circle_opreate", true);
        var left = event.clientX;
        var top = event.clientY;
        document.getElementById('blank_menubar').style.position = 'absolute';
        document.getElementById('blank_menubar').style.left = left + 'px';
        document.getElementById('blank_menubar').style.top = top + 'px';
        $('#blank_menubar').show();
        event.preventDefault(); //取消浏览器默认操作
    });
    $(".graphcontainer").bind("click", function (event) {
        var cursor=document.getElementById("graphcontainer").style.cursor;
        if(cursor=='crosshair'){   //鼠标'+'号模式单击
            d3.select('.graphcontainer').style("cursor", "");
            app.txx=event.offsetX;
            app.tyy=event.offsetY;
            app.createnode();
        }
        event.preventDefault();//取消浏览器默认操作
    });

    $(".linkmenubar").bind("mouseleave", function (event) {
        d3.select('#link_menubar').style('display', 'none');
    });
    $("body").bind("mousedown", function (event) {
        if (!(event.target.id === "link_menubar" || $(event.target).parents("#link_menubar").length > 0)) {
            $("#link_menubar").hide();
        }
        if (!(event.target.id === "linkmenubar" || $(event.target).parents("#linkmenubar").length > 0)) {
            $("#linkmenubar").hide();
        }

    });
})