import { Directive, EventEmitter, HostListener, Input, OnInit, Output } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";


@Directive({
    selector: '[appModuleDragAndDrop]'
})
export class ModuleDragAndDropDirective implements OnInit{
  @Input() appModuleDragAndDrop : string;
  @Output() files: EventEmitter<any> = new EventEmitter();

  constructor(private sanitizer: DomSanitizer) { }
  
  ngOnInit() { }

  @HostListener("dragover", ["$event"]) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener("dragleave", ["$event"]) public onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    let files= [];
    for (let i = 0; i < evt.dataTransfer.files.length; i++) {
      const file = evt.dataTransfer.files[i];
      files.push(evt.dataTransfer.files[i]);
    }
    
    if (files.length > 0) {
      this.files.emit(files);
    }
  }
}