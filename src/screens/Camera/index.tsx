import { useState, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import * as MediaLibrary from "expo-media-library";

import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
    CameraType,
    CameraMode,
} from "expo-camera";

type FlashMode = "off" | "on" | "auto";

export default function CameraScreen() {
    // =========================
    // PERMISSÕES
    // =========================

    const [cameraPermission, requestCameraPermission] =
        useCameraPermissions();

    const [micPermission, requestMicPermission] =
        useMicrophonePermissions();

    // Permissão somente para salvar mídia
    const [mediaPermission, requestMediaPermission] =
        MediaLibrary.usePermissions({
            writeOnly: true,
        });

    const [facing, setFacing] =
        useState<CameraType>("back");

    const [cameraMode, setCameraMode] =
        useState<CameraMode>("picture");

    const [isRecording, setIsRecording] =
        useState(false);

    const [isSaving, setIsSaving] =
        useState(false);

    const [flashMode, setFlashMode] =
        useState<FlashMode>("off");

    const cameraRef = useRef<CameraView>(null);


    useEffect(() => {
        (async () => {
            try {
                if (!cameraPermission?.granted) {
                    await requestCameraPermission();
                }

                if (!micPermission?.granted) {
                    await requestMicPermission();
                }

                if (!mediaPermission?.granted) {
                    await requestMediaPermission();
                }
            } catch (error) {
                console.error(
                    "Erro ao solicitar permissões:",
                    error
                );
            }
        })();
    }, []);

    const toggleCameraFacing = () => {
        setFacing((current) =>
            current === "back" ? "front" : "back"
        );
    };

    const toggleFlashMode = () => {
        setFlashMode((current) => {
            if (current === "off") {
                return "on";
            }

            if (current === "on") {
                return "auto";
            }

            return "off";
        });
    };

    const getFlashIcon = () => {
        if (flashMode === "on") {
            return "flash-on";
        }

        if (flashMode === "auto") {
            return "flash-auto";
        }

        return "flash-off";
    };


    const handleCameraMode = (
        mode: CameraMode
    ) => {
        setCameraMode(mode);

        if (isRecording) {
            setIsRecording(false);
            cameraRef.current?.stopRecording();
        }
    };


    const takeMedia = async () => {
        if (!cameraRef.current || isSaving) {
            return;
        }

        try {

            if (cameraMode === "picture") {
                setIsSaving(true);

                const foto =
                    await cameraRef.current.takePictureAsync({
                        quality: 1,
                        skipProcessing: false,
                    });

                if (foto?.uri) {
                    let hasPermission =
                        mediaPermission?.granted;

                    if (!hasPermission) {
                        const permissionResult =
                            await requestMediaPermission();

                        hasPermission =
                            permissionResult.granted;
                    }

                    if (!hasPermission) {
                        Alert.alert(
                            "Aviso",
                            "Permissão negada para salvar a foto na galeria."
                        );

                        setIsSaving(false);
                        return;
                    }

                    await MediaLibrary.createAssetAsync(
                        foto.uri
                    );

                    Alert.alert(
                        "Sucesso",
                        "Foto salva na galeria!"
                    );
                }

                setIsSaving(false);
            }


            else {
                if (isRecording) {
                    cameraRef.current.stopRecording();
                    return;
                }

                const microphonePermission =
                    await requestMicPermission();

                if (!microphonePermission?.granted) {
                    Alert.alert(
                        "Permissão necessária",
                        "A permissão do microfone é necessária para gravar vídeos."
                    );

                    return;
                }

                setIsRecording(true);

                const video =
                    await cameraRef.current.recordAsync();

                setIsRecording(false);

                if (video?.uri) {
                    await MediaLibrary.saveToLibraryAsync(
                        video.uri
                    );

                    Alert.alert(
                        "Sucesso",
                        "Vídeo salvo na galeria!"
                    );
                }
            }
        } catch (error) {
            setIsSaving(false);
            setIsRecording(false);

            console.error(
                "Erro ao capturar ou salvar mídia:",
                error
            );

            Alert.alert(
                "Erro",
                "Não foi possível capturar ou salvar a mídia."
            );
        }
    };

    if (!cameraPermission) {
        return (
            <View style={styles.container} />
        );
    }


    if (!cameraPermission.granted) {
        return (
            <View
                style={[
                    styles.container,
                    styles.centered,
                ]}
            >
                <Text style={styles.permissionText}>
                    Precisamos de permissão para acessar a câmera
                </Text>

                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestCameraPermission}
                >
                    <Text
                        style={styles.permissionButtonText}
                    >
                        Conceder Permissão
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {/* CÂMERA */}

            <CameraView
                style={StyleSheet.absoluteFill}
                ref={cameraRef}
                facing={facing}
                flash={flashMode}
                mode={cameraMode}
            />

            {/* INTERFACE SOBRE A CÂMERA */}

            <View style={styles.overlayContainer}>
                {/* BOTÕES SUPERIORES */}

                <View style={styles.topContainer}>
                    {/* FLASH */}

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleFlashMode}
                    >
                        <MaterialIcons
                            name={getFlashIcon()}
                            size={30}
                            color={
                                flashMode !== "off"
                                    ? "#FFD700"
                                    : "white"
                            }
                        />
                    </TouchableOpacity>

                    {/* TROCAR CÂMERA */}

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={toggleCameraFacing}
                    >
                        <MaterialIcons
                            name="cameraswitch"
                            size={30}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>

                {/* PARTE INFERIOR */}

                <View style={styles.bottomContainer}>
                    <View style={styles.controlsContainer}>
                        {/* SELETOR FOTO / VÍDEO */}

                        <View style={styles.modeSelector}>
                            {/* FOTO */}

                            <TouchableOpacity
                                onPress={() =>
                                    handleCameraMode(
                                        "picture"
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.modeText,
                                        cameraMode ===
                                            "picture" &&
                                            styles.modeTextSelected,
                                    ]}
                                >
                                    Foto
                                </Text>
                            </TouchableOpacity>

                            {/* VÍDEO */}

                            <TouchableOpacity
                                onPress={() =>
                                    handleCameraMode(
                                        "video"
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.modeText,
                                        cameraMode ===
                                            "video" &&
                                            styles.modeTextSelected,
                                    ]}
                                >
                                    Vídeo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* BOTÃO DE CAPTURA */}

                        <TouchableOpacity
                            style={[
                                styles.captureButton,
                                isRecording &&
                                    styles.captureButtonRecording,
                            ]}
                            onPress={takeMedia}
                            disabled={isSaving}
                        >
                            <View
                                style={[
                                    styles.captureInner,
                                    isRecording &&
                                        styles.captureInnerRecording,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

// =========================
// ESTILOS
// =========================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },

    centered: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between",
        backgroundColor: "transparent",
    },

    topContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 45,
    },

    iconButton: {
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: 10,
        borderRadius: 25,
    },

    bottomContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingBottom: 40,
    },

    controlsContainer: {
        alignItems: "center",
    },

    modeSelector: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },

    modeText: {
        color: "#888",
        fontSize: 16,
        fontWeight: "600",
    },

    modeTextSelected: {
        color: "white",
    },

    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },

    captureButtonRecording: {
        backgroundColor: "rgba(255,0,0,0.3)",
    },

    captureInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "white",
    },

    captureInnerRecording: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: "red",
    },

    permissionText: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 16,
    },

    permissionButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },

    permissionButtonText: {
        color: "white",
        fontWeight: "bold",
    },
});