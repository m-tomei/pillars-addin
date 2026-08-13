/**
 * アプリケーションメインコントローラー
 */
import { DataLoader } from "../utils/dataLoader.js";
import { FortuneCalculator } from "../core/FortuneCalculator.js";
import { GreatFortuneCalculator } from "../core/GreatFortuneCalculator.js";
import { JuuniunCalculator } from "../core/JuuniunCalculator.js";
import { TsuuhenCalculator } from "../core/TsuuhenCalculator.js";
import { TimeCorrectionService } from "../core/TimeCorrectionService.js";
import { FormRenderer } from "../ui/FormRenderer.js";
import { ResultRenderer } from "../ui/ResultRenderer.js";
import { ImageExporter } from "../ui/ImageExporter.js";
import { InputManager } from "./InputManager.js";

export class AppController {
    constructor(options = {}) {
        this.formRenderer = options.formRenderer ?? null;
        this.resultRenderer = options.resultRenderer ?? null;
        this.inputManager = options.inputManager ?? null;
        this.dataLoader = options.dataLoader ?? null;
        this.fortuneCalculator = options.fortuneCalculator ?? null;
        this.greatFortuneCalculator = options.greatFortuneCalculator ?? null;
        this.juuniunCalculator = options.juuniunCalculator ?? null;
        this.tsuuhenCalculator = options.tsuuhenCalculator ?? null;
        this.timeCorrectionService = options.timeCorrectionService ?? null;

        this.initialized = false;
    }

    /**
     * 初期化
     */
    async initialize() {
        try {
            console.log("Initializing application...");

            this.formRenderer = this.formRenderer ?? new FormRenderer();
            this.resultRenderer = this.resultRenderer ?? new ResultRenderer();
            this.inputManager = this.inputManager ?? new InputManager(this.formRenderer);
            this.dataLoader = this.dataLoader ?? new DataLoader();

            const master = await this.dataLoader.loadPrefectureLongitude();
            this.timeCorrectionService = this.timeCorrectionService ?? new TimeCorrectionService(master);
            this.formRenderer.populatePrefectures(master);
            this.inputManager.setLongitudeMaster(master);

            this.fortuneCalculator = this.fortuneCalculator ?? new FortuneCalculator(this.dataLoader);
            await this.fortuneCalculator.initialize();

            this.greatFortuneCalculator = this.greatFortuneCalculator ?? new GreatFortuneCalculator(
                this.fortuneCalculator
            );
            await this.greatFortuneCalculator.initialize();

            this.juuniunCalculator = this.juuniunCalculator ?? new JuuniunCalculator(this.dataLoader);
            await this.juuniunCalculator.initialize();

            this.tsuuhenCalculator = this.tsuuhenCalculator ?? new TsuuhenCalculator();

            this.setupEventListeners();

            this.initialized = true;
            console.log("Application initialized successfully");

        } catch (error) {
            console.error("Initialization error:", error);
            this.initialized = false;
            if (this.formRenderer && typeof this.formRenderer.showError === "function") {
                this.formRenderer.showError(
                    "アプリケーションの初期化に失敗しました: " + error.message
                );
            } else {
                throw error;
            }
        }
    }

    /**
     * イベントリスナーのセットアップ
     */
    setupEventListeners() {
        this.formRenderer.onSubmit(this.handleCalculate.bind(this));
        this.formRenderer.onClear(this.handleClear.bind(this));
        this.formRenderer.onPaste(this.handlePaste.bind(this));
        this.resultRenderer.onSavePNG(this.handleSavePNG.bind(this));
    }

    /**
     * 入力から命式・大運を計算する（UI非依存）
     */
    runCalculation(input) {
        let correction;
        let fortune;
        let cycles;
        let displayYear;
        const shiMode = input.shiMode;

        if (input.hour == null) {
            correction = { applied: false, reason: "no_time" };
            fortune = this.fortuneCalculator.calculateFortune(
                input.year,
                input.month,
                input.day,
                null,
                null,
                { shiMode }
            );
            cycles = this.greatFortuneCalculator.calculateCycles(
                input.year,
                input.month,
                input.day,
                12,
                0,
                input.gender
            );
            displayYear = input.year;
        } else {
            correction = this.timeCorrectionService.correct({
                year: input.year,
                month: input.month,
                day: input.day,
                hour: input.hour,
                minute: input.minute,
                prefectureCode: input.prefectureCode,
                offsetMinutes: input.offsetMinutes,
            });
            const { year: y, month: m, day: d, hour: h, minute: mi } = correction.corrected;
            fortune = this.fortuneCalculator.calculateFortune(
                y, m, d, h, mi, { shiMode }
            );
            cycles = this.greatFortuneCalculator.calculateCycles(
                y, m, d, h, mi, input.gender
            );
            displayYear = y;
        }

        const juuniunResults = this.juuniunCalculator.calculateForPillars(
            fortune.dayPillar.stem,
            fortune.yearPillar.branch,
            fortune.monthPillar.branch,
            fortune.dayPillar.branch,
            fortune.hourPillar ? fortune.hourPillar.branch : null
        );

        const tsuuhenResults = this.tsuuhenCalculator.calculateForPillars(
            fortune.dayPillar.stem,
            fortune.yearPillar.stem,
            fortune.monthPillar.stem,
            fortune.hourPillar ? fortune.hourPillar.stem : null
        );

        return {
            fortune,
            juuniunResults,
            tsuuhenResults,
            cycles,
            displayYear,
            correction,
            shiMode,
        };
    }

    /**
     * 計算ハンドラ
     */
    async handleCalculate() {
        console.time("calculation");
        try {
            this.formRenderer.hideError();

            const inputData = this.inputManager.getFormInput();
            const result = this.runCalculation(inputData);

            this.resultRenderer.showResults(
                result.fortune,
                result.juuniunResults,
                result.tsuuhenResults,
                result.cycles,
                result.displayYear,
                { correction: result.correction, shiMode: result.shiMode }
            );

        } catch (error) {
            console.error("Calculation error:", error);
            this.formRenderer.showError(error.message);
        } finally {
            console.timeEnd("calculation");
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
        const saveBtn = this.resultRenderer?.elements?.savePngBtn;

        try {
            this.formRenderer.hideError();

            const inputData = this.formRenderer.getValues();
            const year = inputData.year || "unknown";

            const targetElement = this.resultRenderer?.elements?.resultSection;

            if (!targetElement || targetElement.style.display === "none") {
                throw new Error("計算結果がありません。まず計算を実行してください。");
            }

            const filename = ImageExporter.generateFilename("fortune", year);

            if (saveBtn) {
                saveBtn.style.display = "none";
            }

            await ImageExporter.exportToPNG(targetElement, filename);

        } catch (error) {
            console.error("Save PNG error:", error);
            this.formRenderer.showError("PNG保存に失敗しました: " + error.message);
        } finally {
            if (saveBtn) {
                saveBtn.style.display = "";
            }
        }
    }
}
