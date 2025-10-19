import {Component, OnInit} from '@angular/core';
import {Connect} from '../../services/connect';
import {SharedService} from '../../services/shared';
import {HttpHeaders} from '@angular/common/http';
import * as FileSaver from 'file-saver';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import ToastrService from '../../toastr-service-wrapper.service';

@Component({
    selector: 'sso-settings',
    templateUrl: './sso-settings.component.html',
    styleUrls: ['./sso-settings.component.css'],
})

export class SsoSettingsComponent implements OnInit {
    entityId: string = '';
    responseUrl: string = '';

    googleSamlForm: FormGroup;
    googleMetadataFile: File | null = null;
    googleEnabled: boolean = true;
    googleConfigured: boolean = false;
    googleExpired: string | null = null;
    googleLinkOrganization: boolean = true;

    msSamlForm: FormGroup;
    msMetadataFile: File | null = null;
    msSecretExpired: string | null = null;
    azureEnabled: boolean = true;
    azureConfigured: boolean = false;
    azureLinkOrganization: boolean = true;
    azureSyncName: boolean = true;

    loadingGoogle: boolean = false;
    loadingMs: boolean = false;

    googleManualPath: string = 'assets/manuals/google_saml_setup.pdf';
    msManualPath: string = 'assets/manuals/ms365_saml_setup.pdf';

    constructor(
        private _connect: Connect,
        private _share: SharedService,
        private _formBuilder: FormBuilder,
        private _toastr: ToastrService
    ) {
        this.googleSamlForm = this._formBuilder.group({
            saml_expired: ['', Validators.required]
        });

        this.msSamlForm = this._formBuilder.group({
            client_id: ['', Validators.required],
            client_secret: ['', Validators.required],
            secret_expired: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.getSsoSettings();
    }

    /**
     * SSO設定情報を取得する
     */
    getSsoSettings() {
        this._connect.get('/api/admin/setting/sso').subscribe(
            (response) => {
                if (response.status === 'success') {
                    this.entityId = response.data.entity_id;
                    this.responseUrl = response.data.response_url;
                    this.googleEnabled = response.data.google_saml_enabled !== undefined ? response.data.google_saml_enabled : true;
                    this.azureEnabled = response.data.azure_saml_enabled !== undefined ? response.data.azure_saml_enabled : true;
                    this.googleConfigured = response.data.google_saml_configured || false;
                    this.azureConfigured = response.data.azure_saml_configured || false;
                    this.googleExpired = response.data.google_saml_expired;
                    this.msSecretExpired = response.data.ms_365_secret_expired;
                    this.googleLinkOrganization = response.data.google_saml_link_organization !== undefined ? response.data.google_saml_link_organization : true;
                    this.azureLinkOrganization = response.data.azure_saml_link_organization !== undefined ? response.data.azure_saml_link_organization : true;
                    this.azureSyncName = response.data.azure_saml_sync_name !== undefined ? response.data.azure_saml_sync_name : true;
                } else {
                    this._toastr.error('SSO設定情報の取得に失敗しました');
                }
            },
            (error) => {
                this._toastr.error('SSO設定情報の取得に失敗しました');
                console.error(error);
            }
        );
    }

    /**
     * Google Metadataファイルの選択
     * @param event ファイル選択イベント（input change event または drag & drop files）
     */
    onGoogleMetadataFileChange(event) {
        const files = event.target ? event.target.files : event;
        if (files && files.length > 0) {
            this.googleMetadataFile = files[0];
        }
    }

    /**
     * Microsoft 365 Metadataファイルの選択
     * @param event ファイル選択イベント（input change event または drag & drop files）
     */
    onMsMetadataFileChange(event) {
        const files = event.target ? event.target.files : event;
        if (files && files.length > 0) {
            this.msMetadataFile = files[0];
        }
    }

    /**
     * Google SAML設定を保存する
     */
    saveGoogleSaml() {
        if (this.googleSamlForm.invalid || !this.googleMetadataFile) {
            this._toastr.error('必須項目を入力してください');
            return;
        }

        this.loadingGoogle = true;

        const formData = new FormData();
        // 日付をYYYY-MM-DD形式に変換
        const samlExpired = this.formatDateForBackend(this.googleSamlForm.value.saml_expired);
        formData.append('saml_expired', samlExpired);
        formData.append('metadata_xml', this.googleMetadataFile);

        this._connect.post('/api/admin/setting/google-saml', formData).subscribe(
            (response) => {
                this.loadingGoogle = false;
                if (response.status === 'success') {
                    this._toastr.success('Google SAML設定が完了しました');
                    this.getSsoSettings();
                    this.googleSamlForm.reset();
                    this.googleMetadataFile = null;
                } else {
                    this._toastr.error(response.message || 'Google SAML設定に失敗しました');
                }
            },
            (error) => {
                this.loadingGoogle = false;
                this._toastr.error('Google SAML設定に失敗しました');
                console.error(error);
            }
        );
    }

    /**
     * Microsoft 365 SAML設定を保存する
     */
    saveMsSaml() {
        if (this.msSamlForm.invalid || !this.msMetadataFile) {
            this._toastr.error('必須項目を入力してください');
            return;
        }

        this.loadingMs = true;

        const formData = new FormData();
        formData.append('client_id', this.msSamlForm.value.client_id);
        formData.append('client_secret', this.msSamlForm.value.client_secret);
        // 日付をYYYY-MM-DD形式に変換
        const secretExpired = this.formatDateForBackend(this.msSamlForm.value.secret_expired);
        formData.append('secret_expired', secretExpired);
        formData.append('metadata_xml', this.msMetadataFile);

        this._connect.post('/api/admin/setting/ms-saml', formData).subscribe(
            (response) => {
                this.loadingMs = false;
                if (response.status === 'success') {
                    this._toastr.success('Microsoft 365 SAML設定が完了しました');
                    this.getSsoSettings();
                    this.msSamlForm.reset();
                    this.msMetadataFile = null as unknown as File;
                } else {
                    this._toastr.error(response.message || 'Microsoft 365 SAML設定に失敗しました');
                }
            },
            (error) => {
                this.loadingMs = false;
                this._toastr.error('Microsoft 365 SAML設定に失敗しました');
                console.error(error);
            }
        );
    }

    /**
     * マニュアルPDFをダウンロードする
     * @param provider プロバイダ名（google, ms365）
     */
    downloadManual(provider: string) {
        const path = provider === 'google' ? this.googleManualPath : this.msManualPath;
        const fileName = provider === 'google' ? 'google_saml_setup.pdf' : 'ms365_saml_setup.pdf';

        // ファイルをダウンロード
        const link = document.createElement('a');
        link.href = path;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this._toastr.info(`${fileName}をダウンロードします`);
    }

    /**
     * テキストをクリップボードにコピーする
     * @param text コピーするテキスト
     */
    copyToClipboard(text: string) {
        if (!text) {
            this._toastr.warning('コピーするテキストがありません');
            return;
        }

        // モダンブラウザ用のClipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this._toastr.success('クリップボードにコピーしました');
            }).catch((err) => {
                console.error('クリップボードコピー失敗:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            // フォールバック方法
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * フォールバック方法でクリップボードにコピー
     * @param text コピーするテキスト
     */
    private fallbackCopyToClipboard(text: string) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this._toastr.success('クリップボードにコピーしました');
            } else {
                this._toastr.error('クリップボードコピーに失敗しました');
            }
        } catch (err) {
            console.error('フォールバック コピー失敗:', err);
            this._toastr.error('クリップボードコピーに失敗しました');
        }

        document.body.removeChild(textarea);
    }

    /**
     * SAML有効化設定を切り替える
     * @param provider プロバイダ名（google, azure）
     * @param event チェックボックスイベント
     */
    toggleSamlEnabled(provider: string, event: any) {
        const enabled = event.target.checked ? 'true' : 'false';

        this._connect.post('/api/admin/setting/saml-enabled', {
            provider: provider,
            enabled: enabled
        }).subscribe(
            (response) => {
                if (response.status === 'success') {
                    this._toastr.success(response.message);

                    // ローカル状態を更新
                    if (provider === 'google') {
                        this.googleEnabled = event.target.checked;
                    } else if (provider === 'azure') {
                        this.azureEnabled = event.target.checked;
                    }
                } else {
                    this._toastr.error(response.message || 'SAML設定の更新に失敗しました');
                    // エラーの場合はチェックボックスを元に戻す
                    event.target.checked = !event.target.checked;
                }
            },
            (error) => {
                this._toastr.error('SAML設定の更新に失敗しました');
                console.error(error);
                // エラーの場合はチェックボックスを元に戻す
                event.target.checked = !event.target.checked;
            }
        );
    }

    /**
     * 日付をバックエンド用のYYYY-MM-DD形式に変換する
     * @param dateValue owl-date-timeから取得した日付値
     * @returns YYYY-MM-DD形式の文字列
     */
    private formatDateForBackend(dateValue: any): string {
        if (!dateValue) {
            return '';
        }

        let date: Date;

        // 文字列の場合はDateオブジェクトに変換
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            // その他の形式の場合はDateコンストラクタに渡す
            date = new Date(dateValue);
        }

        // 無効な日付の場合は空文字を返す
        if (isNaN(date.getTime())) {
            return '';
        }

        // YYYY-MM-DD形式に変換
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);

        return `${year}-${month}-${day}`;
    }

    /**
     * SAML組織連携設定を切り替える
     * @param provider プロバイダ名（google, azure）
     * @param event チェックボックスイベント
     */
    toggleSamlOrganizationLink(provider: string, event: any) {
        const linkOrganization = event.target.checked ? 'true' : 'false';

        this._connect.post('/api/admin/setting/saml-organization-link', {
            provider: provider,
            link_organization: linkOrganization
        }).subscribe(
            (response) => {
                if (response.status === 'success') {
                    this._toastr.success(response.message || '組織連携設定を更新しました');

                    // ローカル状態を更新
                    if (provider === 'google') {
                        this.googleLinkOrganization = event.target.checked;
                    } else if (provider === 'azure') {
                        this.azureLinkOrganization = event.target.checked;
                    }
                } else {
                    this._toastr.error(response.message || '組織連携設定の更新に失敗しました');
                    // エラーの場合はチェックボックスを元に戻す
                    event.target.checked = !event.target.checked;
                }
            },
            (error) => {
                this._toastr.error('組織連携設定の更新に失敗しました');
                console.error(error);
                // エラーの場合はチェックボックスを元に戻す
                event.target.checked = !event.target.checked;
            }
        );
    }

    /**
     * SAML名前同期設定を切り替える
     * @param provider プロバイダ名（google, azure）
     * @param event チェックボックスイベント
     */
    toggleSamlNameSync(provider: string, event: any) {
        const syncName = event.target.checked ? 'true' : 'false';

        this._connect.post('/api/admin/setting/saml-name-sync', {
            provider: provider,
            sync_name: syncName
        }).subscribe(
            (response) => {
                if (response.status === 'success') {
                    this._toastr.success(response.message || '組織名同期設定を更新しました');

                    // ローカル状態を更新
                    if (provider === 'azure') {
                        this.azureSyncName = event.target.checked;
                    }
                } else {
                    this._toastr.error(response.message || '組織名同期設定の更新に失敗しました');
                    // エラーの場合はチェックボックスを元に戻す
                    event.target.checked = !event.target.checked;
                }
            },
            (error) => {
                this._toastr.error('組織名同期設定の更新に失敗しました');
                console.error(error);
                // エラーの場合はチェックボックスを元に戻す
                event.target.checked = !event.target.checked;
            }
        );
    }
}
