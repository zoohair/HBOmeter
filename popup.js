// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl() {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    return url;
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getImageUrl(searchTerm, callback, errorCallback) {
  // Google image search - 100 searches per day.
  // https://developers.google.com/image-search/
  var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
    '?v=1.0&q=' + encodeURIComponent(searchTerm);
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);
  // The Google image search API responds with JSON, so let Chrome parse it.
  x.responseType = 'json';
  x.onload = function() {
    // Parse and process the response from Google Image Search.
    var response = x.response;
    if (!response || !response.responseData || !response.responseData.results ||
        response.responseData.results.length === 0) {
      errorCallback('No response from Google Image search!');
      return;
    }
    var firstResult = response.responseData.results[0];
    // Take the thumbnail instead of the full image to get an approximately
    // consistent image size.
    var imageUrl = firstResult.tbUrl;
    var width = parseInt(firstResult.tbWidth);
    var height = parseInt(firstResult.tbHeight);
    console.assert(
        typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
        'Unexpected respose from the Google Image Search API!');
    callback(imageUrl, width, height);
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}


var movieScores = {}
var movieScores_str = ""
function updateRank(movieName, score)
{
  movieScores[movieName] = score;
  console.log(movieName  + ' has score ' + score + '%');

  movieScores_str += movieName + ": " + score + '%' + '\n';
  renderStatus(movieScores_str)
}
function rankMovie(movieName)
{


  var searchUrl = 'https://www.rottentomatoes.com/search/?search=' + movieName

  var xmlHttp = new XMLHttpRequest();

  var root_script;


  xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          var responseText = (xmlHttp.responseText);
          var $htmlDoc =  jQuery(responseText)
          var root_script = $htmlDoc.find("div").filter('.container ').find("script").eq(0).text()
          var re = /[\s\S]*mount.*?get\(0\)\,\s?\'[\w?\s?]+\'\s?\,(.*).*?\);/;
          var dict_str = root_script.match(re)

          if (dict_str != null && dict_str.length == 2)
          {
            x = JSON.parse(dict_str[1]);
            score = x.movies[0]['meterScore'];
            updateRank(movieName, score == null ? "?" : score)
          }
  }
  xmlHttp.open("GET", searchUrl, true); // true for asynchronous 
  xmlHttp.send(null);

}

function errorMessageFn(errorMessage) {
      renderStatus('Cannot display image. ' + errorMessage);
}

function cbFn(imageUrl, width, height) {

      renderStatus('Search term: ' + url + '\n' +
          'Google image search result: ' + imageUrl);
      var imageResult = document.getElementById('image-result');
      // Explicitly set the width/height to minimize the number of reflows. For
      // a single image, this does not matter, but if you're going to embed
      // multiple external images in your page, then the absence of width/height
      // attributes causes the popup to resize multiple times.
      imageResult.width = width;
      imageResult.height = height;
      imageResult.src = imageUrl;
      imageResult.hidden = false;

}

document.addEventListener('DOMContentLoaded', 
  function() {
    
    //var url = getCurrentTabUrl();

    var movieNames = ['Lord of the rings', 'Transformers', 'Armageddon', 'man On wire']
    
    // for (var i = 0, len = movieNames.length; i < len; i++) {

    //   renderStatus('Ranking ' + movieNames[i]);
    //   rankMovie(movieNames[i]);
    // }


    //getImageUrl(url, cbFn, errorMessageFn);    
  }

);
