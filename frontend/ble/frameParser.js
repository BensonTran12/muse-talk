export function parseMuseFrame(buffer) {
    try {
        const data = new Uint8Array(buffer)


        // mock shit for now: just grab first 16 bytes as sample data
        const frame = {
            timestamp: Date.now(),
            samples: Array.from(data).slice(0, 16),
        }


        return frame
    } catch (err) {
        console.error('[FrameParser] Error parsing frame:', err)
        return null
    }
}