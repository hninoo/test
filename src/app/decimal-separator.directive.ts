import { Directive, HostListener, ElementRef, Renderer2, Input } from '@angular/core';

@Directive({
  selector: '[appDecimalSeparator]',
})
export class DecimalSeparatorDirective  {
  @Input() decimalPlaces: number = 2;
  @Input() separateNumber: boolean = true;
  @Input() isMultiMalueMode: boolean = true;
  @Input() isEditMode: boolean = true;

    private isSmartphone: boolean = false;

    constructor(private el: ElementRef, private renderer: Renderer2) {
        // スマートフォン・タブレット判定（iPadOS 13以降も対応）
        this.isSmartphone = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    this.formatAndSetValue(value);
  }
  @HostListener('blur', ['$event.target.value'])
  onBlur(value: string): void {
    this.formatAndSetValue(value);
  }

  private formatAndSetValue(value: string): void {
    const inputElement = this.el.nativeElement;
    const rawValue = value.replace(/,/g, '');
    const oldCursorPos = inputElement.selectionStart;
    const oldCommaCount = (inputElement.value.match(/,/g) || []).length;

    let [integerPart, decimalPart] = rawValue.split('.');
    if (decimalPart !== undefined) {
      decimalPart = decimalPart.slice(0, this.decimalPlaces);
    }

    let formattedValue = decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

      // スマートフォンの場合はカンマ区切りをスキップ
      if (this.separateNumber && !this.isSmartphone) {
      formattedValue = this.addCommas(formattedValue);
    }

    const newCommaCount = (formattedValue.match(/,/g) || []).length;
    const commaDifference = newCommaCount - oldCommaCount;
    let newCursorPos = oldCursorPos + commaDifference;
    newCursorPos = Math.max(0, Math.min(formattedValue.length, newCursorPos));

    this.renderer.setProperty(inputElement, 'value', formattedValue);
    setTimeout(() => inputElement.setSelectionRange(newCursorPos, newCursorPos));
  }


  private addCommas(value: string): string {
    if (!value) return '';

    const [integerPart, decimalPart] = value.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart.slice(0, this.decimalPlaces)}`
      : formattedInteger;
  }
}
