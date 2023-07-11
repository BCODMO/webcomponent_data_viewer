// https://www.ag-grid.com/javascript-grid/
// https://github.com/frictionlessdata/datapackage-js#installation

import { LitElement, html, css } from "./lit-element/lit-element.js";
import "./@material/mwc-snackbar/mwc-snackbar.js";
import "./@material/mwc-linear-progress/mwc-linear-progress.js";
import "./@material/mwc-icon-button/mwc-icon-button.js";
import "./ag-grid/29.2.0/ag-grid-community.min.js";
import sheet from '../css/style.css' assert { type: 'css' };
try {
document.adoptedStyleSheets = [sheet];
} catch (e) {
  console.log("Error loading style", e)

}

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
      dpkgJson: { type: String },

      hideDpkg: { type: String },

      dataset: { type: String },

      version: { type: String },

      _idx: { type: Number },

      _dataGridIdx: { type: Number },

      _filename: { type: String },
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

  set dpkgJson(value) {
    if (value === this._dpkgJson) {
      return;
    }

    let oldVal = this._dpkgJson;
    this._dpkgJson = value;
    this._dpkg = JSON.parse(decodeURIComponent(value));
    this._start();
    this.requestUpdate("dpkgJson", oldVal);
  }

  get dpkgJson() {
    return this._dpkgJson;
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
    let filename = this._filename;
    if (!filename) {
      filename = "Download file here";
    }

    return html`
      <fieldset class="margin-top-1">
        <div class="columns is-gapless is-multiline">
          <div class="column is-two-thirds">
            <legend>Field Information</legend>
          </div>
          <div class="column is-one-third">
            <div
              class="field has-text-right"
              onclick="toggleFieldInfoVisibility(this, '${id}');"
            >
              <input
                type="checkbox"
                name="fieldInfoToggle${id}"
                class="switch is-small"
                checked
              />
              <label for="fieldInfoToggle${id}">Hide</label>
            </div>
          </div>
          <div class="column">
            <div
              style="height: 200px;"
              id="${id}"
              class="ag-theme-balham"
            ></div>
          </div>
        </div>
      </fieldset>
      <hr />
      <div class="columns is-gapless is-multiline">
        <div class="column is-three-quarters margin-bottom-0">
          <h5 class="title is-5">Download</h5>
        </div>
        ${this.hideDpkg === "true"
          ? html``
          : html`
              <div class="column is-one-quarter has-text-right">
                <h5 class="title is-size-7">Metadata</h5>
              </div>
            `}

        <div class="column is-three-quarters">
          <a class="is-size-5" href="${resource_path}">${filename}</a>
        </div>
        ${this.hideDpkg === "true"
          ? html``
          : html`
        <div class="column is-one-quarter has-text-right" id="dpkgDownloadSection>
          <a class="is-size-7" href="${dpkg_url}">Datapackage (JSON)</a>
          <em class="is-size-7"> => for DM view only</em>
        </div>
        `}
      </div>
      <div
        id="dataLoader"
        class="loader margin-top-1"
        style="margin-right:auto; margin-left: auto;"
      ></div>
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

    datapackage.Package.load(this.dpkg)
      .then((pkg) => {
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
        this._createFieldGrid(idx, resource);
        this._createDataGrid(idx, resource);
        hasTabularData = true;
      }
    }

    /* Let user know if no tabular data found */
    if (!hasTabularData) {
      this._showError("No tabular data found");
      throw new Error("No tabular data found");
    }
  }

  _createFieldGrid(idx, resource) {
    let rows = [];

    if (this.dataset) {
      const kg =
        "https://lod.bco-dmo.org/sparql?default-graph-uri=http%3A%2F%2Fwww.bco-dmo.org%2F&query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+odo%3A+%3Chttp%3A%2F%2Focean-data.org%2Fschema%2F%3E%0D%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0D%0ASELECT+DISTINCT+%3Ffield+%3Fdescription+%3Funits%0D%0AWHERE+%7B+%0D%0A++%3Fdataset+a+odo%3ADataset+.%0D%0A++%3Fdataset+odo%3Aidentifier+%3Fid+.%0D%0A++%3Fid+a+odo%3ABCODMOIdentifier+.%0D%0A++%3Fid+odo%3AidentifierValue+%22" +
        this.dataset +
        "%22%5E%5Exsd%3Atoken+.%0D%0A++%3Fdataset+odo%3AstoresValuesFor+%3Fdp+.%0D%0A++%3Fdp+skos%3Adefinition+%3Fdescription+.%0D%0A++%3Fdp+skos%3AprefLabel+%3Ffield+.%0D%0A++%3Fdp+odo%3AhasUnitOfMeasure+%5B+rdf%3Avalue+%3Funits+%5D+.%0D%0A%7D+%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";
      const kg_fields = fetch(kg).then((response) => response.json());
    }

    const default_types = ["any", "default"];
    if (resource.schema) {
      for (const field of resource.schema.fields) {
        let row = {
          Field: field.name,
          Type: field.type,
          Format: default_types.includes(field.format) ? "" : field.format,
          Description:
            "undefined" != field.description ? field.description : "",
        };
        rows.push(row);
      }
    }

    /* Setup the Field Grid Options */
    var fieldGrid = {
      animateRows: true,
      columnDefs: [
        { field: "Field" },
        { field: "Type" },
        { field: "Format" },
        { field: "Description" },
      ],
      cacheQuickFilter: true,
      defaultColDef: { flex: 1, resizable: true },
      rowData: rows,
    };

    /* Create the Data Grid */
    this._idx = idx;
    this._resourcePath = resource.source;
    this._filename = resource.descriptor.filename;

    this.updateComplete.then(() => {
      let gridDiv = this.querySelector(`#field-grid-${idx}`);
      new agGrid.Grid(gridDiv, fieldGrid);
      if (!rows.length) {
        $(`#field-grid-${idx}`).closest("fieldset").hide();
      }
    });
    /* Define the Data Grid Columns*/
  }

  _createDataGrid(idx, resource) {
    /* Download the file */
    const veryLargeResource =
      (resource.descriptor.size && resource.descriptor.size > 10 ** 8) ||
      (resource.descriptor.bytes && resource.descriptor.bytes > 10 ** 8);
    if (veryLargeResource) {
      this.__createDataGrid(idx, resource, null);
    } else {
      resource
        .iter({ stream: true, keyed: true, cast: false })
        .then((stream) => {
          this.__createDataGrid(idx, resource, stream);
        });
    }
  }

  async __createDataGrid(idx, resource, stream) {
    /* Define the Data Grid Columns*/
    const largeResource =
      (resource.descriptor.size && resource.descriptor.size > 10 ** 7) ||
      (resource.descriptor.bytes && resource.descriptor.bytes > 10 ** 7);
    let columns = [];
    if (resource.schema) {
      for (const field of resource.schema.fields) {
        let column = {
          field: field.name,
          filter: "agTextColumnFilter",
          headerName: field.name,
          headerTooltip: field.name,
          resizable: true,
        };
        switch (field.type) {
          case "date":
          case "datetime":
            column["type"] = "dateColumn";
            column["filter"] = "agDateColumnFilter";
            column["comparator"] = this.dateComparator;
            break;
          case "number":
          case "integer":
            column["type"] = "numberColumn";
            column["filter"] = "agNumberColumnFilter";
            column["comparator"] = this.numberComparator;
            break;
        }
        columns.push(column);
      }
    }

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
        flex: 1,
        sortable: true,
        minWidth: 120,
      },
      alwaysShowHorizontalScroll: true,
      domLayout: "autoHeight",
      immutableData: true,
      onGridReady: (options) => {
        const setColumns = !resource.schema;
        if (largeResource) {
          this.readStream(options, stream, resource.source, 10000, setColumns);
        } else {
          this.readStream(options, stream, resource.source, -1, setColumns);
        }
      },
      pagination: true,
      paginationPageSize: 50,
      rowData: [],
    };

    /* Create the Data Grid */
    this._dataGridIdx = idx;

    this.updateComplete.then(() => {
      $("#dataLoader").hide();
      let gridDiv = this.querySelector(`#data-grid-${idx}`);
      // gridDiv.style.setProperty("height", "80vh");
      var grid = new agGrid.Grid(gridDiv, dataGrid);
      if (stream === null) {
        gridDiv.insertAdjacentHTML(
          "afterbegin",
          '<p class="notification is-warning" >This dataset is too large to show in the browser. Please download the file and view it locally on your computer.</p>'
        );
      } else {
        grid.gridOptions.api.showLoadingOverlay();
        if (largeResource) {
          gridDiv.insertAdjacentHTML(
            "afterbegin",
            '<p class="notification is-warning" >This dataset is too large to show entirely in the browser. The number of rows has been limited to 10,000.</p>'
          );
        }
      }
      const horizontalScrollEl = document.querySelector("#data-grid-0 .ag-body-horizontal-scroll");
      document.querySelector("#data-grid-0 .ag-header").insertAdjacentElement("afterend", horizontalScrollEl);

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
  readStream(options, stream, url, limit, setColumns) {
    /* Stream the file */
    var count = 1;
    var total_count = 0;
    let rows = [];
    if (stream !== null) {
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
          if (setColumns) {
            const exampleRow = rows[0];
            let columnDefs = [];
            if (exampleRow.constructor == Object) {
              columnDefs = Object.keys(exampleRow).map((k) => {
                return {
                  field: k,
                  filter: "agTextColumnFilter",
                  headerName: k,
                  headerTooltip: k,
                  resizable: true,
                };
              });
            } else {
              // Handle unkeyed list
              columnDefs = [...Array(exampleRow.length).keys()].map((i) => {
                return {
                  field: `${i}`,
                  filter: "agTextColumnFilter",
                  headerName: `${i}`,
                  headerTooltip: `${i}`,
                  resizable: true,
                };
              });
              // Set rows to be keyed
              rows = rows.map((row) => {
                return row.reduce((acc, v, i) => {
                  acc[`${i}`] = v;
                  return acc;
                }, {});
              });
            }
            options.api.setColumnDefs(columnDefs);
          }
          options.api.applyTransactionAsync({ add: rows });
          options.api.flushAsyncTransactions();
        });
    } else {
      options.api.flushAsyncTransactions();
    }
  }
}

window.customElements.define("bcodmo-data-viewer", BcodmoDataViewer);
