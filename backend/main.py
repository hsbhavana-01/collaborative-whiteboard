from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = []


@app.get("/")
def home():
    return {"status": "running"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            disconnected = []

            for client in clients:
                try:
                    await client.send_text(data)
                except:
                    disconnected.append(client)

            for client in disconnected:
                if client in clients:
                    clients.remove(client)

    except WebSocketDisconnect:
        if websocket in clients:
            clients.remove(websocket)