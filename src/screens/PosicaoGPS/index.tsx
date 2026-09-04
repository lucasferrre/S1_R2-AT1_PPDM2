import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import * as Location from 'expo-location';



export default function PosicaoGpsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      // status: 'granted' ou 'denied'
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permissão negada a localização do dispositivo');
        return;
      }
      //coordenadas de latitude, longitude e altitude
      const location = await Location.getCurrentPositionAsync();
      setLocation(location);

    }
    getCurrentLocation();
  }, []);


  useEffect(() => {
    async function getAddress() {
      if (!location) return;
      try {
        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };

        const reverseCodedAddress = await Location.reverseGeocodeAsync(coordinates);

        if (reverseCodedAddress.length > 0) {
          setAddress(reverseCodedAddress[0]);
        }
      } catch (e) {
        console.log("Erro no Reverse Geocode:", e);
      }
    }
    getAddress();
  }, [location]);

  let text = 'Aguardando localização...';

  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }
  return (
    <View style={styles.container}>
      <Text style={styles.titleScreen}>Posição atual detectada</Text>

      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : address ? (
        <View style={styles.addressCard}>
          <Text style={styles.streetText}>
            {address.street || 'Rua não encontrada'}, {address.streetNumber || 'S/N'}
          </Text>
          <Text style={styles.detailText}>
            Bairro:  {address.district || 'Bairro não encontrado'}
          </Text>

          <Text style={styles.detailText}>
            Cidade: {address.subregion}
          </Text>
          <Text style={styles.detailText}>
            Estado:{address.region}
          </Text>

          <Text style={styles.cepText}>
            CEP: {address.postalCode}
          </Text>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E293B" />
          <Text style={styles.loadingText}>Aguardando localização...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F8", // Cor de fundo padrão cinza-claro
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleScreen: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 24,
  },

  // Estilos do Card de Endereço
  addressCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    padding: 24,
    borderRadius: 16,
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Sombra para Android
    elevation: 4,
  },

  // Estilo específico para a Rua (Linha 1)
  streetText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },

  // Estilo para Bairro e Cidade (Linhas 2 e 3)
  detailText: {
    fontSize: 16,
    color: "#475569", // Cinza médio
    marginBottom: 4,
  },

  // Estilo para o CEP (Linha 4)
  cepText: {
    fontSize: 14,
    color: "#64748B", // Cinza um pouco mais claro para diferenciar
    marginTop: 8,
    fontWeight: "500",
  },

  // Estados de erro e carregamento
  errorText: {
    fontSize: 16,
    color: "#b12727",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
});