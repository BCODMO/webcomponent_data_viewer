var dataViewer = (function () {
    // Primary load function
    function load() {
        var dataPackageUrl = $("#data-package").val();
        var dataset_field_information = '#dataset-field-information';
        var dataset_licenses = '#dataset-licenses';
        /*
        // Load the data package
        datapackage.Package.load(dataPackageUrl).then(function (result) {
            console.log(result);

            $(".dataset-title").html(result.descriptor.title);
            $(".dataset-name").html(result.descriptor.name);
            $(".dataset-id").html(result.descriptor.id);
            $(".dataset-homepage").html(result.descriptor.homepage);
            $(".dataset-homepage-href").prop('href', result.descriptor.homepage).prop('title', result.descriptor.homepage).text(result.descriptor.homepage);

            $(".dataset-owner").html(result.descriptor.owner);
            $(".dataset-download-url").html(result.descriptor.download_url);
            $(".dataset-image").html(result.descriptor.image);
            $(".dataset-description").html(result.descriptor.description);
            $(".dataset-readme-html").html(result.descriptor.readme_html);

            // Field Information
            $(dataset_field_information + ' tbody').empty();
            $.each(result.resources["0"].schema.descriptor.fields, function (idx, item) {
                var newRow = '<tr><td>' + item.name + '</td><td>' + (idx + 1) + '</td><td>' + item.type + '</td><td>' + item.format + '</td></tr>';
                var datasetTable = $(dataset_field_information + ' tbody').append(newRow);
            });

            // License Information
            $(dataset_licenses).empty();
            $.each(result.descriptor.licenses, function (idx, item) {
                var licenseRow = '<a href="' + item.path + '" title="Available under the following License" target="_blank">' + item.name + '</a><br />';
                var licenseList = $(dataset_licenses).append(licenseRow);
            });

            
            var dataset = new recline.Model.Dataset({
                url: result.resources["0"].source,
                backend: 'dataproxy',
                // delimiter: ',',
                // quotechar: '"',
                // encoding: 'utf8'
            });

            if (dataset) {
                dataset.fetch().done(function (dataset) {
                    var $el = $('#dataset-visualization');
                    var grid = new recline.View.SlickGrid({
                        model: dataset,
                        el: $el
                    });
                    grid.visible = true;
                    grid.render();
                });

                dataset.fetch().done(function (dataset) {
                    var $el = $('#dataset-grid');
                    var grid = new recline.View.SlickGrid({
                        model: dataset,
                        el: $el
                    });
                    grid.visible = true;
                    grid.render();
                });
            }

             console.log("ASD")
            dataset.fetch().done(function (dataset) {
                console.log(dataset.recordCount)
            });

        


        });
            */

    }

    // Exports
    return {
        load: load
    }
}());

//dataViewer.load();