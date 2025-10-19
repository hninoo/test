import { AfterViewInit, Directive, HostListener, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDebugMode]'
})
export class DebugModeOnDirective implements OnInit{
  @Input() appDebugMode : boolean ;
  @Input() add_new_mode : boolean ;
  public debug_mode : string = '';
  public count = 0 ;

  constructor(
      private viewContainer: ViewContainerRef,
      private template: TemplateRef<any>
  ) {
  }

  ngOnInit(): void {
    this.debug_mode = localStorage.getItem('debug_mode')

    if (this.debug_mode && !this.add_new_mode) {
      this.viewContainer.createEmbeddedView(this.template);
    } else {
      this.viewContainer.clear();
    }
  }

    /*
    @HostListener('window:keyup',['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        console.log("KEYUP CALL")

      if(event.key == 'Shift') {
        if(this.count < 5) {
          this.count += 1;
          if(this.count == 5) {
            if (!this.add_new_mode) {
              localStorage.setItem('debug_mode','true');
              this.viewContainer.createEmbeddedView(this.template);
            } else {
              this.viewContainer.clear();
            }
          }

        }
      } else {
        this.count = 0;
      }
    }
     */


}
