import asyncio
import websockets
import json

async def connect_and_capture():
    uri = "ws://127.0.0.1:8001/ws/chat/18ecf2cf-51b8-42f4-979f-e56ca8d406e5/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYyMDAxMjg4LCJpYXQiOjE3NjE5OTc2ODgsImp0aSI6ImNkZGI3OWFmOWNlNzQzZDU5NTIzNDExYjRiOGQ3OGRmIiwidXNlcl9pZCI6IjIifQ.qKOQEdcI4CPGpJQteNkfDAE0gnl18dnYge5XtywxsYo&cid=f3b8ac1b-ddf3-44d9-8e77-1b8eb913929c"
    frames = []
    try:
        async with websockets.connect(uri) as websocket:
            # Wait for incoming messages
            while len(frames) < 3:
                message = await websocket.recv()
                data = json.loads(message)
                frames.append(data)
                print(json.dumps(data))
    except Exception as e:
        print(f"Error: {e}")
    return frames

if __name__ == "__main__":
    frames = asyncio.run(connect_and_capture())
    print("\nCaptured frames:")
    for frame in frames:
        print(json.dumps(frame))