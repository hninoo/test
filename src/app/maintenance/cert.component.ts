import { Component, OnInit } from '@angular/core';
import { Connect } from '../services/connect';

@Component({
    selector: 'app-cert',
    template: `
        <div class="holder">
            <img src="https://pigeon-fw.com/assets/images/logo1.png" style="width:350px; text-align: left"/>
            <h1>
                <span class="tbl">クライアント証明書が必要です</span><br>
                <span style="font-size: 0.8em">Client Certificate Required</span>
            </h1>
            <p>
                <span class="tbl mt-2">
                    このページにアクセスするには、有効なクライアント証明書が必要です。<br>
                    証明書をインストールして再度アクセスしてください。<br><br>
                    A valid client certificate is required to access this page.<br>
                    Please install a certificate and try again.
                </span>
            </p>
            <p>
                <span class="tbl">
                    お問い合わせは<a href="mailto:info@loftal.jp">info@loftal.jp</a>までご連絡ください。<br>
                    For support, please contact <a href="mailto:info@loftal.jp">info@loftal.jp</a>
                </span>
            </p>
        </div>
    `,
    styles: [`
        .holder {
            width: 480px;
            text-align: left;
            margin: 0 auto;
            padding-top: 120px;
        }

        .holder h1 {
            font-family: 'loveloblack', sans-serif;
            font-size: 2em;
            color: #2d2d2d;
            text-shadow: 3px 3px 0 #e3e3e3;
            line-height: 27px;
            margin-top: 12px;
            margin-bottom: 10px;
        }

        .holder h1 span.tbl {
            font-family: Dosis, Tahoma, sans-serif;
            font-size: 35px;
            color: #2d2d2d;
            line-height: 1em;
            font-weight: bold;
            letter-spacing: -1px;
            text-shadow: -1px 1px 1px rgba(0, 0, 0, 0.3);
            text-align: left;
        }

        p {
            font-size: 18px;
            font-weight: 600;
            color: #13447E;
            font-family: 'Neuton', serif;
        }
    `]
})
export class CertComponent implements OnInit {
    constructor(private _connect: Connect) {}

    ngOnInit(): void {
        // Check if certificate is actually required by calling /api/admin/info
        this._connect.get('/check-cert', {observe: 'response'}, null, false).subscribe({
            next: (response) => {
                // If we get a 200, certificate is valid or not required
                // Stay on login page
                // go to /admin/login
                location.href = '/admin/login';
            },
            error: (error) => {
                if ((error.status === 401 || (error && error.error && (
                    error.error.error_type === 'client_cert_required' ||
                    error.error.error_type === 'client_cert_invalid' ||
                    error.error.error_type === 'client_cert_expired'
                ))) && !location.href.match(/maintenance-cert/)) {
                    console.log('Client certificate error:', error.status === 401 ? '401 SSL Certificate Error' : error.error.error_type);
                }
            }
        });
    }
}
