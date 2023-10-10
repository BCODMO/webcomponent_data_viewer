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

      metadataUrl: { type: String },

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
    let metadata_url = this.metadataUrl;

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
        ${metadata_url ? html`
        <div class="column is-three-quarters margin-bottom-0">
          <a class="is-size-5" href="${metadata_url}">&laquo; Back to Metadata</a>
        </div>
        <div class="column is-one-quarter has-text-right">
          <h5 class="title is-5">Download</h5>
        </div>
        <div class="column is-three-quarters"></div>
        <div class="column is-one-quarter has-text-right">
          <a class="is-size-5" href="${resource_path}">${filename}</a>
        </div>

        ` : html`
        <div class="column is-three-quarters margin-bottom-0">
          <h5 class="title is-5">Download</h5>
        </div>
        <div class="column is-three-quarters">
          <a class="is-size-5" href="${resource_path}">${filename}</a>
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


    const default_types = ["any", "default"];
    let showUnits = false;
    if ("bcodmo:" in resource.descriptor && 'fields' in resource.descriptor['bcodmo:']) {
      showUnits = true;
      for (const field of resource.descriptor['bcodmo:']['fields']) {
        let row = {
          Field: field['name'],
          Type: field['type'],
          Units: "undefined" != field['units'] ? field['units'] : "",
          Format: default_types.includes(field['format']) ? "" : field['format'],
          Description: "undefined" != field['description'] ? field['description'] : "",
        };
        rows.push(row);
      }
    } else if (resource.schema && 'fields' in resource.schema) {
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
        { field: "Description", minWidth: 600 },
        { field: "Type", headerName: "Data Type", maxWidth: 100 },
        { field: "Format" },
      ],
      cacheQuickFilter: true,
      defaultColDef: { flex: 1, resizable: true },
      rowData: rows,
    };
    if (showUnits) {
      fieldGrid.columnDefs.splice(1, 0, {field: "Units" });

    }

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
    let all_strings = false;
    if (resource.descriptor['bcodmo_all-strings']) {
      all_strings = true;
    }
    let fields = [];
    if (resource.schema && resource.schema.fields) {
      fields = resource.schema.fields
    } else if ("bcodmo:" in resource.descriptor && "fields" in resource.descriptor["bcodmo:"]) {
      fields = resource.descriptor["bcodmo:"].fields
    }
    for (const field of fields) {
      let column = {
        field: field.name,
        filter: "agTextColumnFilter",
        headerName: field.name,
        headerTooltip: field.name,
        resizable: true,
        sortable: true,
      };
      if (all_strings) {
        column["sortable"] = false;
      }
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
      if (all_strings) {
        column["filter"] = "";
      }
      columns.push(column);
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
      immutableData: false,
      onGridReady: (options) => {
        const setColumns = !columns.length;
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
      if (all_strings === true) {
        gridDiv.insertAdjacentHTML(
          "afterbegin",
          '<p class="notification is-warning">This file was extracted from the legacy BCO-DMO file system. Sorting and filtering functionality is temporarily disable and will be restored soon.</p>'
        );
      }
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
      $(horizontalScrollEl).removeClass("ag-scrollbar-invisible")
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
