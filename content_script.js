console.log("HBO meter has been loaded!");


// Inject the rotten.js script into the file
var s = document.createElement('script');
s.src = chrome.extension.getURL('rotten.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);


var csMovies = {}
var csMovies_str = ""
function updateRank(movieName, score)
{
  csMovies[movieName] = score;
  //console.log(movieName  + ' has score ' + score + '%');

  //csMovies_str += movieName + ": " + score + '%' + '\n';
  //renderStatus(csMovies_str)
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
            updateRank(movieName, score == null ? "?" : score);
          }
          else
          {
          	updateRank(movieName, "!");	
          }
  }
  xmlHttp.open("GET", searchUrl, true); // true for asynchronous 
  xmlHttp.send(null);

}

function buildCntStr(movieName)
{
	return "(" + ((movieName in csMovies) ? csMovies[movieName] : "..") + "%)";
}

function buildTitleStr(movieName)
{
	if (! (movieName in csMovies))
	{
		rankMovie(movieName);
		csMovies[movieName] = "..";
		return "Fetching...";		
	}
	else
	{
		return buildCntStr(movieName);
	}
}



var mylinks = jQuery(document).find("div").filter('.now-thumbnail-bottomtext');

for (var i = 0, len = mylinks.length; i < len; i++) {

 	  var movieTitle = mylinks[i].textContent.trim();
 	  var thisLink = mylinks[i];
 	  thisLink.onmouseover = (function(l,t) { 
 	  											return function()
 	  													{ 
	 	  													l.title 	  = buildTitleStr(t); 
	 	  													l.textContent = t + " " + buildCntStr(t);
	 	  													setTimeout(function(){ l.textContent = t + " " + buildCntStr(t);},3000);
 	  													}

 											} )(thisLink,movieTitle);
 	  //mylinks[i].title = "javascript:getRankStr('" + movieTitle +"');";

}



window.addEventListener('message', function(event) {
    if (event.data.type == 'page_js_request')
    {
    	movieName = event.data.text;
    	console.log('content_script.js got request for:', movieName);
    	rankMovie(movieName);
    }

});


function shareWithPage(movieName)
{
	setTimeout(function () {
	    window.postMessage({ type: 'content_script_scores',
	                         name: movieName,
	                         score: csMovies[movieName]},
	                       '*' /* targetOrigin: any */ );
	}, 1000);
}


