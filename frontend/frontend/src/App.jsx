import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  const drawingRef = useRef(false);
  const prevRef = useRef(null);

  const [color, setColor] = useState("black");

  const [username] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );

  const [cursors, setCursors] = useState({});

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8000/ws");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "cursor") {
        setCursors((prev) => ({
          ...prev,
          [data.user]: {
            x: data.x,
            y: data.y,
          },
        }));
        return;
      }

      if (data.type === "clear") {
        const ctx = canvasRef.current.getContext("2d");

        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        return;
      }

      if (data.type === "draw") {
        const ctx = canvasRef.current.getContext("2d");

        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
      }
    };
  }, []);

  const handleMouseDown = (e) => {
    drawingRef.current = true;

    prevRef.current = [
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY,
    ];
  };

  const handleMouseMove = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    wsRef.current.send(
      JSON.stringify({
        type: "cursor",
        user: username,
        x,
        y,
      })
    );

    if (!drawingRef.current) return;

    const curr = [x, y];

    wsRef.current.send(
      JSON.stringify({
        type: "draw",
        color,
        x0: prevRef.current[0],
        y0: prevRef.current[1],
        x1: curr[0],
        y1: curr[1],
      })
    );

    prevRef.current = curr;
  };

  const handleMouseUp = () => {
    drawingRef.current = false;
  };

  const clearBoard = () => {
    wsRef.current.send(
      JSON.stringify({
        type: "clear",
      })
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Collaborative Whiteboard</h1>

      <h3>
        Users Online: {Object.keys(cursors).length}
      </h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <button onClick={() => setColor("black")}>
          Black
        </button>

        <button onClick={() => setColor("red")}>
          Red
        </button>

        <button onClick={() => setColor("blue")}>
          Blue
        </button>

        <button onClick={() => setColor("green")}>
          Green
        </button>

        <button onClick={clearBoard}>
          Clear Board
        </button>
      </div>

      <div
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            border: "2px solid black",
            backgroundColor: "white",
          }}
        />

        {Object.entries(cursors).map(
          ([user, pos]) => (
            <div
              key={user}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                color: "red",
                fontWeight: "bold",
                pointerEvents: "none",
              }}
            >
              ➤ {user}
            </div>
          )
        )}
      </div>
    </div>
  );
}