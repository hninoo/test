import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';
import {TableInfo} from '../../class/TableInfo';
import {CustomFilter} from '../../class/Filter/CustomFilter';
import {Data} from '../../class/Data';
import {ActivatedRoute} from '@angular/router';

declare const google: any;

@Component({
    selector: 'app-drone-map',
    templateUrl: './drone-map.component.html',
    styleUrls: ['./drone-map.component.scss']
})
export class DroneMapComponent implements OnInit, AfterViewInit {
    @ViewChild('mapElement', {static: false}) mapElement: ElementRef;

    map: any;
    // 単一ドローン用（互換性のため残す）
    droneMarker: any;
    routePath: any;
    traveledPath: any;  // ドローンが飛んだ軌跡用のポリライン

    // 複数ドローン管理用
    droneMarkers: Map<number, any> = new Map();  // 各ドローンのマーカー
    routePaths: Map<number, any> = new Map();     // 各ドローンの予定ルート
    traveledPaths: Map<number, any> = new Map();  // 各ドローンの飛行済みルート
    flightRoutesMap: Map<number, any[]> = new Map();  // 各ドローンの飛行ルート
    flightLogsMap: Map<number, any[]> = new Map();    // 各ドローンの飛行ログ

    routeMarkers: any[] = [];
    flightRoutes: any[] = [];
    flightLogs: any[] = [];  // 飛行ログデータ
    breathDetectionMarkers: any[] = [];  // 呼吸検知マーカー
    drones: any[] = [];
    selectedDroneId: number = -1;  // デフォルトを「すべて」に設定
    mapInitialized: boolean = false;

    // 色設定（ドローンID: 1-6用）
    droneColors = {
        1: {route: '#0088FF', traveled: '#0044AA', routeOpacity: 0.6},  // 青系
        2: {route: '#FF8800', traveled: '#AA4400', routeOpacity: 0.6},  // オレンジ系
        3: {route: '#8800FF', traveled: '#4400AA', routeOpacity: 0.6},  // 紫系
        4: {route: '#0088FF', traveled: '#0044AA', routeOpacity: 0.6},  // 青系（水道用）
        5: {route: '#FF8800', traveled: '#AA4400', routeOpacity: 0.6},  // オレンジ系（水道用）
        6: {route: '#8800FF', traveled: '#4400AA', routeOpacity: 0.6}   // 紫系（水道用）
    };

    // アニメーション関連
    isAnimating: boolean = false;
    animationSpeed: number = 10000; // ミリ秒（0.1ポイント/秒 = 2000msの1/5）
    currentAnimationIndex: number = 0;
    animationInterval: any = null;
    hasAddedMarkerForCurrentSegment: boolean = false;  // 現在のセグメントでマーカーを追加したか

    // 複数ドローンアニメーション用
    animationStates: Map<number, {
        isAnimating: boolean;
        currentIndex: number;
        hasAddedMarker: boolean;
    }> = new Map();

    // デフォルトの中心位置（東京）
    defaultCenter = {lat: 35.6762, lng: 139.6503};

    // グループ設定（通常 or 水道）
    groupType: string = 'normal';  // 'normal' or 'suido'
    droneIdRange = {
        start: 1,
        end: 3
    };
    detectionLabelText = '呼吸検知';  // デフォルトは呼吸検知

    constructor(
        private sharedService: SharedService,
        private connect: Connect,
        private route: ActivatedRoute
    ) {
    }

    ngOnInit(): void {
        // URLパラメータをチェック
        this.route.queryParams.subscribe(params => {
            if (params['group'] === 'suido') {
                this.groupType = 'suido';
                this.droneIdRange = {
                    start: 4,
                    end: 6
                };
                this.detectionLabelText = '水道管異常検知';
            }

            // SharedServiceの初期化を待ってからドローン一覧を取得
            this.sharedService.loadAdminDatas().then(() => {
                console.log('Google Maps API Key:', this.sharedService.google_map_api_key);
                console.log('Group Type:', this.groupType);
                console.log('Drone ID Range:', this.droneIdRange);
                // ドローン一覧を取得
                this.loadDrones();
            });
        });
    }

    ngAfterViewInit(): void {
        // ViewがInitされたらGoogle Maps APIを読み込む
        setTimeout(() => {
            this.sharedService.loadAdminDatas().then(() => {
                this.loadGoogleMapsIfNeeded();
            });
        }, 100);
    }

    loadGoogleMapsIfNeeded(): void {
        // 既に初期化済みの場合はスキップ
        if (this.mapInitialized) {
            return;
        }

        // Google Maps APIが読み込まれているか確認
        if (typeof google !== 'undefined' && google.maps && google.maps.MapTypeId) {
            console.log('Google Maps API already loaded, initializing map');
            this.initMap();
        } else {
            console.log('Loading Google Maps API');
            // Google Maps APIを動的に読み込む
            this.loadGoogleMapsScript();
        }
    }

    loadGoogleMapsScript(): void {
        // APIキーが取得できていない場合はエラー
        if (!this.sharedService.google_map_api_key) {
            console.error('Google Maps APIキーが設定されていません');
            return;
        }

        // 既存のスクリプトタグをチェック
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            console.log('Google Maps script already exists, waiting for load');
            // スクリプトが既に存在する場合は、APIが利用可能になるまで待つ
            this.waitForGoogleMaps();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.sharedService.google_map_api_key}&libraries=geometry&callback=initMapCallback`;
        script.async = true;
        script.defer = true;

        // グローバルコールバック関数を設定
        (window as any).initMapCallback = () => {
            console.log('Google Maps API loaded via callback');
            this.initMap();
            delete (window as any).initMapCallback;
        };

        script.onerror = () => {
            console.error('Google Maps APIの読み込みに失敗しました');
        };

        document.head.appendChild(script);
    }

    waitForGoogleMaps(): void {
        let attempts = 0;
        const maxAttempts = 50;

        const checkInterval = setInterval(() => {
            attempts++;

            if (typeof google !== 'undefined' && google.maps && google.maps.MapTypeId) {
                console.log('Google Maps API is now available');
                clearInterval(checkInterval);
                this.initMap();
            } else if (attempts >= maxAttempts) {
                console.error('Google Maps API load timeout');
                clearInterval(checkInterval);
            }
        }, 100);
    }

    initMap(): void {
        // 既に初期化済みの場合はスキップ
        if (this.mapInitialized) {
            return;
        }

        // mapElementが存在するか確認
        if (!this.mapElement || !this.mapElement.nativeElement) {
            console.error('Map element not found');
            return;
        }

        // Google Maps APIが利用可能か再確認
        if (typeof google === 'undefined' || !google.maps || !google.maps.MapTypeId) {
            console.error('Google Maps API not fully loaded');
            this.waitForGoogleMaps();
            return;
        }

        try {
            // 地図を初期化
            const mapOptions = {
                center: this.defaultCenter,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
            this.mapInitialized = true;
            console.log('Map initialized successfully');

            // デフォルトですべてのドローンを表示
            if (this.selectedDroneId === -1) {
                // すべてのドローンが選択されている場合
                this.onDroneSelect();
            } else if (this.selectedDroneId) {
                // 特定のドローンが選択されている場合
                this.onDroneSelect();
            }
        } catch (error) {
            console.error('Error initializing map:', error);
            this.mapInitialized = false;
        }
    }

    loadDrones(): void {
        // dataset__4（ドローン）のTableInfoを取得してからデータを取得
        this.sharedService.getTableInfo('dataset__4').subscribe((tableInfo: TableInfo) => {
            if (!tableInfo) {
                console.error('dataset__4のテーブル情報が取得できませんでした');
                return;
            }

            console.log('Drone TableInfo:', tableInfo);

            // getListを使用してデータを取得
            this.connect.getList(tableInfo, 1, 1000).subscribe(
                (response: any) => {
                    console.log('ドローン一覧取得レスポンス:', response);
                    if (response.data_a && response.data_a.length > 0) {
                        // data_aの各要素はDataクラスのインスタンスを作成する必要がある
                        this.drones = [];
                        response.data_a.forEach((_data: any) => {
                            const newData = new Data(tableInfo);
                            newData.setInstanceData(_data);
                            // 指定された範囲のドローンのみを追加
                            const rawData: any = newData.raw_data;
                            const droneId = parseInt(rawData.id);
                            if (droneId >= this.droneIdRange.start && droneId <= this.droneIdRange.end) {
                                this.drones.push(newData);
                            }
                        });

                        console.log(`ドローン一覧 (ID: ${this.droneIdRange.start}-${this.droneIdRange.end}):`, this.drones);

                        // デフォルト選択（すべて）でデータを読み込む
                        if (this.drones.length > 0 && this.selectedDroneId === -1) {
                            this.onDroneSelect();
                        }
                    } else {
                        console.log('ドローンデータがありません');
                        this.drones = [];
                    }
                },
                (error) => {
                    console.error('ドローン一覧の取得に失敗しました', error);
                }
            );
        });
    }

    onDroneSelect(): void {
        if (!this.selectedDroneId) {
            return;
        }

        // 「すべて」が選択された場合
        if (this.selectedDroneId == -1) {
            this.loadAllDronesData();
            return;
        }

        // 単一ドローンが選択された場合
        const selectedDrone = this.drones.find(d => d.raw_data.id == this.selectedDroneId);
        if (!selectedDrone) {
            return;
        }

        // ドローンの初期位置を設定（raw_dataから取得）
        const droneLat = parseFloat(selectedDrone.raw_data.field__18) || this.defaultCenter.lat;
        const droneLng = parseFloat(selectedDrone.raw_data.field__19) || this.defaultCenter.lng;

        console.log('選択されたドローン:', selectedDrone.raw_data);
        console.log('ドローン位置:', {lat: droneLat, lng: droneLng});

        // 地図の中心をドローンの位置に移動
        if (this.map) {
            this.map.setCenter({lat: droneLat, lng: droneLng});

            // 既存のマーカーを削除
            if (this.droneMarker) {
                this.droneMarker.setMap(null);
            }

            // ドローンのマーカーを追加（カスタムドローンアイコンを使用）
            this.droneMarker = new google.maps.Marker({
                position: {lat: droneLat, lng: droneLng},
                map: this.map,
                title: `ドローン: ${selectedDrone.raw_data.field__12}`,
                icon: {
                    url: '/assets/img/icon/drone.svg',
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25)
                },
                zIndex: 1000
            });
        }

        // 飛行ルートを取得
        this.loadFlightRoutes();
        // 飛行ログを取得
        this.loadFlightLogs();
    }

    // 全ドローンのデータを読み込み
    loadAllDronesData(): void {
        console.log('[loadAllDronesData] 全ドローンのデータを読み込み開始');
        console.log('[loadAllDronesData] ドローンID範囲:', this.droneIdRange);
        console.log('[loadAllDronesData] 利用可能なドローン:', this.drones.map(d => d.raw_data.id));

        // 既存のマーカーをクリア
        this.clearMap();

        // 現在のドローンID範囲に基づいてドローンIDを設定
        const droneIds = [];
        for (let i = this.droneIdRange.start; i <= this.droneIdRange.end; i++) {
            droneIds.push(i);
        }
        console.log('[loadAllDronesData] 対象ドローンID:', droneIds);
        const loadPromises = [];

        droneIds.forEach(droneId => {
            const drone = this.drones.find(d => d.raw_data.id == droneId);
            console.log(`[loadAllDronesData] ドローン${droneId} 存在:`, drone ? 'あり' : 'なし');
            if (drone) {
                // ドローンマーカーを作成
                this.createDroneMarker(droneId, drone);

                // 飛行ルートを読み込み
                loadPromises.push(this.loadFlightRoutesForDrone(droneId));

                // 飛行ログを読み込み
                loadPromises.push(this.loadFlightLogsForDrone(droneId));
            }
        });

        // 全データ読み込み完了後、マップを調整し、呼吸検知マーカーを描画
        Promise.all(loadPromises).then(() => {
            this.adjustMapBounds();
            // 全ドローンの飛行ログから呼吸検知マーカーを描画
            this.drawAllDronesBreathDetectionMarkers();
        });
    }

    // 個別ドローンのマーカーを作成
    createDroneMarker(droneId: number, drone: any): void {
        if (!this.map) {
            return;
        }

        const droneLat = parseFloat(drone.raw_data.field__18) || this.defaultCenter.lat;
        const droneLng = parseFloat(drone.raw_data.field__19) || this.defaultCenter.lng;

        // 既存のマーカーを削除
        if (this.droneMarkers.has(droneId)) {
            this.droneMarkers.get(droneId).setMap(null);
        }

        // ドローンの色を取得
        const droneColor = this.getDroneIconColor(droneId);

        // 新しいマーカーを作成（SVGを使用）
        const marker = new google.maps.Marker({
            position: {lat: droneLat, lng: droneLng},
            map: this.map,
            title: `ドローン${droneId}: ${drone.raw_data.field__12}`,
            icon: {
                url: this.createDroneSvgUrl(droneColor),
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 25)
            },
            zIndex: 1000 + droneId
        });

        this.droneMarkers.set(droneId, marker);
    }

    // ドローンのSVG URLを生成（色を変更）
    createDroneSvgUrl(color: string): string {
        // SVGテンプレート（fill属性を動的に変更）
        const svg = `
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0,512) scale(0.1,-0.1)" fill="${color}" stroke="none">
                    <path d="M795 5110 c-232 -37 -459 -171 -598 -353 -215 -280 -256 -654 -107 -966 55 -115 113 -192 212 -287 261 -246 646 -318 976 -182 83 35 84 31 -9 109 l-46 38 -62 -19 c-366 -114 -768 63 -931 411 -54 116 -73 216 -67 353 6 141 22 210 78 321 76 154 190 268 344 344 111 56 180 72 321 78 101 4 134 2 204 -16 290 -73 502 -285 575 -576 32 -127 19 -334 -29 -455 -4 -11 13 -38 50 -79 57 -63 57 -63 70 -39 8 12 28 66 46 118 31 93 32 100 33 270 0 200 -8 242 -81 399 -55 117 -113 199 -201 281 -122 115 -254 188 -419 230 -92 24 -270 34 -359 20z"/>
                    <path d="M4011 5110 c-354 -74 -637 -342 -728 -689 -49 -188 -31 -426 44 -594 l27 -60 58 64 c37 41 56 69 52 79 -72 182 -61 436 26 611 140 278 394 438 697 439 429 1 773 -340 773 -766 0 -112 -13 -187 -51 -285 -91 -235 -298 -416 -546 -475 -128 -31 -333 -17 -453 30 -10 4 -38 -15 -79 -52 l-64 -58 60 -27 c162 -73 398 -92 578 -48 355 87 624 364 700 724 31 141 16 356 -33 497 -97 278 -318 490 -612 585 -76 25 -102 28 -245 31 -88 2 -180 -1 -204 -6z"/>
                    <path d="M860 4477 c-209 -59 -292 -301 -162 -472 108 -141 322 -154 446 -28 120 122 112 328 -18 439 -67 57 -184 84 -266 61z"/>
                    <path d="M4112 4475 c-100 -28 -180 -104 -213 -203 -17 -50 -7 -169 18 -217 101 -195 373 -222 505 -50 44 58 64 121 61 197 -5 184 -192 322 -371 273z"/>
                    <path d="M1334 3969 c-33 -67 -116 -150 -183 -183 l-52 -27 77 -51 c42 -29 124 -93 183 -144 254 -218 384 -417 458 -702 26 -101 28 -119 27 -307 -1 -181 -3 -209 -26 -295 -56 -210 -138 -365 -277 -525 -83 -97 -253 -246 -365 -322 l-76 -52 47 -23 c62 -30 162 -130 192 -191 l23 -48 50 73 c75 110 151 200 247 296 185 185 353 283 600 350 88 23 113 26 296 26 189 1 206 -1 310 -28 147 -38 263 -90 386 -171 153 -102 339 -295 462 -479 l45 -68 27 52 c34 68 117 150 184 185 l53 26 -74 51 c-272 187 -481 420 -578 646 -21 48 -51 137 -66 197 -27 103 -29 123 -29 305 0 182 2 202 29 305 38 147 90 263 170 385 103 154 308 350 495 473 l53 36 -53 26 c-67 34 -149 117 -183 184 l-27 51 -46 -67 c-70 -103 -158 -209 -253 -303 -185 -186 -353 -283 -598 -347 -101 -26 -119 -28 -307 -27 -182 0 -209 3 -296 26 -245 66 -418 166 -597 346 -97 97 -186 203 -255 305 l-46 67 -27 -51z"/>
                    <path d="M815 1860 c-107 -15 -188 -40 -291 -90 -241 -117 -404 -307 -489 -570 -23 -71 -28 -108 -33 -228 -5 -150 3 -218 40 -332 90 -280 318 -508 598 -598 114 -37 182 -45 332 -40 156 6 249 28 373 91 248 124 431 354 496 622 44 181 24 416 -48 578 l-27 60 -58 -64 c-37 -41 -56 -69 -52 -79 47 -120 61 -325 30 -453 -46 -192 -171 -370 -336 -476 -255 -165 -599 -161 -849 8 -392 266 -458 812 -142 1162 95 106 239 193 380 231 136 36 344 24 471 -26 10 -4 38 15 79 52 l64 58 -59 27 c-127 57 -341 87 -479 67z"/>
                    <path d="M4100 1863 c-75 -7 -188 -36 -260 -66 l-74 -31 64 -58 c42 -37 70 -56 80 -52 126 50 336 61 471 26 402 -107 649 -507 564 -913 -75 -354 -390 -609 -754 -609 -109 0 -185 14 -282 51 -235 91 -411 291 -474 544 -32 127 -19 334 30 456 4 10 -14 37 -53 79 l-58 64 -27 -65 c-55 -134 -62 -172 -62 -354 0 -148 3 -180 23 -247 46 -155 119 -284 220 -391 453 -476 1229 -357 1518 233 220 449 36 998 -414 1233 -149 78 -349 117 -512 100z"/>
                    <path d="M803 1200 c-109 -55 -165 -147 -166 -270 0 -204 202 -344 399 -277 196 67 259 334 114 485 -61 63 -111 85 -205 90 -74 3 -85 1 -142 -28z"/>
                    <path d="M4075 1210 c-58 -23 -128 -87 -158 -145 -14 -27 -22 -65 -25 -120 -4 -75 -2 -84 30 -145 97 -186 345 -222 483 -68 130 143 94 367 -74 461 -71 40 -180 48 -256 17z"/>
                </g>
            </svg>
        `;

        // SVGをData URLに変換
        const encodedSvg = encodeURIComponent(svg);
        return 'data:image/svg+xml;charset=UTF-8,' + encodedSvg;
    }

    // ドローンIDに基づいたアイコンの色を取得
    getDroneIconColor(droneId: number): string {
        const colors = this.droneColors[droneId];
        if (colors) {
            // ルートの色をアイコンにも使用
            return colors.route;
        }
        // デフォルトは黒
        return '#000000';
    }

    // 個別ドローンの飛行ルートを読み込み
    loadFlightRoutesForDrone(droneId: number): Promise<void> {
        console.log(`[loadFlightRoutesForDrone] ドローン${droneId}の飛行ルート読み込み開始`);
        return new Promise((resolve) => {
            this.sharedService.getTableInfo('dataset__5').subscribe((tableInfo: TableInfo) => {
                if (!tableInfo) {
                    console.error(`dataset__5のテーブル情報が取得できませんでした (Drone ${droneId})`);
                    resolve();
                    return;
                }

                const filter = new CustomFilter();
                filter.conditions.addCondition('eq', 'field__14', droneId.toString());

                const sortParams = {
                    field: 'field__17',
                    asc_desc: 'asc'
                };

                this.connect.getList(tableInfo, 1, 1000, filter, sortParams).subscribe(
                    (response: any) => {
                        console.log(`[loadFlightRoutesForDrone] ドローン${droneId} - 飛行ルートレスポンス:`, response);
                        if (response.data_a && response.data_a.length > 0) {
                            const routes = [];
                            response.data_a.forEach((_data: any) => {
                                const newData = new Data(tableInfo);
                                newData.setInstanceData(_data);
                                routes.push(newData);
                            });

                            console.log(`[loadFlightRoutesForDrone] ドローン${droneId} - 取得したルート数:`, routes.length);
                            this.flightRoutesMap.set(droneId, routes);
                            this.drawFlightPathForDrone(droneId, routes);
                        } else {
                            console.log(`[loadFlightRoutesForDrone] ドローン${droneId} - ルートなし`);
                        }
                        resolve();
                    },
                    (error) => {
                        console.error(`飛行ルートの取得に失敗 (Drone ${droneId})`, error);
                        resolve();
                    }
                );
            });
        });
    }

    // 個別ドローンの飛行ログを読み込み
    loadFlightLogsForDrone(droneId: number): Promise<void> {
        console.log(`[loadFlightLogsForDrone] ドローン${droneId}の飛行ログ読み込み開始`);
        return new Promise((resolve) => {
            this.sharedService.getTableInfo('dataset__6').subscribe((tableInfo: TableInfo) => {
                if (!tableInfo) {
                    console.error(`dataset__6のテーブル情報が取得できませんでした (Drone ${droneId})`);
                    resolve();
                    return;
                }

                const filter = new CustomFilter();
                filter.conditions.addCondition('eq', 'field__23', droneId.toString());
                console.log(`[loadFlightLogsForDrone] ドローン${droneId} - フィルター: field__23 = ${droneId}`);

                this.connect.getList(tableInfo, 1, 1000, filter).subscribe(
                    (response: any) => {
                        console.log(`[loadFlightLogsForDrone] ドローン${droneId} - 飛行ログレスポンス:`, response);
                        if (response.data_a && response.data_a.length > 0) {
                            const logs = [];
                            response.data_a.forEach((_data: any) => {
                                const newData = new Data(tableInfo);
                                newData.setInstanceData(_data);
                                logs.push(newData);
                                // 最初のいくつかのログの検知タイプを確認
                                if (logs.length <= 3) {
                                    const rawData: any = newData.raw_data;
                                    console.log(`[loadFlightLogsForDrone] ドローン${droneId} - ログ${logs.length} field__26:`, rawData.field__26);
                                }
                            });

                            console.log(`[loadFlightLogsForDrone] ドローン${droneId} - 取得したログ数:`, logs.length);
                            this.flightLogsMap.set(droneId, logs);
                        } else {
                            console.log(`[loadFlightLogsForDrone] ドローン${droneId} - ログなし`);
                        }
                        resolve();
                    },
                    (error) => {
                        console.error(`飛行ログの取得に失敗 (Drone ${droneId})`, error);
                        resolve();
                    }
                );
            });
        });
    }

    // 個別ドローンの飛行パスを描画
    drawFlightPathForDrone(droneId: number, routes: any[]): void {
        if (!this.map || !routes || routes.length === 0) {
            return;
        }

        const color = this.droneColors[droneId] || this.droneColors[1];

        // 既存のパスを削除
        if (this.routePaths.has(droneId)) {
            this.routePaths.get(droneId).setMap(null);
        }
        if (this.traveledPaths.has(droneId)) {
            this.traveledPaths.get(droneId).setMap(null);
        }

        // ルートの座標を作成
        const routeCoordinates = routes.map(route => ({
            lat: parseFloat(route.raw_data.field__15),
            lng: parseFloat(route.raw_data.field__16)
        }));

        // 予定ルート（点線）を描画
        const routePath = new google.maps.Polyline({
            path: routeCoordinates,
            geodesic: true,
            strokeColor: color.route,
            strokeOpacity: color.routeOpacity,
            strokeWeight: 4.5,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 4
                },
                offset: '0',
                repeat: '20px'
            }],
            map: this.map
        });

        this.routePaths.set(droneId, routePath);

        // 飛行済みルート（実線）を初期化
        const traveledPath = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: color.traveled,
            strokeOpacity: 0.8,
            strokeWeight: 4.5,
            map: this.map
        });

        this.traveledPaths.set(droneId, traveledPath);

        // ドローンマーカーを最初の位置に移動
        if (this.droneMarkers.has(droneId) && routeCoordinates.length > 0) {
            const firstPoint = routeCoordinates[0];
            this.droneMarkers.get(droneId).setPosition({lat: firstPoint.lat, lng: firstPoint.lng});
            console.log(`ドローン${droneId}を飛行ルートの開始位置に配置:`, firstPoint);
        }
    }

    // マップの表示範囲を調整
    adjustMapBounds(): void {
        if (!this.map) {
            return;
        }

        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        // 全ドローンのルートポイントを含める
        this.routePaths.forEach((path) => {
            const pathArray = path.getPath();
            pathArray.forEach((latLng: any) => {
                bounds.extend(latLng);
                hasPoints = true;
            });
        });

        if (hasPoints) {
            this.map.fitBounds(bounds);
        }
    }

    loadFlightRoutes(): void {
        if (!this.selectedDroneId) {
            return;
        }

        // 「すべて」が選択された場合は loadAllDronesData で処理
        if (this.selectedDroneId == -1) {
            return;
        }

        // dataset__5（飛行ルート）のTableInfoを取得してからデータを取得
        this.sharedService.getTableInfo('dataset__5').subscribe((tableInfo: TableInfo) => {
            if (!tableInfo) {
                console.error('dataset__5のテーブル情報が取得できませんでした');
                return;
            }

            console.log('FlightRoute TableInfo:', tableInfo);

            // フィルターを作成してドローンIDで絞り込み
            const filter = new CustomFilter();
            filter.conditions.addCondition('eq', 'field__14', this.selectedDroneId.toString());

            // ソート設定（field__17で昇順）
            const sortParams = {
                field: 'field__17',
                asc_desc: 'asc'
            };

            // getListを使用してデータを取得
            this.connect.getList(tableInfo, 1, 1000, filter, sortParams).subscribe(
                (response: any) => {
                    console.log('飛行ルート取得レスポンス:', response);
                    if (response.data_a && response.data_a.length > 0) {
                        // data_aの各要素はDataクラスのインスタンスを作成する必要がある
                        this.flightRoutes = [];
                        response.data_a.forEach((_data: any) => {
                            const newData = new Data(tableInfo);
                            newData.setInstanceData(_data);
                            this.flightRoutes.push(newData);
                        });
                        console.log('飛行ルート一覧:', this.flightRoutes);
                        this.drawFlightPath();
                    } else {
                        console.log('飛行ルートデータがありません');
                        this.flightRoutes = [];
                    }
                },
                (error) => {
                    console.error('飛行ルートの取得に失敗しました', error);
                }
            );
        });
    }

    drawFlightPath(): void {
        if (!this.map || this.flightRoutes.length === 0) {
            return;
        }

        // 既存のパスを削除
        if (this.routePath) {
            this.routePath.setMap(null);
        }

        // ルートの座標を作成（raw_dataから取得）
        const routeCoordinates = this.flightRoutes.map(route => ({
            lat: parseFloat(route.raw_data.field__15),  // 緯度
            lng: parseFloat(route.raw_data.field__16)   // 経度
        }));

        // ポリラインで飛行ルートを描画（点線の緑色）
        this.routePath = new google.maps.Polyline({
            path: routeCoordinates,
            geodesic: true,
            strokeColor: '#00FF00',  // 緑色
            strokeOpacity: 0.6,
            strokeWeight: 4.5,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 4
                },
                offset: '0',
                repeat: '20px'
            }],
            map: this.map
        });

        // 飛行済み経路用のポリラインを初期化（赤色の実線）
        if (this.traveledPath) {
            this.traveledPath.setMap(null);
        }
        this.traveledPath = new google.maps.Polyline({
            path: [],  // 初期は空
            geodesic: true,
            strokeColor: '#FF0000',  // 赤色
            strokeOpacity: 0.8,
            strokeWeight: 4.5,
            map: this.map
        });

        // ルートマーカーの配列を初期化（マーカーは作成しない）
        this.routeMarkers = [];

        // ドローンマーカーを飛行ルートの1番目の位置に移動
        if (this.droneMarker && routeCoordinates.length > 0) {
            const firstPoint = routeCoordinates[0];
            this.droneMarker.setPosition({lat: firstPoint.lat, lng: firstPoint.lng});
            console.log('ドローンを飛行ルートの開始位置に配置:', firstPoint);
        }

        // 全てのポイントが見えるように地図を調整
        if (routeCoordinates.length > 0) {
            const bounds = new google.maps.LatLngBounds();

            // ルートの全ポイントを含める
            routeCoordinates.forEach(coord => {
                bounds.extend(coord);
            });

            this.map.fitBounds(bounds);
        }
    }

    clearMap(): void {
        // アニメーションをリセット
        this.resetAnimation();

        // 単一ドローンマーカーをクリア
        if (this.droneMarker) {
            this.droneMarker.setMap(null);
            this.droneMarker = null;
        }

        // 複数ドローンマーカーをクリア
        this.droneMarkers.forEach(marker => {
            marker.setMap(null);
        });
        this.droneMarkers.clear();

        // ルートマーカーをクリア
        if (this.routeMarkers && this.routeMarkers.length > 0) {
            this.routeMarkers.forEach(marker => {
                marker.setMap(null);
            });
            this.routeMarkers = [];
        }

        // 呼吸検知マーカーをクリア
        this.clearBreathDetectionMarkers();

        // 単一ドローンのルートパスをクリア
        if (this.routePath) {
            this.routePath.setMap(null);
            this.routePath = null;
        }

        // 単一ドローンの飛行済み経路をクリア
        if (this.traveledPath) {
            this.traveledPath.setMap(null);
            this.traveledPath = null;
        }

        // 複数ドローンのルートパスをクリア
        this.routePaths.forEach(path => {
            path.setMap(null);
        });
        this.routePaths.clear();

        // 複数ドローンの飛行済み経路をクリア
        this.traveledPaths.forEach(path => {
            path.setMap(null);
        });
        this.traveledPaths.clear();

        this.flightRoutes = [];
        this.flightLogs = [];
        this.flightRoutesMap.clear();
        this.flightLogsMap.clear();

        // アニメーション関連のインデックスもリセット
        this.currentAnimationIndex = 0;
        this.hasAddedMarkerForCurrentSegment = false;
        this.animationStates.clear();
    }

    // アニメーション開始
    startAnimation(): void {
        console.log('[startAnimation] 開始 - selectedDroneId:', this.selectedDroneId);
        // 「すべて」モードの場合
        if (this.selectedDroneId == -1) {
            console.log('[startAnimation] 複数ドローンモードで開始');
            this.startMultipleAnimations();
            return;
        }

        // 単一ドローンモードの場合
        if (!this.map || this.flightRoutes.length === 0 || this.isAnimating) {
            return;
        }

        // ドローンマーカーが存在しない場合は作成
        if (!this.droneMarker) {
            const selectedDrone = this.drones.find(d => d.raw_data.id === this.selectedDroneId);
            if (!selectedDrone) {
                return;
            }

            const droneLat = parseFloat(selectedDrone.raw_data.field__18) || this.defaultCenter.lat;
            const droneLng = parseFloat(selectedDrone.raw_data.field__19) || this.defaultCenter.lng;

            this.droneMarker = new google.maps.Marker({
                position: {lat: droneLat, lng: droneLng},
                map: this.map,
                title: `ドローン: ${selectedDrone.raw_data.field__12}`,
                icon: {
                    url: '/assets/img/icon/drone.svg',
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25)
                },
                zIndex: 1000
            });
        }

        this.isAnimating = true;
        this.currentAnimationIndex = 1;  // 最初の動きを1=>2にするため1から開始

        // ルートの座標を作成
        const routeCoordinates = this.flightRoutes.map(route => ({
            lat: parseFloat(route.raw_data.field__15),
            lng: parseFloat(route.raw_data.field__16)
        }));

        // 飛行済み経路をリセット（最初のポイントから開始）
        if (this.traveledPath) {
            this.traveledPath.setPath([routeCoordinates[0]]);
        }

        // スムーズアニメーションを開始
        this.animateToNextPoint(routeCoordinates);
    }

    // 複数ドローンのアニメーション開始
    startMultipleAnimations(): void {
        if (!this.map) {
            return;
        }

        console.log('[startMultipleAnimations] 複数ドローンのアニメーション開始');
        this.isAnimating = true;

        // 現在のドローンID範囲に基づいてドローンIDを設定
        const droneIds = [];
        for (let i = this.droneIdRange.start; i <= this.droneIdRange.end; i++) {
            droneIds.push(i);
        }
        console.log('[startMultipleAnimations] 対象ドローンID:', droneIds);
        console.log('[startMultipleAnimations] flightRoutesMap keys:', Array.from(this.flightRoutesMap.keys()));

        droneIds.forEach((droneId, index) => {
            if (this.flightRoutesMap.has(droneId)) {
                const routes = this.flightRoutesMap.get(droneId);
                console.log(`[startMultipleAnimations] ドローン${droneId} - ルート数:`, routes ? routes.length : 0);
                if (routes && routes.length > 0) {
                    // アニメーション状態を初期化
                    this.animationStates.set(droneId, {
                        isAnimating: true,
                        currentIndex: 1,  // 1から開始（1=>2）
                        hasAddedMarker: false
                    });

                    // ルート座標を作成
                    const routeCoordinates = routes.map(route => ({
                        lat: parseFloat(route.raw_data.field__15),
                        lng: parseFloat(route.raw_data.field__16)
                    }));
                    console.log(`[startMultipleAnimations] ドローン${droneId} - 座標数:`, routeCoordinates.length);

                    // 飛行済み経路をリセット
                    if (this.traveledPaths.has(droneId)) {
                        this.traveledPaths.get(droneId).setPath([routeCoordinates[0]]);
                    }

                    // 各ドローンの開始を少しずらす（0ms、200ms、400ms）
                    const startDelay = index * 200 + (Math.random() * 100);
                    setTimeout(() => {
                        // アニメーション開始
                        this.animateDrone(droneId, routeCoordinates);
                    }, startDelay);
                }
            }
        });
    }

    // 個別ドローンのアニメーション
    animateDrone(droneId: number, routeCoordinates: any[]): void {
        console.log(`[animateDrone] ドローン${droneId} - 開始`);
        const state = this.animationStates.get(droneId);
        console.log(`[animateDrone] ドローン${droneId} - state:`, state);

        if (!state || !state.isAnimating) {
            console.log(`[animateDrone] ドローン${droneId} - アニメーション状態がfalseまたは存在しない`);
            return;
        }

        if (state.currentIndex >= routeCoordinates.length) {
            // 最後まで到達したら停止
            console.log(`[animateDrone] ドローン${droneId} - 最後に到達 (${state.currentIndex}/${routeCoordinates.length})`);
            state.isAnimating = false;
            return;
        }

        const marker = this.droneMarkers.get(droneId);
        if (!marker) {
            console.log(`[animateDrone] ドローン${droneId} - マーカーが存在しない`);
            return;
        }

        const startPosition = marker.getPosition();
        const endPosition = routeCoordinates[state.currentIndex];

        const numSteps = 50;
        let step = 0;

        // ドローンごとに速度をランダムに調整（基準速度の80%〜120%）
        const speedVariation = 0.8 + (Math.random() * 0.4);
        const droneAnimationSpeed = this.animationSpeed * speedVariation;

        // ドローンIDに基づいた追加の速度調整（各ドローンが少し異なる速度で動く）
        const droneSpeedFactor = {
            1: 0.95,  // ドローン1は少し遅め
            2: 1.0,   // ドローン2は基準速度
            3: 1.05   // ドローン3は少し速め
        };
        const finalSpeed = droneAnimationSpeed * (droneSpeedFactor[droneId] || 1.0);

        const moveStep = () => {
            if (!this.isAnimating || !state.isAnimating) {
                return;
            }

            step++;
            const progress = step / numSteps;

            // 線形補間で中間位置を計算
            const lat = startPosition.lat() + (endPosition.lat - startPosition.lat()) * progress;
            const lng = startPosition.lng() + (endPosition.lng - startPosition.lng()) * progress;

            // ドローンごとに微小なランダムオフセットを追加（重なりを防ぐ）
            const offsetScale = 0.00002; // 約2m程度
            const randomOffsetLat = (Math.random() - 0.5) * offsetScale;
            const randomOffsetLng = (Math.random() - 0.5) * offsetScale;

            marker.setPosition({
                lat: lat + randomOffsetLat,
                lng: lng + randomOffsetLng
            });

            // 飛行済み経路を更新
            const traveledPath = this.traveledPaths.get(droneId);
            if (traveledPath) {
                const currentPath = traveledPath.getPath();
                const pathArray = [];
                currentPath.forEach((latLng: any) => {
                    pathArray.push(latLng);
                });
                const newPoint = new google.maps.LatLng(lat, lng);
                if (pathArray.length === 0 ||
                    (pathArray[pathArray.length - 1].lat() !== lat ||
                        pathArray[pathArray.length - 1].lng() !== lng)) {
                    pathArray.push(newPoint);
                    traveledPath.setPath(pathArray);
                }
            }

            if (step < numSteps) {
                // 各ステップの速度もランダムに微調整
                const stepSpeedVariation = 0.9 + (Math.random() * 0.2);
                setTimeout(moveStep, (finalSpeed / numSteps) * stepSpeedVariation);
            } else {
                // このポイントの移動完了
                state.currentIndex++;

                // ランダムに呼吸検知ピンを追加（各ドローンで独立）
                if (!state.hasAddedMarker && Math.random() < 0.02) {
                    this.addRandomBreathDetectionMarkerForDrone(droneId, endPosition);
                    state.hasAddedMarker = true;
                } else if (state.hasAddedMarker && Math.random() < 0.98) {
                    state.hasAddedMarker = false;
                }

                // 最終地点を飛行済み経路に追加
                if (traveledPath) {
                    const currentPath = traveledPath.getPath();
                    const pathArray = [];
                    currentPath.forEach((latLng: any) => {
                        pathArray.push(latLng);
                    });
                    pathArray.push(new google.maps.LatLng(endPosition.lat, endPosition.lng));
                    traveledPath.setPath(pathArray);
                }

                // 次のポイントへの待機時間もランダムに
                const waitTimeVariation = 80 + (Math.random() * 40); // 80ms〜120ms
                setTimeout(() => {
                    if (this.isAnimating && state.isAnimating) {
                        this.animateDrone(droneId, routeCoordinates);
                    }
                }, waitTimeVariation);
            }
        };

        moveStep();
    }

    // ドローン用のランダム呼吸検知マーカーを追加
    addRandomBreathDetectionMarkerForDrone(droneId: number, position: { lat: number, lng: number }): void {
        if (!this.map) {
            return;
        }

        const isDetection = Math.random() < 0.7;
        const color = this.droneColors[droneId] || this.droneColors[1];

        // 位置を少しランダムにずらす
        const offsetLat = (Math.random() - 0.5) * 0.0002;
        const offsetLng = (Math.random() - 0.5) * 0.0002;

        const markerOptions: any = {
            position: {
                lat: position.lat + offsetLat,
                lng: position.lng + offsetLng
            },
            map: this.map
        };

        if (isDetection) {
            markerOptions.icon = {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(35, 35)
            };
            markerOptions.title = `呼吸検知箇所 (ドローン${droneId})`;
        } else {
            markerOptions.icon = {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(35, 35)
            };
            markerOptions.title = `呼吸検知NG箇所 (ドローン${droneId})`;
        }
        markerOptions.zIndex = 500;

        const marker = new google.maps.Marker(markerOptions);
        this.breathDetectionMarkers.push(marker);

        // クリック時に情報を表示
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <strong>${markerOptions.title}</strong><br>
                    緯度: ${markerOptions.position.lat.toFixed(6)}<br>
                    経度: ${markerOptions.position.lng.toFixed(6)}<br>
                    <small>※アニメーション中に生成</small>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });
    }

    // アニメーション停止
    stopAnimation(): void {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        this.isAnimating = false;

        // 複数ドローンのアニメーションも停止
        this.animationStates.forEach((state) => {
            state.isAnimating = false;
        });

        // currentAnimationIndexはリセットしない（その場で停止）
        // ドローンの位置もそのまま維持
        // 飛行済み経路もそのまま維持
    }

    // アニメーションをリセット（最初に戻す）
    resetAnimation(): void {
        this.stopAnimation();
        this.currentAnimationIndex = 0;

        // ドローンを飛行ルートの最初の位置に戻す
        if (this.droneMarker && this.flightRoutes.length > 0) {
            const firstRoute = this.flightRoutes[0];
            const lat = parseFloat(firstRoute.raw_data.field__15);
            const lng = parseFloat(firstRoute.raw_data.field__16);
            this.droneMarker.setPosition({lat, lng});
        }

        // 飛行済み経路をクリア
        if (this.traveledPath) {
            this.traveledPath.setPath([]);
        }

        // アニメーション中に追加した呼吸検知マーカーをクリア
        this.clearBreathDetectionMarkers();
        // dataset__6からの呼吸検知マーカーを再描画
        if (this.flightLogs.length > 0) {
            this.drawBreathDetectionMarkers();
        }
    }

    // アニメーション速度変更
    changeAnimationSpeed(speed: number): void {
        this.animationSpeed = speed;

        // アニメーション中の場合は再起動
        if (this.isAnimating) {
            this.stopAnimation();
            this.startAnimation();
        }
    }

    // 次のポイントへスムーズに移動
    animateToNextPoint(routeCoordinates: any[]): void {
        if (this.currentAnimationIndex >= routeCoordinates.length) {
            // 最後まで到達したら停止
            this.stopAnimation();
            return;
        }

        const startPosition = this.droneMarker.getPosition();
        const endPosition = routeCoordinates[this.currentAnimationIndex];

        // 補間用のステップ数（スムーズさを調整）
        const numSteps = 50;
        let step = 0;

        // このセグメントでのマーカー追加フラグをリセット
        this.hasAddedMarkerForCurrentSegment = false;

        // 補間アニメーション
        const moveStep = () => {
            if (!this.isAnimating) {
                return;
            }

            step++;
            const progress = step / numSteps;

            // 線形補間で中間位置を計算
            const lat = startPosition.lat() + (endPosition.lat - startPosition.lat()) * progress;
            const lng = startPosition.lng() + (endPosition.lng - startPosition.lng()) * progress;

            this.droneMarker.setPosition({lat, lng});

            // 飛行済み経路を更新（現在の位置を追加）
            if (this.traveledPath) {
                const currentPath = this.traveledPath.getPath();
                // パスの配列を取得
                const pathArray = [];
                currentPath.forEach((latLng: any) => {
                    pathArray.push(latLng);
                });
                // 新しい位置を追加（最後の位置と異なる場合のみ）
                const newPoint = new google.maps.LatLng(lat, lng);
                if (pathArray.length === 0 ||
                    (pathArray[pathArray.length - 1].lat() !== lat ||
                        pathArray[pathArray.length - 1].lng() !== lng)) {
                    pathArray.push(newPoint);
                    this.traveledPath.setPath(pathArray);
                }
            }

            // セグメントの途中でランダムに呼吸検知ピンを追加
            // 各ステップで2%の確率（50ステップで約63%の確率で1個配置される）
            if (!this.hasAddedMarkerForCurrentSegment && Math.random() < 0.02) {
                this.addRandomBreathDetectionMarker({lat, lng});
                this.hasAddedMarkerForCurrentSegment = true;  // このセグメントで追加済みフラグ（オプション）
            }

            if (step < numSteps) {
                // 次のステップ
                setTimeout(moveStep, this.animationSpeed / numSteps);
            } else {
                // このポイントの移動完了、次のポイントへ
                this.currentAnimationIndex++;

                // 到達したポイントを飛行済み経路に確実に追加
                if (this.traveledPath) {
                    const currentPath = this.traveledPath.getPath();
                    const pathArray = [];
                    currentPath.forEach((latLng: any) => {
                        pathArray.push(latLng);
                    });
                    pathArray.push(new google.maps.LatLng(endPosition.lat, endPosition.lng));
                    this.traveledPath.setPath(pathArray);
                }

                // マップを現在位置に追従
                this.map.panTo({lat: endPosition.lat, lng: endPosition.lng});

                // 次のポイントへの移動を開始
                setTimeout(() => {
                    if (this.isAnimating) {
                        this.animateToNextPoint(routeCoordinates);
                    }
                }, 100); // ポイント間の待機時間
            }
        };

        moveStep();
    }

    // 飛行ログを取得
    loadFlightLogs(): void {
        if (!this.selectedDroneId) {
            return;
        }

        // dataset__6（飛行ログ）のTableInfoを取得してからデータを取得
        this.sharedService.getTableInfo('dataset__6').subscribe((tableInfo: TableInfo) => {
            if (!tableInfo) {
                console.error('dataset__6のテーブル情報が取得できませんでした');
                return;
            }

            console.log('FlightLog TableInfo:', tableInfo);

            // フィルターを作成してドローンIDで絞り込み
            const filter = new CustomFilter();
            filter.conditions.addCondition('eq', 'field__23', this.selectedDroneId.toString());

            // getListを使用してデータを取得
            this.connect.getList(tableInfo, 1, 1000, filter).subscribe(
                (response: any) => {
                    console.log('飛行ログ取得レスポンス:', response);
                    if (response.data_a && response.data_a.length > 0) {
                        // data_aの各要素はDataクラスのインスタンスを作成する必要がある
                        this.flightLogs = [];
                        response.data_a.forEach((_data: any) => {
                            const newData = new Data(tableInfo);
                            newData.setInstanceData(_data);
                            this.flightLogs.push(newData);
                        });
                        console.log('飛行ログ一覧:', this.flightLogs);
                        this.drawBreathDetectionMarkers();
                    } else {
                        console.log('飛行ログデータがありません');
                        this.flightLogs = [];
                    }
                },
                (error) => {
                    console.error('飛行ログの取得に失敗しました', error);
                }
            );
        });
    }

    // 全ドローンの呼吸検知マーカーを描画
    drawAllDronesBreathDetectionMarkers(): void {
        if (!this.map) {
            return;
        }

        // 既存の呼吸検知マーカーをクリア
        this.clearBreathDetectionMarkers();

        console.log('全ドローンの呼吸検知マーカーを描画');

        // 各ドローンの飛行ログを処理
        this.flightLogsMap.forEach((logs, droneId) => {
            console.log(`ドローン${droneId}の飛行ログ数: ${logs.length}`);

            logs.forEach((log, index) => {
                const lat = parseFloat(log.raw_data.field__24);  // 緯度
                const lng = parseFloat(log.raw_data.field__25);  // 経度
                const detectionType = log.raw_data.field__26;    // 呼吸検知タイプ

                if (!isNaN(lat) && !isNaN(lng) && detectionType) {
                    let markerOptions: any = {
                        position: {lat, lng},
                        map: this.map
                    };

                    // 検知タイプによってマーカーのアイコンを変更
                    if (detectionType === '呼吸検知箇所' || detectionType === '水道管異常検知') {
                        markerOptions.icon = {
                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            scaledSize: new google.maps.Size(35, 35)
                        };
                        // グループタイプに応じてタイトルを設定
                        const detectionLabel = this.groupType === 'suido' ? '水道管異常検知' : '呼吸検知箇所';
                        markerOptions.title = `${detectionLabel} (ドローン${droneId})`;
                        markerOptions.zIndex = 500;
                    } else if (detectionType === '呼吸検知NG箇所' || detectionType === '水道管異常なし') {
                        markerOptions.icon = {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            scaledSize: new google.maps.Size(35, 35)
                        };
                        // グループタイプに応じてタイトルを設定
                        const detectionLabel = this.groupType === 'suido' ? '水道管異常なし' : '呼吸検知NG箇所';
                        markerOptions.title = `${detectionLabel} (ドローン${droneId})`;
                        markerOptions.zIndex = 500;
                    } else {
                        // その他の場合はスキップ
                        console.log(`不明な検知タイプ: ${detectionType} (ドローン${droneId})`);
                        return;
                    }

                    const marker = new google.maps.Marker(markerOptions);
                    this.breathDetectionMarkers.push(marker);

                    // クリック時に情報を表示
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div>
                                <strong>${markerOptions.title}</strong><br>
                                緯度: ${lat}<br>
                                経度: ${lng}<br>
                                <small>ドローンID: ${droneId}</small>
                            </div>
                        `
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(this.map, marker);
                    });
                }
            });
        });

        console.log(`呼吸検知マーカー総数: ${this.breathDetectionMarkers.length}`);
    }

    // 呼吸検知マーカーを描画
    drawBreathDetectionMarkers(): void {
        if (!this.map || this.flightLogs.length === 0) {
            return;
        }

        // 既存の呼吸検知マーカーをクリア
        this.clearBreathDetectionMarkers();

        console.log('飛行ログから呼吸検知マーカーを描画:', this.flightLogs);

        // 飛行ログから呼吸検知データを処理
        this.flightLogs.forEach((log, index) => {
            const lat = parseFloat(log.raw_data.field__24);  // 緯度
            const lng = parseFloat(log.raw_data.field__25);  // 経度
            const detectionType = log.raw_data.field__26;    // 呼吸検知タイプ

            console.log(`ログ${index}: 緯度=${lat}, 経度=${lng}, タイプ=${detectionType}`);

            if (!isNaN(lat) && !isNaN(lng) && detectionType) {
                let markerOptions: any = {
                    position: {lat, lng},
                    map: this.map
                };

                // 検知タイプによってマーカーのアイコンを変更
                if (detectionType === '呼吸検知箇所' || detectionType === '水道管異常検知') {
                    markerOptions.icon = {
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new google.maps.Size(35, 35)
                    };
                    // グループタイプに応じてタイトルを設定
                    markerOptions.title = this.groupType === 'suido' ? '水道管異常検知' : '呼吸検知箇所';
                    markerOptions.zIndex = 500;
                } else if (detectionType === '呼吸検知NG箇所' || detectionType === '水道管異常なし') {
                    markerOptions.icon = {
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new google.maps.Size(35, 35)
                    };
                    // グループタイプに応じてタイトルを設定
                    markerOptions.title = this.groupType === 'suido' ? '水道管異常なし' : '呼吸検知NG箇所';
                    markerOptions.zIndex = 500;
                } else {
                    // その他の場合はスキップ
                    console.log(`不明な検知タイプ: ${detectionType}`);
                    return;
                }

                const marker = new google.maps.Marker(markerOptions);
                this.breathDetectionMarkers.push(marker);

                // クリック時に情報を表示
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div>
                            <strong>${detectionType}</strong><br>
                            緯度: ${lat}<br>
                            経度: ${lng}
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(this.map, marker);
                });

                console.log(`マーカー追加: ${detectionType} at (${lat}, ${lng})`);
            }
        });

        console.log(`呼吸検知マーカー総数: ${this.breathDetectionMarkers.length}`);
    }

    // 呼吸検知マーカーをクリア
    clearBreathDetectionMarkers(): void {
        if (this.breathDetectionMarkers && this.breathDetectionMarkers.length > 0) {
            this.breathDetectionMarkers.forEach(marker => {
                marker.setMap(null);
            });
            this.breathDetectionMarkers = [];
        }
    }

    // ランダムに呼吸検知マーカーを追加
    addRandomBreathDetectionMarker(position: { lat: number, lng: number }): void {
        if (!this.map) {
            return;
        }

        // ランダムに呼吸検知かNGかを決定（70%で検知、30%でNG）
        const isDetection = Math.random() < 0.7;

        // 位置を少しランダムにずらす（より自然に見せるため）
        const offsetLat = (Math.random() - 0.5) * 0.0002; // 約±20m
        const offsetLng = (Math.random() - 0.5) * 0.0002;

        const markerOptions: any = {
            position: {
                lat: position.lat + offsetLat,
                lng: position.lng + offsetLng
            },
            map: this.map
        };

        if (isDetection) {
            markerOptions.icon = {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(35, 35)
            };
            markerOptions.title = '呼吸検知箇所（アニメーション中）';
            markerOptions.zIndex = 500;
        } else {
            markerOptions.icon = {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(35, 35)
            };
            markerOptions.title = '呼吸検知NG箇所（アニメーション中）';
            markerOptions.zIndex = 500;
        }

        const marker = new google.maps.Marker(markerOptions);
        this.breathDetectionMarkers.push(marker);

        // クリック時に情報を表示
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <strong>${markerOptions.title}</strong><br>
                    緯度: ${markerOptions.position.lat.toFixed(6)}<br>
                    経度: ${markerOptions.position.lng.toFixed(6)}<br>
                    <small>※アニメーション中に生成</small>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });

        console.log(`ランダムマーカー追加: ${markerOptions.title} at (${markerOptions.position.lat}, ${markerOptions.position.lng})`);
    }
}
