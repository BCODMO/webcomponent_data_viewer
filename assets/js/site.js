// Global references to the two grids, data, and chart
var dataGrid;
var metadataGrid;
var resourceGrid;
var packageData;
var chart;
var reversedAxis = false;
var invertedAxis = false;

// Available chart types. Values should match what's in the #graph-type dropdown
const CHART_SCATTER = "scatter";
const CHART_LINE = "line";

// URL used for generating the proxy link
const PROXY_URL = "https://proxy.bco-dmo.org/general?url=";

function loadMetadata(url, descriptor) {
    var licenses = $.map(descriptor["licenses"], function (val) {
        return "<a href='" + val.path + "' title='Available under the following License' target='_blank'>" + val.name + "</a>";
    });
    var sources = $.map(descriptor["sources"], function (val) {
        return "<a href='" + val.path + "' title='" + val.title + "' target='_blank'>" + val.title + "</a>";
    });

    // Top section
    $(".dataset-homepage-href")
        .prop('href', descriptor["homepage"])
        .prop('title', descriptor["homepage"])
        .text(descriptor["homepage"]);

    $(".dataset-metadata-link").attr("href", url);

    $(".dataset-title").html(descriptor["title"]);
    $(".dataset-name").html(descriptor["name"]);
    $(".dataset-id").html(descriptor["id"]);
    $(".dataset-homepage").html(descriptor["homepage"]);
    
    $("#dataset-licenses").html(licenses ? licenses.join(", ") : "");
    $("#dataset-sources").html(sources ? sources.join("<br />") : "");
}

function loadPlotParameters(fields, data) {
    $("#graph-group-column").empty().append($("<option></option>"));
    $("#graph-series").empty();

    $.each(fields, function (idx, item) {
        var name = item["name"];

        $("#graph-group-column").append(
            $("<option></option").attr("value", name).text(name)
        );

        var checkbox = $("<input />").attr("type", "checkbox").attr("data-parameter", name).attr("data-name", name);
        var label = $("<label></label>").text(name);;
        var container = $("<div />").attr("class", "checkbox");

        // String values cannot be plotted
        if (item["type"] == "string") {
            checkbox.attr("disabled", "disabled");
            label.text(label.text() + "*");
        }

        container.append(label.prepend(checkbox));
        $("#graph-series").append(container);
    });
}

function loadGrid(fields, data) {
    if (dataGrid) {
        dataGrid.api.destroy();
    }

    columns = [];
    for (var i = 0; i < fields.length; i++) {
        var column = {
            headerName: fields[i]["name"],
            field: fields[i]["name"]
        };

        // Handle specific formatting for some data types
        switch (fields[i]["type"]) {
            case "date":
                column["cellRenderer"] = function (params) {
                    return moment(params.value).format("L");
                }
                column["getQuickFilterText"] = function (params) {
                    return moment(params.value).format("L");
                }
                break;
            case "time":
                column["cellRenderer"] = function (params) {
                    return moment(params.value).format("LT");
                }
                column["getQuickFilterText"] = function (params) {
                    return moment(params.value).format("LT");
                }
                break;
        }

        columns.push(column);
    }

    dataGrid = {
        columnDefs: columns,
        enableSorting: true,
        enableColResize: true,
        cacheQuickFilter: true,
        pagination: true
    };

    new agGrid.Grid($("#data-grid")[0], dataGrid);

    dataGrid.api.setRowData(data);

    return dataGrid;
}

function loadMetadataGrid(fields) {
    if (metadataGrid) {
        metadataGrid.api.destroy();
    }

    // TODO: The types don't include a description field?
    metadataGrid = {
        columnDefs: [
            { headerName: "Field Name", field: "name" },
            { headerName: "Order", cellRenderer: function (params) {
                    return (parseInt(params.rowIndex) + 1).toString()
            }},
            { headerName: "Type (Format)", field: "type" },
            { headerName: "Description" }
        ],
        enableSorting: false,
        enableColResize: true
    };
    
    new agGrid.Grid($("#metadata-grid")[0], metadataGrid);

    metadataGrid.api.setRowData(fields);
    metadataGrid.api.sizeColumnsToFit();

    return metadataGrid;
}

function loadResourceGrid(resources) {
    if (resourceGrid) {
        resourceGrid.api.destroy();
    }

    resourceGrid = {
        columnDefs: [
            { headerName: "Name", field: "descriptor.name" },
            { headerName: "Format", field: "descriptor.format" },
            { headerName: "", field: "descriptor.path", cellRenderer: function (params) {
                // The package at this point has the proxy included, so it needs to be stripped out
                var url = params.value.replace(PROXY_URL, "");
                return "<a href='" + url + "' target='_blank'>Download</a>";
            }}
        ],
        enableSorting: false,
        enableColResize: false,
        gridAutoHeight: true
    };

    new agGrid.Grid($("#resources-grid")[0], resourceGrid);

    resourceGrid.api.setRowData(resources);
    resourceGrid.api.sizeColumnsToFit();

    return resourceGrid;
}

function onFilterData() {
    dataGrid.api.setQuickFilter($('#filter-data').val());
}

function loadDataPackage(url, content) {
    // Clear any existing error message since we're starting over
    $("#data-package-error").hide();

    datapackage.Package.load(content, {
        basePath: getPath(url),
        strict: false
    }).then(pkg => {

        // See if datapackage is valid
        if (!pkg.valid) {
            showError("The selected Data Package does not appear to be valid");
            return;
        }

        // But the contents of the valid resources can be read
        // Note: `Resource.table` returns `jsontableschema.Table` instance.
        // For usage details please see https://github.com/frictionlessdata/jsontableschema-js#table

        // TODO: This just picks the first resource. Are we supposed to be reading a merged version
        //   of all resources, or letting a user pick which one we're dealing with?
        if (pkg.resources.length == 0 || !("table" in pkg.resources[0])) {
            showError("The selected Data Package does not contain a usable data source")
            return;
        }

        // TODO: Need to check for the following to make sure we can read in tabular data
        //"profile": "tabular-data-resource",

        var tbl = pkg.resources[0]["table"];
        var fields = tbl["schema"]["fields"]

        tbl.read({ keyed: true }).then(data => {
            packageData = data;

            $("#data-package-content").show();
            $("#plot-section").show();

            loadMetadata(url, pkg["descriptor"]);
            loadMetadataGrid(fields);
            loadResourceGrid(pkg["resources"]);
            loadPlotParameters(fields, data);
            loadGrid(fields, data);

            // Attempt to pre-load the plot base on the first record in the views entry. Currently, only
            //   the first record is used and only points (scatter) plots are supported
            // TODO: Add additional error handling and support for different graph types
            if ("views" in content) {
                chart = createEmptyScatterChart();

                $("#missing-parameters").hide();
                $("#plot").show();
                try {
                    var state = content["views"][0]["state"];
                    var group = state["group"];
                    var series = state["series"];

                    chart = createEmptyScatterChart();

                    if (group != "" && series.length > 0) {
                        $("#graph-type").val(CHART_SCATTER);
                        $("#graph-group-column").val(group);

                        for (var i = 0; i < series.length; i++) {
                            $("#graph-series input[data-parameter=" + series[i] + "]").prop("checked", "checked")
                            addSeries(series[i], false)
                        }

                        updateAxisTitles();
                        chart.redraw();
                    }
                } catch  {
                    // If there is any error, just don't preload the plot
                }
            } else {
                $("#graph-type").val(CHART_LINE);
                $("#missing-parameters").hide();
                $("#plot").show();

                if (chart) {
                    chart.destroy();
                    chart = null;
                }

                reloadChart();
            }

            $("#graph-group-column-section").toggle(
                $("#graph-type").val() == "scatter"
            );
            $("#loading-panel").hide();
        }, result => {
            showError(result["message"])
        })

    }).catch(err => {
        // TODO: This error handling might have to be tested with some additional exceptions
        showError("Exception while parsing the Data Package: " + err["message"])
    })
}

function getLineDataValues(parameter) {
    return $.map(packageData, function (val) { return val[parameter]; });
}

function getScatterDataValues(firstParameter, secondParameter) {
    // The return result needs to be explicitly wrapped in double brackets, or jQuery will return a single array, rather than
    //   an array of arrays, which is what's needed for the scatter plots

    return $.map(packageData, function (val) {
        return [[val[firstParameter], val[secondParameter]]];
    });
}

function createEmptyLineChart() {
    return Highcharts.chart('plot', {
        chart: {
            inverted: invertedAxis
        },
        title: {
            text: ""
        },
        yAxis: {
            title: {
                text: ""
            },
            reversed: reversedAxis
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -20,
            y: 20,
            floating: true,
            backgroundColor: '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                }
            }
        },
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }

    });
}

function createEmptyScatterChart() {
    return Highcharts.chart('plot', {
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            inverted: invertedAxis
        },
        title: {
            text: ""
        },
        xAxis: {
            title: {
                enabled: true
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
            type: "category"
        },
        yAxis: {
            title: {
                text: ""
            },
            reversed: reversedAxis
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -40,
            y: 80,
            floating: true,
            backgroundColor: '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            series: {
                animation: false
            },
            scatter: {
                /*turboThreshold: 0,*/
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                }
            }
        }
    });
}

function areParametersValid() {
    // Scatter plots require a group value to be set
    if (getChartType() == CHART_SCATTER && $("#graph-group-column").val() == "") {
        return false;
    }

    // Check for at least one series
    if ($("#graph-series input[type=checkbox]:checked").length == 0) {
        return false;
    } 

    return true;
}

function reloadChart() {
    // Start with an empty chart object
    switch (getChartType()) {
        case CHART_SCATTER:
            chart = createEmptyScatterChart();
            break;
        default: //case CHART_LINE:
            chart = createEmptyLineChart();
            break;
    }

    // Add series for all selected items
    if (areParametersValid()) {
        $("#graph-series input[type=checkbox]:checked").each(function (idx, item) {
            addSeries($(item).attr("data-parameter"), false);
        });

        chart.redraw();
    }

    updateAxisTitles();
    updateChartVisibility();
}

function updateAxisTitles() {
    yTitle = getChartType() == CHART_SCATTER ? $("#graph-group-column option:selected").text() : "";
    chart.yAxis[0].setTitle({ text: yTitle });

    var series = [];
    $("#graph-series input[type=checkbox]:checked").each(function (idx, item) {
        series.push($(this).attr("data-name"))
    });

    chart.xAxis[0].setTitle({ text: series.join(", ") })
}

function updateChartVisibility() {
    if (!areParametersValid()) {
        var msg = getChartType() == CHART_SCATTER ?
            "Select a group column (X-axis) and at least one Series (Axis 2) to generate a graph" :
            "At least one Series (Y-axis) is must be enabled to generate a graph";

        $("#missing-parameters .alert").html(msg)
        $("#missing-parameters").show();
        $("#plot").hide();
        return;
    }

    $("#missing-parameters").hide();
    $("#plot").show();
}

function getChartType() {
    return $("#graph-type").val();
}

function addSeries(parameter, redraw) {
    var data;

    switch (getChartType()) {
        case CHART_SCATTER:
            var groupColumn = $("#graph-group-column").val();
            data = getScatterDataValues(groupColumn, parameter);
            break;
        default: //case CHART_LINE:
            data = getLineDataValues(parameter);
            break;
    }

    chart.addSeries({
        name: parameter,
        id: parameter,
        data: data
    }, redraw);
}

function changeChartType() {
    $("#graph-group-column-section").toggle(
        $("#graph-type").val() == "scatter"
    );

    reloadChart();
}

function showError(msg) {
    $("#loading-panel").hide();
    $("#data-package-error").html(msg).show();
}

function getPath(url) {
    return url.split('/').slice(0, -1).join('/') || '.'
}

function preprocessDataPackage(url, data) {
    if (data["resources"].length == 0)
        return;

    var baseUrl = getPath(url);
    for (var i = 0; i < data["resources"].length; i++) {
        // If the resource path is local, the base url of the data package needs to be prepended
        var resourceUrl = data["resources"][i]["path"];
        if (!resourceUrl.startsWith("http")) {
            resourceUrl = baseUrl + "/" + resourceUrl
        }

        data["resources"][i]["path"] = PROXY_URL + resourceUrl;
    }

    return data;
}

function reverseAxis() {
    chart.yAxis[0].update({
        reversed: !reversedAxis
    });

    reversedAxis = !reversedAxis;
}

function swapAxis() {
    chart.update({
        chart: {
            inverted: !invertedAxis
        }
    });

    invertedAxis = !invertedAxis;
    updateAxisLabels();
}

function updateAxisLabels() {
    $("#reverse-label").html("Reverse " + (invertedAxis ? "X" : "Y") + "-Axis");
    $("#group-column-label").html("Group Column (" + (invertedAxis ? "Y" : "X") + "-axis):");
    $("#series-label").html("Series (" + (invertedAxis ? "X" : "Y") + "-axis):");
}