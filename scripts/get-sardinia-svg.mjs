import https from 'https'
import fs from 'fs'

const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'

https.get(url, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const geojson = JSON.parse(data)
    const sardinia = geojson.features.find(f => 
      f.properties.name === 'Sardegna' || 
      f.properties.name_en === 'Sardinia'
    )
    if (sardinia) {
      fs.writeFileSync('scripts/sardinia.json', JSON.stringify(sardinia.geometry, null, 2))
      console.log('Saved! Type:', sardinia.geometry.type)
      const coords = sardinia.geometry.type === 'MultiPolygon' 
        ? sardinia.geometry.coordinates[0][0]
        : sardinia.geometry.coordinates[0]
      console.log('First coord:', coords[0])
      console.log('Total points:', coords.length)
    }
  })
}).on('error', e => console.error(e))
