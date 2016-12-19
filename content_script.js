console.log("HBO meter has been loaded!");


// Inject the rotten.js script into the file
var s = document.createElement('script');
s.src = chrome.extension.getURL('rotten.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);


var csMovies = {}
var nmMovies = {}
function updateRank(movieName, score, matchedName)
{
  csMovies[movieName] = score;

  if (matchedName == null)
    {matchedName = movieName}

  nmMovies[movieName] = matchedName;
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
          var re = /[\s\S]*mount.*?get\(0\)\,\s?\'.*\'\s?\,(.*).*?\);/;
          var dict_str = root_script.match(re)


          var idx = -1
          if (dict_str != null && dict_str.length == 2)
          {
            x = JSON.parse(dict_str[1]);

            //See if we can find a perfect match in the name
            //otherwise we'll just used idx=0

            for (var i = 0, len = x.movies.length; i < len; i++) {
              if(x.movies[i]['name'] == movieName)
              {
                  idx = i;
                  break;
              }
            }

            if (idx != -1)
            {
              var score = x.movies[idx]['meterScore'];
              var name  = x.movies[idx]['name'];
              updateRank(movieName, score == null ? "?" : score, name);
            }
          }

          if (idx == -1)
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
		return nmMovies[movieName] + buildCntStr(movieName);
	}
}



var mylinks = jQuery(document).find("div").filter('.now-thumbnail-bottomtext');

for (var i = 0, len = mylinks.length; i < len; i++) {

 	  var movieTitle = mylinks[i].textContent.trim();
 	  var thisLink = mylinks[i];
 	  thisLink.onmouseover = (function(l,t) { 
 	  											return function()
 	  													{ 
	 	  													l.title 	    = buildTitleStr(t); 
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


