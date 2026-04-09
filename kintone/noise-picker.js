/**
 * noise-picker.js
 *
 * kintone 一覧画面カスタマイズ
 * 指パッチンを3回検出すると、現在の絞り込み条件のレコードから
 * 1件をランダムに選んで詳細画面へ遷移する。
 *
 * アップロード順（kintone JSカスタマイズ設定）:
 *   1. sound-detector.js
 *   2. noise-picker.js  ← このファイル
 */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────
  //  サウンドプロファイル（ハードコード）
  // ──────────────────────────────────────────────────────────────
  var PROFILE = {
    name: 'my-sound',
    version: '1.0',
    createdAt: '2026-04-04T07:01:35.538Z',
    samplesCount: 6,
    fftSize: 2048,
    numBands: 32,
    threshold: 0.75,
    feature: [
      0.013211, 0.069531, 0.273487, 0.405665, 0.332011, 0.222143, 0.1624, 0.314863, 0.446316, 0.433554, 0.288175,
      0.018075, 0.00114, 0.000525, 0.000322, 0.000256, 0.000172, 0.000108, 0.000109, 0.000095, 0.000063, 0.000059,
      0.000053, 0.000041, 0.000039, 0.000041, 0.000038, 0.000043, 0.000034, 0.000019, 0.000009, 0.000003,
    ],
    bands: [
      { freqHz: [0, 689] },
      { freqHz: [689, 1378] },
      { freqHz: [1378, 2067] },
      { freqHz: [2067, 2756] },
      { freqHz: [2756, 3445] },
      { freqHz: [3445, 4134] },
      { freqHz: [4134, 4823] },
      { freqHz: [4823, 5513] },
      { freqHz: [5513, 6202] },
      { freqHz: [6202, 6891] },
      { freqHz: [6891, 7580] },
      { freqHz: [7580, 8269] },
      { freqHz: [8269, 8958] },
      { freqHz: [8958, 9647] },
      { freqHz: [9647, 10336] },
      { freqHz: [10336, 11025] },
      { freqHz: [11025, 11714] },
      { freqHz: [11714, 12403] },
      { freqHz: [12403, 13092] },
      { freqHz: [13092, 13781] },
      { freqHz: [13781, 14470] },
      { freqHz: [14470, 15159] },
      { freqHz: [15159, 15848] },
      { freqHz: [15848, 16538] },
      { freqHz: [16538, 17227] },
      { freqHz: [17227, 17916] },
      { freqHz: [17916, 18605] },
      { freqHz: [18605, 19294] },
      { freqHz: [19294, 19983] },
      { freqHz: [19983, 20672] },
      { freqHz: [20672, 21361] },
      { freqHz: [21361, 22050] },
    ],
  };

  // ──────────────────────────────────────────────────────────────
  //  設定
  // ──────────────────────────────────────────────────────────────
  var REQUIRED_DETECTIONS = 3;

  // ──────────────────────────────────────────────────────────────
  //  モジュールスコープの状態
  // ──────────────────────────────────────────────────────────────
  var _detector = null;
  var _widget = null;

  // ──────────────────────────────────────────────────────────────
  //  kintone イベント
  // ──────────────────────────────────────────────────────────────
  kintone.events.on('app.record.index.show', function (event) {
    cleanup();
    _widget = createWidget();
    document.body.appendChild(_widget);
    initDetector();
    return event;
  });

  // ──────────────────────────────────────────────────────────────
  //  検出器の初期化
  // ──────────────────────────────────────────────────────────────
  function initDetector() {
    _detector = new SoundDetector({
      cooldownMs: 400,
      maxDetectDurationMs: 120,
    });

    _detector
      .loadProfile(PROFILE)
      .then(function () {
        return _detector.start();
      })
      .then(function () {
        var count = 0;

        _detector.onDetect = function (score) {
          count++;
          setWidgetCount(count, score);

          if (count >= REQUIRED_DETECTIONS) {
            _detector.stop();
            _detector = null;
            setWidgetNavigating();
            navigateToRandom();
          }
        };
      })
      .catch(function (err) {
        setWidgetError('マイク取得失敗');
        console.error('[noise-picker]', err);
      });
  }

  // ──────────────────────────────────────────────────────────────
  //  ランダムレコードへ遷移
  // ──────────────────────────────────────────────────────────────
  function navigateToRandom() {
    var appId = kintone.app.getId();
    var condition = kintone.app.getQueryCondition() || '';
    var apiUrl = kintone.api.url('/k/v1/records', true);

    // まず件数を取得
    kintone.api(
      apiUrl,
      'GET',
      {
        app: appId,
        query: condition ? condition + ' limit 1' : 'limit 1',
        totalCount: true,
        fields: ['$id'],
      },
      function (resp) {
        var total = parseInt(resp.totalCount, 10);

        if (total === 0) {
          setWidgetError('対象レコードなし');
          return;
        }

        var offset = Math.floor(Math.random() * total);

        // ランダムな1件を取得
        kintone.api(
          apiUrl,
          'GET',
          {
            app: appId,
            query: (condition ? condition + ' ' : '') + 'limit 1 offset ' + offset,
            fields: ['$id'],
          },
          function (resp2) {
            var recordId = resp2.records[0]['$id'].value;
            window.location.href = '/k/' + appId + '/show#record=' + recordId;
          },
          function (err) {
            setWidgetError('取得エラー');
            console.error('[noise-picker]', err);
          },
        );
      },
      function (err) {
        setWidgetError('取得エラー');
        console.error('[noise-picker]', err);
      },
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  クリーンアップ
  // ──────────────────────────────────────────────────────────────
  function cleanup() {
    if (_detector) {
      _detector.stop();
      _detector = null;
    }
    if (_widget) {
      _widget.remove();
      _widget = null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  ウィジェット
  // ──────────────────────────────────────────────────────────────
  function createWidget() {
    var el = document.createElement('div');
    el.id = 'noise-picker-widget';
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'background:#1a1814',
      'color:#e0e0e0',
      'font-family:monospace',
      'font-size:12px',
      'padding:14px 20px',
      'border-radius:6px',
      'box-shadow:0 4px 24px rgba(0,0,0,0.5)',
      'z-index:9999',
      'min-width:160px',
      'text-align:center',
      'user-select:none',
    ].join(';');

    var dots = '';
    for (var i = 0; i < REQUIRED_DETECTIONS; i++) {
      dots += '<span class="np-dot" style="font-size:22px;color:#333;transition:color 0.15s;">●</span>';
    }

    el.innerHTML =
      '<div style="color:#c8ff00;font-size:9px;letter-spacing:0.2em;margin-bottom:10px;">ガチャトン</div>' +
      '<div id="np-dots" style="display:flex;gap:10px;justify-content:center;margin-bottom:10px;">' +
      dots +
      '</div>' +
      '<div id="np-status" style="color:#666;font-size:11px;">ハンドルを回せ！</div>';

    return el;
  }

  function setWidgetCount(count, score) {
    if (!_widget) return;
    var dots = _widget.querySelectorAll('.np-dot');
    dots.forEach(function (d, i) {
      d.style.color = i < count ? '#c8ff00' : '#333';
    });
    var status = document.getElementById('np-status');
    if (status) {
      status.style.color = '#aaa';
      status.textContent = count + ' / ' + REQUIRED_DETECTIONS + '  (score ' + score.toFixed(2) + ')';
    }
  }

  function setWidgetNavigating() {
    if (!_widget) return;
    var dots = _widget.querySelectorAll('.np-dot');
    dots.forEach(function (d) {
      d.style.color = '#c8ff00';
    });
    var status = document.getElementById('np-status');
    if (status) {
      status.style.color = '#c8ff00';
      status.textContent = 'ランダム選択中...';
    }
  }

  function setWidgetError(msg) {
    if (!_widget) return;
    var status = document.getElementById('np-status');
    if (status) {
      status.style.color = '#ff5555';
      status.textContent = msg;
    }
  }
})();

