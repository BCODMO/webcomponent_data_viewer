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
      console.log(this.dpkg);
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

    if (this._idx === undefined) {
      return html`<mwc-linear-progress indeterminate></mwc-linear-progress>`;
    }

    return html`
      <fieldset class="margin-top-1">
        <div class="columns is-gapless is-multiline">
          <div class="column is-two-thirds"><legend><a id="field-info-label">Field Information</a></legend></div>
          <div class="column is-one-third">
            <div class="field has-text-right">
              <input id="field-info-toggle" type="checkbox" name="fieldInfoToggle" class="switch is-small" checked>
              <label for="field-info-toggle">Hide</label>
            </div>
          </div>
          <div class="column"><div style="height: 200px;" id="${id}" class="ag-theme-balham"></div></div>
        </div>
      </fieldset>
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

    console.log(this.dpkg);
    datapackage.Package.load(this.dpkg)
      .then((pkg) => {
        console.log(pkg.descriptor);
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
    for (const field of resource.schema.fields) {
      let row = {
        Field: field.name,
        Type: field.type,
        Format: default_types.includes(field.format) ? "" : field.format,
        Description: "undefined" != field.description ? field.description : "",
      };
      rows.push(row);
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
      immutableData: true,
      rowData: rows,
    };

    /* Create the Data Grid */
    this._idx = idx;
    this.updateComplete.then(() => {
      let gridDiv = this.querySelector(`#field-grid-${idx}`);
      new agGrid.Grid(gridDiv, fieldGrid);
    });
    /* Define the Data Grid Columns*/
  }

  _createDataGrid(idx, resource) {
    /* Download the file */
    console.log("downloading...", resource.source);
    resource.iter({ stream: true, keyed: true, cast: false }).then((stream) => {
      this.__createDataGrid(idx, resource, stream);
    });
  }

  __createDataGrid(idx, resource, stream) {
    /* Define the Data Grid Columns*/
    let columns = [];
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
          column["comparator"] = this.dateComparator;
          break;
        case "number":
          column["type"] = "numberColumn";
          column["comparator"] = this.numberComparator;
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
