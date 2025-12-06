# 四柱推命 Chrome拡張機能

## アイコンについて

アイコンファイル（icon16.png, icon48.png, icon128.png）は以下の方法で生成してください：

1. `icons/icon.svg` をブラウザで開く
2. オンラインSVG to PNGコンバーターを使用（例：https://svgtopng.com/）
3. 16x16, 48x48, 128x128 のサイズで変換
4. それぞれ icon16.png, icon48.png, icon128.png として保存

または、ImageMagickを使用：
```bash
convert -background none -resize 16x16 icons/icon.svg icons/icon16.png
convert -background none -resize 48x48 icons/icon.svg icons/icon48.png
convert -background none -resize 128x128 icons/icon.svg icons/icon128.png
```

## 開発環境のセットアップ

1. Chrome拡張機能ページを開く：chrome://extensions/
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」
4. このディレクトリを選択
