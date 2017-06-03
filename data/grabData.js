var fs = require('fs');
var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express')
var app = express();
var https = require('https')

var authCode = "";
var clientId = null;
var clientSecret = null;
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

	var outputData = [];
	function getPlaylist(count){
		spotifyApi.getPlaylistTracks('ddaan', playlistData[count].playlistId)
	  		.then(function(data) {
	    		playlistData[count].tracks = data.body.items.map(function(track,i){
	    			console.log(i)
	    			return {
	    				count: i + 1,
	    				artists: track.track.artists,
	    				name:track.track.name,
	    				preview_url: track.track.preview_url,
	    				id: track.track.id
	    			}
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
	function getImage(month,track){
		if(!data[month]){ 
			exportData();
			return; }
		if(!data[month].tracks[track]){
			getImage(month + 1, 0);
			return;
		}

		var artist = data[month].tracks[track].artists[0];
		spotifyApi.getArtist(artist.id).then(function(val){
			data[month].tracks[track].images = val.body.images;
			setTimeout(function(){getImage(month,track+1)},50)
		}).catch(function(err){
			console.log(err)
		})
	}

	getImage(0,0);

	function exportData(){
		var dataExport = "var data = " + JSON.stringify(data) + ";"
		fs.writeFileSync('data.js',dataExport)
	}
}

// "primaryColor": "rgb(255, 235, 59)",
// "secondaryColor": "rgb(251, 63, 114)",
// "tertiaryColor":"rgb(251, 63, 114)"
