from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/frame")
async def receive_frame(request: Request):
    data = await request.json()
    # TODO: add cleaning and classification logic later
    print("Received frame:", data)
    return JSONResponse({"input": "Up"})  # mock shit rn
