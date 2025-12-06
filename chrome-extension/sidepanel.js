/**
 * サイドパネル エントリポイント
 */
import { AppController } from "./js/app/AppController.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("DOMContentLoaded - Starting app initialization");
    const app = new AppController();
    await app.initialize();
    console.log("App initialization complete");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    alert("アプリケーションの初期化に失敗しました: " + error.message);
  }
});
