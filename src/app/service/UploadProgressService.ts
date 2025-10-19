import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadProgressService {
  private progressSource = new BehaviorSubject<number | null>(null);
  progress$ = this.progressSource.asObservable();

  updateProgress(value: number) {
    this.progressSource.next(value);
  }
}
