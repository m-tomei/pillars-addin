/**
 * サイドパネル エントリポイント
 */
import { AppController } from "./js/app/AppController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new AppController();
  await app.initialize();
});
