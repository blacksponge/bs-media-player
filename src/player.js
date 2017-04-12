"use strict"

/**** PLAYER ****/
function Player(query, {url} = {}) {
  if(!url)
    console.warn('No URL given');
  const BASE_HTML = `<video preload="metadata">
    <source src="${url}" type="video/mp4">
    Miséricorde, ça ne va pas aller du tout, le tag video n'est pas suporté >.<
  </video>
  <div id="error">Une puissante magie noire s'est emparée de la vidéo. <span>Tenter de la récupérer</span></div>
  <div id="spinner"></div>
  <div class="bs-control-bar">
    <svg class="bs-player-ctrl-i play" width="25" height="25"></svg>
    <div time="00:00" class="bs-player-ctrl-i curTime timer"></div>
    <div class="bs-player-ctrl-i state_bar">
    </div>
    <div time="00:00" class="bs-player-ctrl-i endTime timer"></div>
    <div class="volume">
      <svg width="25" height="25" class="bs-player-ctrl-i"></svg>
      <div class="slider bs-player-ctrl-i">
      </div>
    </div>
    <svg class="bs-player-ctrl-i fullscreen" width="30" height="25"></svg>
    <div class="time"></div>
  </div>`;

  var player = document.querySelector(query);
  player.innerHTML = BASE_HTML;
  var media = player.querySelector('video');

  //Bouton play pause
  var playB = Snap(query+' .play');
  playB.path('M0 0 L0 25 L12.5 18.8 L12.5 6.3 Z').attr({fill:"white", stroke:"white", "stroke-width":"1"});
  playB.path('M12.5 6.3 L12.5 18.8 L25 12.5 L25 12.5 Z').attr({fill:"white", stroke:"white", "stroke-width":"1"});
  //Indication du temps au passage sur la timeline
  var timeEl = player.querySelector('.time');

  //Timer au bout de la timeline
  var curTime = player.querySelector('.curTime');
  var endTime = player.querySelector('.endTime');

  /***************** Timeline ********************/
  var x,xPos,duration = 0,currentTime = 0;

  var timelineSlider = new Slider(query + ' .state_bar', {
    move : function(obj){
      media.currentTime = (duration * obj.val);
    },
    init : function(obj){
      this.get().onmouseover = () => {
        timeEl.style.visibility = 'visible';
      }
      this.get().onmouseout = () => {
        timeEl.style.visibility = 'hidden';
      }
      this.get().onmousemove = (e) => {
        x = e.clientX;
        var boundingRectTL = this.get().getBoundingClientRect()

        if(x<boundingRectTL.left || x>boundingRectTL.right)
          return;

        timeEl.style.left = x-media.getBoundingClientRect().left+'px';

        x = (x-boundingRectTL.left)/this.get().clientWidth * media.duration;
        timeEl.textContent = ('0'+Math.floor(x/60)).slice(-2) + ':' + ('0'+Math.floor(x)%60).slice(-2);
      }
      currentTime = obj.val;
    },
    saveState : true,
    id : 'mediaPlayer:' + url,
    forgetAfter : 0.9
  });

  /***********************************************/
  /***************** Volume **********************/
  var vol = Snap(query+' .volume svg');
  vol.path('M0 10 L0 15 L5 15 L13 22 L13 3 L5 10 Z').attr({fill:'white'});
  vol.path('M 17 7.5 a10,10 0 0 1 0,10').attr({stroke:'white', 'stroke-width':'2', fill:'none'});
  //Volume initial  = 0.5
  var volLvl = vol.path('M 22 6 a10,10 0 0 1 0,13').attr({stroke:'none', 'stroke-width':'2', fill:'none'});
  //Pas mute au début
  var muted = vol.path('M2 20 L17 5').attr({stroke:'none', 'stroke-width':'2'});
  media.volume = .5;

  new Slider(query + ' .volume .slider',{
    move : function(obj){
      if(media.muted)
        toggleMute();

      if(media.volume < .75 && obj.val > .75){
        volLvl.attr({stroke:'white'});
      }else if(media.volume > .75 && obj.val < .75){
        volLvl.attr({stroke:'none'});
      }
      media.volume = obj.val;
    },
    init : function(obj){
      media.volume = obj.val;
    },
    saveState : true,
    id : 'volume',
    startValue : 0.5
  });
  /***********************************************/
  /*************** Fullscreen ********************/
  var fS= new Snap(query + ' .fullscreen').attr({'stroke-width' : '2', stroke:'white', fill:'none'});

  fS.path('M5 11 l0 -5 l5 0');
  fS.path('M25 11 l0 -5 l-5 0');
  fS.path('M5 14 l0 5 l5 0');
  fS.path('M25 14 l0 5 l-5 0');

  var fSenable = false;

  /***********************************************/
  /*************** Events ************************/
  //spinner
  media.onseeking = toogleSpinner;
  media.onseeked = toogleSpinner;
  //toggle mute quand on clique sur mute
  player.querySelector('.volume svg').onmousedown = toggleMute;
  //togglePlay quand on appuit sur le bouton play/pause
  player.querySelector('.play').onmousedown = togglePlay;
  //Survol du bouton de fullscreen
  player.querySelector('.fullscreen').onmouseout = function(){
    fSenable ? 	bigger() : smaller();
  }
  player.querySelector('.fullscreen').onmouseover = function(){
    fSenable ? smaller() : bigger();
  }
  player.querySelector('.fullscreen').addEventListener('click',function(){
    toggleFullScreen();
  }, false);
  //togglePlay quand on click sur la video
  media.onmousedown = togglePlay;

  //On empeche d'ouvrir le menu contextuel
  player.oncontextmenu = function(e){
    e.preventDefault();
  };
  //Affichage du temps total de la vidéo au chargement des méta data
  media.onloadedmetadata = function(){
    duration=media.duration; //Utilisé aussi dans media.ontimeupdate
    media.currentTime = currentTime * duration;
    endTime.setAttribute('time', ('0'+Math.floor(duration/60)).slice(-2) + ':' + ('0'+Math.floor(duration)%60).slice(-2));
  };

  media.onerror = function(){
    player.querySelector('#error').style.display = "block";
  };

  media.ontimeupdate = function(){
    currentTime = media.currentTime;
    if(!timelineSlider.drag)
      timelineSlider.value(currentTime / duration);
    curTime.setAttribute('time', ('0'+Math.floor(currentTime/60)).slice(-2) + ':' + ('0'+Math.floor(currentTime)%60).slice(-2));
  }

  //Fullscreen events
  document.addEventListener('webkitfullscreenchange', fullScreenStateChange);
  document.addEventListener('mozfullscreenchange', fullScreenStateChange);
  document.addEventListener('fullscreenchange', fullScreenStateChange);
  document.addEventListener('MSFullscreenChange', fullScreenStateChange);
  //Shortcuts event
  document.onkeydown = function(e){
    var k = e.which || e.keyCode;
    switch (k){
      case 70 : toggleFullScreen(); break; //F : fullscreen
      case 32 : e.preventDefault(); //SPACE : pause and prevent scroll
      case 80 : togglePlay(); e.preventDefault(); break; //P : pause
      case 77 : toggleMute(); break; //M : mute
    }
  }
  /***********************************************/
  /************* Fonctions ***********************/
  function toogleSpinner(){
    if(media.seeking){
      player.querySelector('#spinner').style.display = "block";
    }else{
      player.querySelector('#spinner').style.display = "none";
    }
  }
  function toggleFullScreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.mozRequestFullScreen) {
            player.mozRequestFullScreen();
        } else if (player.webkitRequestFullScreen) {
            player.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (player.msRequestFullscreen) {
          player.msRequestFullscreen();
        }
      } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
  }
  function fullScreenStateChange(){
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      turnOffFS();
    }else{
      turnOnFS();
    }
  }
  function turnOnFS(){
    document.querySelector('body').classList.add('fullscreenmode');
    fSenable = true;
    bigger();
  }
  function turnOffFS(){
    document.querySelector('body').classList.remove('fullscreenmode');
    fSenable = false;
    smaller();
  }
  function animate(svg,arr,tps){
    var el;
    arr.forEach(function(obj, i){
      el = svg.selectAll('*:not(desc):not(defs)')[i];
      el.animate(obj, tps, mina.easein);
    })
  }
  function bigger (){
    animate(fS,
      [{d:'M3 9 l0 -5 l5 0'},
      {d:'M27 9 l0 -5 l-5 0'},
      {d:'M3 16 l0 5 l5 0'},
      {d:'M27 16 l0 5 l-5 0'}], 150);
  }
  function smaller (){
    animate(fS,
      [{d:'M5 11 l0 -5 l5 0'},
      {d:'M25 11 l0 -5 l-5 0'},
      {d:'M5 14 l0 5 l5 0'},
      {d:'M25 14 l0 5 l-5 0'}], 150);
  }
  function toggleMute(e){
    if(media.muted){
      muted.attr({stroke:"none"});
    }else{
      muted.attr({stroke:"red"});
    }
    media.muted = !media.muted;
  }

  function togglePlay(){
    hideControl();
    if (!media.paused){
      pause();
    }else{
      play();
    }
  }

  function play(){
    media.play();
    animate(playB,
      [{d: 'M0 0 L0 25 L10 25 L10 0 Z'},
      {d:'M15 0 L15 25 L25 25 L25 0 Z'}], 300);
  }
  function pause(){
    media.pause();
    animate(playB,
      [{d: 'M0 0 L0 25 L12.5 18.8 L12.5 6.3 Z'},
      {d:'M12.5 6.3 L12.5 18.8 L25 12.5 L25 12.5 Z'}], 300);
  }
  /*********** Hide Control **********************/
  var immerse;
  function hideControl(e){
    player.classList.remove('hide_control');
    clearTimeout(immerse);
    immerse=setTimeout(function(){
      if(!media.paused){
        player.classList.add('hide_control');
      }
    },2000);
  }
  player.onmousemove = hideControl;
  /***********************************************/
}
