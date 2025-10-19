import {Component, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {Connect} from '../../services/connect';
import ToastrService from '../../toastr-service-wrapper.service';
import {saveAs} from 'file-saver';

@Component({
    selector: 'certificate-management',
    template: `
        <div class="card mb-3" *ngIf="maxCount>0">
            <div class="card-header">
                <h3>クライアント証明書管理</h3>
            </div>
            <div class="card-body m-2">
                <div class="mb-4" >
                    <button class="btn btn-primary me-3"
                            (click)="showNameModal()"
                            [disabled]="isLoading || certificates?.length >= 3">
                        <i class="fa" [ngClass]="{'fa-key': !isLoading, 'fa-spinner fa-spin': isLoading}"></i> 証明書を発行
                    </button>
                    <!--                    <button class="btn btn-primary ml-2"-->
                    <!--                            (click)="openEmailModal()"-->
                    <!--                            [disabled]="isLoading || certificates?.length >= 3">-->
                    <!--                        <i class="fa" [ngClass]="{'fa-envelope': !isLoading, 'fa-spinner fa-spin': isLoading}"></i> 証明書をメール送信-->
                    <!--                    </button>-->
                    <div class="mt-2" *ngIf="certificates.length==0">
                        残り証明書発行可能ユーザー数: {{remainingCount}}
                    </div>
                    <div *ngIf="certificates?.length >= 3" class="text-danger mt-2">
                        <small>証明書の発行上限に達しています（最大3つまで）</small>
                    </div>
                </div>


                <!-- Certificate List -->
                <div class="certificate-list mt-4" *ngIf="certificates?.length">
                    <h4 class="mb-3">発行済み証明書一覧</h4>
                    <div class="table-responsive mr-3">
                        <table class="table table-hover table-bordered m-3 mr-2">
                            <style>
                                .table tbody tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05); }
                                .table tbody tr:hover { background-color: rgba(0,0,0,.075); }
                                .badge-success { background-color: #28a745; color: white; padding: 0.4em 0.6em; }
                            </style>
                            <thead>
                                <tr>
                                    <th><input type="checkbox" (change)="toggleAllCertificates($event)"></th>
                                    <th>名前</th>
                                    <th>発行日</th>
                                    <th>最終ログイン</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let cert of certificates">
                                    <td><input type="checkbox" [(ngModel)]="cert.selected"></td>
                                    <td>{{cert.name || '名前なし'}}</td>
                                    <td>{{cert.issued_at | date:'yyyy/MM/dd HH:mm'}}</td>
                                    <td>{{cert.last_login_at | date:'yyyy/MM/dd HH:mm' || '未使用'}}</td>
                                    <!--
                                    <td><span class="badge" [class.badge-success]="!cert.revoked">{{cert.revoked=='false' ? '失効済み' : '有効'}}</span></td>
                                    -->
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-danger" (click)="revokeSelectedCertificates()"
                                [disabled]="!hasSelectedCertificates() || isLoading">
                            <i class="fa" [ngClass]="{'fa-times-circle': !isLoading, 'fa-spinner fa-spin': isLoading}"></i> 選択した証明書を失効
                        </button>
                    </div>
                </div>

                <!-- Certificate Name Modal -->
                <div bsModal #nameModal="bs-modal" class="modal fade" tabindex="-1" role="dialog"
                     aria-labelledby="nameModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="nameModalLabel">証明書名を入力</h5>
                                <button type="button" class="close" (click)="nameModal.hide()" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <input type="text" class="form-control" [(ngModel)]="certificateName"
                                       placeholder="証明書の名前（任意）">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" (click)="nameModal.hide()">キャンセル</button>
                                <button type="button" class="btn btn-primary" (click)="issueCertificateWithName()" [disabled]="isLoading">
                                    <i class="fa" [ngClass]="{'fa-key': !isLoading, 'fa-spinner fa-spin': isLoading}"></i> 発行</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Email Certificate Modal -->
                <div bsModal #emailModal="bs-modal" class="modal fade" tabindex="-1" role="dialog"
                     aria-labelledby="emailModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="emailModalLabel">メールで証明書を送信</h5>
                                <button type="button" class="close" (click)="emailModal.hide()" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <p>新しい証明書を発行してメールで送信します。</p>
                                <input type="text" class="form-control" [(ngModel)]="emailCertificateName"
                                       placeholder="証明書の名前（任意）">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" (click)="emailModal.hide()">キャンセル</button>
                                <button type="button" class="btn btn-primary" (click)="sendCertificateEmail()" [disabled]="isLoading">
                                    <i class="fa" [ngClass]="{'fa-envelope': !isLoading, 'fa-spinner fa-spin': isLoading}"></i> 送信</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class CertificateManagementComponent {
    @Input() userId: number;
    @Input() isMasterUser: boolean = false;
    @Output() onCertificateChange = new EventEmitter<any>();


    public isLoading: boolean = false;
    public certificates: any[] = [];
    public certificateName: string = '';
    public emailCertificateName: string = '';
    public usedCount: number = 0;
    public maxCount: number = 0;
    public remainingCount: number = 0;
    @ViewChild('nameModal') nameModal: ModalDirective;
    @ViewChild('emailModal') emailModal: ModalDirective;

    constructor(
        private connect: Connect,
        private toasterService: ToastrService
    ) {
    }

    ngOnInit() {
        this.loadCertificates();
        this.loadRemainingCount();
    }

    loadCertificates() {
        this.isLoading = true;
        this.connect.get(`/admin/certificates/${this.userId}`).subscribe(
            (response) => {
                if (response.result === 'success') {
                    this.certificates = response.certificates;
                }
            },
            (error) => {
                this.toasterService.error('証明書情報の取得に失敗しました');
            }
        ).add(() => {
            this.isLoading = false;
        });
    }

    loadRemainingCount() {
        this.connect.get('/admin/certificate-remaining-count').subscribe(
            (response: any) => {
                if (response.result === 'success') {
                    this.usedCount = response.used_count;
                    this.maxCount = response.max_count;
                    this.remainingCount = response.remaining_count;
                }
            },
            (error) => {
                this.toasterService.error('残り発行可能数の取得に失敗しました');
            }
        );
    }

    showNameModal() {
        if (this.certificates.length >= 3) {
            this.toasterService.error('1ユーザーにつき最大3つまでの証明書を発行できます');
            return;
        }

        if (this.remainingCount <= 0) {
            this.toasterService.error('証明書の発行上限に達しています.追加する場合、契約設定画面から契約を追加してください.');
            return;
        }
        this.certificateName = '';
        this.nameModal.show();
    }

    issueCertificateWithName() {
        this.issueCertificate(this.certificateName);
        this.nameModal.hide();
    }

    toggleAllCertificates(event: any) {
        const checked = event.target.checked;
        this.certificates.forEach(cert => cert.selected = checked);
    }

    hasSelectedCertificates(): boolean {
        return this.certificates.some(cert => cert.selected);
    }

    revokeSelectedCertificates() {
        const selectedSerials = this.certificates
            .filter(cert => cert.selected)
            .map(cert => cert.certificate_serial);

        if (!selectedSerials.length) return;

        if (!confirm('選択した証明書を失効させますか？この操作は取り消せません。')) {
            return;
        }

        this.isLoading = true;
        this.connect.post('/admin/revoke-certificates', {
            serials: selectedSerials
        }).subscribe(
            (response) => {
                if (response.result === 'success') {
                    this.toasterService.success('選択した証明書が失効されました');
                    this.loadCertificates();
                    this.onCertificateChange.emit({action: 'revoked'});
                } else {
                    this.toasterService.error(response.errors.join('\n'));
                }
            },
            (error) => {
                this.toasterService.error('証明書の失効に失敗しました');
            }
        ).add(() => {
            this.isLoading = false;
        });
    }

    openEmailModal() {
        this.emailCertificateName = '';
        this.emailModal.show();
    }

    closeEmailModal() {
        this.emailModal.hide();
        this.emailCertificateName = '';
    }

    sendCertificateEmail() {
        this.isLoading = true;
        this.connect.post('/admin/send-certificate-email', {
            name: this.emailCertificateName,
            admin_id: this.userId
        }).subscribe(
            (response) => {
                if (response.result === 'success') {
                    this.toasterService.success('証明書がメールで送信されました');
                    this.closeEmailModal();
                    this.emailCertificateName = '';
                    this.loadCertificates();
                } else {
                    this.toasterService.error(response.errors.join('\n'));
                }
            },
            (error) => {
                this.toasterService.error('証明書の送信に失敗しました');
            }
        ).add(() => {
            this.isLoading = false;
        });
    }

    issueCertificate(name?: string) {
        this.isLoading = true;
        const endpoint = this.isMasterUser ?
            `/admin/download-certificate/${this.userId}` :
            '/admin/self/download-certificate';

        const params = name ? { name } : {};
        this.connect.post(endpoint, params, {responseType: 'blob'}).subscribe(
            (response: Blob) => {
                // Verify response is a ZIP file
                if (response.type !== 'application/octet-stream') {
                    // If not binary data, try to read error message
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const result = JSON.parse(reader.result as string);
                            this.toasterService.error(result.errors?.join('\n') || '証明書のダウンロードに失敗しました');
                        } catch (e) {
                            this.toasterService.error('証明書のダウンロードに失敗しました');
                        }
                    };
                    reader.readAsText(response);
                    return;
                }

                saveAs(response, 'certificate_package.zip');
                this.toasterService.success('証明書がダウンロードされました');
                this.loadCertificates();
                this.onCertificateChange.emit({action: 'issued'});
            },
            (error) => {
                console.log(error);
                this.toasterService.error('証明書の発行に失敗しました');
            }
        ).add(() => {
            this.isLoading = false;
        });
    }

    revokeCertificate(serial: string) {
        if (!confirm('証明書を失効させますか？この操作は取り消せません。')) {
            return;
        }

        this.isLoading = true;
        this.connect.post('/admin/revoke-certificates', {
            serials: [serial]
        }).subscribe(
            (response) => {
                if (response.result === 'success') {
                    this.toasterService.success('証明書が失効されました');
                    this.loadCertificates();
                    this.onCertificateChange.emit({action: 'revoked'});
                } else {
                    this.toasterService.error(response.errors.join('\n'));
                }
            },
            (error) => {
                this.toasterService.error('証明書の失効に失敗しました');
            }
        ).add(() => {
            this.isLoading = false;
        });
    }
}
