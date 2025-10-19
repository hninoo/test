import { Component, OnInit, AfterViewInit, NgZone, Input, SimpleChanges, EventEmitter, Output } from '@angular/core';
import {TableInfo} from '../../class/TableInfo';
import { GoogleMapFilter } from '../../class/Filter/GoogleMapFilter';
import ToastrService from '../../toastr-service-wrapper.service';
import { SharedService } from '../../services/shared';
import { Connect } from '../../services/connect';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

@Component({
  selector: 'google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.scss']
})
export class GoogleMapComponent implements OnInit, AfterViewInit {
  @Input() data_a: any[] = [];
  @Input() filter: GoogleMapFilter;
  @Output() onLocationSelect = new EventEmitter<{lat: number, lng: number}>();
  private map: any;
  private markers: any[] = [];
  private geocoder: any;
  private apiLoaded = false;
  private apiLoading = false; // APIロード中フラグを追加
  public isLoading = true;
  public isDisplay = false;
  public address_field: string = '';
  @Input() table_info: TableInfo;
  private currentLocationMarker: any = null; // 現在地マーカー
  @Input() is_edit: boolean = false;
  @Input() data: any;
  
  // 選択した緯度経度を保持
  public selectedLocation: {lat: number, lng: number} = null;
  // 緯度経度の小数点以下桁数
  public latDecimalPlaces: number = 6;
  public lngDecimalPlaces: number = 6;
  // 地図使用回数の情報
  public mapUsageInfo: {
    current_count: number;
    max_count: number;
    reset_date: string;
  } = null;

  constructor(private ngZone: NgZone, private toasterService: ToastrService, private sharedService: SharedService, private _connect: Connect) {
    console.log('GoogleMapComponent constructor');
    // コンストラクタでグローバル関数を定義
    window.initMap = () => {
      console.log('Global initMap called');
      this.ngZone.run(() => {
        this.initMap();
      });
    };
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // DOMが準備できてから読み込み開始
    setTimeout(() => {
      this.loadGoogleMapsAPI();
    }, 1000);
    
    // グローバルオブジェクトにコンポーネントを追加して、JavaScriptからアクセスできるようにする
    (<any>window).googleMapComponent = this;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isDisplay = this.table_info.menu && this.table_info.menu.isDisplayGoogleMap()
    this.address_field = this.table_info.menu.getGoogleMapAddressField()
    
    // 緯度経度フィールドの桁数を取得
    if (this.table_info && this.table_info.menu) {
      const latField = this.table_info.menu.getGoogleMapLatField();
      const lngField = this.table_info.menu.getGoogleMapLngField();
      
      if (latField && lngField) {
        const latForm = this.table_info.forms.byFieldName(latField);
        const lngForm = this.table_info.forms.byFieldName(lngField);
        
        if (latForm && latForm.custom_field && latForm.custom_field['decimal_places']) {
          this.latDecimalPlaces = parseInt(latForm.custom_field['decimal_places']);
        }
        
        if (lngForm && lngForm.custom_field && lngForm.custom_field['decimal_places']) {
          this.lngDecimalPlaces = parseInt(lngForm.custom_field['decimal_places']);
        }
      }
    }
    
    if (changes['data_a'] && this.map) {
      this.addMarkers();
    }
  }

  private loadGoogleMapsAPI() {
    // すでにAPIがロードされている場合は何もしない
    if (this.apiLoaded || window.google) {
      console.log('Google Maps API already loaded, initializing map directly');
      this.initMap();
      return;
    }

    // APIのロード中は新たなリクエストを行わない
    if (this.apiLoading) {
      console.log('Google Maps API is currently loading...');
      return;
    }

    console.log('Loading Google Maps API...');
    this.apiLoading = true;

    // 地図表示回数をチェック
    this._connect.post('/admin/check-google-map-count', {}).subscribe(
      (response) => {
        if (response['success']) {
          // 使用回数情報を保存
          this.mapUsageInfo = {
            current_count: response['current_count'],
            max_count: response['max_count'],
            reset_date: response['reset_date']
          };

          // 残り回数が少ない場合は警告を表示
          if (response['max_count'] > 0) {
            const remainingCount = response['max_count'] - response['current_count'];
            if (remainingCount <= 10) {
              this.toasterService.warning(
                `今月の地図表示可能回数があと${remainingCount}回です。\n次回リセット日: ${new Date(response['reset_date']).toLocaleDateString()}`,
                '警告'
              );
            }
          }

          // 地図の読み込みを続行
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          const apiKey = this.sharedService.google_map_api_key;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
          script.async = true;
          script.defer = true;
          
          script.onerror = (error) => {
            console.error('Error loading Google Maps API:', error);
            this.isLoading = false;
            this.apiLoading = false;
          };

          document.head.appendChild(script);
          console.log('Google Maps API script added to head');
          this.apiLoaded = true;
        } else {
          // 上限に達している場合
          if (response['exceeded']) {
            this.toasterService.error(response['message'], 'エラー');
          } else {
            this.toasterService.error('地図の読み込みに失敗しました。', 'エラー');
          }
          this.isLoading = false;
          this.apiLoading = false;
        }
      },
      (error) => {
        console.error('Error checking map count:', error);
        this.toasterService.error('地図の読み込みに失敗しました。', 'エラー');
        this.isLoading = false;
        this.apiLoading = false;
      }
    );
  }

  private initMap() {
    try {
      const mapElement = document.getElementById('map');
      
      if (mapElement) {
        // デフォルトの中心位置（東京駅）
        const defaultCenter = { lat: 35.6812, lng: 139.7671 };
        
        const mapOptions = {
          center: defaultCenter,
          zoom: 12,
          mapTypeId: 'roadmap',
          mapTypeControl: false,  // 地図タイプコントロールを非表示
          streetViewControl: false, // ストリートビューコントロールも非表示
          fullscreenControl: false // 全画面表示コントロールも非表示
        };

        this.map = new window.google.maps.Map(mapElement, mapOptions);
        this.geocoder = new window.google.maps.Geocoder();
        
        // マップのダブルクリックイベントを追加
        this.map.addListener('dblclick', (event: any) => {
          if(!this.is_edit) {
            return;
          }
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // 指定された桁数に丸める
          const roundedLat = Number(lat).toFixed(this.latDecimalPlaces);
          const roundedLng = Number(lng).toFixed(this.lngDecimalPlaces);
          
          // 選択した位置を保存（丸めた値を数値に変換して保存）
          this.selectedLocation = { 
            lat: parseFloat(roundedLat), 
            lng: parseFloat(roundedLng) 
          };
          
          // 緯度経度を親コンポーネントに通知
          this.onLocationSelect.emit(this.selectedLocation);

          // ユーザーに通知
          this.toasterService.info(`緯度経度を取得しました。緯度: ${roundedLat}, 経度: ${roundedLng}`, '位置情報');

          // クリックした位置にマーカーを表示
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: this.map,
            animation: window.google.maps.Animation.DROP
          });

          // 3秒後にマーカーを消す
          setTimeout(() => {
            marker.setMap(null);
          }, 3000);
        });

        // 自動的に現在地を取得して表示
        this.showCurrentLocation();

        if(this.data_a.length == 0 && this.data) {
          this.data_a.push(this.data)
        }
        // データがある場合はマーカーを追加
        if (this.data_a && this.data_a.length > 0) {
          this.addMarkers();
        }

        this.isLoading = false;
      } else {
        console.error('Map element not found in DOM');
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error in initMap:', error);
      this.isLoading = false;
    }
  }

  // 現在地を表示するメソッド
  private showCurrentLocation() {
    if (navigator.geolocation) {
      // 位置情報取得中の表示
      const loadingInfoWindow = new window.google.maps.InfoWindow({
        content: '<div style="padding: 10px;"><div class="loader_small">位置情報を取得中...</div></div>',
        position: this.map.getCenter()
      });
      loadingInfoWindow.open(this.map);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 読み込み中のウィンドウを閉じる
          loadingInfoWindow.close();

          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // 既存の現在地マーカーがあれば削除
          if (this.currentLocationMarker) {
            this.currentLocationMarker.setMap(null);
          }
          
          // 現在地マーカーを作成
          this.currentLocationMarker = new window.google.maps.Marker({
            position: pos,
            map: this.map,
            title: '現在地',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            zIndex: 999 // 他のマーカーより前面に表示
          });
          
          // 現在地に地図の中心を移動
          this.map.setCenter(pos);
          this.map.setZoom(15); // ズームレベルを調整
          
          // 現在地の周りに円を描画（精度を表す）
          const accuracyCircle = new window.google.maps.Circle({
            map: this.map,
            center: pos,
            radius: position.coords.accuracy,
            strokeColor: '#4285F4',
            strokeOpacity: 0.2,
            strokeWeight: 1,
            fillColor: '#4285F4',
            fillOpacity: 0.1
          });
          
          // 情報ウィンドウを追加
          const infoWindow = new window.google.maps.InfoWindow({
            content: '<div style="padding: 5px;"><strong>現在地</strong></div>'
          });
          
          this.currentLocationMarker.addListener('click', () => {
            infoWindow.open(this.map, this.currentLocationMarker);
          });
        },
        (error) => {
          // 読み込み中のウィンドウを閉じる
          loadingInfoWindow.close();

          console.error('Geolocation error:', error);
          console.log('現在地を取得できませんでした。デフォルトの位置を使用します。');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // タイムアウトを15秒に延長
          maximumAge: 0
        }
      );
    } else {
      console.log('お使いのブラウザは位置情報をサポートしていません。');
    }
  }

  private async addMarkers() {
    this.clearMarkers();
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarker = false;

    for (const data of this.data_a) {
      const address = data.raw_data?.[this.address_field];
      const latField = this.table_info.menu.getGoogleMapLatField();
      const lngField = this.table_info.menu.getGoogleMapLngField();
      const lat = data.raw_data?.[latField];
      const lng = data.raw_data?.[lngField];

      // 緯度経度が直接指定されている場合はそれを使用
      if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        const position = new window.google.maps.LatLng(parseFloat(lat), parseFloat(lng));
        
        // マーカーの色とアイコンタイプを決定
        let markerColor = 'red'; // デフォルトの色
        let markerIconType = 'dot'; // デフォルトのアイコンタイプ
        
        if (this.filter) {
          if (typeof this.filter.getMarkerSettingsByConditions === 'function') {
            // 新しいメソッドがある場合は色とアイコンタイプを取得
            const markerSettings = this.filter.getMarkerSettingsByConditions(data);
            markerColor = markerSettings.color;
            markerIconType = markerSettings.iconType || 'dot';
          } else {
            // 下位互換性のため
            markerColor = this.filter.getMarkerColorByConditions(data);
          }
        }

        // アイコンURLを生成
        const iconUrl = markerIconType === 'pushpin' 
          ? `assets/img/google-map/${markerColor}-pushpin.png`
          : `assets/img/google-map/${markerColor}-dot.png`;

        const scaledSize = markerIconType === 'pushpin'
          ? new window.google.maps.Size(32, 32)
          : new window.google.maps.Size(20, 32);

        const anchor = markerIconType === 'pushpin'
          ? new window.google.maps.Point(0, 32)
          : new window.google.maps.Point(10, 32);

        const marker = new window.google.maps.Marker({
          position: position,
          map: this.map,
          title: address || `${lat}, ${lng}`,
          icon: {
            url: iconUrl,
            scaledSize: scaledSize,
            anchor: anchor
          }
        });

        // 情報ウィンドウを追加
        let infoWindowContent = `<div style="padding: 10px;">
          <div style="margin-bottom: 8px;"><a href="/admin/${this.table_info.table}/view/${data.raw_data.id}" style="color: #0066cc; text-decoration: none;">レコードを表示</a></div>`;

        // info_modal_fieldsが設定されている場合は、その項目のみを表示
        // 設定されていない場合は、システムフィールドを除いた最初の10個のフィールドを表示
        const systemFields = ['id', 'created', 'updated', 'admin_id', 'updated_admin_id'];
        const fieldsToShow = this.filter?.info_modal_fields?.length > 0 
          ? this.filter.info_modal_fields 
          : Object.keys(data.raw_data)
              .filter(key => !systemFields.includes(key))
              .slice(0, 10);
        let fieldKey = '';

        console.log(data.view_data)

        for (const key of fieldsToShow) {
          if (['id', 'created', 'updated', 'admin_id', 'updated_admin_id'].indexOf(key) === -1) {
            fieldKey = key.startsWith('field__') ? key : `field__${key}`;
          } else {
            fieldKey = key;
          }

          if (data.raw_data.hasOwnProperty(fieldKey) && this.table_info?.getFieldByFieldName(fieldKey)) {
            // フィールドタイプ判定のための情報を取得
            const field = this.table_info.getFieldByFieldName(fieldKey);
            const fieldValue = data.view_data[fieldKey];
            const fieldForm = this.table_info.forms.byFieldName(fieldKey);
            const fieldType = fieldForm?.original_type || fieldForm?.type;

            // フィールドの種類に応じた表示処理
            if (fieldType === 'image' && fieldValue && typeof fieldValue === 'object') {
              // 画像の場合、サムネイルを表示とダウンロードリンク
              if (fieldValue.thumbnail_url) {
                infoWindowContent += `
                  <div style="margin: 8px 0;">
                    <strong>${field['Name']}:</strong><br>
                    <img src="${fieldValue.thumbnail_url}" alt="${fieldValue.name || ''}" style="max-width: 150px; max-height: 100px; margin-top: 5px; border-radius: 4px; cursor: pointer;" 
                      onclick="window.open('${fieldValue.display_url || fieldValue.url}', '_blank')" 
                      title="クリックで拡大表示"
                    />
                    <div style="margin-top: 5px;">
                      <a href="javascript:void(0)" 
                         onclick="window.googleMapComponent.downloadFile('${fieldValue.display_url || fieldValue.presigned_url || fieldValue.url}', '${fieldValue.name || 'image'}')" 
                         style="color: #0066cc; text-decoration: none; font-size: 0.9em;">
                        <i style="margin-right: 4px;">⬇</i>ダウンロード
                      </a>
                    </div>
                  </div>`;
              } else if (fieldValue.url) {
                infoWindowContent += `
                  <div style="margin: 8px 0;">
                    <strong>${field['Name']}:</strong><br>
                    <a href="${fieldValue.display_url || fieldValue.url}" target="_blank" style="display: inline-block; margin-top: 5px;">
                      <img src="${fieldValue.url}" alt="${fieldValue.name || ''}" style="max-width: 150px; max-height: 100px; border-radius: 4px;" />
                    </a>
                    <div style="margin-top: 5px;">
                      <a href="javascript:void(0)" 
                         onclick="window.googleMapComponent.downloadFile('${fieldValue.display_url || fieldValue.presigned_url || fieldValue.url}', '${fieldValue.name || 'image'}')" 
                         style="color: #0066cc; text-decoration: none; font-size: 0.9em;">
                        <i style="margin-right: 4px;">⬇</i>ダウンロード
                      </a>
                    </div>
                  </div>`;
              } else {
                infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> 画像なし</p>`;
              }
            } else if (fieldType === 'file' && fieldValue && typeof fieldValue === 'object') {
              // ファイルの場合、ダウンロードリンクを表示
              if (fieldValue.url) {
                const downloadUrl = fieldValue.display_url || fieldValue.presigned_url || fieldValue.url;
                infoWindowContent += `
                  <div style="margin: 5px 0;">
                    <strong>${field['Name']}:</strong><br>
                    <a href="javascript:void(0)" 
                       onclick="window.googleMapComponent.downloadFile('${downloadUrl}', '${fieldValue.name || 'file'}')" 
                       style="display: inline-block; margin-top: 5px; color: #0066cc; text-decoration: none;">
                      <span style="display: flex; align-items: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="12" y1="18" x2="12" y2="12"></line>
                          <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        ${fieldValue.name || 'ファイルをダウンロード'} (${(fieldValue.size / 1024).toFixed(1)}KB)
                      </span>
                    </a>
                  </div>`;
              } else {
                infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> ファイルなし</p>`;
              }
            } else {
              // その他のフィールドタイプは従来通り表示
              infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> ${fieldValue}</p>`;
            }
          }
        }
        
        // 住所がある場合はGoogle Mapで開くリンクを追加
        if (address) {
          infoWindowContent += `<div style="margin-top: 8px; padding-top: 8px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" style="color: #0066cc; text-decoration: none;">Google マップで開く</a>
          </div>`;
        } else {
          infoWindowContent += `<div style="margin-top: 8px; padding-top: 8px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="color: #0066cc; text-decoration: none;">Google マップで開く</a>
          </div>`;
        }
        infoWindowContent += '</div>';

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoWindowContent
        });

        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
        });

        this.markers.push(marker);
        bounds.extend(position);
        hasValidMarker = true;
      }
      // 緯度経度がなく住所がある場合は、ジオコーディングを使用（従来の方法）
      else if (address) {
        try {
          const position = await this.geocodeAddress(address);
          if (position) {
            // マーカーの色とアイコンタイプを決定
            let markerColor = 'red'; // デフォルトの色
            let markerIconType = 'dot'; // デフォルトのアイコンタイプ
            
            if (this.filter) {
              if (typeof this.filter.getMarkerSettingsByConditions === 'function') {
                // 新しいメソッドがある場合は色とアイコンタイプを取得
                const markerSettings = this.filter.getMarkerSettingsByConditions(data);
                markerColor = markerSettings.color;
                markerIconType = markerSettings.iconType || 'dot';
              } else {
                // 下位互換性のため
                markerColor = this.filter.getMarkerColorByConditions(data);
              }
            }

            // アイコンURLを生成
            const iconUrl = markerIconType === 'pushpin' 
              ? `assets/img/google-map/${markerColor}-pushpin.png`
              : `assets/img/google-map/${markerColor}-dot.png`;

            const scaledSize = markerIconType === 'pushpin'
              ? new window.google.maps.Size(32, 32)
              : new window.google.maps.Size(20, 32);

            const anchor = markerIconType === 'pushpin'
              ? new window.google.maps.Point(0, 32)
              : new window.google.maps.Point(10, 32);

            const marker = new window.google.maps.Marker({
              position: position,
              map: this.map,
              title: address,
              icon: {
                url: iconUrl,
                scaledSize: scaledSize,
                anchor: anchor
              }
            });

            // 情報ウィンドウを追加
            let infoWindowContent = `<div style="padding: 10px;">
              <div style="margin-bottom: 8px;"><a href="/admin/${this.table_info.table}/view/${data.raw_data.id}" style="color: #0066cc; text-decoration: none;">レコードを表示</a></div>`;

            // info_modal_fieldsが設定されている場合は、その項目のみを表示
            // 設定されていない場合は、システムフィールドを除いた最初の10個のフィールドを表示
            const systemFields = ['id', 'created', 'updated', 'admin_id', 'updated_admin_id'];
            const fieldsToShow = this.filter?.info_modal_fields?.length > 0 
              ? this.filter.info_modal_fields 
              : Object.keys(data.raw_data)
                  .filter(key => !systemFields.includes(key))
                  .slice(0, 10);
            let fieldKey = '';

            for (const key of fieldsToShow) {
              if (['id', 'created', 'updated', 'admin_id', 'updated_admin_id'].indexOf(key) === -1) {
                fieldKey = key.startsWith('field__') ? key : `field__${key}`;
              } else {
                fieldKey = key;
              }

              if (data.raw_data.hasOwnProperty(fieldKey) && this.table_info?.getFieldByFieldName(fieldKey)) {
                // フィールドタイプ判定のための情報を取得
                const field = this.table_info.getFieldByFieldName(fieldKey);
                const fieldValue = data.view_data[fieldKey];
                const fieldForm = this.table_info.forms.byFieldName(fieldKey);
                const fieldType = fieldForm?.original_type || fieldForm?.type;

                // フィールドの種類に応じた表示処理
                if (fieldType === 'image' && fieldValue && typeof fieldValue === 'object') {
                  // 画像の場合、サムネイルを表示とダウンロードリンク
                  if (fieldValue.thumbnail_url) {
                    infoWindowContent += `
                      <div style="margin: 8px 0;">
                        <strong>${field['Name']}:</strong><br>
                        <img src="${fieldValue.thumbnail_url}" alt="${fieldValue.name || ''}" style="max-width: 150px; max-height: 100px; margin-top: 5px; border-radius: 4px; cursor: pointer;" 
                          onclick="window.open('${fieldValue.display_url || fieldValue.url}', '_blank')" 
                          title="クリックで拡大表示"
                        />
                        <div style="margin-top: 5px;">
                          <a href="javascript:void(0)" 
                             onclick="window.googleMapComponent.downloadFile('${fieldValue.display_url || fieldValue.presigned_url || fieldValue.url}', '${fieldValue.name || 'image'}')" 
                             style="color: #0066cc; text-decoration: none; font-size: 0.9em;">
                            <i style="margin-right: 4px;">⬇</i>ダウンロード
                          </a>
                        </div>
                      </div>`;
                  } else if (fieldValue.url) {
                    infoWindowContent += `
                      <div style="margin: 8px 0;">
                        <strong>${field['Name']}:</strong><br>
                        <a href="${fieldValue.display_url || fieldValue.url}" target="_blank" style="display: inline-block; margin-top: 5px;">
                          <img src="${fieldValue.url}" alt="${fieldValue.name || ''}" style="max-width: 150px; max-height: 100px; border-radius: 4px;" />
                        </a>
                        <div style="margin-top: 5px;">
                          <a href="javascript:void(0)" 
                             onclick="window.googleMapComponent.downloadFile('${fieldValue.display_url || fieldValue.presigned_url || fieldValue.url}', '${fieldValue.name || 'image'}')" 
                             style="color: #0066cc; text-decoration: none; font-size: 0.9em;">
                            <i style="margin-right: 4px;">⬇</i>ダウンロード
                          </a>
                        </div>
                      </div>`;
                  } else {
                    infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> 画像なし</p>`;
                  }
                } else if (fieldType === 'file' && fieldValue && typeof fieldValue === 'object') {
                  // ファイルの場合、ダウンロードリンクを表示
                  if (fieldValue.url) {
                    const downloadUrl = fieldValue.display_url || fieldValue.presigned_url || fieldValue.url;
                    infoWindowContent += `
                      <div style="margin: 5px 0;">
                        <strong>${field['Name']}:</strong><br>
                        <a href="javascript:void(0)" 
                           onclick="window.googleMapComponent.downloadFile('${downloadUrl}', '${fieldValue.name || 'file'}')" 
                           style="display: inline-block; margin-top: 5px; color: #0066cc; text-decoration: none;">
                          <span style="display: flex; align-items: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="12" y1="18" x2="12" y2="12"></line>
                              <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            ${fieldValue.name || 'ファイルをダウンロード'} (${(fieldValue.size / 1024).toFixed(1)}KB)
                          </span>
                        </a>
                      </div>`;
                  } else {
                    infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> ファイルなし</p>`;
                  }
                } else {
                  // その他のフィールドタイプは従来通り表示
                  infoWindowContent += `<p style="margin: 5px 0;"><strong>${field['Name']}:</strong> ${fieldValue}</p>`;
                }
              }
            }
            infoWindowContent += `<div style="margin-top: 8px; padding-top: 8px;">
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" style="color: #0066cc; text-decoration: none;">Google マップで開く</a>
            </div>`;
            infoWindowContent += '</div>';

            const infoWindow = new window.google.maps.InfoWindow({
              content: infoWindowContent
            });

            marker.addListener('click', () => {
              infoWindow.open(this.map, marker);
            });

            this.markers.push(marker);
            bounds.extend(position);
            hasValidMarker = true;
          }
        } catch (error) {
          console.error('Geocoding error for address:', address, error);
        }
      }
    }

    if (hasValidMarker) {
      this.map.fitBounds(bounds);
      // ズームレベルが近すぎる場合は調整
      const listener = this.map.addListener('idle', () => {
        if (this.map.getZoom() > 16) {
          this.map.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

    this.isLoading = false;
  }

  private geocodeAddress(address: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address: address }, (results: any, status: any) => {
        if (status === 'OK') {
          resolve(results[0].geometry.location);
        } else {
          reject(status);
        }
      });
    });
  }

  private clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  // ファイルをダウンロードするためのメソッド（グローバルアクセス用）
  public downloadFile(url: string, fileName: string = 'file') {
    // ダウンロード中の表示などが必要な場合はここで設定
    this.sharedService.download_file(url, () => {
      // ダウンロード完了後のコールバック処理
      console.log('ファイルのダウンロードが完了しました: ' + fileName);
    }, false, fileName);
  }
} 
