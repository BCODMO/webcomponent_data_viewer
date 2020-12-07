
const max_bytes = 1000000000


function addListeners(xhr) {
    xhr.addEventListener('loadstart', handleEvent);
    xhr.addEventListener('load', handleEvent);
    xhr.addEventListener('loadend', handleEvent);
    xhr.addEventListener('progress', handleEvent);
    xhr.addEventListener('error', handleEvent);
    xhr.addEventListener('abort', handleEvent);
}

var s_ajaxListener = new Object();
s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
s_ajaxListener.callback = function () {
  // this.method :the ajax method used
  // this.url    :the url of the requested script (including query string, if any) (urlencoded)
  // this.data   :the data sent, if any ex: foo=bar&a=b (urlencoded)
  //console.log(this.method);
  //console.log(this.url);
  //console.log(this.data);
}

XMLHttpRequest.prototype.open = function(a,b) {
  if (!a) var a='';
  if (!b) var b='';
  s_ajaxListener.tempOpen.apply(this, arguments);
  s_ajaxListener.method = a;
  s_ajaxListener.url = b;
  if (a.toLowerCase() == 'get') {
    s_ajaxListener.data = b.split('?');
    s_ajaxListener.data = s_ajaxListener.data[1];
  }
  //console.log(downloads_to_watch)
  if (undefined != downloads_to_watch[s_ajaxListener.url]) {
    //console.log(`watching for ${s_ajaxListener.url}`)
    document.querySelector('#progress-container').style.display = 'block';
    addListeners(this);
  }
}

XMLHttpRequest.prototype.send = function(a,b) {
  if (!a) var a='';
  if (!b) var b='';
  s_ajaxListener.tempSend.apply(this, arguments);
  if(s_ajaxListener.method.toLowerCase() == 'post')s_ajaxListener.data = a;
  //console.log(s_ajaxListener.url)
  s_ajaxListener.callback();
}

function handleEvent(e) {
  if ('error' == e.type) {
    showError('Could not finish retrieving the data. Please try again.')
  }

  // Get the total bytes from the downloads_to_watch object
  let bytes = downloads_to_watch[e.target.responseURL];
  // Calculate some total
  let total = (e.total > 0) ? e.total : (bytes != 'undefined' ? bytes : max_bytes)
  //console.log(`${e.target.responseURL} - ${e.type}: ${e.loaded} of ${total} bytes transferred\n`)

  // Calculate the percent complete
  percentage = ((e.loaded/total) * 100).toFixed(1);

  // Update the progress bar
  let bar = document.querySelector('#download-bar')
  bar.style.width = percentage + "%";
  bar.innerHTML = bar.style.width
  // Update the progress message
  document.querySelector('#progress-msg-update').innerHTML = prettySize(e.loaded)

  // Hide progress when complete
  if ('loadend' == e.type) {
    document.querySelector('#progress-container').style.display = 'none';
  }
}


