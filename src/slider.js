"use strict"

/****  SLIDER ****/
function Slider(query, {move = () => {}, init = () => {}, startValue = 0} = {}){
  this.el = document.querySelector(query);
  this.el.classList.add('bs-slider');

  const BASE_HTML = `<div class="bs-slider-bg">
    <div class="bs-slider-spacer">
      <span class="bs-slider-cursor"></span>
    </div>
  </div>`;

  this.el.innerHTML = BASE_HTML;

  this.drag = false;
  this.spacer = this.el.querySelector('.bs-slider-spacer');
  this.cbMove = move;
  this.cbInit = init;
  this.percentage = 0;

  this.test = 0;

  this.value(startValue)

  this.cbInit.call(this, {val : this.percentage});

  this.el.addEventListener('mousedown', this.start.bind(this));

}

Slider.prototype.move = function(e){
  e.preventDefault();
  if(!this.drag)
    return
  var sliderWidth = this.el.clientWidth;
  var cursorPos = (e.clientX -  this.el.getBoundingClientRect().left);
  var oldPercentage = this.percentage;
  if(cursorPos < 0){
    this.percentage = 0;
  } else if (cursorPos > sliderWidth){
    this.percentage = 1;
  } else {
    this.percentage = (cursorPos/sliderWidth);
  }
  if(this.percentage != oldPercentage){
    this.spacer.style.width = this.percentage*100+'%';
    this.cbMove.call(this, {val:this.percentage});
  }
}

Slider.prototype.start = function(e){
  this.drag = true;
  this.el.classList.add('bs-slider-state-moving');
  this.move(e);

  this.test ++;

  document.addEventListener('mouseup', this.end.bind(this));
  document.addEventListener('mousemove', this.move.bind(this));
}

Slider.prototype.end = function(e){
  if(!this.drag)
    return;
  this.el.classList.remove('bs-slider-state-moving');
  this.drag = false;

  document.removeEventListener('mouseup', this.end.bind(this));
  document.removeEventListener('mousemove', this.move.bind(this));
}

Slider.prototype.value = function(newVal = null, runCb = false){
  if(newVal === null){
    return this.percentage;
  }
  this.percentage = newVal;
  this.spacer.style.width = (this.percentage * 100) + '%';
  if(runCb)
    this.cbMove.call(this,{val:percentage});
}

Slider.prototype.get = function(){
  return this.el;
}
