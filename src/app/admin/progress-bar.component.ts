import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent implements OnChanges, AfterViewInit {
  @Input() progress: number = 0; 
  isVisible: boolean = false;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress'] && changes['progress'].currentValue !== undefined) {
      const newProgress = changes['progress'].currentValue;
      if (newProgress > 0 && newProgress < 100) {
        const wasHidden = !this.isVisible;
        this.isVisible = true;
        if (wasHidden) {
          setTimeout(() => this.loadPosition());
        }
      }
      if (newProgress >= 100) {
        setTimeout(() => {
          this.isVisible = false;
        }, 500);
      }
    }
  }

  ngAfterViewInit(): void {
    this.loadPosition();
  }

  onMouseDown(event: MouseEvent) {
    const container = this.getProgressContainer();
    if (!container) return;

    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const rect = container.getBoundingClientRect();
    this.offsetX = this.startX - rect.left;
    this.offsetY = this.startY - rect.top;

    this.renderer.listen('window', 'mousemove', (e) => this.onMouseMove(e));
    this.renderer.listen('window', 'mouseup', () => this.onMouseUp());
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const container = this.getProgressContainer();
    if (!container) return;

    const newX = event.clientX - this.offsetX;
    const newY = event.clientY - this.offsetY;

    this.renderer.setStyle(container, 'left', `${newX}px`);
    this.renderer.setStyle(container, 'top', `${newY}px`);
  }

  onMouseUp() {
    this.isDragging = false;
    this.savePosition();
  }

  savePosition() {
    const container = this.getProgressContainer();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    localStorage.setItem('progressBarPosition', JSON.stringify({ left: rect.left, top: rect.top }));
  }

  loadPosition() {
    const container = this.getProgressContainer();
    if (!container) {
      return;
    }

    const position = localStorage.getItem('progressBarPosition');
    if (position) {
      const { left, top } = JSON.parse(position);
      this.renderer.setStyle(container, 'left', `${left}px`);
      this.renderer.setStyle(container, 'top', `${top}px`);
    }
  }

  private getProgressContainer(): HTMLElement | null {
    return this.el.nativeElement.querySelector('.progress-container');
  }
}
