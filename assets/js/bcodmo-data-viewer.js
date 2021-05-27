// https://www.ag-grid.com/javascript-grid/
// https://github.com/frictionlessdata/datapackage-js#installation

import { LitElement, html, css } from "./lit-element/lit-element.js";
import "./@material/mwc-snackbar/mwc-snackbar.js";
import "./@material/mwc-linear-progress/mwc-linear-progress.js";
import "./@material/mwc-icon-button/mwc-icon-button.js";

export class BcodmoDataViewer extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  static get properties() {
    return {
      dpkg: { type: String },

      dataset: { type: String },

      version: { type: String },

      _idx: { type: Number },

      _dataGridIdx: { type: Number },

      _resourcePath: { type: String },

      _errorText: { type: String },
    };
  }

  set dpkg(url) {
    if (url === this.dpkg) {
      return;
    }

    let oldVal = this.dpkg;
    this._dpkg = url;
    this._start();
    this.requestUpdate("dpkg", oldVal);
  }

  get dpkg() {
    return this._dpkg;
  }

  set dataset(value) {
    if (value === this.dataset) {
      return;
    }

    let oldVal = this.dataset;
    this._dataset = value;
    this._setdpkg();
    this.requestUpdate("dataset", oldVal);
  }

  get dataset() {
    return this._dataset;
  }

  set version(value) {
    if (value === this.version) {
      return;
    }

    let oldVal = this.version;
    this._version = value;
    this._setdpkg();
    this.requestUpdate("dataset", oldVal);
  }

  get version() {
    return this._version;
  }

  _setdpkg() {
    if (this.dataset && this.version) {
      this.dpkg =
        //"https://raw.githubusercontent.com/BCODMO/Frictionless-Data-Package-Inspector/ag-grid/datasets/" +
        //"http://localhost:9080/datasets/" +
        //"https://webcomponents.bco-dmo.org/data-viewer/datasets/" +
        "https://datadocs.bco-dmo.org/files/laminar/1/" +
        this.dataset +
        "/" +
        this.version +
        "/data/datapackage.json";
      //console.log(this.dpkg);
    }
  }

  render() {
    return html`
      <mwc-snackbar
        id="toast"
        .labelText=${this._errorText}
        leading
        timeoutMs="-1"
        closeOnEscape
      >
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>
      ${this._getPageContent}
    `;
  }

  firstUpdated() {
    if (!this.dpkg) {
      let elToast = this.querySelector("#toast");
      this._errorText = "The selected Datapackage does not appear to be valid";
      elToast && elToast.show();
      throw new Error("The selected Datapackage does not appear to be valid");
    }
  }

  createRenderRoot() {
    return this;
  }

  get _getPageContent() {
    let id = `field-grid-${this._idx}`;
    let dataGridId = `data-grid-${this._dataGridIdx}`;
   
    let dpkg_url = this.dpkg;

    if (this._idx === undefined) {
      return html`<mwc-linear-progress indeterminate></mwc-linear-progress>`;
    }

    let resource_path = this._resourcePath;
    //console.log(resource_path);

    return html`
      <fieldset class="margin-top-1">
        <div class="columns is-gapless is-multiline">
          <div class="column is-two-thirds"><legend>Field Information</legend></div>
          <div class="column is-one-third">
            <div class="field has-text-right" onclick="toggleFieldInfoVisibility(this, '${id}');">
              <input type="checkbox" name="fieldInfoToggle${id}" class="switch is-small" checked>
              <label for="fieldInfoToggle${id}">Hide</label>
            </div>
          </div>
          <div class="column"><div style="height: 200px;" id="${id}" class="ag-theme-balham"></div></div>
        </div>
      </fieldset>
      <hr>
      <div class="columns is-gapless is-multiline">
        <div class="column is-three-quarters margin-bottom-0"><h5 class="title is-6">Download</h5></div>
        <div class="column is-one-quarter has-text-right"><h5 class="title is-size-7">Metadata</h5></div>
        <div class="column is-three-quarters"><a class="is-size-6" href="${resource_path}">${resource_path}</a></div>
        <div class="column is-one-quarter has-text-right"><a class="is-size-7" href="${dpkg_url}">Datapackage (JSON)</a> <em class="is-size-7"> => for DM view only</em></div>
      </div>
      <div
        style="min-height: 400px;"
        id=${dataGridId}
        class="ag-theme-balham margin-top-1"
      ></div>
    `;
  }

  _start() {
    if (!this.dpkg) {
      this._showError("The selected Datapackage does not appear to be valid");
      console.error("The selected Datapackage does not appear to be valid");
      return;
    }

    //console.log(this.dpkg);
    datapackage.Package.load(this.dpkg)
      .then((pkg) => {
        //console.log(pkg.descriptor);
        this._createTable(pkg);
      })
      .catch((err) => {
        this._showError(err);
        throw new Error(err);
      });
  }

  _showError(errMsg) {
    let elToast = this.querySelector("#toast");
    this._errorText = errMsg;
    elToast && elToast.show();
  }

  _createTable(pkg) {
    let hasTabularData = false;

    /* Store the DataPackage desriptor */
    for (const [idx, resource] of pkg.resources.entries()) {
      if (resource.tabular) {
        hasTabularData = true;
        this._createFieldGrid(idx, resource)
          .then((fieldInfo) => {
            this._createDataGrid(idx, resource, fieldInfo);
          })
          .catch((err) => {
            this._showError(err);
            throw new Error(err);
          });
      }
      else {
        // To-Do: need to do something with non-tabular package
      }
    }

    /* Let user know if no tabular data found */
    if (!hasTabularData) {
      this._showError("No tabular data found");
      throw new Error("No tabular data found");
    }
  }

  async _createFieldGrid(idx, resource) {
    if(this.dataset) {
      let kg = 'https://lod.bco-dmo.org/sparql?default-graph-uri=http%3A%2F%2Fwww.bco-dmo.org%2F&query=SELECT+DISTINCT+%3Fdp+%3Fname+%3Fdefinition+%3Fdatatype+%3Fformat+%3Funits+%3Fndv+%3Frequires_conversion+%3Fparameter+%3Fp_name+%3Fp_def+%3Fp_units+%3Fp_ndv%0D%0AWHERE+%7B%0D%0A++VALUES+%3Fdataset+%7B+%3Chttp%3A%2F%2Flod.bco-dmo.org%2Fid%2Fdataset%2F' + this.dataset + '%3E+%7D%0D%0A++%3Fdataset+odo%3AstoresValuesFor+%3Fdp+.%0D%0A++%3Fdp+skos%3AprefLabel+%3Fname%0D%0A++OPTIONAL+%7B+%3Fdp+skos%3Adefinition+%3Fdefinition+%7D%0D%0A++OPTIONAL+%7B+%3Fdp+odo%3AvalueFormat+%3Fformat+%7D%0D%0A++OPTIONAL+%7B+%3Fdp+odo%3Adatatype+%5B+odo%3AfrictionlessdataDatatype+%3Fdatatype+%5D+%7D%0D%0A++OPTIONAL+%7B+%3Fdp+odo%3AhasNoDataValue+%3Fndv+%7D%0D%0A++OPTIONAL+%7B+%3Fdp+odo%3ArequiresConversion+%3Frequires_conversion+%7D%0D%0A++OPTIONAL+%7B+%3Fdp+odo%3AhasUnitOfMeasure+%5B+rdf%3Avalue+%3Funits+%5D+%7D%0D%0A++OPTIONAL+%7B+%0D%0A++++%3Fdp+odo%3AisInstanceOf+%3Fparameter+.%0D%0A++++%3Fparameter+skos%3AprefLabel+%3Fp_name+.%0D%0A++++%3Fparameter+skos%3Adefinition+%3Fp_def+.%0D%0A++++OPTIONAL+%7B+%3Fparameter+odo%3AhasUnitOfMeasure+%5B+rdf%3Avalue+%3Fp_units+%5D+%7D%0D%0A++++OPTIONAL+%7B+%3Fparameter+odo%3AhasNoDataValue+%3Fp_ndv+%7D%0D%0A++%7D%0D%0A%7D%0D%0AORDER+BY+%3Fdp&format=application%2Fsparql-results%2Bjson&timeout=0';
      //console.log(kg);
      let fi = await fetch(kg)
        .then(response => response.json())
        .then(data => {
          if (undefined != data['results']['bindings']) {
             let kg_fields = {};
             for (let res of data['results']['bindings']) {
                 kg_fields[res.name.value] = res;
             }
             return this._buildFieldGrid(idx, resource, kg_fields);
          } else {
             return this._buildFieldGrid(idx, resource, {});
          }
        })
        .catch((error) => { 
          this._showError(errror);
           throw new Errorr(error);
        });
      return fi;
    }
    else {
      console.log('calling with no dataset');
      return this._buildFieldGrid(idx, resource, {});
    }
  }

  _buildFieldGrid(idx, resource, kg_fields) {

    //console.log(kg_fields);
    let rows = [];
    const default_types = ["any", "default"];
    for (const field of resource.schema.fields) {
      let row = {
        Field: field.name,
        Units: "",
        Description: "undefined" != field.description ? field.description : "",
        Format: default_types.includes(field.format) ? "" : field.format,
        Type: field.type,
      };
      if (field.name in kg_fields) {
        let kg_field = kg_fields[field.name];
        // datatype
        if (kg_field.datatype != undefined) {
          row.Type = kg_field.datatype.value;
        }
        // format
        if (kg_field.format != undefined) {
          row.Format = kg_field.format.value;
        }
        // description 
        if (kg_field.definition != undefined) {
          row.Description = kg_field.definition.value;
        }
        // units
        if (kg_field.units != undefined) {
          row.Units = kg_field.units.value;
        }
      }
      rows.push(row);
    }

    /* Setup the Field Grid Options */
    var fieldGrid = {
      animateRows: true,
      columnDefs: [
        { field: "Field", width: 100 },
        { field: "Units", width: 100 },
        { field: "Description",
           suppressSizeToFit: false,
           cellRenderer: params => {
              // return HTML;
              //console.log(params.value);
              //return params.value;
              // strip HTML
              return params.value.replace(/(<([^>]+)>)/gi, "");
           }
        }, 
        { field: "Format", width: 50 },
        { field: "Type", width: 50 },
      ],
      cacheQuickFilter: true,
      defaultColDef: { flex: 1, resizable: true },
      immutableData: true,
      rowData: rows,
    };

    /* Create the Data Grid */
    this._idx = idx;
    this._resourcePath = resource.source;

    this.updateComplete.then(() => {
      let gridDiv = this.querySelector(`#field-grid-${idx}`);
      var grid = new agGrid.Grid(gridDiv, fieldGrid);
      grid.gridOptions.api.sizeColumnsToFit();
    });
    /* Define the Data Grid Columns*/
    return rows;
  }

  _createDataGrid(idx, resource, fieldInfo) {
    /* Download the file */
    //console.log("downloading...", resource.source);
    resource.iter({ stream: true, keyed: true, cast: false }).then((stream) => {
      this.__createDataGrid(idx, resource, fieldInfo, stream);
    });
  }

  __createDataGrid(idx, resource, fieldInfo, stream) {
    /* Define the Data Grid Columns*/
    let columns = [];
    //console.log(fieldInfo);
    //for (const field of resource.schema.fields) {
    for (const field of fieldInfo) {
      let column = {
        //field: field.name,
        field: field.Field,
        filter: "agTextColumnFilter",
        //headerName: field.name,
        headerName: field.Field,
        //headerTooltip: field.name,
        headerTooltip: "" != field.Description ? field.Description : field.Field,
        resizable: true,
      };
      //switch (field.type) {
      switch (field.Type) {
        case "date":
        case "datetime":
          column["type"] = "dateColumn";
          column["comparator"] = this.dateComparator;
          column["filter"] = 'agDateColumnFilter';
          break;
        case "number":
          column["type"] = "numberColumn";
          column["comparator"] = this.numberComparator;
          column["filter"] = 'agNumberColumnFilter';
          break;
      }
      columns.push(column);
    }

    const largeResource =
      resource.descriptor.bytes && resource.descriptor.bytes > 10 ** 7;

    /* Setup the Data Grid Options */
    var dataGrid = {
      animateRows: true,
      asyncTransactionWaitMillis: 200,
      columnDefs: columns,
      cacheQuickFilter: true,
      columnTypes: {
        dateColumn: {
          filter: "agDateColumnFilter",
          filterParams: { comparator: this.dateComparator },
        },
        numberColumn: {
          filter: "agNumberColumnFilter",
          filterParams: { comparator: this.numberComparator },
        },
      },
      defaultColDef: {
        flex: columns.length < 10 ? 1 : 0,
        sortable: true,
        width: 120,
      },
      domLayout: "autoHeight",
      immutableData: true,
      onGridReady: (options) => {
        if (largeResource) {
          this.readStream(options, stream, resource.source, 10000);
        } else {
          this.readStream(options, stream, resource.source, -1);
        }
      },
      pagination: true,
      rowData: [],
    };

    /* Create the Data Grid */
    this._dataGridIdx = idx;

    this.updateComplete.then(() => {
      let gridDiv = this.querySelector(`#data-grid-${idx}`);
      var grid = new agGrid.Grid(gridDiv, dataGrid);
      grid.gridOptions.api.showLoadingOverlay();
      if (largeResource) {
        gridDiv.insertAdjacentHTML(
          "afterbegin",
          '<p class="warning-bar" >This dataset is too large to show entirely in the browser. The number of rows has been limited to 10,000.</p>'
        );
      }
    });
  }

  dateComparator(date1, date2) {
    if (date1 === null && date2 === null) {
      return 0;
    }
    if (!isNaN(new Date(date1).getTime())) {
      return -1;
    }
    if (!isNaN(new Date(date2).getTime())) {
      return -1;
    }
    if (date1 === null) {
      return -1;
    }
    if (date2 === null) {
      return 1;
    }
    return Date.parse(date1) - Date.parse(date2);
  }

  numberComparator(number1, number2) {
    if (number1 === null && number2 === null) {
      return 0;
    }
    if (isNaN(number1)) {
      return -1;
    }
    if (isNaN(number2)) {
      return 1;
    }
    if (number1 === null) {
      return -1;
    }
    if (number2 === null) {
      return 1;
    }
    return number1 - number2;
  }

  /**
   * Description: Read the tabular Data file
   */
  readStream(options, stream, url, limit) {
    /* Stream the file */
    console.log("streaming...");
    var count = 1;
    var total_count = 0;
    var rows = [];
    options.api.showLoadingOverlay();
    stream
      .on("data", (row) => {
        if (limit >= 0 && total_count >= limit) {
          return;
        }
        rows.push(row);
        if (count == 50) {
          options.api.applyTransactionAsync({ add: rows });
          options.api.flushAsyncTransactions();
          rows = [];
          count = 1;
          /* Update the Grid */
          //stream.pause();
          setTimeout(() => {
            //stream.resume();
          }, 10);
        }
        total_count += 1;
      })
      .on("end", () => {
        console.log("finished!");
        options.api.applyTransactionAsync({ add: rows });
        options.api.flushAsyncTransactions();
      });
  }
}

window.customElements.define("bcodmo-data-viewer", BcodmoDataViewer);
