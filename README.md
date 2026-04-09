# noise-picker

マイク入力からリアルタイムで特定の音を検出するJavaScriptライブラリと、そのサンプル・kintoneカスタマイズです。

Web Audio API による FFT 解析と、コサイン類似度によるプロファイルマッチングで動作します。

## 構成

```
lib/          ライブラリ本体（SoundDetector）
examples/     サンプルプログラム・プロファイル作成ツール
kintone/      kintoneカスタマイズ（ガチャトン）
```

## ライブラリ（lib/）

### SoundDetector

リアルタイム音声検出クラス。マイク入力の周波数スペクトルを32バンドに分割し、事前に記録したプロファイルとコサイン類似度で比較します。

```javascript
const detector = new SoundDetector({ threshold: 0.75 });
await detector.loadProfile('profile.json');
detector.onDetect = (score) => console.log('検出!', score);
detector.start();
```

**主なオプション:**
- `threshold` — 検出閾値（0.5〜0.99）
- `cooldownMs` — 連続検出防止の待ち時間（デフォルト: 300ms）
- `maxDetectDurationMs` — 持続音を除外する最大検出時間（デフォルト: 120ms）
- `minVolume` — 無音を無視する閾値（デフォルト: 0.001）

## サンプル（examples/）

### sound-sampler.html
音のプロファイルを作成するツール。3〜5回のサンプル録音から検出用プロファイルJSONを生成します。

### example.html
SoundDetector のデモ。プロファイルを読み込み、リアルタイムでスコアを可視化。パラメータの調整もできます。

### profiles/
サンプルプロファイル（指パッチン、マイクタップなど）。

## kintoneカスタマイズ（kintone/）

「ガチャトン」— 指パッチンを3回検出すると、現在のビューからランダムにレコードを選択して表示する kintone カスタマイズです。

詳細は [kintone/README.md](kintone/README.md) を参照してください。

## 技術詳細

- FFTサイズ: 2048
- バンド数: 32（0〜22050Hz を均等分割）
- 特徴量: 各バンドのエネルギー（L2正規化）
- マッチング: コサイン類似度

## ライセンス

MIT
