## DOCTOR BOT

<h2>SLM BASED CHAT BOT</h2>
<p>Finetuned using LLAMA 2 7B CHAT BASED MODEL by using PEFT LORA METHOD WITH 8 bit fine tuning</p>

## TO FINE TUNE THE MODEL USE THE NOTEBOOK [DocBotFineTuing-PEFT.ipynb]

# TO RUN DEMO USING PEFT ADAPATER USE THE NOTEBOOK [MAIN_DOCBOT_DEMO.ipynb]

## TO RUN LOCALLY OFFLINE
# USE THE BELOW STEP

1. FIRST INSTALL ALL THE REQUIREMENTS

```
pip install -r requirement.txt
```

2. DOWNLOAD THE MODEL USING

```
python download_model.py
```

3. RUN THE SERVER.PY

```
uvicorn server:app --reload
```
