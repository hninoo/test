import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';

@Injectable({
    providedIn: 'root'
})
export class FaviconService {
    config: any;

    setFavicon(): void {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        link.href = "assets/oem-favicon.png";
        document.title = "CandyCloud";
      }
}
