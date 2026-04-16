# 2D Shooter Project

縦スクロール型2Dシューティングゲーム。GitHub Pages でブラウザからプレイ可能。

## 技術スタック

- 純粋な HTML5 Canvas + ES Modules（外部ライブラリなし）
- ビルドツール不要、`index.html` を直接開くか GitHub Pages で公開するだけ

## ファイル構成

```
index.html          # エントリーポイント（Canvas 480×640）
style.css           # 画面レイアウト（黒背景、中央寄せ）
src/
  main.js           # ゲームループ・状態管理・衝突判定
  player.js         # プレイヤー（移動・射撃・被弾）
  enemy.js          # 敵クラス（SmallEnemy / MediumEnemy / Boss）
  bullet.js         # 弾クラス（プレイヤー弾・敵弾）
  particle.js       # 爆発パーティクル
  stage.js          # ステージ管理・背景スクロール・ウェーブ定義・PowerUp
  ui.js             # HUD・タイトル・ゲームオーバー・クリア画面
```

## ゲーム仕様

### プレイヤー操作
- **マウス**: カーソル追従移動、クリックで射撃
- **キーボード**: 矢印キー / WASD で移動、自動射撃（Space でゲーム開始）
- ライフ 3 機、被弾後 120 フレームの無敵時間

### パワーアップ
- `P` アイテムを取得するごとに弾が強化（最大レベル 3）
- Lv1: 単発 / Lv2: 3 方向 / Lv3: 5 方向

### 敵
| クラス | HP | スコア | 挙動 |
|---|---|---|---|
| SmallEnemy | 2 | 100 | 直線 + 小ジグザグ、単発弾 |
| MediumEnemy | 10 | 400 | サイン波移動、3-way 弾 |
| Boss | 150 | 5000 | 円形バースト弾（HP 半分以下で強化） |

### ゲーム状態
`TITLE → PLAYING → GAMEOVER / CLEAR`

### ステージ構成（ウェーブ）
`src/stage.js` の `buildWaves()` で定義。フレーム数基準でウェーブをスポーン。
ボス撃破後にステージクリア。

## GitHub Pages 公開手順

1. リポジトリの **Settings > Pages** を開く
2. Branch: `claude/2d-shooting-game-DPKlX`（または main）、フォルダ: `/ (root)` を選択
3. 保存後、`https://<owner>.github.io/<repo>/` でプレイ可能

## 開発ブランチ

`claude/2d-shooting-game-DPKlX`

## 衝突判定

AABB（軸平行境界ボックス）方式。各オブジェクトに `getBounds()` メソッドを実装。
プレイヤーのヒットボックスは見た目より小さめ（35%×40%）に設定。
