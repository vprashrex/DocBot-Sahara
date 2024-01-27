from fastapi import FastAPI
from fastapi.responses import Response,JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import redis
import json


templates = Jinja2Templates(directory='templates')

app = FastAPI()

app.mount("/static",StaticFiles(directory="static"))

r = redis.StrictRedis(host="localhost",port=6379,db=0)

@app.get("/")
async def get(request:Request):
    return templates.TemplateResponse("4.html",context={"request":request})


class ChatHtml(BaseModel):
    session_id: str

@app.post("/session")
async def session(chat_request:ChatHtml):
    try:
        print("current session : {}".format(chat_request.session_id))
    except Exception as e:
        print(e)
        return JSONResponse(content={"error":str(e)})


class ChatRequest(BaseModel):
    session_id: str
    userText: str
    html: str
    title:str
    timestamp: str

datalist = []
@app.post("/chat")
async def chat(chat_request:ChatRequest):
    try:
        session_id = chat_request.session_id
        userText = chat_request.userText
        html = chat_request.html
        title = chat_request.title
        timestamp = chat_request.timestamp

        r.hmset(session_id, {"userText": userText, "title": title, "time": timestamp, "html": html})
        print("Current session_id is: ",session_id)
        
        session_found = False

        for item in datalist:
            if session_id in item:
                session_found = True
                break

        if not session_found:
            if not any(session_id in d for d in datalist):
                data = {session_id: title}
                datalist.append(data)
        
        print(datalist)
        sessions = json.dumps(datalist)
        r.lpush("sessions",sessions)

    except Exception as e:
        print(e)
        return JSONResponse(content={"error":str(e)})
    
@app.get("/htcode")
async def chat():
    try:
        # Retrieve the serialized data from the list
        retrieved_data = r.lindex("sessions", 0)  # Assuming it's stored at index 0
        deserialized_data = json.loads(retrieved_data)
        print(deserialized_data)
        return{"deserialised_data":deserialized_data}
    
    except Exception as e:
        print(e)
        return JSONResponse(content={"error":str(e)})