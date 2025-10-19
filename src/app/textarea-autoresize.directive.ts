import { Directive, HostListener, Input, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appTextareaAutoresize]'
})
export class TextareaAutoresizeDirective implements OnInit {

  @Input()
  appTextareaAutoresize: string;

  constructor(private elementRef: ElementRef) { }

  @HostListener(':input')
  onInput() {
    this.resize();
  }

  ngOnInit() {
    if (this.elementRef.nativeElement.scrollHeight) {
      setTimeout(() => this.resize());
    }
  }

  resize() {
    this.elementRef.nativeElement.style.height = '150px';
    let scrollHeight = this.elementRef.nativeElement.scrollHeight;
    let minHeight = parseInt(this.elementRef.nativeElement.getAttribute('data-min-height')) ?? 150;
    if (scrollHeight < minHeight) scrollHeight = minHeight;
    this.elementRef.nativeElement.style.height = scrollHeight + 'px';
  }
}
