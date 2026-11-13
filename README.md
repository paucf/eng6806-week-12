# eng6806-week-12

**Chat with Soph**: a sassy shih tzu played by a small language model that runs entirely in the browser.

- Two "brains", both run with [Transformers.js](https://github.com/huggingface/transformers.js) 4.3.2:
  - **Standard:** [`onnx-community/Llama-3.2-1B-Instruct`](https://huggingface.co/onnx-community/Llama-3.2-1B-Instruct). About 1.07 GB on WebGPU (q4f16). This is the default on GPUs with f16 support and is noticeably more coherent.
  - **Lite:** [`onnx-community/Qwen2.5-0.5B-Instruct`](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct). About 483 MB on WebGPU and 512 MB on WASM. This is the default on CPU-only devices and on older GPUs.
- Visitors can switch between the two before downloading. Each model is downloaded once and cached by the browser.
- Nothing is sent to a server. After the first visit, the page, the library and the model all load from the visitor's device, so it works offline too.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app: UI, model loading and chat. |
| `sw.js` | Service worker that caches the page, the library and the fonts for offline use. The model itself is cached by Transformers.js. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are, without a Jekyll build. |

## Deploy on GitHub Pages

1. Merge into `main`.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then pick **Branch** `main` and folder `/ (root)`, and click **Save**.
4. After a minute the site is live at `https://<owner>.github.io/eng6806-week-12/`.

All paths are relative, so the site works under the `/eng6806-week-12/` sub-path without any changes.

When you change `index.html` or upgrade the library, bump `VERSION` in `sw.js` so returning visitors get the new files.

## Reply quality settings

- **No `repetition_penalty`.** Transformers.js applies it to every token in the context, including the system prompt, and that makes small models ramble into word salad.
- **Per-model sampling:** Llama uses temperature 0.7, top-p 0.9 and top-k 40. Qwen uses temperature 0.6, top-p 0.8 and top-k 20.
- **Short prompt with examples:** a short persona description plus three example exchanges that show the voice and show Soph actually answering.
- **Bounded context:** only the last 3 exchanges are sent, user messages are capped at 500 characters, and replies at 120 tokens.
- **Reply clean-up:** generation stops if the model starts writing the user's next line, and a reply cut off mid-sentence is trimmed back to the last complete sentence.

## Notes and limits

- **Browser support:** WebGPU is used in Chrome/Edge 113+ and recent Safari and Firefox. Other browsers fall back to WASM, which works everywhere but is slower.
- **No multithreaded WASM:** GitHub Pages can't send the COOP/COEP headers that `SharedArrayBuffer` needs, so the WASM fallback runs single-threaded. This doesn't affect WebGPU.
- **Phones:** the model needs roughly 1 GB of free memory while it runs, so low-end phones may struggle.

## Run locally

Service workers and WebGPU need a secure context, and `localhost` counts as one:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
