# Frictionless-Data-Package-Inspector
Visualize a Frictionless Data Package with at least one tabular data resource defined. It displays:
- a table of information about the columns of the file
- a table of the tabular data

## how to run project?

- Run `npm install npm@latest -g` (if npm is not installed)
- Run `npm install -g polymer-cli`
- Run `npm install`
- Run `polymer serve` (If you want to view a live demo of your element, run the local web server)
- Now To view the demo, point your browser to `http://127.0.0.1:8081/` URL. (Must run `polymer server` command before this)

## How to use it

1. `<bcodmo-data-viewer dataset=812909 version=1></bcodmo-data-viewer>`
  
2. `<bcodmo-data-viewer dpkg="DATA_PKG_URL"></bcodmo-data-viewer>`
  
## How does it work

1. Builds a URL to a Frictionless Data Package (datapackage.json)
2. Loads the datapackage.json
3. Look for a tabular data resource within the data package
4. Create a table to list the fields of that tabular resource
5. Create a table to list the data of that tabular resource
6. Display a progress bar as the data file is downloaded to the client
7. Parse the data file to construct rows for the data table

## Dependencies

1. Lit-element
2. Datapackage 1.1.9
3. Tableschema 1.12.3
4. AG-Grid 24.1.0

## Local Javascript

1. dataViewer.js - processes the Frictionless Data Package and generates the tables
2. detectXHR.js - generates a progress bar for the retrieval of the tabular data file
