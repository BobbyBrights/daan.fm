var fs = require('fs');
var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express')
var app = express();
var https = require('https')

var authCode = "";
var clientId = "69eca68bc733412a83d867d10680d52c"
var clientSecret = "c1247552885340289c8c923441d5b00d"
var redirectUri = "http://localhost:8000/callback"
var playlistData;
var tokenExpirationEpoch;
if(playlistData){playlistData = JSON.parse(playlistData)}

var spotifyApi = new SpotifyWebApi({
  clientId : clientId,
  clientSecret : clientSecret,
  redirectUri : redirectUri
});

var authorizeURL = spotifyApi.createAuthorizeURL([],'ee');

app.get('/authorize', function (req, res) {
  res.redirect(authorizeURL);
})

app.get('/callback', function (req, res) {
	authCode = req.query.code;
	authSpotify();
  	res.send('let\'s get those playlists <a href="/">here</a>')
})

app.get('/',function(req,res){
	playlistData = JSON.parse(fs.readFileSync('mixes.json','utf8'));
	if(authCode){
		startScraping(req.query);
	}
	res.send('<h1>Hoi, om te authorizen, <a href="/authorize">klik hier</a>. Als dat al gelukt is, dan is dit je nieuwe data.</h1>')
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})


function authSpotify(){
	spotifyApi.authorizationCodeGrant(authCode)
	  .then(function(data) {
	  	tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];

	    spotifyApi.setAccessToken(data.body['access_token']);
	    spotifyApi.setRefreshToken(data.body['refresh_token']);

	    console.log('successfully authorized')
	  }, function(err) {
	    console.log('Something went wrong!', err);
	  });
}

function refreshToken(){
	if(!tokenExpirationEpoch || new Date().getTime() / 1000 >= tokenExpirationEpoch){
		spotifyApi.refreshAccessToken()
		  .then(function(data) {
		    console.log('The access token has been refreshed!');

		    // Save the access token so that it's used in future calls
		    spotifyApi.setAccessToken(data.body['access_token']);
		  }, function(err) {
		    console.log('Could not refresh access token', err);
		  });
	}else{
		var timeRemaining = tokenExpirationEpoch - (new Date().getTime() / 1000)
		console.log(tokenExpirationEpoch, (new Date().getTime() / 1000))
		console.log('token still fresh, new one in: ' + timeRemaining);
	}
}

function startScraping(playlist){
	refreshToken();

	console.log('start scraiping')

	var outputData = [];
	function getPlaylist(count){
		spotifyApi.getPlaylistTracks('ddaan', playlistData[count].playlistId)
	  		.then(function(data) {
	    		playlistData[count].tracks = data.body.items.map(function(track,i){
	    			track.count = i + 1;
	    			return track
	    		})
	    		outputData.push(playlistData[count])
	    		if(count < playlistData.length-1){
	    			getPlaylist(count+1)
	    		}else{
	    			getArtistImages(outputData)
	    		}
	  		}, function(err) {
	    		console.log('Something went wrong!', err);
	  		});
	}

	getPlaylist(0)
}

function getArtistImages(data){
	// console.log('started function')
	// data.forEach(function(month){
	// 	month.tracks.forEach(function(track){
	// 		var url = "https://api.spotify.com/v1/artists/" + track.track.artists[0].id;
	// 		https.get(url, function(res){
	// 		    var body = '';

	// 		    res.on('data', function(chunk){
	// 		        body += chunk;
	// 		    });

	// 		    res.on('end', function(){
	// 		        var bodyData = JSON.parse(body);
	// 		        console.log(bodyData.images[0].url);
	// 		    });
	// 		}).on('error', function(e){
	// 		      console.log("Got an error: ", e);
	// 		});
	// 	})
	// })



	var dataExport = "var data = " + JSON.stringify(data) + ";"
	fs.writeFileSync('data.js',dataExport)
}


// "primaryColor": "rgb(255, 235, 59)",
// "secondaryColor": "rgb(251, 63, 114)",
// "tertiaryColor":"rgb(251, 63, 114)"
