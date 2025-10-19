import { AfterContentChecked, AfterViewChecked, AfterViewInit, Directive,ElementRef,HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[doubleScrollbar]'
})
export class DoubleScrollbarDirective implements AfterContentChecked,OnInit {
  @Input() loading: Boolean;
  @Input() total_count: number;
  private isMac: boolean;
  constructor(private el:ElementRef) {
    this.isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  }

  ngOnInit(): void {
    //don't show top scroll on Apple device
    if(this.isMac) return;

    this.el.nativeElement.insertAdjacentHTML('beforebegin',`<div id='sticky-top-scroll' style='z-index:100;position: sticky; top: -11px;height:40px; overflow-x:scroll;width:100%; margin:6px 0px;margin-top:-20px;'><div> </div></div>`);
    $('#sticky-top-scroll').scroll(function(){
      $("#sticky-table-wrapper").scrollLeft($("#sticky-top-scroll").scrollLeft());
    });
    $('#sticky-table-wrapper').scroll(function() {
      $("#sticky-top-scroll").scrollLeft($("#sticky-table-wrapper").scrollLeft());
    });
  }
  ngAfterContentChecked(): void {
    if(!this.isMac && !this.loading && this.el.nativeElement.offsetWidth != 0 ){
      this.toggleTopScrollbar();
      $('#sticky-top-scroll>div').css('width',this.el.nativeElement.scrollWidth);
    }
  }

  toggleTopScrollbar(){
    let topScrollWrap = $('#sticky-top-scroll'),
        el            = this.el.nativeElement;

    if(el.scrollWidth > el.clientWidth){
      topScrollWrap.removeClass('d-none');
    }else{
      topScrollWrap.addClass('d-none');
    }
  }

}
