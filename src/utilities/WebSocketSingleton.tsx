import { SimulationParamsRequest } from "../API/SimulationParamsRequest";

let ws: WebSocket | null = null;
const PORT = import.meta.env.VITE_BACKEND_PORT

export function getSocket(): WebSocket {
  if (!ws) {
    ws = new WebSocket(`ws://localhost:${PORT}/stream/calculate`);
    ws.binaryType = 'arraybuffer';
  }
  return ws;
}

export function sendJSON(msg: SimulationParamsRequest): void {
    const socket = getSocket();
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
    }
}