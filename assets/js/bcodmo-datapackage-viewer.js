let tmpl = document.createElement('template');
tmpl.innerHTML = `
  <h1 id="bcodmo-datapackage-viewer-title">Data Viewer</h1>
  <div id="bcodmo-datapackage-viewer-error" class="alert alert-danger"></div>
  <main id="bcodmo-datapackage-viewer-main"></main>
`;

class BcoDmoDataPackageViewer extends HTMLElement {

  constructor() {
    super();

    // Attach a shadow root to the element.
    let shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(tmpl.content.cloneNode(true));

    this.$title = this.shadowRoot.querySelector('#bcodmo-datapackage-viewer-title')
    this.$error = this.shadowRoot.querySelector('#bcodmo-datapackage-viewer-error')
    this.$main = this.shadowRoot.querySelector('#bcodmo-datapackage-viewer-main')

    /* Construct the Datapackage URL */
    if (this.dataset && this.version) {
      let dpkg_url = this.getDatasetVersionPackage()

    }
  }

  createGrid(idx, resource) {
    /* Define the Data Grid Columns*/
    columns = []
    for (const field of resource.schema.fields) {
      var column = { field: field.name, headerName: field.name, sortable: true, filter: true }
      // Handle specific formatting for some data types
      switch (field.type) {
        case "date":
           column["cellRenderer"] = function (params) {
               return dateFormat(params.value, field.format)
           }
           column["getQuickFilterText"] = function (params) {
               return dateFormat(params.value, field.format)
           }
           break;
        case "time":
           column["cellRenderer"] = function (params) {
               return dateFormat(params.value, field.format)
           }
           column["getQuickFilterText"] = function (params) {
               return dateFormat(params.value, field.format)
           }
           break;
      }
      columns.push(column)
    }

    /* Setup the Data Grid Options */
    var dataGrid = {
       animateRows: true,
       columnDefs: columns,
       cacheQuickFilter: true,
       defaultColDef: {
         flex: 1,
         filter: 'agTextColumnFilter'
       },
       domLayout: 'autoHeight',
       immutableData: true,
       pagination: true,
       rowData: []
    }

    /* Create the Data Grid */
    let gridDiv = document.createElement('div')
    gridDiv.id = 'data-grid-' + idx
    gridDiv.className = 'ag-theme-balham'
    gridDiv.style = 'height: 500px; width: 100%'
    this.$main.append(gridDiv)
    new agGrid.Grid(gridDiv, dataGrid)

    const stream = await resource.iter({stream: true, keyed: true})
    stream.on('data', (row) => {
     dataGrid.api.applyTransaction({ add: [row] })
    })
  }

  getDatasetVersionPackage() {
    return 'https://datadocs.bco-dmo.org/files/laminar/1/' + this.dataset + '/' + this.version + '/data/datapackage.json'
  }

  showError(err) {
    this.$error.html(msg).show()
  }

  // A getter/setter for an dataset property.
  get dataset() {
    return this.getAttribute('dataset');
  }

  set dataset(val) {
    // Reflect the value of the dataset property as an HTML attribute.
    if (val) {
      this.setAttribute('dataset', '');
    } else {
      this.removeAttribute('dataset');
    }
  }

  // A getter/setter for an version property.
  get version() {
    return this.getAttribute('version');
  }

  set version(val) {
    // Reflect the value of the version property as an HTML attribute.
    if (val) {
      this.setAttribute('version', '');
    } else {
      this.removeAttribute('version');
    }
  }
}
window.customElements.define('bcodmo-datapackage-viewer', BcoDmoDataPackageViewer);
