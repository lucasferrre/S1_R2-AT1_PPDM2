import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const options: Array<{
    title: string;
    description: string;
    route: keyof RootStackParamList;
}> = [
        {
            title: 'Posição atual',
            description: 'consulte sua localização atual',
            route: 'PosicaoGpsScreen'
        },
        {
            title: 'Redes Wifi',
            description: 'Verifique a rede conectada e o statis da conexão',
            route: 'RedesWifiScreen'
        },
                {
            title: 'Acelerômetro',
            description: 'Acompanhe o movimento do seu aparelho',
            route: 'AcelerometroScreen'
        },
         {
            title: 'Camera',
            description: 'Acompanhe o movimento do seu aparelho',
            route: 'CameraScreen'
        },
    ];

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProps>();
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.heading}>
                    <Text style={styles.eyebrow}>RECURSOS DO DISPOSITIVO</Text>
                    <Text style={styles.title}>Escolha uma ferramenta</Text>
                    <Text style={styles.subtitle}>Explore sensores e informações no seu aparelho.</Text>
                </View>
                <View style={styles.list}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.route}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`${option.title}. ${option.description}`}
                            style={styles.card}
                            onPress={() => navigation.navigate(option.route)}
                        >
                            <View style={styles.cardText}>
                                <Text style={styles.cardTitle}>{option.title}</Text>
                                <Text style={styles.cardDescription}>{option.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

    // Ocupa toda a tela disponível e define cor de fundo cinza-claro padrão do app
    safeArea: {
        flex: 1,               // Expande para preencher toda a área segura da tela
        backgroundColor: "#F6F7F8", // Cinza-claro: cor de fundo padrão do app
    },

    // Container principal da tela com padding lateral e espaçamento superior
    container: {
        flex: 1,               // Preenche toda a SafeAreaView
        paddingHorizontal: 20, // Margem interna lateral de 20px (esquerda e direita)
        paddingTop: 48,        // Espaço superior generoso para o cabeçalho respirar
    },

    // Bloco do cabeçalho — espaçamento abaixo separa do conteúdo
    heading: {
        marginBottom: 28, // Espaço entre o cabeçalho e a lista de cards
    },

    // Texto pequeno em caixa alta (eyebrow / kicker) acima do título
    eyebrow: {
        color: "#25883E",    // Verde principal do app
        fontSize: 12,        // Tamanho pequeno — texto de apoio
        fontWeight: "700",   // Negrito
        letterSpacing: 1.2,  // Espaçamento entre letras: dá o efeito de texto em caixa alta
    },

    // Título grande da tela
    title: {
        color: "#18211B",  // Verde-escuro quase preto — cor primária de texto
        fontSize: 30,      // Grande para ser o destaque visual principal
        fontWeight: "700", // Negrito
        marginTop: 8,      // Pequeno espaço acima, separando do eyebrow
    },

    // Subtítulo descritivo abaixo do título
    subtitle: {
        color: "#66706A",  // Cinza-esverdeado — cor secundária de texto
        fontSize: 16,      // Legível, mas menor que o título
        lineHeight: 24,    // Altura de linha aumentada para facilitar a leitura
        marginTop: 10,     // Espaço entre o título e o subtítulo
    },

    // Container da lista de cards — gap define espaçamento entre os itens
    list: {
        gap: 12, // Espaçamento uniforme de 12px entre cada card da lista
    },

    // Estilo base de cada card de opção do menu
    card: {
        minHeight: 92,         // Altura mínima garante que cards curtos sejam clicáveis
        alignItems: "center",  // Alinha verticalmente os filhos ao centro
        flexDirection: "row",  // Coloca os filhos em linha horizontal (texto + seta)
        backgroundColor: "#FFFFFF", // Fundo branco para o card
        borderRadius: 14,      // Cantos arredondados — estética moderna
        paddingHorizontal: 18, // Padding interno: espaço lateral dentro do card
        paddingVertical: 16,   // Padding interno: espaço vertical dentro do card
        borderWidth: 1,        // Borda fina ao redor do card
        borderColor: "#E4E8E5", // Cinza-claro para a borda — sutil, não chama atenção
    },

    // Área de texto dentro do card: ocupa todo o espaço disponível (exceto a seta)
    cardText: {
        flex: 1, // flex: 1 faz este elemento crescer e ocupar o espaço restante na linha
    },

    // Título do card (nome da funcionalidade)
    cardTitle: {
        color: "#18211B",  // Verde-escuro quase preto
        fontSize: 17,      // Tamanho médio-grande para o nome da funcionalidade
        fontWeight: "700", // Negrito para destaque
    },

    // Descrição curta abaixo do título do card
    cardDescription: {
        color: "#66706A",  // Cinza-esverdeado — texto secundário
        fontSize: 14,      // Menor que o título
        lineHeight: 20,    // Altura de linha confortável para leitura
        marginTop: 5,      // Pequeno espaço entre o título e a descrição
    },

    // Seta "›" no lado direito do card — indica que é navegável
    arrow: {
        color: "#25883E",  // Verde principal — cor de destaque
        fontSize: 32,      // Grande o suficiente para ser visível
        lineHeight: 32,    // Igual ao fontSize para alinhar verticalmente sem espaço extra
        marginLeft: 12,    // Separa a seta do texto à esquerda
    },
});
