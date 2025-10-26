import noble from '@abandonware/noble'


class MuseConnector extends EventEmitter {
    constructor() {
        super()
        this.device = null
        this.connected = false
    }


    async start() {
        console.log('[MuseConnector] Scanning for Muse 2...')


        noble.on('stateChange', async (state) => {
            if (state === 'poweredOn') {
                noble.startScanning([], false)
            } else {
                noble.stopScanning()
            }
        })


        noble.on('discover', async (peripheral) => {
            const name = peripheral.advertisement.localName || ''
            if (name.includes('Muse')) {
                console.log(`[MuseConnector] Found device: ${name}`)
                noble.stopScanning()
                this.device = peripheral
                await this.connect(peripheral)
            }
        })
    }


    async connect(peripheral) {
        return new Promise((resolve, reject) => {
            peripheral.connect((err) => {
                if (err) {
                    console.error('[MuseConnector] Connection error:', err)
                    reject(err)
                    return
                }


                console.log('[MuseConnector] Connected to Muse')
                this.connected = true
                this.emit('connected')


                peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
                    if (error) {
                        console.error('[MuseConnector] Service discovery failed:', error)
                        return
                    }


                    for (const char of characteristics) {
                        if (char.properties.includes('notify')) {
                            char.subscribe((e) => e && console.error(e))
                            char.on('data', (data) => {
                                this.emit('data', data)
                            })
                        }
                    }
                })
                resolve()
            })
        })
    }


    disconnect() {
        if (this.device && this.connected) {
            this.device.disconnect()
            this.connected = false
            console.log('[MuseConnector] Disconnected')
            this.emit('disconnected')
        }
    }
}