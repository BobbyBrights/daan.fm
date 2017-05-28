var mixSelectEl = document.querySelector('#main-header select');
var audioEl = document.querySelector('audio');
var currentMix;
var hashId = window.location.search;
var isTouch = false;
var mixes = data.reverse();
var months = [];
var throttle = 0;
var currentActive = null;

if(hashId){
	
}

// Create and initialise page
var templateHTML = document.querySelector("#template").innerHTML;
var template = Handlebars.compile(templateHTML);

for(var currentMix in mixes){
	months.push(new Month(mixes[currentMix]));
	months[months.length - 1].create();
}

checkScrollHeight();
initAudio();

window.addEventListener('scroll',function(e){
	throttle--;
	if(throttle > 0){ return false }
	throttle = 5;

	checkScrollHeight();
})

function checkScrollHeight(){
	var windowHeight = window.innerHeight;
	for(var i = 0; i < months.length; i++){
		var offsetTop = months[i].el.getBoundingClientRect().top;
		var offsetBottom = months[i].el.getBoundingClientRect().bottom;

		// preload
		if(offsetTop < windowHeight*1.2 && !months[i].loaded){
			if(!months[i].loaded){
				months[i].loaded = true;
				months[i].initStyles();
				months[i].fadeCircles();
				createCircles(months[i].el,months[i].data)
			}
		}

		// Fade in content
		if(offsetTop < windowHeight*0.55 && offsetBottom > windowHeight*0.55 && !months[i].active){
			if(currentActive !== null){
				months[currentActive].active = false;
				months[currentActive].hide();
			}
			
			months[i].active = true;
			months[i].appear();
			
			currentActive = i;
		}
	}
}

function Month(data){
	this.data = data;
	this.loaded = false;
	this.active = false;
	this.shown = false;
	this.el;

	var self = this;

	this.create = function(){
		var splitTrack = Math.ceil(this.data.tracks.length/2);
		
		this.data.firstTracks = this.data.tracks.filter(function(d,i){
			return i < splitTrack
		})
		this.data.secondTracks = this.data.tracks.filter(function(d,i){
			return i >= splitTrack
		})

		var html = template(this.data);

		var templateEl = document.createElement('section');
			templateEl.className = "month";
			templateEl.dataset.loaded = false;
			templateEl.innerHTML = template(this.data);
		
		this.el = document.querySelector('#content').appendChild(templateEl);	
		this.adjustHeight();
	}

	this.adjustHeight = function(){
		var elHeight = this.el.querySelector('.content').getBoundingClientRect().height;
		var padding = window.getComputedStyle(this.el, null).getPropertyValue('padding-top');
		var windowHeight = window.innerHeight - (Number(padding.replace("px",""))*2);

		var diff = windowHeight - elHeight;
		if(diff > 0){
			this.el.querySelector('.content').style.marginTop = diff/2 + "px";
		}
	}

	this.initStyles = function(){
		// this.el.style.color = this.data.secondaryColor;
		this.el.querySelector('.spotify-btn').style.color = this.data.secondaryColor;
		this.el.querySelector('.spotify-btn').style.backgroundColor = this.data.tertiaryColor;

		var circleContainers = this.el.querySelectorAll('.circle-line');
		for(var i=0; i<circleContainers.length;i++){
			circleContainers[i].style.borderColor = currentMix.primaryColor;
		}
	}

	this.hide = function(){
		this.el.querySelector('.content').style.opacity = 0; 
		var circleEls = this.el.querySelectorAll('.circle-container');

		// for(var i = 0; i<circleEls.length; i++){
		// 	circleEls[i].style.opacity = 0;
		// }
	}

	this.appear = function(){
		document.body.style.backgroundColor = this.data.primaryColor;

		// document.body.style.color = this.data.secondaryColor;
		this.el.style.color = this.data.secondaryColor;
		this.el.querySelector('.content').style.opacity = 1; 
	}

	this.fadeCircles = function(){
		function fadeCircles(index){
			setTimeout(function(){
				self.el.querySelectorAll('.circle-container')[index].style.opacity = null;
				if(index < self.el.querySelectorAll('.circle-container').length - 1){
					fadeCircles(index+1)
				}
			},100)
		}

		fadeCircles(0);
	}
}

document.querySelector('#mute-button').addEventListener('touchend',function(){
	stopAudio();
})




function initAudio(){
	var trackEls = document.querySelectorAll('.track');

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
}

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




// Background artists
function createCircles(el,data){
	var amount = data.tracks.length;
	var circles = [];
	var circleEls = [];
	var tries = 0;
	var backgroundEl = el.querySelector(".background-container")
	var limit = 40000;
	var margin = 10;
	var windowWidth = window.innerWidth;
	var windowHeight = backgroundEl.getBoundingClientRect().height;
	var area = windowWidth * windowHeight;
	var size = area/8000;
	if(size < 40){size = 40}else if(size > 120){ size=120 }
	size = size * (4/amount)

	function calculatePositions(){
		while(circles.length < amount){
			var offset = (200/limit) * tries;
			var rad = (Math.random() * (size+20)) + size;
			var circle = {
				xPos : (rad) + Math.random() * (windowWidth - rad*2),
				yPos : (rad) + Math.random() * (windowHeight - rad*2),
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
			circleEl.style.backgroundColor = data.primaryColor;
			circleEl.style.width = c.rad*2 + "px";
			circleEl.style.opacity = 0;
			circleEl.style.height = c.rad*2 +"px";
			circleEl.style.top = c.yPos - c.rad + "px";
			circleEl.style.left = c.xPos - c.rad + "px";
			circleEl.id = "track-" + data.tracks[i].track.id;
			circleEl.innerHTML = "<div class='circle-line circle-line-7'></div><div class='circle-line circle-line-1'></div><div class='circle-line circle-line-2'></div><div class='circle-line circle-line-3'></div><div class='circle-line circle-line-4'></div><div class='circle-line circle-line-5'></div><div class='circle-line circle-line-6'></div>";
			
		function getArtistImage(count){
			if(data.tracks[i].track.artists.length < count+1){
				return false
			}
			getArtistURL(data.tracks[i].track.artists[count].id,function(r){
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
	})
}


function getArtistURL(id,callback){
	var request = new XMLHttpRequest();
	request.open('GET', "https://api.spotify.com/v1/artists/" + id, true);
	request.onload = callback;
	request.send();
}











