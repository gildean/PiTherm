(function (window, $, undefined) {
    'use strict';

    function isValidJSON(message) {
        try {
            return JSON.parse(message);
        } catch (e) {
            console.log('This doesn\'t look like valid JSON: ' + message);
            return false;
        }
    }

    function getElId(id) {
        return $.getElementById(id);
    }

    function addElement(parent, type, classN, id, texts) {
        var el = $.createElement(type);
        el.className = classN;
        el.id = id;
        el.appendChild($.createTextNode(texts));
        parent.appendChild(el);
        return el;
    }

    function removeEl(el) {
        setTimeout(function () {
            el.style.display = 'none';
        }, 300);
    }

    var main = getElId('main');
    var temps = getElId('temps');
    var buttons = getElId('buttons');
    var topbar = getElId('topbar');
    var graphWrap = getElId('graphWrap');
    var currentTime = getElId('checkingtime');
    var history = 'HISTORY';
    var tempdata = 'TEMPDATA';
    var active = {
        button: getElId('current'),
        view: getElId('main')
    };
    var fsbutton = getElId('fullscreen');
    var lsbutton = getElId('listscreen');
    var curGraph;
    var last = {
        high: 0,
        low: 60
    };
    var fs = false;

    var tempInfo = {
        init: function (name) {
            this.name = name;
            var d = addElement(main, 'div', 'sensorH', name, '');
            var s = addElement(d, 'h4', 'sensorname', 'head' + name, name);
            var sp = addElement(d, 'span', 'sensors stat', 'statc' + name, 'current: ');
            this.current = addElement(d, 'span', 'sensors', 'current' + name, '');
            var sh = addElement(d, 'span', 'sensors stat', 'stath' + name, 'highest: ');
            this.high = addElement(d, 'span', 'sensors', 'high' + name, '');
            var sl = addElement(d, 'span', 'sensors stat', 'statl' + name, 'lowest: ');
            this.low = addElement(d, 'span', 'sensors', 'low' + name, '');
            d.style.opacity = 1;
            return this;
        },
        update: function (data) {
            var curTemp = (data !== null) ? (data.temp) ? data.temp : data : null;
            var temps = [this.current, this.high, this.low];
            temps.forEach(function (temp) {
                temp.style.opacity = 0;
            });
            if (curTemp) {
                temps[0].innerText = curTemp.toFixed(1) + '°C';
            }
            if (curTemp && data.high) {
                temps[1].innerText = data.high.toFixed(1) + '°C';
                temps[2].innerText = data.low.toFixed(1) + '°C';
            }
            clearTimeout(this.rT);
            this.rT = setTimeout(function () {
                temps.forEach(function (temp) {
                    temp.style.opacity = 1;
                });
            }, 300);
        }
    };

    var sensorObject = Object.create({
        lastCheck: getElId('lastcheck'),
        refresh: function (data) {
            console.log(this);
            var self = this;
            Object.keys(data.sensors).forEach(function (sensor) {
                if (!self.hasOwnProperty(sensor)) {
                    self[sensor] = Object.create(tempInfo).init(sensor);
                }
                self[sensor].update(data.sensors[sensor]);
            });
            if (active.view.id === 'main') {
                self.updateTime(data.time);
            }
        },
        updateTime: function (time) {
            var self = this;
            console.log(this);
            this.lastCheck.style.opacity = 0;
            this.lastCheck.innerText = moment(time).format('MMMM Do YYYY, HH:mm:ss');
            clearTimeout(this.checkTo);
            this.checkTo = setTimeout(function () {
                self.lastCheck.style.opacity = 1;
            }, 200);
        }
    });

    var graphs = Object.create({
        init: function (options) {
            var finals = [];
            var y = 0;
            var last = {
                high: 0,
                low: 60
            };
            var listView = buttonActions[active.button.id].list;
            options.data.forEach(function (tempdata) {
                var sensArr = Object.keys(tempdata.sensors);
                var i = 0;
                var j = sensArr.length;
                for (i; i < j; i += 1) {
                    var sensor = tempdata.sensors[sensArr[i]];
                    addElement(listView, 'p', 'listdata', 'listdata' + y + i, moment(tempdata.time).format('MMMM Do YYYY, HH:mm:ss') + ' - ' + sensArr[i] + ': ' + sensor);
                    if (sensor !== null) {
                        last = {
                            high: (last.high > sensor) ? last.high : (parseInt(sensor * 100) / 100),
                            low: (sensor < last.low) ? (parseInt(sensor * 100) / 100) : last.low
                        };
                        if (i === 0) {
                            finals[y] = tempdata;
                            y += 1;
                        }
                    }
                }
            });
            var sTime = finals[0].time;
            var eTime = finals[finals.length -1].time;
            var delta = parseInt((eTime - sTime) / 15);
            var graph = new SimpleGraph(options.element, {
                'xmax': new Date(eTime + (delta)),
                'xmin': new Date(sTime - (delta / 5)),
                'ymax': last.high + 0.5,
                'ymin': last.low - 1.5,
                'ylabel': 'temperature °C', 
                //'temperature ℃',
                'data': finals
            });
            return graph;
        },
        update: function (action, fs) {
            var self = this;
            if (fs) {
                graphWrap.style.height = window.innerHeight + 'px';
                graphWrap.className = 'fullscreen mainView';
                graphWrap.style.margin = 0;
                active.view.style.height = graphWrap.style.height;
            } else {
                graphWrap.className = 'mainView';
                var margin = parseInt(window.getComputedStyle(getElId('topbar')).getPropertyValue('height')) + 10 + 'px';
                graphWrap.style.margin = margin + ' 0 0';
                graphWrap.style.height = (window.innerHeight / 100 * 60).toFixed(1) + 'px';
                active.view.style.height = graphWrap.style.height;
            }
            if (curGraph) {
                curGraph.options.element = curGraph.chart.id;
                curGraph = self.init(curGraph.options);
            }
        }
    });
   
   var buttonActions = {
        current: {
            send: history,
            view: 'main'
        },
        hour: {
            send: 'HOUR',
            list: getElId('listHour'),
            view: 'graphHour',
            graph: true
        },
        day: {
            send: 'DAY',
            list: getElId('listDay'),
            view: 'graphDay',
            graph: true
        },
        month: {
            send: 'MONTH',
            list: getElId('listMonth'),
            view: 'graphMonth',
            graph: true
        }
    };
    
    var webSocketConnection = Object.create({
        init: function () {
            var self = this;
            this.connection = new WebSocket(window.location.href.replace('http', 'ws'));
            this.connection.onopen = function () {
                self.connection.send(history);
            };
            
            this.connection.onerror = function (error) {
                console.log(error);
                self.connection.close();
            };

            this.connection.onclose = function () {
                setTimeout(self.init, 1000);
            };

            this.connection.onmessage = function (message) {
                var json = isValidJSON(message.data);
                if (json) {
                    var type = json.type.toLowerCase();
                    if (json.type === tempdata) {
                        sensorObject.refresh(json);
                    } else if (json.type === history) {
                        sensorObject.refresh(json.data[json.data.length - 1]);
                    } else if (json.data !== null && buttonActions.hasOwnProperty(type)) {
                        var action = buttonActions[type];
                        sensorObject.updateTime(json.data[json.data.length - 1].time);
                        if (action.graph) {
                            getElId(action.view).style.height = graphWrap.style.height;
                            curGraph = graphs.init({
                                background: window.getComputedStyle($.getElementsByClassName('mainView')[0]).getPropertyValue('background-color'),
                                element: action.view,
                                type: type,
                                data: json.data
                            });
                        }
                    }
                }
            };
        },
        send: function (data) {
            this.connection.send(data);
        },
        close: function () {
            this.connection.close();
        }
    });
    webSocketConnection.init();

    buttons.onclick = function (event) {
        var eid = event.target.id;
        event.preventDefault();
        if (buttonActions.hasOwnProperty(eid)) {
            var action = buttonActions[eid];
            if (active && active.button !== event.target) {
                active.button.className = 'normal';
                active.view.style.opacity = 0;
                removeEl(active.view);
                if (action.view === 'main') {
                    graphWrap.style.display = 'none';
                } else {
                    graphWrap.style.display = 'block';
                }
            }
            active = null;
            active = {
                button: event.target,
                view: getElId(action.view)
            };
            active.view.style.display = 'block';
            active.view.style.opacity = 1;
            topbar.className = eid;
            active.button.className = 'normal clicked';
            webSocketConnection.send(buttonActions[eid].send);
        }
    };

    fsbutton.onclick = function () {
        var action = buttonActions[active.button.id];
        fs = (!fs) ? true : false;
        graphs.update(action, fs);
    };

    window.onresize = function () {
        if (curGraph) {
            graphs.update(buttonActions[active.button.id], fs);
        }
    };

    window.onclose = function () {
        webSocketConnection.close();
        webSocketConnection = null;
    };

}(window, document));
