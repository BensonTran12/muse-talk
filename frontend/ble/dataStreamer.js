import fetch from 'node-fetch'
import { parseMuseFrame } from './frameParser.js'


class DataStreamer {
constructor() {
// Backend container hostname from Docker Compose (service name)
this.backendUrl = process.env.VITE_BACKEND_URL || 'http://backend:5000/frame'
}


async sendFrame(buffer) {
const frame = parseMuseFrame(buffer)
if (!frame) return


try {
const response = await fetch(this.backendUrl, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(frame)
})


if (!response.ok) {
console.error(`[DataStreamer] Backend responded with ${response.status}`)
return null
}


const result = await response.json()
console.log('[DataStreamer] Frame processed:', result)
return result // for example { input: "Up" }


} catch (err) {
console.error('[DataStreamer] Error sending frame:', err.message)
return null
}
}
}


export default DataStreamer