# Second Harvest 🌱

**Your next garden might start with today's meal.**

Second Harvest helps you explore what could grow from the food scraps you saved. Describe your meal and leftovers, review what the local AI understood, and compare growing options that fit your space.

Built for the **Hacktoberfest Open-Source AI Challenge — Week 1: Touch Grass**.

## What it does

1. Accepts a description of your meal and saved leftovers.
2. Uses Gemma to identify foods and their remaining parts.
3. Lets you edit descriptions, remove incorrect entries, and add missed foods.
4. Shows food benefit cards after you confirm.
5. Compares growing possibilities using your space, sunlight, supplies, and goal.

Food recognition is open-ended. A small reference catalogue provides additional facts for selected foods, but it does not limit which foods you can enter.

## Example input

> I made a salad. I saved fresh uncooked spring onion white bases with roots attached, and seeds from a ripe raw tomato. I also ate a banana, but only its peel remains, and I have a mango seed as well.

The food and its saved parts are treated separately. A food can appear in the benefits section even when its leftovers are unsuitable for growing.

## Technology

- **Backend:** Python, FastAPI, Pydantic, HTTPX
- **Frontend:** HTML, CSS, JavaScript
- **Local inference:** Ollama
- **Current model:** Gemma 2 2B (`gemma2:2b`)

## Run locally

### 1. Get the project

Download this repository using **Code → Download ZIP**, extract it, and open a terminal inside the project folder.

### 2. Prepare Python

Use Python 3.10 or newer.

On Ubuntu/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install fastapi "uvicorn[standard]" httpx "pydantic>=2,<3"
```

### 3. Prepare Ollama

Install Ollama from https://ollama.com.

Make sure its server is running. If it is not already running as a service, start it in a separate terminal:

```bash
ollama serve
```

Download the model:

```bash
ollama pull gemma2:2b
```

### 4. Start Second Harvest

From the project folder, with the Python environment activated:

```bash
OLLAMA_MODEL=gemma2:2b python -m uvicorn app:app --port 8001
```

Open:

```text
http://127.0.0.1:8001
```

Keep the app server and Ollama running while using the application.

## Configuration

| Variable | Purpose |
| --- | --- |
| `OLLAMA_MODEL` | Selects the Ollama model. Use `gemma2:2b` for the current setup. |
| `OLLAMA_URL` | Ollama server address. Defaults to `http://127.0.0.1:11434`. |

The startup command explicitly selects Gemma 2 2B. Download any alternative model before selecting it.

## Project structure

- `app.py` — API routes, model requests, and response validation.
- `garden.py` — data models, reference information, and growing checks.
- `static/index.html` — application page and styling.
- `static/interpret.js` — interpretation and editable food review.
- `static/garden.js` — benefits and growing comparison interface.

## How the AI is used

Gemma interprets food descriptions, generates general benefit summaries where reference facts are unavailable, and assesses growing options.

The application requests structured responses and validates their format. Users review the interpretation before it is used downstream. Additional rules exclude obvious unsuitable material, including cooked or spoiled leftovers and peel-only scraps.

These checks reduce specific errors; they do not guarantee that every model suggestion is correct.

## Local inference and performance

With Ollama running locally, meal descriptions are processed on your computer rather than sent to a hosted model API.

Initial installation and model downloads require internet access. Opening external reference links also requires connectivity.

CPU inference can take time, particularly on a laptop with limited memory. Response times vary with hardware, model size, and request length.

## Limitations

- The model can misunderstand descriptions or omit foods.
- Reference information currently covers a small selection of foods.
- Other foods may receive AI-generated information that needs verification.
- The app does not check live weather or local planting calendars.
- Growing recommendations do not guarantee germination or a harvest.
- Food benefit summaries are general information, not personalised dietary advice.

## Development

The prototype initially focused on four foods. It was expanded to accept open-ended food entries, with an editable review step so users can correct the model before continuing.

Development included ChatGPT/Codex assistance for implementation and debugging.

Gemma is an open-weight model governed by its own licence. Third-party tools and dependencies retain their respective licences.

## Challenge submission

**Theme:** Touch Grass  
**Partner category:** Best Use of Gemma

The project aims to help someone choose a practical gardening experiment from the leftovers they already have.

## Post-deadline changes

- **12 October 2026, after 11:59 AM Pakistan time:** Added or updated this README with project documentation and local setup instructions.

Any subsequent code changes will be recorded separately here.
