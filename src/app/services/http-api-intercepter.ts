import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class HttpApiInterceptor implements HttpInterceptor {
    // 起動環境毎のAPIサーバを保持する

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // '/api'から始まるリクエスト
        if (request.url.match(/^\/admin\//)) {
            const req = request.clone({
                url: `${request.url}`,  // 接続先URL付加
                withCredentials: true,                  // Cookie有効
                setHeaders: {                           // ヘッダー書き換え
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            return next.handle(req);
        }
        return next.handle(request);
    }
}
