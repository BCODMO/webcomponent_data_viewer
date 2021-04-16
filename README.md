# Frictionless-Data-Package-Inspector
Visualize a Frictionless Data Package with at least one tabular data resource defined. It displays:
- a table of information about the columns of the file
- a table of the tabular data

## How to use it
You might need to use `static-server` for development.
Call the index.html file with the following query parameters:

1. `/index.html?dataset=<dataset-id>&version=<version-id>`
  
  Ex: /index.html?dataset=812909&version=1
  
2. `/index.html?dpkg=<url to Frictionless Data Package>`
  
  Ex: /index.html?dpkg=https://raw.githubusercontent.com/BCODMO/Frictionless-Data-Package-Inspector/ag-grid/datasets/812909/1/data/datapackage.json
  
## How does it work

1. Builds a URL to a Frictionless Data Package (datapackage.json)
2. Loads the datapackage.json
3. Look for a tabular data resource within the data package
4. Create a table to list the fields of that tabular resource
5. Create a table to list the data of that tabular resource
6. Display a progress bar as the data file is downloaded to the client
7. Parse the data file to construct rows for the data table

## Dependencies

1. jQuery 3.5.1
2. Datapackage 1.1.9
3. Tableschema 1.12.3
4. AG-Grid 24.1.0

## Local Javascript

1. dataViewer.js - processes the Frictionless Data Package and generates the tables
2. detectXHR.js - generates a progress bar for the retrieval of the tabular data file
