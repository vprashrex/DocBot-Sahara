from fastapi.middleware.cors import CORSMiddleware

origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:8000'
]

def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origns=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    