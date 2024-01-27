from fastapi import APIRouter
from api.pipeline import medical_api
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi.responses import StreamingResponse
from api.schemas.chat_schema import ChatRequest
from fastapi.responses import JSONResponse
import io
import sys
import asyncio



router = APIRouter()
model = medical_api.CodeGen()


async def stram_buffer(word:str):
    buffer = io.StringIO()
    sys.stdout = buffer
    sys.stdout.write(word)
    out = buffer.getvalue()
    sys.stdout = sys.__stdout__
    return out

@asynccontextmanager
async def load_model() -> AsyncGenerator[medical_api.CodeGen,None]:
    try:
        yield model
    
    finally:
        pass


from fastapi import status
from api.custom_response import CustomJSONResponse
from fastapi import HTTPException
import threading


stop = threading.Event()
s = {}


async def generate_word(prompt: str):
    global stop
    try:
        first = True
        async with load_model() as model:
            loop = asyncio.get_event_loop()
            future = loop.run_in_executor(None, model.infer, prompt)
            gen_word = await asyncio.wait_for(future, 120)
            for word in gen_word:
                
                if s["stop"]:
                    break
                else:
                    if first:
                        first = False
                        yield prompt + word   
                    else:
                        yield word
            first = True

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail={"Took too long to respond"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server error"
        ) from e

@router.post("/medical/api/instruct_resp", tags=["chat"])
async def generate(chat_request: ChatRequest):
    try:
        user_prompt = chat_request.prompt
        s["stop"] = False
        response = StreamingResponse(
            generate_word(user_prompt),
            status_code=200,
            media_type="text/plain"
        )
        return response
    except HTTPException as e:
        return CustomJSONResponse(
            content={"error": e.detail},
            status_code=e.status_code
        )
    except Exception as e:
        print(e)
        return JSONResponse(
            status_code=200,
            content={"error": str(e)}
        )

@router.post("/medical/api/restart")
async def restart_generation(chat_request: ChatRequest):
    try:
        user_prompt = chat_request.prompt
        s["stop"] = False
        response = StreamingResponse(
            generate_word(user_prompt),
            status_code=200,
            media_type="text/plain"
        )
        return response

    except HTTPException as e:
        return CustomJSONResponse(
            content={"error": e.detail},
            status_code=e.status_code
        )
    except Exception as e:
        print(e)
        return JSONResponse(
            status_code=200,
            content={"error": str(e)}
        )

@router.post("/medical/api/stop", tags=["chat"])
async def stop_generation_endpoint():
    try:
        s["stop"] = True
        return JSONResponse(
            status_code=200,
            content={"message": "Generation Stopped!"}
        )
    except Exception as e:
        print(e)
        return JSONResponse(
            content={"error": str(e)},
            status_code=200
        )
