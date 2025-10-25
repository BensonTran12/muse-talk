import WebSocket from 'ws'
import { parseMuseFrame } from './frameParser.js'


class DataStreamer {
    constructor(backendUrl) {
        this.backendUrl = backendUrl
        this.ws = null
    }


    connect() {
        this.ws = new WebSocket(this.backendUrl)


        this.ws.on('open', () => console.log(`[DataStreamer] Connected to backend at ${this.backendUrl}`))
        this.ws.on('close', () => console.log('[DataStreamer] Disconnected from backend'))
        this.ws.on('error', (err) => console.error('[DataStreamer] WebSocket error:', err))
    }


    sendRaw(buffer) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return


        const parsed = parseMuseFrame(buffer)
        if (parsed) {
            this.ws.send(JSON.stringify(parsed))
        }
    }


    close() {
        if (this.ws) {
            this.ws.close()
        }
    }
}


export default DataStreamer