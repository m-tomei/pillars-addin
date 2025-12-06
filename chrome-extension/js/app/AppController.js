/**
 * アプリケーションメインコントローラー
 */
import { DataLoader } from "../utils/dataLoader.js";
import { FortuneCalculator } from "../core/FortuneCalculator.js";
import { GreatFortuneCalculator } from "../core/GreatFortuneCalculator.js";
import { JuuniunCalculator } from "../core/JuuniunCalculator.js";
import { TsuuhenCalculator } from "../core/TsuuhenCalculator.js";
import { FormRenderer } from "../ui/FormRenderer.js";
import { ResultRenderer } from "../ui/ResultRenderer.js";
import { ImageExporter } from "../ui/ImageExporter.js";
import { InputManager } from "./InputManager.js";

export class AppController {
    constructor() {
        this.dataLoader = null;
        this.fortuneCalculator = null;
        this.greatFortuneCalculator = null;
        this.juuniunCalculator = null;
        this.tsuuhenCalculator = null;

        this.formRenderer = null;
        this.resultRenderer = null;
        this.inputManager = null;

        this.initialized = false;
    }

    /**
     * 初期化
     */
    async initialize() {
        try {
            console.log("Initializing application...");

            // UIコンポーネントの初期化
            this.formRenderer = new FormRenderer();
            this.resultRenderer = new ResultRenderer();
            this.inputManager = new InputManager(this.formRenderer);

            // DataLoader初期化
            this.dataLoader = new DataLoader();

            // 計算エンジンの初期化
            this.fortuneCalculator = new FortuneCalculator(this.dataLoader);
            await this.fortuneCalculator.initialize();

            this.greatFortuneCalculator = new GreatFortuneCalculator(
                this.fortuneCalculator
            );
            await this.greatFortuneCalculator.initialize();

            this.juuniunCalculator = new JuuniunCalculator(this.dataLoader);
            await this.juuniunCalculator.initialize();

            this.tsuuhenCalculator = new TsuuhenCalculator();

            // イベントリスナーのセットアップ
            this.setupEventListeners();

            this.initialized = true;
            console.log("Application initialized successfully");

        } catch (error) {
            console.error("Initialization error:", error);
            this.formRenderer.showError(
                "アプリケーションの初期化に失敗しました: " + error.message
            );
        }
    }

    /**
     * イベントリスナーのセットアップ
     */
    setupEventListeners() {
        // 計算実行
        this.formRenderer.onSubmit(this.handleCalculate.bind(this));

        // クリア
        this.formRenderer.onClear(this.handleClear.bind(this));

        // クリップボード貼り付け
        this.formRenderer.onPaste(this.handlePaste.bind(this));

        // PNG保存
        this.resultRenderer.onSavePNG(this.handleSavePNG.bind(this));
    }

    /**
     * 計算ハンドラ
     */
    async handleCalculate() {
        console.time('calculation');
        try {
            this.formRenderer.hideError();

            // 入力取得と検証
            const inputData = this.inputManager.getFormInput();

            console.log("Input data:", inputData);

            // 1. 命式計算
            const fortune = await this.fortuneCalculator.calculateFortune(
                inputData.year,
                inputData.month,
                inputData.day,
                inputData.hour,
                inputData.minute
            );
            console.log("Fortune calculated:", fortune);

            // 2. 十二運計算
            const juuniunResults = this.juuniunCalculator.calculateForPillars(
                fortune.dayPillar.stem,
                fortune.yearPillar.branch,
                fortune.monthPillar.branch,
                fortune.dayPillar.branch,
                fortune.hourPillar ? fortune.hourPillar.branch : null
            );
            console.log("Juuniun calculated:", juuniunResults);

            // 3. 通変星計算
            const tsuuhenResults = this.tsuuhenCalculator.calculateForPillars(
                fortune.dayPillar.stem,
                fortune.yearPillar.stem,
                fortune.monthPillar.stem,
                fortune.hourPillar ? fortune.hourPillar.stem : null
            );
            console.log("Tsuuhen calculated:", tsuuhenResults);

            // 4. 大運計算
            const greatFortuneCycles = this.greatFortuneCalculator.calculateCycles(
                inputData.year,
                inputData.month,
                inputData.day,
                inputData.hour,
                inputData.minute,
                inputData.gender
            );
            console.log("Great fortune cycles calculated:", greatFortuneCycles);

            // 結果表示
            this.resultRenderer.showResults(
                fortune,
                juuniunResults,
                tsuuhenResults,
                greatFortuneCycles,
                inputData.year
            );

        } catch (error) {
            console.error("Calculation error:", error);
            this.formRenderer.showError(error.message);
        } finally {
            console.timeEnd('calculation');
        }
    }

    /**
     * クリアハンドラ
     */
    handleClear() {
        this.formRenderer.reset();
        this.resultRenderer.clear();
    }

    /**
     * ペーストハンドラ
     */
    async handlePaste() {
        try {
            this.formRenderer.hideError();
            await this.inputManager.pasteFromClipboard();
        } catch (error) {
            this.formRenderer.showError(
                "クリップボードからの読み取りに失敗しました: " + error.message
            );
        }
    }

    /**
     * PNG保存ハンドラ
     */
    async handleSavePNG() {
        // ボタンへの参照を保持
        const saveBtn = this.resultRenderer?.elements?.savePngBtn;

        try {
            this.formRenderer.hideError();

            // フォームの値からファイル名用の年を取得
            const inputData = this.formRenderer.getValues();
            const year = inputData.year || "unknown";

            const targetElement = this.resultRenderer?.elements?.resultSection;

            // 要素が表示されていない場合はエラー
            if (!targetElement || targetElement.style.display === "none") {
                throw new Error("保存する結果が表示されていません");
            }

            const filename = ImageExporter.generateFilename("fortune", year);

            // ボタンを一時的に隠す
            if (saveBtn) {
                saveBtn.style.display = "none";
            }

            await ImageExporter.exportToPNG(targetElement, filename);

        } catch (error) {
            console.error("Save PNG error:", error);
            this.formRenderer.showError("PNG保存に失敗しました: " + error.message);
        } finally {
            // ボタンを確実に戻す
            if (saveBtn) {
                saveBtn.style.display = "";
            }
        }
    }
}
