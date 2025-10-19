import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { subscribeOn } from "rxjs-compat/operator/subscribeOn";
import { catchError } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class HttpService {
    constructor (
        private http : HttpClient
    ) {}

    getRequest(url: string): Observable<any> {
       return this.http.get(url)
       .pipe(
           catchError(this.handleError)
       )
    }

    postRequest(url:string, data:any, option?: any): Observable<any> {
        return this.http.post(url, data, option)
        .pipe(
            catchError(this.handleError)
        )
    }

    updateRequest(url:string, data:any, option?: any): Observable<any> {
        return this.http.put(url, data, option)
        .pipe(
            catchError(this.handleError)
        )
    }

    handleError(error: HttpErrorResponse) {
        if (error.status === 0) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error);
        } else {
          if (error.status === 403 && error.error?.error_type === 'secure_access_only') {
            return throwError(() => new Error('セキュアドメインでのみログインが可能です'));
          }
          // The backend returned an unsuccessful response code.
          console.error(
            `Backend returned code ${error.status}, body was: `, error.error);
        }
        // Return an observable with a user-facing error message.
        return throwError(() => new Error('Something bad happened; please try again later.'));
      }
}
