/**
 * アプリケーションメインコントローラー
 */
import { DataLoader } from "../utils/dataLoader.js";
import { FortuneCalculator } from "../core/FortuneCalculator.js";
import { GreatFortuneCalculator } from "../core/GreatFortuneCalculator.js";
import { JuuniunCalculator } from "../core/JuuniunCalculator.js";
import { TsuuhenCalculator } from "../core/TsuuhenCalculator.js";
import { DayMasterStrengthAssessor } from "../core/DayMasterStrengthAssessor.js";
import { KakkyokuCalculator } from "../core/KakkyokuCalculator.js";
import { ByoyakuCalculator } from "../core/ByoyakuCalculator.js";
import { DaiunHyoukaCalculator } from "../core/DaiunHyoukaCalculator.js";
import { GouChuuCalculator } from "../core/GouChuuCalculator.js";
import { KishouAssessor } from "../core/KishouAssessor.js";
import { KeizenAnalyzer } from "../core/KeizenAnalyzer.js";
import { FormRenderer } from "../ui/FormRenderer.js";
import { ResultRenderer } from "../ui/ResultRenderer.js";
import { ImageExporter } from "../ui/ImageExporter.js";
import { InputManager } from "./InputManager.js";
import { getByoyakuPipelinePlan, runOptionalDiagnostics } from "./byoyakuPipeline.js";

export class AppController {
    constructor() {
        this.dataLoader = null;
        this.fortuneCalculator = null;
        this.greatFortuneCalculator = null;
        this.juuniunCalculator = null;
        this.tsuuhenCalculator = null;
        this.strengthAssessor = null;
        this.kakkyokuCalculator = null;
        this.byoyakuCalculator = null;
        this.daiunHyoukaCalculator = null;
        this.gouChuuCalculator = null;
        this.kishouAssessor = null;
        this.keizenAnalyzer = null;
        this.stemBranchData = null;
        this.kakkyokuRules = null;

        this.formRenderer = null;
        this.resultRenderer = null;
        this.inputManager = null;

        /** @type {boolean} feature.byoyakuEnabled（セッション内。DOMと同期） */
        this.byoyakuEnabled = false;
        this.hasCalculatedResults = false;
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
            this.byoyakuEnabled = this.formRenderer.isByoyakuEnabled();

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

            // 格局・病薬関連の初期化（OFF時は実行しないがインスタンスは用意）
            this.stemBranchData = await this.dataLoader.loadStemBranchMaster();
            this.kakkyokuRules = await this.dataLoader.loadKakkyokuRules();
            this.strengthAssessor = new DayMasterStrengthAssessor(this.stemBranchData);
            this.kakkyokuCalculator = new KakkyokuCalculator(this.stemBranchData);
            this.byoyakuCalculator = new ByoyakuCalculator(this.kakkyokuRules);
            this.gouChuuCalculator = new GouChuuCalculator();
            this.kishouAssessor = new KishouAssessor();
            this.keizenAnalyzer = new KeizenAnalyzer(this.kakkyokuRules);
            this.daiunHyoukaCalculator = new DaiunHyoukaCalculator(this.tsuuhenCalculator, this.gouChuuCalculator);

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

        // 病薬オプション変更（有効入力なら自動再計算）
        this.formRenderer.onByoyakuOptionChange(this.handleByoyakuOptionChange.bind(this));

        // PNG保存
        this.resultRenderer.onSavePNG(this.handleSavePNG.bind(this));
    }

    /**
     * 病薬オプション変更ハンドラ（D-04）
     */
    handleByoyakuOptionChange(enabled) {
        this.byoyakuEnabled = Boolean(enabled);
        if (!this.initialized) return;

        try {
            this.inputManager.getFormInput();
        } catch {
            // 無効入力中はフラグのみ更新
            return;
        }

        this.handleCalculate();
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
            this.byoyakuEnabled = Boolean(inputData.byoyakuEnabled);
            const plan = getByoyakuPipelinePlan(this.byoyakuEnabled);

            console.log("Input data:", inputData);
            console.log("Byoyaku pipeline plan:", plan);

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

            // 4. 大運計算（基本）
            const greatFortuneCycles = this.greatFortuneCalculator.calculateCycles(
                inputData.year,
                inputData.month,
                inputData.day,
                inputData.hour,
                inputData.minute,
                inputData.gender
            );
            console.log("Great fortune cycles calculated:", greatFortuneCycles);

            // 5〜8. 病薬オプションON時のみ（OFF時は各計算機を呼ばない）
            const optional = runOptionalDiagnostics({
                kishouAssessor: this.kishouAssessor,
                gouChuuCalculator: this.gouChuuCalculator,
                strengthAssessor: this.strengthAssessor,
                kakkyokuCalculator: this.kakkyokuCalculator,
                keizenAnalyzer: this.keizenAnalyzer,
                byoyakuCalculator: this.byoyakuCalculator,
                daiunHyoukaCalculator: this.daiunHyoukaCalculator
            }, {
                byoyakuEnabled: this.byoyakuEnabled,
                fortune,
                juuniunResults,
                tsuuhenResults,
                greatFortuneCycles
            });

            if (this.byoyakuEnabled) {
                console.log("Kishou assessed:", optional.kishouResult);
                console.log("GouChuu analyzed:", optional.gouChuuResult);
                console.log("Strength assessed:", optional.strengthResult);
                console.log("Kakkyoku calculated:", optional.kakkyokuResult);
                console.log("Keizen analyzed:", optional.keizenResult);
                console.log("Byoyaku diagnosed:", optional.byoyakuResult);
                console.log("Daiun evaluated:", optional.daiunEvaluations);
            }

            // 結果表示
            this.resultRenderer.showResults(
                fortune,
                juuniunResults,
                tsuuhenResults,
                greatFortuneCycles,
                inputData.year,
                optional.kakkyokuResult,
                optional.byoyakuResult,
                optional.strengthResult,
                optional.daiunEvaluations,
                plan.showGouChuuSection ? optional.gouChuuResult : null
            );

            this.hasCalculatedResults = true;

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
        this.byoyakuEnabled = this.formRenderer.isByoyakuEnabled();
        this.hasCalculatedResults = false;
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
                throw new Error("計算結果がありません。まず計算を実行してください。");
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
