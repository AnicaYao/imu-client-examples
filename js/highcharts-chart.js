import { onSensorData } from 'https://cdn.jsdelivr.net/npm/imu-tools/index.js'
import { throttled } from 'https://cdn.jsdelivr.net/npm/imu-tools/utils.js'

Highcharts.setOptions({ global: { useUTC: false } })

const chart = new Highcharts.Chart({
    chart: { renderTo: 'container' },
    title: { text: 'IMU Data' },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 100,
    },
    series: [],
})

const seriesIndices = {}

function addSampleScalar(name, value, timestamp) {
    let seriesIndex = seriesIndices[name]
    if (seriesIndex === undefined) {
        seriesIndex = Object.keys(seriesIndices).length
        seriesIndices[name] = seriesIndex
        chart.addSeries({
            id: seriesIndex,
            name: name,
            data: [],
        })
    }
    const series = chart.series[0]
    chart.series[seriesIndex].addPoint(
        [timestamp, value],
        true,
        series.data.length > 500
    )
}

onSensorData(
    throttled(({ deviceId, data }) => {
        // const [a0, a1, a2] = data.accelerometer
        const [e0, e1, e2] = data.euler
        // console.log(e0,e1,e2)
        const values = { e0, e1, e2 }
        const timestamp = new Date().getTime()
        Object.keys(values).forEach((k) => {
            addSampleScalar(k, values[k], timestamp)
        })
    })
)
