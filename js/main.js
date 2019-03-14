data = {}

$(document).ready(function(){
  var url = "https://clickcircle.github.io/osu-archive/data/osu_standard.csv";
  var data= $.ajax({url:url,async:false}).responseText;
  draw(d3.csvParse(data))
});

function draw(data) {

  var update_rate; // 动画交换速率
  var date = [];
  data.forEach(element => {
    if (date.indexOf(element["date"]) == -1) {
      date.push(element["date"]);
    }
  });
  
  var time = date.sort((x, y) => new Date(x) - new Date(y)); // 时间从前往后排
  var currentdate = time[0].toString();

  d3.select("body").attr("style", "background:#FFFFFF");
  const svg = d3.select("svg");
  const xValue = d => Number(d.value);
  const yValue = d => d.name;

  const margin = {
    left: 50,
    right: 80,
    top: 50,
    bottom: 0
  };
  const width = svg.attr("width");
  const height = svg.attr("height");
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom - 32;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const xAxisG = g
    .append("g")
    .attr("transform", `translate(0, ${innerHeight})`);
  const yAxisG = g.append("g");

  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", 100);

  var xScale = d3.scaleLinear();
  const yScale = d3
    .scaleBand()
    .paddingInner(0.3)
    .paddingOuter(0);

  const xTicks = 10;
  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .ticks(xTicks)
    .tickPadding(20)
    .tickFormat(d => {
      if (d <= 0) {
        return "";
      }
      return d;
    })
    .tickSize(-innerHeight);

  const yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickPadding(5)
    .tickSize(-innerWidth);

  var dateLabel = g
    .insert("text")
    .data(currentdate)
    .attr("class", "dateLabel")
    .attr("style:visibility", 'visible')
    .attr("x", innerWidth)
    .attr("y", innerHeight)
    .attr("text-anchor", function () {
      return "end";
    })
    .text(currentdate);

  var num = 1;
  yScale.range([innerHeight, 0]);
  while(num <= 10){
  	g.append("text")
    .style("fill", "#000000")
    .attr("fill-opacity", 1)
    .attr("class", function (d) {
      return "label ";
    })
    .attr("x", -10)
    .attr("y", 20 + (480.6 / 9) * (num - 1))
    .attr("text-anchor", "end")
    .text("#" + num);
    num++;
  }

  function getCurrentData(date) {
    currentData = [];
    // 获取入参日期的数据
	data.forEach(element => {
      if (element["date"] == date && parseFloat(element["value"]) != 0) {
        currentData.push(element);
      }
    });

	// 取每天的前十个数据并根据pp排序
    currentData = currentData.slice(0, 10);
    dataSort();

    d3.transition("2")
      .each(redraw)
      .each(change);
    lastData = currentData;
  }

  function redraw() {
    if (currentData.length == 0) return;

    // x轴起点动态变化，更直观体现数据间的差异
    xScale
        .domain([
          2 * d3.min(currentData, xValue) - d3.max(currentData, xValue),
          d3.max(currentData, xValue) + 10
        ])
        .range([0, innerWidth]);

    // 日期变动
    dateLabel.text(currentdate);

    xAxisG
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .call(xAxis);
    yAxisG
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .call(yAxis);
    // 不需要显示y轴tick
    yAxisG.selectAll(".tick").remove();

    yScale
      .domain(currentData.map(d => d.name).reverse())
      .range([innerHeight, 0]);

    var bar = g.selectAll(".bar").data(currentData, function (d) {
      return d.name;
    });

    var currentYScale;
    var barEnter = bar
      .enter()
      .insert("g", ".axis")
      .attr("class", "bar")
      .attr("transform", function (d) {
      	currentYScale = yScale(yValue(d));
        return "translate(0," + yScale(yValue(d)) + ")";
      });

    barEnter
      .append("rect")
      .attr("height", 26)
      .attr("y", 50)
      .style("fill", d => config.color[d.country])
      .transition("a")
      .delay(100)
      .duration(100)
      .attr("y", 0)
      .attr("width", d => xScale(xValue(d)))
      .attr("fill-opacity", 1);

    // bar上文字
    var barInfo = barEnter
      .append("text")
      .attr("x", function (d) {
        return xScale(currentData[currentData.length - 1].value);
      })
      .attr("stroke", d => config.color[d.country])
      .attr("class", "barInfo")
      .attr("y", 50)
      .attr("stroke-width", "0px")
      .transition()
      .delay(100)
      .duration(100)
      .text(d => d.name)
      .attr("x", d => {
        return xScale(xValue(d)) - 10;
      })
      .attr("fill-opacity", 1)
      .attr("y", 2)
      .attr("dy", ".5em")
      .attr("text-anchor", function () {
        return "end";
      })
      .attr("stroke-width", function (d) {
        if (xScale(xValue(d)) - 10 < 0) {
          return "0px";
        }
        return "1px";
      })
      .attr("stroke", d => config.color[d.country]);

    barEnter
      .append("image")
      .attr("width", 30)
      .attr("height", 20)
      .attr("xlink:href", d => "./img/flags/" + d.country + ".png")
      .attr("x", 10)
      .attr("y", 2)

    barEnter
        .append("text")
        .attr("x", function () {
          return xScale(currentData[currentData.length - 1].value);
        })
        .attr("y", 50)
        .attr("fill-opacity", 1)
        .style("fill", d => config.color[d.country])
        .transition()
        .duration(200)
        .tween("text", function (d) {
          var self = this;
          // 初始值为d.value的0.9倍
          self.textContent = d.value * 0.9;
          var i = d3.interpolate(self.textContent, Number(d.value)),
            prec = (Number(d.value) + "").split("."),
            round = prec.length > 1 ? Math.pow(10, prec[1].length) : 1;
          // d.value = self.textContent
          return function (t) {
            self.textContent = d3.format(".0f")(
              Math.round(i(t) * round) / round
            );
            // d.value = self.textContent
          };
        })
        .attr("fill-opacity", 1)
        .attr("y", 0)
        .attr("class", function (d) {
          return "value";
        })
        .attr("x", d => {
          return xScale(xValue(d)) + 10;
        })
        .attr("y", 22);

    var barUpdate = bar
      .transition("2")
      .duration(250)
      .ease(d3.easeLinear);

    barUpdate
      .select("rect")
      .style("fill", d => config.color[d.country])
      .attr("width", d => xScale(xValue(d)));

    var barInfo = barUpdate
      .select(".barInfo")
      .text(function (d) {
        return d.name;
      })
      .attr("x", d => {
        return xScale(xValue(d)) - 10;
      })
      .attr("fill-opacity", 1)
      .attr("stroke-width", function (d) {
        if (xScale(xValue(d)) - 10 < 0) {
          return "0px";
        }
        return "1px";
      });

    barUpdate
      .select(".value")
      .tween("text", function (d) {
          var self = this;
          var i = d3.interpolate(self.textContent, Number(d.value));
          var prec = (Number(d.value) + "").split("."),
          round = prec.length > 1 ? Math.pow(10, prec[1].length) : 1;
          return function (t) {
            self.textContent = d3.format(".0f")(
              Math.round(i(t) * round) / round
            );
          };
        })
        .duration(250)
        .attr("x", d => xScale(xValue(d)) + 10);

    var barExit = bar
      .exit()
      .transition()
      .duration(250);
    barExit
      .attr("transform", function (d) {
        return "translate(0," + "1000" + ")";
      })
      .remove();
    barExit
      .select("rect")
      .attr("width", xScale(currentData[currentData.length - 1]["value"]));
    barExit
      .select(".value")
      .attr("x", () => {
        return xScale(currentData[currentData.length - 1]["value"]);
      });
    barExit
      .select(".barInfo")
      .attr("stroke-width", function (d) {
        return "0px";
      })
      .attr("x", () => {
        return xScale(currentData[currentData.length - 1]["value"]);
      });
  }

  function dataSort() {
    currentData.sort(function (a, b) {
      if (Number(a.value) == Number(b.value)) {
        var r1 = 0;
        var r2 = 0;
        for (let index = 0; index < a.name.length; index++) {
          r1 = r1 + a.name.charCodeAt(index);
        }
        for (let index = 0; index < b.name.length; index++) {
          r2 = r2 + b.name.charCodeAt(index);
        }
        return r2 - r1;
      } else {
        return Number(b.value) - Number(a.value);
      }
    });
  }

  function change() {
    yScale
      .domain(currentData.map(d => d.name).reverse())
      .range([innerHeight, 0]);
    g.selectAll(".bar")
      .data(currentData, function (d) {
        return d.name;
      })
      .transition("1")
      .ease(d3.easeLinear)
      .duration(250)
      .attr("transform", function (d) {
        return "translate(0," + yScale(yValue(d)) + ")";
      });
  }

  var i = 0;
  var p = 1;
  var inter = setInterval(function next() {
    // 空过p回合,方便录制
    while (p) {
      p -= 1;
      return;
    }
    currentdate = time[i];
    getCurrentData(time[i]);
    i++;

    if (i >= time.length) {
      window.clearInterval(inter);
    }
  }, 250);
}

