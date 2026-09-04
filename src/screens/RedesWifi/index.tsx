import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import * as Network from 'expo-network';

type NetworkInfo = {
    type: Network.NetworkStateType; // enum: wifi |celular
    isConnected: boolean;
    isInternetReachable: boolean;
    ipAddres: string,
    isAirplaneMode: boolean
}

// Wi-fi
// CELLULAR

const typeLabels: Record<string, string> = {
    WIFI: "wi-fi",
    CELLULAR: 'Dados móveis',
    NONE: 'Sem conexão',
    UNKNOWN: 'Rede desconhecida',
    VPN: 'VPN'
    // ETHERNET: 'Ethernet'
}

export default function RedesWifiScreen() {
    const [info, setInfo] = useState<NetworkInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const carregarRede = useCallback(async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const state = await Network.getNetworkStateAsync();
            let ip = 'Indisponível';
            let airplane = false;

            try {
                ip = await Network.getIpAddressAsync();
            } catch {
                ip = 'Indisponível'
            }

            try {
                airplane = await Network.isAirplaneModeEnabledAsync();
            } catch (error) {
                airplane = false;
            }

            setInfo({
                type: state.type ?? Network.NetworkStateType.UNKNOWN,
                isConnected: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable ?? false,
                ipAddres: ip,
                isAirplaneMode: airplane
            })


        } catch (error) {
            console.error(error);
            setErrorMsg('Não foi possível obter informações da rede.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarRede();
        // fica escutando quando troca de rede
        const subscription = Network.addNetworkStateListener(() => {
            carregarRede();
        });

    }, [carregarRede]);


    const isWifi = info?.type === Network.NetworkStateType.WIFI;


    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Conexão da rede</Text>
            <Text style={styles.subtitle}>Status da conexão ativa</Text>
            {loading && !info ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size='large' color='#25883E' />
                    <Text style={styles.loadingText}>Consultado a rede...</Text>
                </View>
            ) : errorMsg ? (
                <View style={[styles.card, styles.errorCard]}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            ) : (
                info && (
                    <View style={styles.card}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: info.isConnected ? "#25883E" : "#B12727" }]}>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tipo de conexão</Text>
                            <Text style={styles.infoValue}>{isWifi ? 'Conectado por Wi-fi' : 'Não conectado por wi-fi'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Endereço de IP</Text>
                            <Text style={styles.infoValue}>{info.ipAddres}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status odo avião</Text>
                            <Text style={styles.infoValue}>{info.isAirplaneMode ? 'Ativado' : 'Desativado'}</Text>
                        </View>
                    </View>
                )
            )}
            {/* Card informativo sobre limitações do Expo Go para varredura de redes */}
            <View style={[styles.card, styles.noteCard]}>
                <Text style={styles.noteTitle}>Sobre as redes disponíveis</Text>
                <Text style={styles.noteText}>
                    A varredura de outras redes Wi-Fi próximas e a leitura do nome (SSID)
                    não são permitidas no Expo Go. Esses recursos exigem um módulo nativo
                    e um development build. Aqui mostramos as informações da conexão ativa
                    que o Expo disponibiliza com segurança.
                </Text>
            </View>
            {/* Botão para atualizar manualmente as informações de rede */}
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={carregarRede} // Chama a mesma função de carregamento
                activeOpacity={0.85} // Opaciadade leve ao pressionar
                disabled={loading} // Desabilitado enquanto já está carregando
            >
                <Text style={styles.refreshText}>
                    {/* Texto muda dinamicamente conforme o estado de loading */}
                    {loading ? "Atualizando..." : "Atualizar"}
                </Text>

            </TouchableOpacity>
        </View>
    );
}




// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

    // Tela principal: ocupa toda a área e define o fundo cinza-claro
    screen: {
        flex: 1,               // Expande para preencher toda a tela
        backgroundColor: "#F6F7F8", // Cinza-claro padrão do app
    },

    // Container do ScrollView: define espaçamento interno e gap entre filhos
    content: {
        padding: 20, // Espaçamento interno uniforme em todos os lados
        gap: 16,     // Espaço automático de 16px entre cada filho direto
    },

    // Título principal da tela
    title: {
        fontSize: 26,      // Grande para ser o destaque visual
        fontWeight: "700", // Negrito
        color: "#18211B",  // Verde-escuro quase preto — cor primária de texto
    },

    // Subtítulo descritivo abaixo do título
    subtitle: {
        fontSize: 15,      // Menor que o título
        color: "#66706A",  // Cinza-esverdeado — texto secundário
        lineHeight: 22,    // Altura de linha para boa legibilidade
        marginTop: -8,     // Margem negativa para aproximar do título (o gap do content já espaça)
    },

    // Container do spinner de carregamento
    loadingBox: {
        alignItems: "center",  // Centraliza o spinner e o texto horizontalmente
        paddingVertical: 48,   // Espaço vertical generoso para o spinner "respirar"
        gap: 12,               // Espaço entre o spinner e o texto abaixo
    },

    // Texto abaixo do spinner
    loadingText: {
        color: "#66706A", // Cinza — texto de status secundário
        fontSize: 15,
    },

    // Card branco com borda — container reutilizado em múltiplos contextos
    card: {
        backgroundColor: "#FFFFFF", // Fundo branco — contrasta com o fundo cinza da tela
        borderRadius: 14,           // Cantos arredondados — estética moderna
        padding: 18,                // Espaçamento interno uniforme
        borderWidth: 1,             // Borda fina ao redor do card
        borderColor: "#E4E8E5",     // Cinza-claro sutil para a borda
    },

    // Linha do indicador de status (ponto colorido + texto "Conectado")
    statusRow: {
        flexDirection: "row",  // Coloca os filhos em linha horizontal
        alignItems: "center",  // Alinha verticalmente ao centro
        gap: 10,               // Espaço entre o ponto e o texto
    },

    // Ponto circular colorido (verde ou vermelho)
    statusDot: {
        width: 12,         // Largura fixa do círculo
        height: 12,        // Altura fixa do círculo
        borderRadius: 6,   // Metade da largura/altura = círculo perfeito
        // backgroundColor aplicado dinamicamente no JSX
    },

    // Texto "Conectado" ou "Sem conexão"
    statusText: {
        fontSize: 18,      // Destaque — maior que os textos de detalhe
        fontWeight: "700", // Negrito
        color: "#18211B",  // Verde-escuro quase preto
    },

    // Linha separadora horizontal entre status e detalhes
    divider: {
        height: 1,              // Linha de 1px de altura
        backgroundColor: "#EEF1EF", // Cinza-claro — separador sutil
        marginVertical: 14,     // Espaço acima e abaixo da linha
    },

    // Container de cada linha de detalhe (InfoRow)
    infoRow: {
        flexDirection: "row",        // Rótulo à esquerda, valor à direita
        justifyContent: "space-between", // Empurra rótulo para esquerda e valor para direita
        alignItems: "center",        // Alinha verticalmente ao centro
        paddingVertical: 8,          // Espaço acima e abaixo de cada linha
        gap: 12,                     // Espaço mínimo entre rótulo e valor
    },

    // Rótulo da esquerda (ex.: "Tipo de conexão", "Endereço IP")
    infoLabel: {
        fontSize: 14,     // Tamanho padrão de texto de detalhe
        color: "#66706A", // Cinza-esverdeado — texto secundário
    },

    // Valor da direita (ex.: "Wi-Fi", "192.168.1.10")
    infoValue: {
        fontSize: 14,
        fontWeight: "600",   // Semi-negrito — destaca o valor em relação ao rótulo
        color: "#18211B",    // Verde-escuro quase preto — texto primário
        flexShrink: 1,       // Permite encolher e quebrar linha se o texto for longo
        textAlign: "right",  // Alinha o texto à direita dentro do seu espaço
    },

    // Variação do card para estado de erro (fundo e borda avermelhados)
    errorCard: {
        borderColor: "#F0C9C9",     // Borda rosa-avermelhada
        backgroundColor: "#FCF2F2", // Fundo levemente rosado
    },

    // Texto de erro exibido dentro do errorCard
    errorText: {
        color: "#B12727",       // Vermelho — indica erro
        fontSize: 15,
        textAlign: "center",    // Centraliza a mensagem de erro
    },

    // Variação do card para nota informativa (fundo verde-claro)
    noteCard: {
        backgroundColor: "#F1F6F2", // Verde muito claro — tom informativo
        borderColor: "#D6E6D9",     // Borda verde-claro
    },

    // Título da nota informativa
    noteTitle: {
        fontSize: 15,
        fontWeight: "700",   // Negrito para destacar o título da nota
        color: "#25883E",    // Verde principal — reforça o tom informativo
        marginBottom: 6,     // Espaço entre título e texto da nota
    },

    // Corpo de texto da nota informativa
    noteText: {
        fontSize: 14,
        color: "#4C5B50",  // Verde-escuro suave — harmônico com o fundo verde-claro
        lineHeight: 21,    // Altura de linha generosa para boa leitura
    },

    // Botão de atualizar rede — destaque em verde sólido
    refreshButton: {
        height: 52,              // Altura confortável para toque (mínimo recomendado: 44px)
        borderRadius: 12,        // Cantos arredondados
        backgroundColor: "#25883E", // Verde principal
        alignItems: "center",    // Centraliza o texto horizontalmente
        justifyContent: "center", // Centraliza o texto verticalmente
    },

    // Texto do botão de atualizar
    refreshText: {
        color: "#FFFFFF",    // Branco — contrasta com o fundo verde
        fontSize: 16,        // Tamanho adequado para botão de ação
        fontWeight: "700",   // Negrito — enfatiza a ação
    },
});