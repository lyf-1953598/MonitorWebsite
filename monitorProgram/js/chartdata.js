//#region 全局变量部分
let time = new Date()
var globaldataset;
var globalstrategies;
var colorList = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570',
    '#c4ccd3', '#24ce21', '#cad0b4', '#60775e', '#ce6772', '#d9af92', '#0a131a', '#9b909d', '#7683a1', '#76635d'];

//分类必要条件
var globalaccounts;
var globalaccountsArray;
var globalcolorCategories = [];
//单张图使用
var globalNetValueselected;
var globalBarselected;
var globalDDMselected;
// 净值折线图声明
var chartDom = document.getElementById('main');
var myChart = echarts.init(chartDom);

// 柱状图声明
var chartDomBar = document.getElementById('lineMain');
var myChartBar = echarts.init(chartDomBar);

// 动态回撤折线图声明
var chartDDMDom = document.getElementById('lineDDM');
var myChartDDM = echarts.init(chartDDMDom);

// 标识通过时间选择器确定的时间区间
var globalStartTime;
var globalEndTime;
// 标识当前从表中读到的时间区间
var globalMinStartTime;
var globalMaxEndTime;
//#endregion
// echarts.connect([myChart, myChartBar])

//测试用
// tmpdataset = 

// 导入数据函数,并策略识别进行全局保存
function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    var result = [];
    var curtestdata;
    var strategies;
    globalMinStartTime = time.toLocaleDateString();
    globalMaxEndTime = '1949/10/01';
    reader.onload = function (e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        for (let i = range.s.r; i <= range.e.r; i++) {
            const row = [];
            for (let j = range.s.c; j <= range.e.c; j++) {
                const cell = sheet[XLSX.utils.encode_cell({ r: i, c: j })];

                row.push(cell ? cell.w : undefined);

            }
            // 输入excel日期变数字
            // 最大数字和最小时间区间
            const curdata = new Date(row[1]).toLocaleDateString();
            const curDateData = new Date(row[1]);
            // console.log(curdata);
            if (i == 1) {
                globalMinStartTime = curdata;
                globalMaxEndTime = curdata;
            } else {
                // console.log(curdata);
                const tempMinStartTime = new Date(globalMinStartTime);
                const tempMaxEndTime = new Date(globalMaxEndTime);
                if (tempMinStartTime > curDateData) {
                    globalMinStartTime = curdata;
                }
                if (tempMaxEndTime < curDateData) {
                    globalMaxEndTime = curdata;
                }
            }

            result.push(row);
        }



        // 策略识别
        // console.log(globalMinStartTime);
        // console.log(globalMaxEndTime);
        curtestdata = result;
        const columnIndex = 3;
        const columnData = curtestdata.map(row => row[columnIndex])
        var newArr = columnData.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        })
        newArr.shift();
        strategies = newArr;
        //正则识别策略账户种类 XXX_YY
        // 原始数组
        // console.log(globalaccounts);
        // 获取所有不同的 YY
        globalaccounts = [...new Set(strategies.map(str => str.split("_")[1]))];

        // 构建对应不同 YY 的二维数组
        globalaccountsArray = globalaccounts.map(strategy => {
            // 过滤出包含相同 YY 的字符串
            const filteredArr = strategies.filter(str => str.includes(`_${strategy}`));
            return filteredArr;
        });
        console.log(globalaccounts);
        console.log(globalaccountsArray);


        //颜色

        for (var i = 0; i < globalaccounts.length; i++) {
            globalcolorCategories.push(colorList[i]);
        }
        // console.log(strategies);
        //读取完数据之后进行图表呈现
        // console.log(curtestdata);
        const startTime = '1949-10-01';
        const endTime = time.toLocaleDateString();
        // console.log(endTime);
        // console.log(curtestdata);
        // console.log(typeof (curtestdata));
        // calculateChart(curtestdata, strategies, startTime, endTime);
        showBarTables(curtestdata, strategies, startTime, endTime);
        showMDDTables(curtestdata, strategies, startTime, endTime);
        showNetWorthTables(curtestdata, strategies, startTime, endTime);
        // calculateNetWorth(curtestdata, strategies, startTime, endTime);
        showCharts(curtestdata, strategies);
        showChartsAnother(curtestdata, strategies);
        globaldataset = curtestdata;
        globalstrategies = strategies;
        globalStartTime = startTime;
        globalEndTime = endTime;

        //表和时间选择器一块出现
        if ($(".wrap").hasClass('hide')) {
            $(".wrap").removeClass('hide');
        }
    }
    reader.readAsBinaryString(file);
    // console.log(result);

}

//#region 净值图、柱状图、动态回撤图呈现部分

// 对数据排序，暂时废弃
function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

// 封装折线图标呈现,传入参数时间筛选以及图表等变量的信息
function showTables(curtestdata, strategies, startTime, endTime) {
    const datasetWithFilters = [];
    const seriesList = [];
    echarts.util.each(strategies, function (strategy) {
        var datasetId = 'dataset_' + strategy;
        datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'curtestdata',
            transform: {
                type: 'filter',
                config: {
                    and: [
                        // 修改区间
                        {
                            dimension: '日期',
                            '>=': startTime,
                            '<=': endTime,
                            parser: 'time'
                        },
                        { dimension: '策略', '=': strategy }
                    ]
                }
            }
        });
        // console.log(datasetWithFilters);
        seriesList.push({
            type: 'line',
            areaStyle: {
                // color: 'rgba(255, 165, 0, 0.1)', // 浅橙色，透明度为0.3
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0, color: 'rgba(255, 165, 0, 0.1)' // 颜色从不透明到透明
                    }, {
                        offset: 1, color: 'rgba(255, 0, 0, 0)'
                    }]
                }
            },
            datasetId: datasetId,
            showSymbol: false,
            name: strategy,
            endLabel: {
                // show: true,
                formatter: function (params) {

                    return params.value[3] + ': ' + params.value[11];
                }
            },

            // 调整折现字体的显示
            labelLayout: {
                moveOverlap: 'shiftY'
            },
            emphasis: {
                focus: 'series'
            },
            encode: {
                x: '日期',
                y: '当日收益率',
                label: ['策略', '当日收益率'],
                itemName: '日期',
                tooltip: ['Test', '当日收益率']
            }
        });
        // console.log(seriesList);
    });
    var option = {
        animationDuration: 1000,
        dataset: [
            {
                id: 'curtestdata',
                source: curtestdata
            },
            ...datasetWithFilters
        ],
        legend: {
            orient: 'vertical',
            type: 'scroll',
            right: 0,
            top: 'center'
        },
        title: {
            text: '收益走势图',
            textStyle: {
                fontSize: 28,
                textAlign: 'center',
            },
            left: '40%'
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        toolbox: {
            show: true,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: { readOnly: false },
                magicType: { type: ['line', 'bar'] },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'time',
            // name: '时间',
            nameLocation: 'middle',
            axisPointer: {
                // 绑定折线图的数据
                link: [{ xAxisIndex: 'all' }],
            }
        },
        yAxis: {
            // name: '当日收益率',
            // nameTextStyle:{
            //     fontSize:20,    
            // }
        },
        dataZoom: [
            {
                textStyle: {
                    color: '#8392A5'
                },
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                brushSelect: true
            },
            {
                type: 'inside'
            }
        ],
        grid: {
            right: 140
        },
        series: seriesList
    };
    // myChart.setOption(option,true);

    // let chartDom = document.getElementById('main');
    chartDom.removeAttribute("_echarts_instance_");
    // const myChart = echarts.init(chartDom);

    myChart.setOption(option, true);
    console.log("myChart", myChart);
}
//------------------------------------------------------------------------------------------
//封装净值图呈现，传递参数
function showNetWorthTables(curtestdata, strategies, startTime, endTime) {
    var result = calculateNetWorth(curtestdata, strategies, startTime, endTime);
    // console.log(result);

    // console.log(visualMap);
    // console.log(myChart);
    var option = {
        animationDuration: 1000,
        dataset: [
            {
                id: 'newDataArr',
                source: result[0]
            },
            ...result[1]
        ],
        legend: {
            orient: 'vertical',
            type: 'scroll',
            right: 0,
            top: 'center'
        },
        visualMap: {
            // type: 'category',
            left: 0,
            top: 'center',
            dimension: 0,
            categories: globalaccounts,
            inRange: {
                color: globalcolorCategories
            },
            selected: globalNetValueselected
        },
        toolbox: {
            show: true,
            feature: {
                // dataZoom: {
                //     yAxisIndex: 'none'
                // },
                // restore: {},
                saveAsImage: {}
            }
        },
        title: {
            text: '净值走势图',
            textStyle: {
                fontSize: 28,
                textAlign: 'center',
            },
            left: '40%'
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        xAxis: {
            type: 'time',
            // name: '时间',
            nameLocation: 'middle',
            axisPointer: {
                // 绑定折线图的数据
                link: [{ xAxisIndex: 'all' }],
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function (params) {
                    return params * 100 + '%';
                }
            },
            min: 0.9, // y 轴最小值为 0.9
            interval: 0.02, // y 轴刻度间隔为 0.02
            // name: '当日收益率',
            // nameTextStyle:{
            //     fontSize:20,    
            // }
        },
        dataZoom: [
            {
                show: false,
                // start: 0,
                // end: 100,
                textStyle: {
                    color: '#8392A5'
                },
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                brushSelect: true
            }
            // {
            //     type: 'inside',
            //     // startValue: 1677600000000,
            //     // endValue:1679846400000
            // },

        ],
        grid: {
            right: 140
        },
        series: result[2]
    };
    chartDom.removeAttribute("_echarts_instance_");
    // const myChart = echarts.init(chartDom);
    myChart.setOption(option, true);

}

//净值图分组
myChart.getZr().on('click', function (params) {
    // console.log(params);
    // console.log();
    // || (params.target?.style?.fill)
    if ((params.target?.style?.text) || (params.target?.style?.fill && params.target?.style?.fill != '#000')) {
        // 执行需要的代码
        // console.log("判断通过");
        let visualMap = myChart.getModel().getComponent('visualMap');
        // console.log(visualMap);
        var newStrategies = [];
        globalNetValueselected = visualMap.option.selected;
        //判定哪些被选择，哪些没有被选择，修改策略表然后呈现
        var localselected = visualMap.option.selected;
        // console.log("localselected",localselected);
        // console.log("globalaccounts",globalaccounts);
        for (let i = 0; i < globalaccounts.length; i++) {
            // 账户数目
            if (localselected[globalaccounts[i]]) {
                // console.log("选择了",globalaccounts[i],"索引为",i,"对应策略组为",globalaccountsArray[i]);
                newStrategies = newStrategies.concat(globalaccountsArray[i]);
            }
        }
        // console.log(newStrategies);
        // console.log(selectArray.length);
        // console.log(globalstrategies);
        showNetWorthTables(globaldataset, newStrategies, globalStartTime, globalEndTime);

    } else {
        // console.log('params.target.style.text 不存在');
    }
});
//-------------------------------------------------------------------------------------
// 封装柱状图表呈现，传参
function showBarTables(curtestdata, strategies, startTime, endTime) {
    const datasetWithFilters = [];
    const seriesList = [];
    echarts.util.each(strategies, function (strategy) {
        var datasetId = 'dataset_' + strategy;
        datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'curtestdata',
            transform: {
                type: 'filter',
                config: {
                    and: [
                        // 修改区间
                        {
                            dimension: '日期',
                            '>=': startTime,
                            '<=': endTime,
                            parser: 'time'
                        },
                        { dimension: '策略', '=': strategy }
                    ]
                }
            }
        });
        // console.log(datasetWithFilters);
        seriesList.push({
            type: 'bar',
            datasetId: datasetId,
            showSymbol: false,
            name: strategy,
            // 末端标签
            endLabel: {
                // show: true,
                formatter: function (params) {
                    return '当日收益率: ' + params.value[11];
                    // return params.value[3] + ': ' + params.value[11];
                }
            },
            // 调整折现字体的显示
            labelLayout: {
                moveOverlap: 'shiftY'
            },
            emphasis: {
                focus: 'series'
            },
            encode: {
                x: '日期',
                y: '当日收益率',
                itemName: '日期',
                tooltip: ['Test', '当日收益率']
            }
        });
        // console.log(seriesList);
    });
    var optionBar = {
        // color:colorList,
        animationDuration: 1000,
        dataset: [
            {
                id: 'curtestdata',
                source: curtestdata
            },
            ...datasetWithFilters
        ],
        legend: {
            orient: 'vertical',
            type: 'scroll',
            right: 0,
            top: 'center'
        },
        title: {
            text: '每日收益柱状图',
            textStyle: {
                fontSize: 28,
                textAlign: 'center',
            },
            left: '40%'
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        toolbox: {
            show: true,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: { readOnly: false },
                magicType: { type: ['line', 'bar'] },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'time',
            // name: '时间',
            nameLocation: 'middle',
            axisPointer: {
                // 绑定折线图的数据
                link: [{ xAxisIndex: 'all' }],
            },
        },
        yAxis: {
            // name: '当日收益率',
            // nameTextStyle:{
            //     fontSize:20,    
            // }
        },
        dataZoom: [
            {
                textStyle: {
                    color: '#8392A5'
                },
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                brushSelect: true
            },
            {
                type: 'inside'
            }
        ],
        grid: {
            right: 140
        },
        series: seriesList
    };
    // myChart.setOption(option,true);
    // let chartDomBar = document.getElementById('lineMain');
    chartDomBar.removeAttribute("_echarts_instance_");
    // const myChart = echarts.init(chartDomBar);

    myChartBar.setOption(optionBar, true);
    console.log("myChartBar", myChartBar);
}

//---------------------------------------------------------------------------------------
// 封装动态回撤图表呈现，传递参数
function showMDDTables(curtestdata, strategies, startTime, endTime) {
    var result = calculateMMD(curtestdata, strategies, startTime, endTime);
    // console.log(result);
    var option = {
        animationDuration: 1000,
        dataset: [
            {
                id: 'newDataArr',
                source: result[0]
            },
            ...result[1]
        ],
        legend: {
            orient: 'vertical',
            type: 'scroll',
            right: 0,
            top: 'center'
        },
        //2023-04-17
        visualMap: {
            // type: 'category',
            left: 0,
            top: 'center',
            dimension: 0,
            categories: globalaccounts,
            inRange: {
                color: globalcolorCategories
            },
            selected: globalDDMselected
        },
        toolbox: {
            show: true,
            feature: {
                // dataZoom: {
                //     yAxisIndex: 'none'
                // },
                // restore: {},
                saveAsImage: {}
            }
        },
        title: {
            text: '动态回撤走势图',
            textStyle: {
                fontSize: 28,
                textAlign: 'center',
            },
            left: '40%'
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        xAxis: {
            type: 'time',
            // name: '时间',
            nameLocation: 'middle',
            axisPointer: {
                // 绑定折线图的数据
                link: [{ xAxisIndex: 'all' }],
            }
        },
        yAxis: {
            // name: '当日收益率',
            // nameTextStyle:{
            //     fontSize:20,    
            // }
        },
        dataZoom: [
            {
                // start: 0,
                // end: 100,
                textStyle: {
                    color: '#8392A5'
                },
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                brushSelect: true
            },
            {
                type: 'inside',
                // startValue: 1677600000000,
                // endValue:1679846400000
            },

        ],
        grid: {
            right: 140
        },
        series: result[2]
    };
    chartDDMDom.removeAttribute("_echarts_instance_");
    myChartDDM.setOption(option, true);
    // console.log(myChartDDM.getOption());

}
//overwrite 时间滑动
myChartDDM.on('datazoom', function (params) {

    // 获取时间轴组件实例
    // var timeStart = myChartDDM._model.option.dataZoom[1].startValue;
    // var timeEnd = myChartDDM._model.option.dataZoom[1].endValue;
    // console.log("时间轴当前区间：", timeStart, timeEnd);

    // 获取时间轴的最大最小值
    // var dataZoomStart = params.batch[0].start;
    // var dataZoomEnd = params.batch[0].end;
    // var startTime = timeAxis.axis.scale.parse(dataZoomStart);
    // var endTime = timeAxis.axis.scale.parse(dataZoomEnd);
    console.log(myChartDDM.getModel().getComponent('dataZoom').option);
    let rangeStart = myChartDDM.getModel().getComponent('dataZoom').option.startValue;
    let rangeEnd = myChartDDM.getModel().getComponent('dataZoom').option.endValue;
    console.log(rangeStart);
    console.log(rangeEnd);
    // dataZoomInstance.option.startValue = '2023-03-01';
    // dataZoomInstance.option.endValue = '2023-03-31';
    // console.log(dataZoomInstance);


    var curStartZone;
    var curEndZone;
    // 获取当前时间轴的范围
    var startValue, endValue;
    console.log(params);
    //两种操作方式都需要被覆写
    if (params.batch) {
        // console.log("鼠标滚轮");
        startValue = params.batch[0].start;
        endValue = params.batch[0].end;
    } else {
        // console.log("鼠标拖动");
        startValue = params.start;
        endValue = params.end;
    }
    // console.log(startValue);
    // console.log(endValue);
    // 当前表单的最长时间区间
    const tempTableMinStartTime = new Date(globalMinStartTime);
    const tempTableMaxEndTime = new Date(globalMaxEndTime);
    // 当前选择器的时间区间
    const pickerMinStartTime = new Date(globalStartTime);
    const pickerMaxEndTime = new Date(globalEndTime);
    //实际时间轴区间
    if (tempTableMinStartTime < pickerMinStartTime) {
        curStartZone = pickerMinStartTime.toLocaleDateString();
    } else {
        curStartZone = tempTableMinStartTime.toLocaleDateString();
    }

    if (tempTableMaxEndTime > pickerMaxEndTime) {
        curEndZone = pickerMaxEndTime.toLocaleDateString();
    } else {
        curEndZone = tempTableMaxEndTime.toLocaleDateString();
    }
    console.log(curStartZone);
    console.log(curEndZone);

    //有value，计算间隔
    curStartZoneTime = new Date(curStartZone);
    curEndZoneTime = new Date(curEndZone);
    // const dayMs = 1000 * 60 * 60 * 24; // 一天的毫秒数
    // const diffDays = Math.floor((curEndZoneTime.getTime()-curStartZoneTime.getTime()) / dayMs);
    const diffMs = Math.floor(curEndZoneTime.getTime() - curStartZoneTime.getTime());
    // console.log(curStartZoneTime.getMilliseconds());
    // console.log(curEndZoneTime);
    // const initMilliseconds = curStartZoneTime.getMilliseconds();
    const newStartTime = new Date(curStartZoneTime);
    const newEndTime = new Date(curStartZoneTime);
    newStartTime.setMilliseconds(curStartZoneTime.getMilliseconds() + diffMs * startValue / 100);
    newEndTime.setMilliseconds(curStartZoneTime.getMilliseconds() + diffMs * endValue / 100)
    // console.log(newStartTime);
    // console.log(newEndTime);
    globalStartTime = newStartTime.toLocaleDateString();
    globalEndTime = newEndTime.toLocaleDateString();
    // console.log(globalStartTime);
    // console.log(globalEndTime);
    var result = calculateMMD(globaldataset, globalstrategies, globalStartTime, globalEndTime);
    console.log(result);
    var option = {
        animationDuration: 1000,
        dataset: [
            {
                id: 'newDataArr',
                source: result[0]
            },
            ...result[1]
        ],
        legend: {
            orient: 'vertical',
            type: 'scroll',
            right: 0,
            top: 'center'
        },
        toolbox: {
            show: true,
            feature: {
                // dataZoom: {
                //     yAxisIndex: 'none'
                // },
                // restore: {},
                saveAsImage: {}
            }
        },
        title: {
            text: '动态回撤走势图',
            textStyle: {
                fontSize: 28,
                textAlign: 'center',
            },
            left: '40%'
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis'
        },
        xAxis: {
            type: 'time',
            // name: '时间',
            nameLocation: 'middle',
            axisPointer: {
                // 绑定折线图的数据
                link: [{ xAxisIndex: 'all' }],
            }
        },
        yAxis: {
            // name: '当日收益率',
            // nameTextStyle:{
            //     fontSize:20,    
            // }
        },
        dataZoom: [
            {
                textStyle: {
                    color: '#8392A5'
                },
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                brushSelect: true
            },
            {
                type: 'slider',
                start: 0,
                end: 100,
                // startValue: 1677600000000,
                // endValue:1680192000000
            },

        ],
        grid: {
            right: 140
        },
        series: result[2]
    };
    chartDDMDom.removeAttribute("_echarts_instance_");
    myChartDDM.setOption(option, true);
    // let dataZoomInstance = myChartDDM.getModel().getComponent('dataZoom');
    // dataZoomInstance.option.startValue = '2023-03-01';
    // dataZoomInstance.option.endValue = '2023-03-31';
    // console.log(dataZoomInstance);

    // myChartDDM.dispatchAction({
    //     type:'dataZoom',
    //     dataZoomIndex:1,
    //     startValue:dataZoomInstance.option.startValue,
    //     endValue:dataZoomInstance.option.endValue
    // })
    console.log(myChartDDM.getOption());

});

//overwrite 动态回撤分组
//净值图分组
myChartDDM.getZr().on('click', function (params) {
    console.log(params);
    if ((params.target?.style?.text) || (params.target?.style?.fill && params.target?.style?.fill != '#000')) {
        // 执行需要的代码
        // console.log("判断通过");
        let visualMap = myChartDDM.getModel().getComponent('visualMap');
        // console.log(visualMap);
        var newStrategies = [];
        globalDDMselected = visualMap.option.selected;
        //判定哪些被选择，哪些没有被选择，修改策略表然后呈现
        var localselected = visualMap.option.selected;
        // console.log("localselected",localselected);
        // console.log("globalaccounts",globalaccounts);
        for (let i = 0; i < globalaccounts.length; i++) {
            // 账户数目
            if (localselected[globalaccounts[i]]) {
                // console.log("选择了",globalaccounts[i],"索引为",i,"对应策略组为",globalaccountsArray[i]);
                newStrategies = newStrategies.concat(globalaccountsArray[i]);
            }
        }
        // console.log(newStrategies);
        // console.log(selectArray.length);
        // console.log(globalstrategies);
        showMDDTables(globaldataset, newStrategies, globalStartTime, globalEndTime);

    } else {
        // console.log('params.target.style.text 不存在');
    }
});



//封装净值计算全部内容
function calculateNetWorth(curtestdata, strategies, startTime, endTime) {
    var totalResult = [];
    const datasetWithFilters = [];
    const seriesList = [];
    //数据分组
    // 按第二列进行分组，得到三维数组
    var groups = curtestdata.reduce((acc, cur) => {
        const key = cur[3];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(cur);
        return acc;
    }, {});
    var result = Object.values(groups);
    //表头分离
    var firstLine = result.shift();
    firstLine[0].push("净值");
    // console.log(firstLine);
    // console.log(result);
    // 时间筛选
    result = filterDataByTime(result, startTime, endTime);
    // console.log(result);
    //计算初始净值
    for (let i = 0; i < result.length; i++) {
        let curValue;
        let netValue = [];
        // let cur, max;
        // let netWorth;
        for (let j = 0; j < result[i].length; j++) {
            if (j == 0) {

                curValue = parseFloat(result[i][j][11]) + 1;
                // console.log(result[i][j][11]);
            }
            else {
                curValue = curValue * (parseFloat(result[i][j][11]) + 1);
            }
            // 进行净值临时存储
            // 添加进一个临时数组中
            netValue.push(curValue);
            //如果没有该元素，则添加，否则更新
            if (result[i][j].length == 14) {
                result[i][j].push(curValue);
            } else {
                result[i][j][14] = curValue;
            }
        }
        //净值计算正常     
    }
    // console.log(result);
    //将三维数组解放为二维数组，添加表头
    // var flattenedArr = result.flat(2); // 将三维数组变成二维数组
    // console.log(flattenedArr);
    var newDataArr = [];
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
            newDataArr.push(result[i][j]);
        }
    }
    //净值回收完成
    newDataArr.unshift(firstLine[0]);
    // console.log(newDataArr);

    //数据传入
    echarts.util.each(strategies, function (strategy) {
        var datasetId = 'dataset_' + strategy;
        datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'newDataArr',
            transform: {
                type: 'filter',
                config: {
                    and: [
                        // 修改区间
                        { dimension: '策略', '=': strategy }
                    ]
                }
            }
        });
        // console.log(datasetWithFilters);
        seriesList.push({
            type: 'line',
            areaStyle: {
                // color: 'rgba(255, 165, 0, 0.1)', // 浅橙色，透明度为0.3
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0, color: 'rgba(255, 165, 0, 0.1)' // 颜色从不透明到透明
                    }, {
                        offset: 1, color: 'rgba(255, 0, 0, 0)'
                    }]
                }
            },
            datasetId: datasetId,
            showSymbol: false,
            name: strategy,
            // 调整折现字体的显示
            labelLayout: {
                moveOverlap: 'shiftY'
            },
            emphasis: {
                focus: 'series'
            },
            encode: {
                x: '日期',
                y: '净值',
                label: ['策略', '净值'],
                itemName: '日期',
                tooltip: ['Test', '净值']
            }
        });
        // console.log(seriesList);
    });
    totalResult.push(newDataArr);
    totalResult.push(datasetWithFilters);
    totalResult.push(seriesList);
    return totalResult;
}

//封装计算动态回撤地全部内容
function calculateMMD(curtestdata, strategies, startTime, endTime) {
    var totalResult = [];
    const datasetWithFilters = [];
    const seriesList = [];
    //数据分组
    // 按第二列进行分组，得到三维数组
    var groups = curtestdata.reduce((acc, cur) => {
        const key = cur[3];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(cur);
        return acc;
    }, {});
    var result = Object.values(groups);
    //表头分离
    var firstLine = result.shift();
    firstLine[0].push("动态回撤");
    // console.log(firstLine);
    // console.log(result);
    // 时间筛选
    result = filterDataByTime(result, startTime, endTime);
    // console.log(result);
    //计算初始净值和动态回撤
    for (let i = 0; i < result.length; i++) {
        let curValue;
        let netValue = [];
        let cur, max;
        let mmd;
        for (let j = 0; j < result[i].length; j++) {
            if (j == 0) {

                curValue = parseFloat(result[i][j][11]) + 1;
                // console.log(result[i][j][11]);
            }
            else {
                curValue = curValue * (parseFloat(result[i][j][11]) + 1);
            }
            // 进行净值临时存储
            // 添加进一个临时数组中
            netValue.push(curValue);


        }
        //净值计算正常
        // console.log(netValue);
        for (let j = 0; j < result[i].length; j++) {
            if (j == 0) {
                //第一个初始值
                max = netValue[j];
            } else {
                if (netValue[j] > max) {
                    max = netValue[j];
                }
            }
            cur = netValue[j];
            //动态回撤计算
            mmd = -(max - cur) / max;
            //计算完成后放入数组
            // console.log(mmd);
            // console.log(result[i][j]);
            //如果没有该元素，则添加，否则更新
            if (result[i][j].length == 13) {
                result[i][j].push(mmd);
            } else {
                result[i][j][13] = mmd;
            }


        }
    }
    // console.log(result);
    //将三维数组解放为二维数组，添加表头
    // var flattenedArr = result.flat(2); // 将三维数组变成二维数组
    // console.log(flattenedArr);
    var newDataArr = [];
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
            newDataArr.push(result[i][j]);
        }
    }
    //动态回撤回收完成
    newDataArr.unshift(firstLine[0]);
    // console.log(newDataArr);

    //数据传入
    echarts.util.each(strategies, function (strategy) {
        var datasetId = 'dataset_' + strategy;
        datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'newDataArr',
            transform: {
                type: 'filter',
                config: {
                    and: [
                        // 修改区间
                        { dimension: '策略', '=': strategy }
                    ]
                }
            }
        });
        // console.log(datasetWithFilters);
        seriesList.push({
            type: 'line',
            areaStyle: {
                // color: 'rgba(255, 165, 0, 0.1)', // 浅橙色，透明度为0.3
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0, color: 'rgba(255, 165, 0, 0.1)' // 颜色从不透明到透明
                    }, {
                        offset: 1, color: 'rgba(255, 0, 0, 0)'
                    }]
                }
            },
            datasetId: datasetId,
            showSymbol: false,
            name: strategy,
            // 调整折现字体的显示
            labelLayout: {
                moveOverlap: 'shiftY'
            },
            emphasis: {
                focus: 'series'
            },
            encode: {
                x: '日期',
                y: '动态回撤',
                label: ['策略', '动态回撤'],
                itemName: '日期',
                tooltip: ['Test', '动态回撤']
            }
        });
        // console.log(seriesList);
    });

    totalResult.push(newDataArr);
    totalResult.push(datasetWithFilters);
    totalResult.push(seriesList);
    return totalResult;
}


// 时间选择器
var now = new Date();
// 获取当前月份
var year = now.getFullYear();
var month = now.getMonth();
var day = now.getDay();

//计算本月开始日期和结束日期
var startMonthDate = new Date(year, month, 1).toLocaleDateString();
//本月测试正常
// console.log("本月开始日期：",startMonthDate);
// console.log("本月结束日期：",now.toLocaleDateString());

//本周测试正常
var startWeekDate = getFirstDayOfWeek(now).toLocaleDateString(); // 获取当前日期所在周的第一天
// console.log("本周开始日期：",startWeekDate);
// console.log("本周结束日期：",now.toLocaleDateString());

var fastTime = {
    true: {
        4: { // 双日历天、小时的快速选择格式
            '最近7天': { startTime: moment().subtract(7, 'day').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') },
            '最近一个月': { startTime: moment().subtract(1, 'month').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') },
            '最近三个月': { startTime: moment().subtract(3, 'month').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') }
        },
        5: { // 双日历天、小时的快速选择格式
            '至今': { startTime: '1970-01-01', endTime: moment().format('YYYY-MM-DD') },
            '本周': { startTime: startWeekDate, endTime: moment().format('YYYY-MM-DD') },
            '本月': { startTime: startMonthDate, endTime: moment().format('YYYY-MM-DD') },
            '最近7天': { startTime: moment().subtract(7, 'day').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') },
            '最近一个月': { startTime: moment().subtract(1, 'month').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') },
            '最近三个月': { startTime: moment().subtract(3, 'month').format('YYYY-MM-DD'), endTime: moment().format('YYYY-MM-DD') }
        },
        6: { // 双日历周的快速选择格式
            '本周': { startTime: moment().startOf('week').subtract(0, 'week').format('YYYY-MM-DD'), endTime: moment().endOf('week').format('YYYY-MM-DD') },
            '最近2周': { startTime: moment().startOf('week').subtract(2, 'week').format('YYYY-MM-DD'), endTime: moment().endOf('week').format('YYYY-MM-DD') },
            '最近4周': { startTime: moment().startOf('week').subtract(4, 'week').format('YYYY-MM-DD'), endTime: moment().endOf('week').format('YYYY-MM-DD') },
            '最近8周': { startTime: moment().startOf('week').subtract(8, 'week').format('YYYY-MM-DD'), endTime: moment().endOf('week').format('YYYY-MM-DD') },
        },
        7: { // 双日历月的快速选择格式
            "本月": { startTime: moment().startOf('month').format('YYYY-MM-DD'), endTime: moment().endOf('month').format('YYYY-MM-DD') },
            "本年": { startTime: moment().startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('month').format('YYYY-MM-DD') },
            "最近六个月": { startTime: moment().startOf('month').subtract(6, 'month').format('YYYY-MM-DD'), endTime: moment().endOf('month').format('YYYY-MM-DD') }
        },
        8: { // 双日历季的快速选择格式
            "本季度": { startTime: moment().startOf('quarter').format('YYYY-MM-DD'), endTime: moment().endOf('quarter').format('YYYY-MM-DD') },
            "今年至今": { startTime: moment().startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('quarter').format('YYYY-MM-DD') },
            "上一季度": { startTime: moment().subtract(1, 'quarter').startOf('quarter').format('YYYY-MM-DD'), endTime: moment().subtract(1, 'quarter').endOf('quarter').format('YYYY-MM-DD') }
        },
        9: { // 双日历年的快速选择格式
            "今年": { startTime: moment().startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('year').format('YYYY-MM-DD') },
            "近一年": { startTime: moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('year').format('YYYY-MM-DD') },
            "近二年": { startTime: moment().subtract(2, 'year').startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('year').format('YYYY-MM-DD') },
            "近十一年": { startTime: moment().subtract(11, 'year').startOf('year').format('YYYY-MM-DD'), endTime: moment().endOf('year').format('YYYY-MM-DD') }
        }
    },
    false: {
        4: {  // 单日历天和小时的快速时间选择格式
            '今天': { startTime: moment().format('YYYY-MM-DD') },
            '昨天': { startTime: moment().subtract(1, 'day').format('YYYY-MM-DD') },
            '一周前': { startTime: moment().subtract(7, 'day').format('YYYY-MM-DD') },
        },
        5: {  // 单日历天和小时的快速时间选择格式
            '今天': { startTime: moment().format('YYYY-MM-DD') },
            '昨天': { startTime: moment().subtract(1, 'day').format('YYYY-MM-DD') },
            '一周前': { startTime: moment().subtract(7, 'day').format('YYYY-MM-DD') },
        },
        6: { // 单日历周的快速选择格式
            '本周': { startTime: moment().startOf('week').subtract(0, 'week').format('YYYY-MM-DD') },
            '上一周': { startTime: moment().startOf('week').subtract(1, 'week').format('YYYY-MM-DD') },
            '上二周': { startTime: moment().startOf('week').subtract(2, 'week').format('YYYY-MM-DD') },
        },
        7: {  // 单选日历月的快速时间选择格式
            '当前月': { startTime: moment().startOf('month').format('YYYY-MM-DD') },
            '一个月前': { startTime: moment().startOf('month').subtract(1, 'month').format('YYYY-MM-DD') },
            '半年前': { startTime: moment().startOf('month').subtract(6, 'month').format('YYYY-MM-DD') },
            '一年前': { startTime: moment().startOf('month').subtract(12, 'month').format('YYYY-MM-DD') },
        },
        8: {  // 单选日历季的快速时间选择格式
            '本季度': { startTime: moment().startOf('quarter').format('YYYY-MM-DD') },
            '上一季度': { startTime: moment().startOf('quarter').subtract(1, 'quarter').format('YYYY-MM-DD') },
            '上二季度': { startTime: moment().startOf('quarter').subtract(2, 'quarter').format('YYYY-MM-DD') },
        },
        9: {  // 单选日历年的快速时间选择格式
            '今年': { startTime: moment().startOf('year').format('YYYY-MM-DD') },
            '去年': { startTime: moment().startOf('year').subtract(1, 'year').format('YYYY-MM-DD') },
            '前年': { startTime: moment().startOf('year').subtract(2, 'year').format('YYYY-MM-DD') },
        },
    }

}

// 时间选择点击事件
$('.wrap').on('click', function () {
    var _this = this;
    // console.log(_this);
    var reportTimeType = 5;
    var double = true;
    if (!$(this).next('[name="datePicker"]').length) {
        $(this).after("<div class='datePicker-x' name='datePicker'></div>");
        datePicker = $('.datePicker-x').datePicker({
            reportTimeType: reportTimeType, // 4代表小时、5代表天、6代表周、7代表月、8代表季、9代表年
            startDom: $(_this).find('input[name="startTime"]'),  // 开始时间要赋值的DOM元素
            endDom: $(_this).find('input[name="endTime"]'),  // 结束时间要赋值的DOM元素
            format: 'YYYY-MM-DD',
            fastTime: fastTime[double][reportTimeType], // 快速选择的时间
            isFast: true,   // 是否显示快速选择的选项
            isDouble: double,   // 是否双选择的日历
            disabledDate: false,    // 是否禁用以后的时间
            yes: function (startTime, endTime) {    // 成功赋值前的回调可改变赋值的时间格式
                // console.log("在此处修改成功");
                startTime = new Date(startTime).toLocaleDateString();
                endTime = new Date(endTime).toLocaleDateString();
                globalStartTime = startTime;
                globalEndTime = endTime;


                showBarTables(globaldataset, globalstrategies, startTime, endTime);
                showMDDTables(globaldataset, globalstrategies, startTime, endTime);
                showNetWorthTables(globaldataset, globalstrategies, startTime, endTime);
                // 更换目录
            },
        });
    } else {
        if ($(this).next('[name="datePicker"]').hasClass('hide')) {
            $(this).next('[name="datePicker"]').removeClass('hide');
            //在此处渲染
            datePicker.render();
        } else {
            $(this).next('[name="datePicker"]').addClass('hide');

        }
    }



});

//时间格式转换
function formatDate(numb, format) {
    const time = new Date((numb - 1) * 24 * 3600000 + 1)
    time.setYear(time.getFullYear() - 70)
    const year = time.getFullYear() + ''
    const month = time.getMonth() + 1 + ''
    const date = time.getDate() - 1 + ''
    if (format && format.length === 1) {
        return year + format + month + format + date
    }
    return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
}

function getFirstDayOfWeek(date) {
    const day = date.getDay() || 7; // 获取当前星期几，如果是星期天返回7，否则返回1-6
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1 - day); // 计算本周第一天的日期
}

function getFirstDayOfRecentTwoWeek(date) {
    const day = date.getDay() || 7; // 获取当前星期几，如果是星期天返回7，否则返回1-6
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1 - day - 7); // 计算本周第一天的日期 
}

//时间筛选
function filterDataByTime(data, startTime, endTime) {
    const result = [];

    for (let i = 0; i < data.length; i++) {
        const group = data[i];
        const filteredGroup = [];

        for (let j = 0; j < group.length; j++) {
            const row = group[j];
            // console.log(row);
            const time = new Date(row[1]);
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(endTime);
            // console.log(time);
            if (time >= startDateTime && time <= endDateTime) {
                filteredGroup.push(row);
            }
        }

        if (filteredGroup.length > 0) {
            result.push(filteredGroup);
        }
    }

    return result;
}


// 定义随机颜色函数 暂时废弃
function randomColor() {
    return 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')';
}

//#endregion




// 定义表格部分
function showCharts(curtestdata, strategies) { 

    const columnDefs = [
        {
            field: 'show',
            cellRenderer: ShowCellRenderer,
            rowSpan: rowSpan,
            cellClassRules: {
                'show-cell': 'value !== undefined',
            },
            width: 200,
            headerName:'策略', 
        },
        { field: 'strategy', headerName:'账户', },
    
        { field: 'today', headerName:'当日',cellStyle: valueCellStyle },
        { field: 'thisweek', headerName:'本周',cellStyle: valueCellStyle },
        { field: 'recenttwoweeks',headerName:'这两周', cellStyle: valueCellStyle },
        { field: 'thismonth', headerName:'本月',cellStyle: valueCellStyle },
    ];

    const gridOptions = {
        columnDefs: columnDefs,
        defaultColDef: {
            resizable: true,
            width: 170,
        },
        rowData: buildNetValueTable(curtestdata,strategies),
        suppressRowTransform: true,
    };


    //初始化
    const gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
}


function showChartsAnother(curtestdata, strategies) { 

    const columnDefs = [
        {
            field: 'show',
            cellRenderer: ShowCellRendererAnother,
            rowSpan: rowSpan,
            cellClassRules: {
                'show-cell': 'value !== undefined',
            },
            width: 200,
            headerName:'账户', 
        },
        { field: 'strategy', headerName:'策略', },
    
        { field: 'today', headerName:'当日',cellStyle: valueCellStyle },
        { field: 'thisweek', headerName:'本周',cellStyle: valueCellStyle },
        { field: 'recenttwoweeks',headerName:'这两周', cellStyle: valueCellStyle },
        { field: 'thismonth', headerName:'本月',cellStyle: valueCellStyle },
    ];

    const gridOptions = {
        columnDefs: columnDefs,
        defaultColDef: {
            resizable: true,
            width: 170,
        },
        rowData: buildNetValueTableAnother(curtestdata,strategies),
        suppressRowTransform: true,
    };


    //初始化
    const gridDiv = document.querySelector('#myGridAnother');
    new agGrid.Grid(gridDiv, gridOptions);
}




function rowSpan(params) {
    // console.log(params);
    if (params.data.show) {
        return params.data.show.count;
    } else {
        return 1;
    }
}

//行跨越部分
class ShowCellRenderer {
    init(params) {
        // console.log(params);
        const cellBlank = !params.value;
        if (cellBlank) {
            return;
        }

        this.ui = document.createElement('div');
        this.ui.innerHTML =
            '<div class="show-name">' +
            params.value.prefix +
            '' +
            '</div>';
            //  +
            // '<div class="show-presenter">' +
            // params.value.prefix +
            // '</div>';
    }

    getGui() {
        return this.ui;
    }

    refresh() {
        return false;
    }
}

class ShowCellRendererAnother {
    init(params) {
        // console.log(params);
        const cellBlank = !params.value;
        if (cellBlank) {
            return;
        }

        this.ui = document.createElement('div');
        this.ui.innerHTML =
            '<div class="show-name">' +
            params.value.suffix +
            '' +
            '</div>';
            //  +
            // '<div class="show-presenter">' +
            // params.value.prefix +
            // '</div>';
    }

    getGui() {
        return this.ui;
    }

    refresh() {
        return false;
    }
}

function valueCellStyle(params) {
    const value = params.value;
    const color = getColor(value);
    return { background: color };
}

function getColor(value) {
    // console.log(value);
    const startColor = [255, 194, 102, 0.1];
    const endColor = [255, 194, 102, 0.9];
    const percent = value / 0.8;
    const color = [];
    for (let i = 0; i < 4; i++) {
        // console.log((endColor[i] - startColor[i]) * percent + startColor[i]);
        color.push(((endColor[i] - startColor[i]) * percent + startColor[i]));
    }
    // console.log(color);
    // `rgb(${color[0]}, ${color[1]}, ${color[2]})
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;

}

// setup the grid after the page has finished loading
// document.addEventListener('DOMContentLoaded', function () {
//     const gridDiv = document.querySelector('#myGrid');
//     new agGrid.Grid(gridDiv, gridOptions);
// });


function buildNetValueTable(curtestdata, strategies) {
    var valueArray = buildArray(curtestdata,strategies);
    //添加相关元素来做行跨越
    // 策略识别

    //正则识别策略账户种类 XXX_YY
    // 原始数组
    // console.log(globalaccounts);
    // 获取所有不同的 XXX
    var strategyType = [...new Set(strategies.map(str => str.split("_")[0]))];
    console.log(strategyType);

    // 遍历数组b，找到以b元素为前缀的对象并添加index属性
    strategyType.forEach((prefix, index) => {
        valueArray.forEach(obj => {
            if (obj.strategy.startsWith(prefix)) {
                obj.index = index;
            }
        });
    });

    // 按照index属性进行排序
    valueArray.sort((obj1, obj2) => obj1.index - obj2.index);
    console.log(valueArray);

    // 添加属性
    // 对象数组按照strategy属性排序
    const counts = {};
    strategyType.forEach(prefix => {
        counts[prefix] = 0;
    });

    valueArray.forEach(obj => {
        const prefix = obj.strategy.split('_')[0];
        counts[prefix]++;
    });
    const c = strategyType.map(prefix => counts[prefix]);
    let lastPrefix;
    valueArray.forEach(obj => {
        const prefix = obj.strategy.split('_')[0];
        if (prefix !== lastPrefix) {
            lastPrefix = prefix;
            var tmp = {
                count: c[strategyType.indexOf(prefix)],
                prefix: prefix

            }
            obj.show = tmp;
        }
    });
    console.log(valueArray);
    return valueArray;


}


function buildArray(curtestdata, strategies){
    //表格数据处理
    // globaldataset 当前全局存储的是一个二维数组[[标题1，标题2，标题3....][elements1,elements2,....]]-> [{标题1：ele1,....}{}{}]
    // 计算净值有方法，设置封装即可，返回怎么办，怎么把他们一种数据？
    // 封装函数返回的是一个值，或者一个所有策略的二维数组，先整理出所有策略的，[{策略名:...,当日:...,本周:...,近两周:...，本月:...},{...}]
    // 行跨越的实现方式  show里面存储行数好了line
    // 得到策略数组后，按照正则包含进行排序，比如按序push... or unshift 倒着来，利用count计数在最后一个里面加入show属性 show:{line:4,extra:...}
    // 正常映射
    // 导出表不带颜色只有计算值应该还行
    // 没有当日数据？没有本周数据？...
    // 一一对齐

    //#region 时间部分
    //确定 当日、本周、近两周、本月
    var now = new Date();
    // 获取当前月份
    var year = now.getFullYear();
    var month = now.getMonth();

    // 获取当日
    var startTodayDate = now.toLocaleDateString();
    // console.log("本日开始日期：",startTodayDate);
    // console.log("本日结束日期：",startTodayDate);

    //计算本月开始日期和结束日期
    var startMonthDate = new Date(year, month, 1).toLocaleDateString();
    //本月测试正常
    // console.log("本月开始日期：",startMonthDate);
    // console.log("本月结束日期：",now.toLocaleDateString());

    //本周测试正常
    var startWeekDate = getFirstDayOfWeek(now).toLocaleDateString(); // 获取当前日期所在周的第一天
    // console.log("本周开始日期：",startWeekDate);
    // console.log("本周结束日期：",now.toLocaleDateString());

    //近两周
    var startRecentTwoWeekDate = getFirstDayOfRecentTwoWeek(now).toLocaleDateString(); // 获取当前日期所在周的第一天
    // console.log("近两周开始日期：",startRecentTwoWeekDate);
    // console.log("近两周结束日期：",now.toLocaleDateString());
    //#endregion

    // 确定各自的净值数组
    var tmp = calculateChartData(curtestdata, strategies, startTodayDate, startTodayDate);
    var strategieshead = tmp[0];
    var todayNetValue = tmp[1];
    var curWeekNetValue = calculateChartData(curtestdata, strategies, startWeekDate, startTodayDate)[1];
    var curMonthNetValue = calculateChartData(curtestdata, strategies, startMonthDate, startTodayDate)[1];
    var curRecentTwoWeeksNetValue = calculateChartData(curtestdata, strategies, startRecentTwoWeekDate, startTodayDate)[1];
    // console.log(strategieshead);
    // console.log(todayNetValue);
    // console.log(curWeekNetValue);
    // console.log(curMonthNetValue);
    // console.log(curRecentTwoWeeksNetValue);

    //搭建对象数组
    const valueArray = [];
    for (let i = 0; i < strategieshead.length; i++) {
        const obj = {
            strategy: strategieshead[i],
            today: todayNetValue[i],
            thisweek: curWeekNetValue[i],
            recenttwoweeks: curRecentTwoWeeksNetValue[i],
            thismonth: curMonthNetValue[i]
        };
        valueArray.push(obj);
    }
    console.log(valueArray);
    return valueArray;
}


function buildNetValueTableAnother(curtestdata, strategies) {
    var valueArray = buildArray(curtestdata,strategies);
    //添加相关元素来做行跨越
    // 策略识别

    //正则识别策略账户种类 XXX_YY
    // 原始数组
    // console.log(globalaccounts);
    // 获取所有不同的 YY
    var accountType = [...new Set(strategies.map(str => str.split("_")[1]))];
    console.log(accountType);

    accountType.forEach((suffix, index) => {
        valueArray.forEach(obj => {
            if (obj.strategy.endsWith(suffix)) {
                obj.index = index;
            }
        });
    });

    // 按照index属性进行排序
    valueArray.sort((obj1, obj2) => obj1.index - obj2.index);
    // console.log(valueArray);

    // 添加属性
    // 对象数组按照strategy属性排序
    const counts = {};
    accountType.forEach(suffix => {
        counts[suffix] = 0;
    });

    valueArray.forEach(obj => {
        const suffix = obj.strategy.split('_')[1];
        counts[suffix]++;
    });
    const c = accountType.map(suffix => counts[suffix]);
    let lastsuffix;
    valueArray.forEach(obj => {
        const suffix = obj.strategy.split('_')[1];
        if (suffix !== lastsuffix) {
            lastsuffix = suffix;
            var tmp = {
                count: c[accountType.indexOf(suffix)],
                suffix: suffix

            }
            obj.show = tmp;
        }
    });
    console.log(valueArray);
    return valueArray;


}





// 某段时间内的净值计算
function calculateChartData(curtestdata, strategies, startTime, endTime) {
    //表格数据处理
    // globaldataset 当前全局存储的是一个二维数组[[标题1，标题2，标题3....][elements1,elements2,....]]-> [{标题1：ele1,....}{}{}]
    // 计算净值有方法，设置封装即可，返回怎么办，怎么把他们一种数据？
    // 封装函数返回的是一个值，或者一个所有策略的二维数组，先整理出所有策略的，[{策略名:...,当日:...,本周:...,近两周:...，本月:...},{...}]
    // 行跨越的实现方式  show里面存储行数好了line
    // 得到策略数组后，按照正则包含进行排序，比如按序push... or unshift 倒着来，利用count计数在最后一个里面加入show属性 show:{line:4,extra:...}
    // 正常映射
    // 导出表不带颜色只有计算值应该还行
    // 没有当日数据？没有本周数据？...
    // 一一对齐
    // console.log(curtestdata);
    // console.log(strategies);
    // console.log(startTime);
    // console.log(endTime);
    var funcResult = [];
    var netValueResult = [];
    //策略、时间范围
    for (let i = 0; i < strategies.length; i++) {
        //筛选出所有对应策略在对应时间内的数据
        let [headers, ...rows] = curtestdata; // 解构出表头和行数据
        let filteredRows = rows.filter(row => {

            let [, rowTime, , rowCategory] = row; // 解构出行数据的种类和时间信息
            // console.log("rowCategory",rowCategory);
            // console.log("rowTime",rowTime);
            let startDate = new Date(startTime);
            let endDate = new Date(endTime);
            let rowDate = new Date(rowTime);

            return rowCategory === strategies[i] && rowDate >= startDate && rowDate <= endDate;
        });
        // console.log(filteredRows);

        //获取收益率数组
        const column = 11;
        const columnValues = filteredRows.map(row => parseFloat(row[column]));
        let incrementedValues = columnValues.map(value => value + 1); // 对数组中的每个值都加1
        // console.log(incrementedValues);
        // let filteredData = [headers, ...filteredRows]; // 将表头和筛选后的行数据合并成新的二维数组
        // console.log(filteredData);
        if (incrementedValues.length === 0) {
            netValueResult.push(1);
        } else {
            //获取该时间段内的总净值
            let curNetValue = incrementedValues.reduce((acc, val) => acc * val);
            console.log(filteredRows[0][3], curNetValue);
            // console.log();
            netValueResult.push(curNetValue);
        }

    }
    //完成对齐工作
    // console.log(strategies);
    // console.log(netValueResult);
    funcResult.push(strategies, netValueResult);
    return funcResult;
}

//表格数据处理
