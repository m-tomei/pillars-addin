/**
 * 画像出力クラス
 */
import html2canvas from "../lib/html2canvas.esm.js";

export class ImageExporter {
    /**
     * 要素をPNG画像として保存
     * @param {HTMLElement} element - 保存対象の要素
     * @param {string} filename - ファイル名
     */
    static async exportToPNG(element, filename = "fortune.png") {
        try {
            if (!element) {
                throw new Error("出力対象の要素が見つかりません");
            }

            // html2canvasオプション
            const options = {
                scale: 2, // 高解像度
                backgroundColor: "#ffffff", // 背景白
                logging: false,
                useCORS: true // 外部画像対応
            };

            const canvas = await html2canvas(element, options);

            // データURL生成
            const dataUrl = canvas.toDataURL("image/png");

            // ダウンロードトリガー
            this._triggerDownload(dataUrl, filename);

            return true;
        } catch (error) {
            console.error("Image export error:", error);
            throw new Error("画像の保存に失敗しました: " + error.message);
        }
    }

    /**
     * ダウンロードを実行
     */
    static _triggerDownload(dataUrl, filename) {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * ファイル名を生成
     * @param {string} prefix - 接頭辞
     * @param {number|string} year - 年
     */
    static generateFilename(prefix, year) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        return `${prefix}_${year}_${timestamp}.png`;
    }
}
