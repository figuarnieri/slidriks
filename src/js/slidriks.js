class Slidriks{
  constructor(...args){
    const _tag = typeof args[0]==='object' ? args[0].selector : args[0];
    this.selector = document.querySelector(_tag);
    if(!this.selector){
      return console.warn(`Selector ${_tag} is NULL!`);
    }
    this.views = 4;
    this.move = true;
    this.nav = true;
    this.pages = true;
    this.itemAdjust = true;
    this.infinite = true;
    this.breakpoints = {
      468: () => {
        this.views = 1;
        this.nav = false;
      },
      992: () => {
        this.views = 3;
        this.nav = false;
      }
    }
    const _html = this.selector.innerHTML;
    this.selector.innerHTML = `<div class="slidriks"><div class="slidriks__scroll">${_html}</div></div>`;
    this.scroll = this.selector.querySelector('.slidriks__scroll');
    this.childs = this.scroll.children;
    [].forEach.call(this.childs, child => child.outerHTML = `<div class="slidriks__item">${child.outerHTML}</div>`);
    this.rebuild();
    if(this.nav){
      this.navigate();
    }
    if(this.pages){
      this.paginate();
    }
    if(this.move){
      this.moving();
    }
    addEventListener('resize', (e) => this.rebuild());
  }
  rebuild(){
    let _screen = window.innerWidth,
    _size = 1140;
    Object.entries(this.breakpoints).map(values => {
      const _value = parseInt(values[0]);
      if(_screen <= _value){
        _size = Math.min(_size, _value);
      }
    });
    if(this.breakpoints[_size]){
      this.breakpoints[_size]();
    }
    this.itemWidth = this.selector.clientWidth / this.views;

    if(this.infinite){
      for(let i=0; i<this.views; i++){
        this.scroll.insertAdjacentHTML('beforeend', this.childs[i].outerHTML);
        const _child = this.childs[this.childs.length-1];
        _child.classList.add('slidriks__clone');
        _child.style.left = `${(this.childs.length)*this.itemWidth-this.itemWidth}px`;
      }
    }

    [].forEach.call(this.childs, child => child.style.width = `${this.itemWidth}px`);
    this.scroll.style.width = `${this.itemWidth * this.childs.length}px`;
    this.scroll.style.transform = 'translateX(0px)';
  }
  navigate(){
    this.selector.insertAdjacentHTML('beforeend', `<div class="slidriks__nav" style="top: -${this.selector.clientHeight/2}px;"><button class="slidriks__navbutton slidriks__navbutton-prev"></button><button class="slidriks__navbutton slidriks__navbutton-next"></button></div>`);
    [].forEach.call(this.selector.querySelectorAll('.slidriks__navbutton'), (button, i) => {
      button.addEventListener('click', () => {
        const _left = parseFloat(this.scroll.style.transform.replace(/translateX\(|px\)/g,''));
        if(_left>=0 && i===0 || _left<=-(this.itemWidth*this.scroll.childElementCount - this.itemWidth*this.views)+1 && i===1){
          return;
        }
        this.scroll.style.transform = `translateX(${_left - (i ? this.itemWidth : -this.itemWidth)}px)`;
        this.moveEnd = _left - (i ? this.itemWidth : -this.itemWidth);
      });
    });
  }
  paginate(){
    this.selector.insertAdjacentHTML('beforeend', '<div class="slidriks__pages" />');
    const _childs = Math.ceil(this.childs.length / this.views);
    for(let i=0; i<_childs; i++){
      this.selector.querySelector('.slidriks__pages').insertAdjacentHTML('beforeend', `<button class="slidriks__pageitem ${i===0 ? 'slidriks__pageitem-actvie' : ''}">${i + 1}</button>`);
    }
    const _pages = this.selector.querySelectorAll('.slidriks__pageitem');
    [].forEach.call(_pages, (button, i) => {
      button.addEventListener('click', (e) => {
        const _lastItem = this.childs[i*this.views+this.views-1],
        _left = this.childs[_lastItem ? i*this.views : this.childs.length - this.views].offsetLeft;
        [].forEach.call(_pages, bullet => bullet.classList.remove('slidriks__pageitem-actvie'));
        this.scroll.style.transform = `translateX(-${_left}px)`;
        this.moveEnd = -_left;
        button.classList.add('slidriks__pageitem-actvie');
      });
    });
  }
  moving(){
    this.moveX = 0;
    this.axisX = 0;
    this.moveEnd = 0;
    const _left  = (this.itemWidth * this.scroll.childElementCount) - (this.itemWidth * this.views);
    this.selector.addEventListener(window.innerWidth > 1024 ? 'mousedown' : 'touchstart', (e) => {
      if(window.innerWidth > 1024){
        e.preventDefault();
      }
      this.selector.classList.add('slidriks--move');
      this.moveX = e.screenX || e.changedTouches[0].screenX;
    });
    document.addEventListener(window.innerWidth > 1024 ? 'mousemove' : 'touchmove', (e) => {
      if(this.selector.classList.contains('slidriks--move')){
        this.axisX = (e.screenX || e.changedTouches[0].screenX) - this.moveX + this.moveEnd;
        if(this.infinite){
          if(this.axisX > 0){
            this.axisX = -_left + this.axisX;
          }
          if(this.axisX < -_left){
            this.axisX = 0 + this.axisX + _left;
          }
        } else {
          if(this.axisX > 0){
            this.axisX = this.axisX/30;
          }
          if(this.axisX < -_left){
            this.axisX = -_left - Math.abs(this.axisX)/this.itemWidth;
          }
        }
        this.scroll.style.transform = `translateX(${this.axisX}px)`;
      }
    });
    document.addEventListener(window.innerWidth > 1024 ? 'mouseup' : 'touchend', (e) => {
      this.moveEnd = this.axisX;
      const _that = document.querySelector('.slidriks--move');
      this.selector.classList.remove('slidriks--move');
      if(this.axisX > 0){
        this.scroll.style.transform = `translateX(0px)`;
      } else if(this.axisX < -_left){
        this.scroll.style.transform = `translateX(${-_left}px)`;
      } else {
        if(this.itemAdjust && _that){
          const _itemHalf = Math.abs(this.axisX%this.itemWidth) < this.itemWidth/2,
          _adjust = this.axisX - this.axisX%this.itemWidth - (_itemHalf ? 0 : this.itemWidth);
          this.scroll.style.transform = `translateX(${_adjust}px)`;
          this.moveEnd = _adjust;
        }
      }
    });
  }
}