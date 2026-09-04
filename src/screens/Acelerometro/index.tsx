// ─────────────────────────────────────────────────────────────────────────────
// Acelerometro/index.tsx — Tela do Acelerômetro.
//
// Lê em tempo real a aceleração do dispositivo nos eixos X, Y e Z (em força g).
// A magnitude vetorial combina os três eixos em um único valor.
//
// Controles:
//   - Iniciar: começa a captura e atualiza os valores a cada 200ms
//   - Pausar: interrompe a captura sem zerar os valores
//   - Zerar: reseta os valores exibidos para zero (sem parar a captura)
//   - Chacoalhar o aparelho: liga a lanterna; chacoalhar de novo: desliga
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";
import { CameraView, useCameraPermissions } from "expo-camera";

// Valor padrão inicial de todos os eixos: zeros.
// Também usado ao zerar os valores manualmente.
// AccelerometerMeasurement exige o campo "timestamp" além de x, y e z.
const ZERO: AccelerometerMeasurement = { x: 0, y: 0, z: 0, timestamp: 0 };

// ── Configuração do detector de chacoalhada ──────────────────────────────────
// Magnitude acima da qual consideramos que houve uma "chacoalhada".
// ~1g é repouso; valores bem acima disso indicam movimento brusco.
const SHAKE_THRESHOLD = 1.8;
// Tempo mínimo (ms) entre uma chacoalhada e a próxima ser reconhecida.
// Evita que um único movimento seja contado várias vezes seguidas (debounce).
const SHAKE_COOLDOWN_MS = 1000;

export default function AcelerometroScreen() {
  // Última leitura do acelerômetro: valores de x, y, z em força g
  const [data, setData] = useState<AccelerometerMeasurement>(ZERO);

  // Controla se a captura está em andamento (true) ou pausada (false)
  const [isRunning, setIsRunning] = useState(false);

  // Estado de disponibilidade do sensor:
  //   null  → ainda verificando
  //   true  → disponível
  //   false → não disponível neste dispositivo
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // NOVO: estado da lanterna (ligada/desligada), alternado ao chacoalhar
  const [torchOn, setTorchOn] = useState(false);

  // NOVO: permissão de câmera — necessária para controlar a lanterna via CameraView
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // useRef armazena a assinatura do listener sem causar re-renders ao mudar.
  // É essencial para poder remover o listener (pausar) sem perder a referência.
  // O tipo é inferido do retorno de Accelerometer.addListener.
  const subscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  // NOVO: guarda o timestamp (ms) da última chacoalhada reconhecida,
  // usado para aplicar o cooldown e não alternar a lanterna várias vezes seguidas.
  const lastShakeTime = useRef(0);

  // ── Inicialização ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Verifica se o acelerômetro existe e está acessível neste dispositivo.
    // .catch garante que uma rejeição da Promise seja tratada (define false em vez de lançar erro).
    Accelerometer.isAvailableAsync()
      .then(setIsAvailable)         // Se resolveu: salva o resultado (true ou false)
      .catch(() => setIsAvailable(false)); // Se rejeitou: assume que não está disponível

    // NOVO: pede a permissão de câmera assim que a tela monta,
    // já que ela é necessária para acionar a lanterna.
    requestCameraPermission();

    // Cleanup executado quando a tela é desmontada (ex.: usuário volta para a Home).
    // Remove o listener para liberar o sensor e evitar memory leak.
    return () => {
      subscription.current?.remove(); // ?. evita erro se já for null
      subscription.current = null;
    };
  }, []); // [] = executa apenas uma vez ao montar

  // NOVO: verifica se o movimento atual é uma chacoalhada e, se for,
  // alterna a lanterna (respeitando o cooldown contra múltiplos disparos).
  const checkShake = (measurement: AccelerometerMeasurement) => {
    const currentMagnitude = Math.sqrt(
      measurement.x ** 2 + measurement.y ** 2 + measurement.z ** 2
    );

    if (currentMagnitude < SHAKE_THRESHOLD) return; // Movimento fraco: ignora

    const now = Date.now();
    if (now - lastShakeTime.current < SHAKE_COOLDOWN_MS) return; // Ainda em cooldown: ignora

    lastShakeTime.current = now; // Marca o momento desta chacoalhada
    setTorchOn((current) => !current); // Alterna: ligado -> desligado -> ligado ...
  };

  // ── Iniciar captura ────────────────────────────────────────────────────────
  const iniciar = () => {
    // Guarda de segurança: não faz nada se o sensor não está disponível
    // ou se já existe uma assinatura ativa (evita criar múltiplos listeners)
    if (!isAvailable || subscription.current) return;

    // Define a frequência de atualização: 200ms = 5 leituras por segundo.
    // Valores menores = mais fluido, mas consome mais bateria.
    Accelerometer.setUpdateInterval(200);

    // Registra o listener: callback chamado a cada nova leitura do sensor.
    // "measurement" é um objeto com x, y, z (em g) e timestamp.
    subscription.current = Accelerometer.addListener((measurement) => {
      setData(measurement);    // Atualiza o estado com a nova leitura
      checkShake(measurement); // NOVO: verifica se essa leitura representa uma chacoalhada
    });

    setIsRunning(true); // Atualiza a UI para mostrar que está capturando
  };

  // ── Pausar captura ─────────────────────────────────────────────────────────
  const pausar = () => {
    // Remove o listener — para de receber leituras do sensor
    subscription.current?.remove();
    subscription.current = null; // Limpa a referência para permitir reinício
    setIsRunning(false);         // Atualiza a UI para mostrar que está pausado
  };

  // ── Zerar valores ──────────────────────────────────────────────────────────
  // Reseta apenas os valores exibidos — não para a captura se estiver rodando
  const zerar = () => {
    setData(ZERO); // Substitui os dados pelo objeto de zeros
  };

  // ── Magnitude vetorial ─────────────────────────────────────────────────────
  // Calcula a força total combinando os três eixos.
  // Fórmula: √(x² + y² + z²)
  // Em repouso horizontal: ~1g (gravidade terrestre no eixo Z)
  // Em queda livre: ~0g | Sacudindo vigorosamente: > 2g
  const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

  return (
    <View style={styles.screen}>

      {/* NOVO: CameraView invisível (1x1px, fora da área visível) usada
          apenas como "controle remoto" da lanterna via enableTorch.
          Só é montada se a permissão de câmera foi concedida. */}
      {cameraPermission?.granted && (
        <CameraView style={styles.hiddenCamera} facing="back" enableTorch={torchOn} />
      )}

      {/* Cabeçalho: título e descrição da tela */}
      <View style={styles.heading}>
        <Text style={styles.title}>Movimento do aparelho</Text>
        <Text style={styles.subtitle}>
          Valores de aceleração em cada eixo, medidos em força g.
        </Text>
      </View>

      {/* Renderização condicional: sensor ausente → aviso | disponível → conteúdo */}
      {isAvailable === false ? (
        // Aviso exibido quando o acelerômetro não está disponível
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Sensor indisponível</Text>
          <Text style={styles.warningText}>
            Este dispositivo não possui um acelerômetro acessível.
          </Text>
        </View>
      ) : (
        // Fragmento vazio (<>) agrupa múltiplos filhos sem criar um elemento extra no DOM
        <>
          {/* Cards lado a lado para os eixos X, Y e Z */}
          <View style={styles.axes}>
            {/* Cada AxisCard recebe o nome do eixo, seu valor atual e a cor de destaque */}
            <AxisCard axis="X" value={data.x} color="#B12727" />{/* Vermelho */}
            <AxisCard axis="Y" value={data.y} color="#25883E" />{/* Verde   */}
            <AxisCard axis="Z" value={data.z} color="#376FA3" />{/* Azul    */}
          </View>

          {/* Card da magnitude total — combina os três eixos em um único valor */}
          <View style={styles.magnitudeCard}>
            <View>
              <Text style={styles.magnitudeLabel}>MAGNITUDE TOTAL</Text>
              <Text style={styles.magnitudeHint}>Combinação dos três eixos</Text>
            </View>
            {/* .toFixed(3): exibe sempre 3 casas decimais para consistência visual */}
            <Text style={styles.magnitudeValue}>{magnitude.toFixed(3)} g</Text>
          </View>

          {/* Linha de status: captura em andamento/pausada + estado da lanterna */}
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  // Cor dinâmica: verde se capturando, cinza se pausado
                  { backgroundColor: isRunning ? "#25883E" : "#66706A" },
                ]}
              />
              <Text style={styles.statusText}>
                {isRunning ? "Captura em andamento" : "Captura pausada"}
              </Text>
            </View>

            {/* NOVO: indicador do estado da lanterna */}
            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: torchOn ? "#E0A63A" : "#66706A" },
                ]}
              />
              <Text style={styles.statusText}>
                {torchOn ? "Lanterna ligada" : "Lanterna desligada"}
              </Text>
            </View>
          </View>

          {/* Botões de controle: Iniciar (verde) e Pausar (contorno verde) */}
          <View style={styles.controls}>

            {/* Botão Iniciar: desabilitado se já estiver rodando ou sem sensor */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isRunning && styles.disabledButton, // Aplica estilo de desabilitado condicionalmente
              ]}
              onPress={iniciar}
              disabled={isRunning || isAvailable !== true}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Iniciar leitura do acelerômetro"
            >
              <Text style={styles.primaryButtonText}>Iniciar</Text>
            </TouchableOpacity>

            {/* Botão Pausar: desabilitado se não estiver capturando */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                !isRunning && styles.disabledButton, // Desabilitado quando não está rodando
              ]}
              onPress={pausar}
              disabled={!isRunning}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Pausar leitura do acelerômetro"
            >
              <Text style={styles.secondaryButtonText}>Pausar</Text>
            </TouchableOpacity>
          </View>

          {/* Botão de zerar: reseta os valores sem parar a captura */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={zerar}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Zerar valores do acelerômetro"
          >
            <Text style={styles.resetButtonText}>Zerar valores</Text>
          </TouchableOpacity>

          {/* Dica de uso para o usuário entender o valor esperado */}
          <Text style={styles.helpText}>
            Apoie o aparelho sobre uma superfície estável para observar cerca de 1 g no eixo vertical.{"\n"}
            Chacoalhe o aparelho para ligar ou desligar a lanterna.
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Componente auxiliar AxisCard ─────────────────────────────────────────────
// Exibe o valor de aceleração de um único eixo com badge colorido e unidade.
// Recebe: axis (letra), value (número), color (cor do badge).
function AxisCard({ axis, value, color }: { axis: string; value: number; color: string }) {
  return (
    // accessibilityLabel torna o card legível por leitores de tela
    <View style={styles.axisCard} accessibilityLabel={`Eixo ${axis}: ${value.toFixed(3)} g`}>

      {/* Badge colorido com a letra do eixo (X, Y ou Z) */}
      <View style={[styles.axisBadge, { backgroundColor: color, shadowColor: color }]}>
        <Text style={styles.axisLetter}>{axis}</Text>
      </View>

      {/* Valor numérico com 3 casas decimais */}
      <Text style={styles.axisValue}>{value.toFixed(3)}</Text>

      {/* Unidade de medida */}
      <Text style={styles.axisUnit}>g</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Tela principal: fundo cinza-claro e padding uniforme
  screen: {
    flex: 1,
    backgroundColor: "#F6F7F8",
    padding: 20,
  },

  // NOVO: CameraView "fantasma" — 1x1px e posicionada fora da área
  // visível, existe só para dar acesso à prop enableTorch (lanterna).
  hiddenCamera: {
    position: "absolute",
    width: 1,
    height: 1,
    top: -100,
    left: -100,
  },

  // Bloco de cabeçalho
  heading: {
    marginBottom: 24,
  },

  // Título principal da tela
  title: {
    fontSize: 28,        // Levemente maior — mais presença
    fontWeight: "800",   // Peso extra-negrito — visual mais moderno
    color: "#18211B",
    letterSpacing: -0.5, // Aproxima as letras — look mais "tech"
  },

  // Subtítulo explicativo
  subtitle: {
    fontSize: 15,
    color: "#66706A",
    lineHeight: 22,
    marginTop: 6,
  },

  // Container dos três cards de eixo lado a lado
  axes: {
    flexDirection: "row",
    gap: 12, // Levemente maior — respiro entre os cards
  },

  // Card individual de cada eixo (X, Y ou Z)
  axisCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,        // Cantos mais arredondados — visual mais suave/moderno
    paddingVertical: 22,
    alignItems: "center",
    // Sombra suave no lugar da borda fina — dá sensação de profundidade (iOS)
    shadowColor: "#18211B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,             // Equivalente à sombra no Android
  },

  // Badge circular colorido com a letra do eixo
  axisBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // Sombra colorida (mesma cor do badge) — efeito de "glow" sutil
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  // Letra dentro do badge (X, Y ou Z)
  axisLetter: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  // Valor numérico do eixo (ex.: "0.982")
  axisValue: {
    color: "#18211B",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // Unidade de medida "g" abaixo do valor
  axisUnit: {
    color: "#66706A",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  // Card da magnitude total (linha horizontal com rótulo e valor)
  magnitudeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 14,
    gap: 12,
    shadowColor: "#18211B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Rótulo "MAGNITUDE TOTAL"
  magnitudeLabel: {
    color: "#66706A",       // Agora em cinza — vira um "eyebrow label"
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,     // Espaçamento entre letras — efeito "label" moderno
  },

  // Texto auxiliar "Combinação dos três eixos"
  magnitudeHint: {
    color: "#18211B",       // Trocado de posição visual com o label acima
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  // Valor numérico da magnitude (ex.: "1.024 g")
  magnitudeValue: {
    color: "#25883E",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // Linha do indicador de status — agora com 2 itens (captura + lanterna)
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  // NOVO: agrupa um ponto + texto (usado 2x: captura e lanterna)
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Ponto circular de status
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  // Texto de status
  statusText: {
    color: "#66706A",
    fontSize: 13,
    fontWeight: "600",
  },

  // Linha com os botões Iniciar e Pausar lado a lado
  controls: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  // Estilo base compartilhado pelos dois botões de controle
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Botão primário: fundo verde sólido (Iniciar)
  primaryButton: {
    backgroundColor: "#25883E",
    shadowColor: "#25883E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Texto do botão primário
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Botão secundário: contorno verde sem fundo (Pausar)
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#25883E",
  },

  // Texto do botão secundário
  secondaryButtonText: {
    color: "#25883E",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Estilo de botão desabilitado
  disabledButton: {
    opacity: 0.45,
  },

  // Botão de zerar
  resetButton: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  // Texto do botão de zerar
  resetButtonText: {
    color: "#66706A",
    fontSize: 15,
    fontWeight: "600",
  },

  // Texto de dica de uso no final da tela
  helpText: {
    color: "#66706A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 18,
  },

  // Card de aviso: sensor não disponível
  warningCard: {
    backgroundColor: "#FCF2F2",
    borderWidth: 1,
    borderColor: "#F0C9C9",
    borderRadius: 14,
    padding: 18,
  },

  // Título do aviso
  warningTitle: {
    color: "#B12727",
    fontSize: 16,
    fontWeight: "700",
  },

  // Corpo do texto do aviso
  warningText: {
    color: "#7A4545",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
});