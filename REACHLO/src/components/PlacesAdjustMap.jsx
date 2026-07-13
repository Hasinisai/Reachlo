import React, { useState, useRef } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

/**
 * Non-intrusive modal map for adjusting a place pin.
 * Props:
 * - visible: boolean
 * - initialRegion: { latitude, longitude, latitudeDelta?, longitudeDelta? }
 * - onClose(): called when modal closed without saving
 * - onSave({ latitude, longitude }): called when user saves adjusted pin
 * Usage: render and control visibility from your existing Create Campaign screen.
 */
export default function PlacesAdjustMap({ visible, initialRegion, onClose, onSave }) {
  const [marker, setMarker] = useState({
    latitude: initialRegion?.latitude || 0,
    longitude: initialRegion?.longitude || 0,
  })

  React.useEffect(() => {
    if (visible && initialRegion) {
      setMarker({
        latitude: initialRegion.latitude || 0,
        longitude: initialRegion.longitude || 0,
      });
    }
  }, [visible, initialRegion]);

  const mapRef = useRef(null)

  function handleDragEnd(e) {
    const { latitude, longitude } = e.nativeEvent.coordinate
    setMarker({ latitude, longitude })
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Adjust Location</Text>
        </View>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={{
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: initialRegion?.latitudeDelta || 0.002,
            longitudeDelta: initialRegion?.longitudeDelta || 0.002,
          }}
        >
          <Marker
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            draggable
            onDragEnd={handleDragEnd}
          />
        </MapView>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.save]}
            onPress={() => onSave && onSave({ latitude: marker.latitude, longitude: marker.longitude })}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const { height } = Dimensions.get('window')
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  map: { flex: 1, height: height - 140 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  cancel: { backgroundColor: '#f2f2f2' },
  save: { backgroundColor: '#1e90ff' },
  btnText: { fontSize: 14 },
})
