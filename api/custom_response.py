import json
import typing
from typing import Optional,Any,Generic,TypeVar,Dict
from fastapi import Response
from fastapi.encoders import jsonable_encoder
from pydantic.generics import GenericModel
from starlette.background import BackgroundTask


T = TypeVar('T')

class ResponseWrapper(GenericModel,Generic[T]):

    code: int = 0
    message: str = ""
    result: Optional[T | Any] = None

    def to_dict(self):
        return jsonable_encoder(self)
    
    def to_json(self):
        return json.dumps(self.to_dict(),ensure_ascii=False)
    
class CustomJSONResponse(Response):
    media_type = "application/json"

    def __init__(
            self,
            content: Any,
            status_code: int = 200,
            headers: Optional[Dict[str, str]] = None,
            media_type: Optional[str] = None,
            background: Optional[BackgroundTask] = None,
    ) -> None:
        super().__init__(content, status_code, headers, media_type, background)

    def render(self, content: typing.Any) -> bytes:
        if not isinstance(content, ResponseWrapper):
            content = ResponseWrapper(code=self.status_code, message=get_http_message(self.status_code), result=content)
        return content.to_json().encode("utf-8")

class PrettyJSONResponse(Response):
    media_type = "application/json"

    def render(self, content: typing.Any) -> bytes:
        return json.dumps(
            jsonable_encoder(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=4,
            separators=(", ", ": "),
        ).encode("utf-8")


def response(code: int = 200, message: str = "", result: Optional[Any] = None,
             headers: Optional[Dict[str, str]] = None) -> CustomJSONResponse:
    return CustomJSONResponse(
        content=ResponseWrapper(code=code, message=message, result=result),
        status_code=200,
        headers=headers
    )

def get_http_message(status_code: int) -> str:
    return {
        200: "tips.requestSuccess",
        201: "tips.requestSuccess",
        204: "tips.requestSuccess",
        400: "errors.badCredentials",
        401: "errors.userNotLogin",
    }.get(status_code, "")
