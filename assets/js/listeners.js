/**
 * Listeners
 **/
function toggleFieldInfoVisibility(element, table_id) {
  console.log(element);
  console.log(table_id);

  var table_display = document.querySelector('#'+table_id).style.display;
  if (table_display == undefined || table_display == '' || table_display == 'block'){
    document.querySelector('#'+table_id).style.display = 'none';
    element.querySelector('input').checked = false;
    element.querySelector('label').innerHTML = 'Show';
  }
  else {
    document.querySelector('#'+table_id).style.display = 'block';
    element.querySelector('input').checked = true;
    element.querySelector('label').innerHTML = 'Hide';
  }
}
