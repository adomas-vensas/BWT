import { SimulationParamsRequest } from "../API/SimulationParamsRequest";

type MsgHandler = (data: ArrayBuffer) => void;

let ws: WebSocket | null = null;
const handlers = new Set<MsgHandler>();

export function getSocket(): WebSocket {
  if (!ws) {
    ws = new WebSocket('ws://localhost:7910/stream/calculate');
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