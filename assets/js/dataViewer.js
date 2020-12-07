// watch downloads to update the progress bar
var downloads_to_watch = {}

$('#field-info-label').click(function() {
  $('#field-grid').toggle();
  return false;
});

/**
 * Description: Take the URL Query Parameters and determine the Datapackage to view
 * Example #1: ?dataset={datasetID}&version={version}
 * Example #2: ?dpkg={datapackage URL}
 */
const main = async () => {
  /* Construct the Datapackage URL */
  var dpkg_url = ""
  const params = new URLSearchParams(window.location.search)
  if ((params.has('dataset')) && (params.has('version'))) {
    dpkg_url = 'https://datadocs.bco-dmo.org/files/laminar/1/' + params.get('dataset') + '/' + params.get('version') + '/data/datapackage.json'
  } else if (params.has('dpkg')) {
    dpkg_url = params.get('dpkg') //'https://datadocs.bco-dmo.org/' + params.get('dpkg')
  }
  /* Check if we have a Datapackage URL */
  if (dpkg_url == "") {
    let error = "The selected Datapackage does not appear to be valid"
    showError(error)
    throw new Error(error)
  }

  /* Load the Datapackage URL we have */
  const package = await datapackage.Package.load(dpkg_url)
    .catch(err => {
      showError(err)
      throw new Error(err)
    })

  /* Look for tabular resource in the Datapackage */
  let found = false
  for(const [idx,resource] of package.resources.entries()) {
    if (resource.tabular) {
      if ('undefined' != resource.descriptor.bytes) {
        document.querySelector('#progress-total').innerHTML = prettySize(resource.descriptor.bytes)
        downloads_to_watch[resource.source] = resource.descriptor.bytes
      }
      else {
        downloads_to_watch[resource.source] = 0
      }
      createFieldGrid(idx, resource)
      createDataGrid(idx, resource)
      found = true
    }
  }

  /* Let user know if no tabular data found */
  if (false == found) {
    showError('No tabular data found')
  }
}

async function createFieldGrid(idx, resource) {
  let rows = []
  const default_types = ['any', 'default']
  for (const field of resource.schema.fields) {
    let row = {
      Field: field.name,
      Type: field.type,
      Format: default_types.includes(field.format) ? '' : field.format,
      Description: 'undefined' != field.description ? field.description : ''
    }
    rows.push(row)
  }

  /* Setup the Field Grid Options */
  var fieldGrid = {
     animateRows: true,
     columnDefs: [{field: 'Field'},{field: 'Type'},{field: 'Format'},{field: 'Description'}],
     cacheQuickFilter: true,
     defaultColDef: { flex: 1, resizable: true },
     immutableData: true,
     rowData: rows
  }

  /* Create the Data Grid */
  let gridDiv = document.createElement('div')
  gridDiv.id = 'field-grid-' + idx
  gridDiv.className = 'ag-theme-balham'
  gridDiv.style = 'height: 200px'
  let mainNode = document.querySelector('#field-grid')
  mainNode.append(gridDiv)
  new agGrid.Grid(gridDiv, fieldGrid)
  document.querySelector('#fields').style.display = 'block';
  /* Define the Data Grid Columns*/
}

async function createDataGrid(idx, resource) {

  /* Download the file */
  console.log('downloading...')
  const stream = await resource.iter({stream: true, keyed: true, cast: false})
  document.querySelector('#progress-container').style.display = 'block';
  /* Define the Data Grid Columns*/
  columns = []
  for (const field of resource.schema.fields) {
    let column = {
      field: field.name,
      filter: 'agTextColumnFilter',
      headerName: field.name,
      headerTooltip: field.name,
      resizable: true
    }
    switch (field.type) {
      case 'date':
      case 'datetime':
        column['type'] = 'dateColumn'
        break;
      case 'number':
        column['type'] = 'numberColumn'
        break
    }
    columns.push(column)
  }

  /* Setup the Data Grid Options */
  var dataGrid = {
     animateRows: true,
     asyncTransactionWaitMillis: 200,
     columnDefs: columns,
     cacheQuickFilter: true,
     columnTypes: {
       'dateColumn': {
         filter: 'agDateColumnFilter',
         filterParams: { comparator: dateComparator },
       },
       'numberColumn': {
        filter: 'agNumberColumnFilter',
         filterParams: { comparator: numberComparator },
       }
     },
     defaultColDef: {
       flex: columns.length < 10 ? 1 : 0,
       sortable: true,
       width: 120
     },
     domLayout: 'autoHeight',
     immutableData: true,
     onGridReady: function (options) {
       readStream(options, stream, resource.source);
     },
     pagination: true,
     rowData: []
  }

  /* Create the Data Grid */
  let gridDiv = document.createElement('div')
  gridDiv.id = 'data-grid-' + idx
  gridDiv.className = 'ag-theme-balham'
  gridDiv.style = 'height: 500px'
  let mainNode = document.querySelector('main#data')
  mainNode.append(gridDiv)
  new agGrid.Grid(gridDiv, dataGrid)
}

/**
 * Description: Read the tabular Data file
 */
async function readStream(options, stream, url) {
  /* Stream the file */
  console.log('streaming...')
  var count = 1
  var rows = []
  stream.on('data', (row) => {
    rows.push(row)
    if (count == 50) {
      options.api.applyTransactionAsync({ add: rows })
      options.api.flushAsyncTransactions()
      rows = []
      count = 1
      /* Update the Grid */
      //stream.pause();
      setTimeout(() => {
        //stream.resume();
      }, 10);
    }
  })
  .on('end', () => {
    console.log('finished!')
    options.api.applyTransactionAsync({ add: rows })
    options.api.flushAsyncTransactions()
  })
}

function dateComparator (date1, date2) {
  if (date1 === null && date2 === null) {
    return 0;
  }
  if(!isNaN(new Date(date1).getTime())){ return -1}
  if(!isNaN(new Date(date2).getTime())){ return -1}
  if (date1 === null) {
   return -1;
  }
  if (date2 === null) {
    return 1;
  }
  return Date.parse(date1) - Date.parse(date2)
}

function numberComparator (number1, number2) {
  if (number1 === null && number2 === null) {
    return 0;
  }
  if(isNaN(number1)){ return -1}
  if(isNaN(number2)){ return 1}
  if (number1 === null) {
   return -1;
  }
  if (number2 === null) {
    return 1;
  }
  return number1 - number2;
}

/**
 * Description: Display an error message on the page
 * @param:  msg is the error msg
 */
function showError(msg) {
  //$("#loading-panel").hide()
  $("#data-package-error").html(msg).show()
}

/**
 * Description: display the size of bytes
 */
function prettySize(bytes, separator = '', postFix = '') {
    if (bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10), sizes.length - 1);
        return ` ${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)}${separator}${sizes[i]}${postFix}`;
    }
    return ' ';
}

/**
 * Call the main method
 */
main()
