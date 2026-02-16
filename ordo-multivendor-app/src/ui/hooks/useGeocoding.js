import axios from 'axios'
import useEnvVars from '../../../environment'

const useGeocoding = () => {
  const { GOOGLE_MAPS_KEY } = useEnvVars()
  const API_KEY = GOOGLE_MAPS_KEY

  const getAddress = async (latitude, longitude) => {
    console.log('🔍 [useGeocoding] Starting geocoding request')
    console.log('📍 Coordinates:', { latitude, longitude })
    console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'UNDEFINED')
    
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}&language=en`
      console.log('🌐 Request URL:', url.replace(API_KEY, 'API_KEY_HIDDEN'))
      
      const response = await axios.get(url)
      
      console.log('📡 Response status:', response.status)
      console.log('📦 Response data:', JSON.stringify(response.data, null, 2))

      // Check if the response is successful and contains results
      if (
        response.data &&
        response.data.results &&
        response.data.results.length > 0
      ) {
        // Extract the formatted address from the first result
        const formattedAddress = response.data.results[0].formatted_address
        // Extract the city from the address components
        const cityComponent = response.data.results[0].address_components.find(
          (component) =>
            component.types.includes('locality') ||
            component.types.includes('administrative_area_level_2')
        )
        const city = cityComponent ? cityComponent.long_name : null
        
        console.log('✅ Address found:', { formattedAddress, city })
        return { formattedAddress, city }
        
      } else {
        console.log('❌ No results in response')
        throw new Error('No address found for the given coordinates.')
      }
    } catch (error) {
      console.error('❌ Error fetching address:', error.message)
      console.error('❌ Full error:', error)
      throw error
    }
  }
  return {getAddress}
}

export default useGeocoding
