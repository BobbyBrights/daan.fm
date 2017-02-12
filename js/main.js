var mixSelectEl = document.querySelector('#main-header select');
var audioEl = document.querySelector('audio');
var currentMix;
var hashId = window.location.search;
var isTouch = false;
var mixes = data;

if(hashId){
	var hashValue = hashId.replace("?","").split('=')[1];
	var filteredMix = mixes.filter(function(m){
		return m.id === hashValue;
	})
	currentMix = filteredMix[0];
}else{
	currentMix = mixes[mixes.length-1]
}

// Create 2 rows of songs 
var splitTrack = Math.ceil(currentMix.tracks.length/2);
currentMix.firstTracks = currentMix.tracks.filter(function(d,i){
	return i < splitTrack
})
currentMix.secondTracks = currentMix.tracks.filter(function(d,i){
	return i >= splitTrack
})

// Create and initialise page
var templateHTML = document.querySelector("#template").innerHTML;
var template = Handlebars.compile(templateHTML);
var targetEl = document.querySelector('#content');
targetEl.innerHTML = template(currentMix);

mixSelectEl.value = currentMix.id;
mixSelectEl.addEventListener('change',function(e){
	window.location.search = "?month=" + e.target.value
})

var spotifyBtn = document.querySelector('#spotify-btn').addEventListener('click',function(e){
	var url = e.currentTarget.getAttribute('data-url');
	window.open('https://open.spotify.com/user/ddaan/playlist/' + currentMix.playlistId)
})

// Create e-mail contents
document.querySelector('#email-link a').addEventListener('click',function(e){
	var string = "Tracklist daan.fm %0A";

	currentMix.tracks.forEach(function(track){
		string += encodeURIComponent(track.track.artists[0].name) + " - " + encodeURIComponent(track.track.name) + "%0A"
	})

	string += "%0A" + encodeURIComponent('daanlouter.com/daanfm');
	window.open('mailto:%20?Subject=daan.fm%20tracklist&Body='+string)
})

createCircles();


// Preview track
var trackEls = document.querySelectorAll('.track');


// On desktop
// Mouse enter, start playing, mouseleave, stop playing
// Mobile, tap to play, tap again or tap pause button to stop

for(var i=0; i<trackEls.length; i++){
	trackEls[i].addEventListener('mouseenter',function(e){
		startAudio(e,'mouse');
	})

	trackEls[i].addEventListener('touchend',function(e){
		stopAudio();
		startAudio(e,'touch');
	})

	trackEls[i].addEventListener('mouseleave',function(e){
		stopAudio();
	})
}

document.querySelector('#mute-button').addEventListener('touchend',function(){
	stopAudio();
})

function startAudio(e,state){
	if(!isTouch && state === "touch"){
		isTouch = true;
		document.querySelector('body').classList.add('isTouch');
	}

	// Animate circle
	var url = e.currentTarget.getAttribute('data-audio');
	var id = e.currentTarget.getAttribute('data-id');
	var trackCircle = document.querySelector("#track-" + id);
		trackCircle.className += " circle-active";

	// Play audio
	document.querySelector('#mute-button').classList.add('isActive')
	audioEl.src = url;
	audioEl.play()
}

function stopAudio(){
	var trackCircle = document.querySelector(".circle-active");
	if(trackCircle){
		trackCircle.classList.remove("circle-active");
	}

	document.querySelector('#mute-button').classList.remove('isActive')
	audioEl.src = "";
}

initStyles();

function initStyles(){
	document.querySelector('body').style.backgroundColor = currentMix.primaryColor;
	document.querySelector('body').style.color = currentMix.secondaryColor;
	document.querySelector('#main-header select').style.color = currentMix.secondaryColor;
	document.querySelector('#spotify-btn').style.backgroundColor = currentMix.secondaryColor;
	document.querySelector('#spotify-btn').style.color = currentMix.tertiaryColor;
	document.querySelector('#mute-button').style.backgroundColor = currentMix.secondaryColor;
	document.querySelector('#mute-button').style.color = currentMix.tertiaryColor;

	var circleContainers = document.querySelectorAll('.circle-line');
	for(var i=0; i<circleContainers.length;i++){
		circleContainers[i].style.borderColor = currentMix.primaryColor;
	}
}




// Background artists
function createCircles(){
	var amount = currentMix.tracks.length;
	var circles = [];
	var circleEls = [];
	var tries = 0;
	var backgroundEl = document.querySelector("#background-container")
	var wrapperEl = document.querySelector("#wrapper")
	var limit = 40000;
	var margin = 10;
	var windowWidth = window.innerWidth;
	var wrapperBigger = wrapperEl.getBoundingClientRect().height > backgroundEl.getBoundingClientRect().height ? true : false;
	var rightHeight =  wrapperBigger ? wrapperEl.getBoundingClientRect().height : backgroundEl.getBoundingClientRect().height
	if(wrapperBigger){
		backgroundEl.style.minHeight = rightHeight + "px"
	}
	var windowHeight = rightHeight;
	var area = windowWidth * windowHeight;
	var size = area/8000;
	if(size < 40){size = 40}else if(size > 120){ size=120 }
	size = size * (9/amount)

	function calculatePositions(){
		while(circles.length < amount){
			var offset = (200/limit) * tries;
			var rad = (Math.random() * (size+20)) + size;
			var circle = {
				xPos : (rad/2) + Math.random() * (windowWidth - rad),
				yPos : (rad/2) + Math.random() * (windowHeight - rad),
				rad : rad
			}

			var isOverlapping = false;

			for(i=0;i<circles.length; i++){
				var otherCircle = circles[i];
				var a = otherCircle.xPos - circle.xPos;
				var b = otherCircle.yPos - circle.yPos;

				var dist = Math.sqrt( a*a + b*b );
				if(dist < otherCircle.rad + circle.rad + margin){
					isOverlapping = true;
				}
			}

			if(!isOverlapping){
				circles.push(circle);
			}else{
				tries++;
			}

			if(tries > limit){
				break;
			}
		}

		if(circles.length < amount){
			calculatePositions();
		}
	}

	calculatePositions();

	circles.forEach(function(c,i){
		var circleEl = document.createElement('div')
			circleEl.className = "circle-container";
			circleEl.style.backgroundColor = currentMix.primaryColor;
			circleEl.style.width = c.rad*2 + "px";
			circleEl.style.opacity = 0;
			circleEl.style.height = c.rad*2 +"px";
			circleEl.style.top = c.yPos - c.rad + "px";
			circleEl.style.left = c.xPos - c.rad + "px";
			circleEl.id = "track-" + currentMix.tracks[i].track.id;
			circleEl.innerHTML = "<div class='circle-line circle-line-7'></div><div class='circle-line circle-line-1'></div><div class='circle-line circle-line-2'></div><div class='circle-line circle-line-3'></div><div class='circle-line circle-line-4'></div><div class='circle-line circle-line-5'></div><div class='circle-line circle-line-6'></div>";
			
		function getArtistImage(count){
			if(currentMix.tracks[i].track.artists.length < count+1){
				return false
			}
			getArtistURL(currentMix.tracks[i].track.artists[count].id,function(r){
				var request = r.target;
				
				if (request.status >= 200 && request.status < 400) {
					var data = JSON.parse(request.responseText);
				    var img = null;
				    
				    if(data.images.length > 0){
				    	img = data.images[0].url;
				    	circleEl.style.backgroundImage = "url(" + img + ")"
				    }else{
				    	getArtistImage(count+1)
				    }
				    
				}
			});
		}

		getArtistImage(0);
			
		backgroundEl.appendChild(circleEl);
		fadeCircles(0);
	})

	function fadeCircles(index){
		setTimeout(function(){
			backgroundEl.querySelectorAll('.circle-container')[index].style.opacity = null;
			if(index <circles.length - 1){
				fadeCircles(index+1)
			}
		},100)
	}


}


function getArtistURL(id,callback){
	var request = new XMLHttpRequest();
	request.open('GET', "https://api.spotify.com/v1/artists/" + id, true);
	request.onload = callback;
	request.send();
}















