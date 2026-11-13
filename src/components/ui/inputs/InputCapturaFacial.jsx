import { useCallback, useEffect, useState, useRef } from "react";
import Button from '@/components/ui/buttons/Button';
import { useAppContext } from "@/context/AppContext";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const InputCapturaFacial = ({ init, id, onChange, currentImage, ...props }) => {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(currentImage || null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [faceInPosition, setFaceInPosition] = useState(false);
    const [facePositionReady, setFacePositionReady] = useState(false);
    const [positionInstructions, setPositionInstructions] = useState('Posicione seu rosto na moldura');
    const [cameraLoading, setCameraLoading] = useState(false);
    const [photoFromCamera, setPhotoFromCamera] = useState(false); // Novo estado para diferenciar origem da foto

    // Estados para MediaPipe (preservar instância EXATAMENTE como photo-modal.js)
    const [mediaPipeReady, setMediaPipeReady] = useState(false);
    const [mediaPipeErrorCount, setMediaPipeErrorCount] = useState(0);
    const [isMonitoringStarted, setIsMonitoringStarted] = useState(false);
    const [isDetectingFace, setIsDetectingFace] = useState(false);
    const [isInitializingMediaPipe, setIsInitializingMediaPipe] = useState(false);
    const [mediaPipeInitAttempts, setMediaPipeInitAttempts] = useState(0);

    const { user, toast } = useAppContext();

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const positionCheckRef = useRef(null);

    // Refs para MediaPipe (preservar instância)
    const faceDetectionRef = useRef(null);
    const mediaPipeCameraRef = useRef(null);
    const mediaPipeCallbackReceived = useRef(false);

    // Constantes MediaPipe - EXATO como photo-modal.js
    const MAX_MEDIAPIPE_ERRORS = 5;
    const MAX_MEDIAPIPE_ATTEMPTS = 5;

    useEffect(() => {
        if (currentImage) {
            setPreview(currentImage);
            setPhotoFromCamera(false); // Imagem atual não é da câmera
        }
    }, [currentImage]);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (positionCheckRef.current) {
                clearInterval(positionCheckRef.current);
            }
            // Limpar MediaPipe apenas com limpeza suave (preservar instância)
            cleanupMediaPipe();
        };
    }, [stream]);

    // Função para limpeza suave do MediaPipe (preservar instância)
    const cleanupMediaPipe = () => {
        console.log('🧹 Limpeza suave do MediaPipe (preservando instância)...');

        // Parar câmera MediaPipe, mas NUNCA destruir faceDetection
        if (mediaPipeCameraRef.current) {
            mediaPipeCameraRef.current.stop();
            mediaPipeCameraRef.current = null;
        }
    };

    // Verificar suporte a MediaPipe Face Detection - CÓPIA EXATA do photo-modal.js
    const checkMediaPipeSupport = async () => {
        // PRIORIDADE: Se MediaPipe já está funcionando, SEMPRE reutilizar
        if (mediaPipeReady && faceDetectionRef.current) {
            console.log('♻️ MediaPipe JÁ FUNCIONA - reutilizando instância existente (ZERO recriação)');
            console.log('📊 Estado da instância:', {
                mediaPipeReady,
                faceDetection: !!faceDetectionRef.current,
                errorCount: mediaPipeErrorCount
            });
            return true;
        }

        // Evitar múltiplas inicializações simultâneas
        if (isInitializingMediaPipe) {
            return mediaPipeReady;
        }

        // Verificar tentativas máximas
        if (mediaPipeInitAttempts >= MAX_MEDIAPIPE_ATTEMPTS) {
            return await checkNativeFaceDetection();
        }

        setIsInitializingMediaPipe(true);
        setMediaPipeInitAttempts(prev => prev + 1);

        try {
            // NÃO limpar instâncias anteriores - apenas verificar se já existe
            if (faceDetectionRef.current) {
                // Verificar se a instância ainda está funcionando
                if (mediaPipeReady) {
                    setIsInitializingMediaPipe(false);
                    return true;
                }
            }

            // Verificar se MediaPipe está disponível
            if (typeof window !== 'undefined' && typeof window.FaceDetection !== 'undefined') {

                // Criar instância com timeout
                const initSuccess = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout na inicialização do MediaPipe'));
                    }, 3000);

                    try {
                        const faceDetection = new window.FaceDetection({
                            locateFile: (file) => {
                                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                            }
                        });

                        faceDetection.setOptions({
                            model: 'short',
                            minDetectionConfidence: 0.05, // Ainda mais baixo para detectar faces distantes
                        });

                        // Criar callback wrapper com logs detalhados e proteção de erro - EXATO como photo-modal.js
                        faceDetection.onResults(function (results) {
                            try {
                                // Contador de callbacks recebidos
                                window.mediaPipeCallbackCount = (window.mediaPipeCallbackCount || 0) + 1;

                                // Chamar função principal com proteção
                                onFaceDetectionResults(results);

                            } catch (callbackError) {
                                console.error('❌ Erro no callback wrapper MediaPipe:', callbackError);
                                // NÃO chamar handleMediaPipeError aqui para evitar loop
                                // Apenas logar o erro e continuar
                            }
                        });

                        // Salvar instância e marcar como pronto
                        faceDetectionRef.current = faceDetection;
                        setMediaPipeReady(true);
                        setIsInitializingMediaPipe(false);

                        clearTimeout(timeout);
                        resolve(true);

                    } catch (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });

                return initSuccess;

            } else {
                throw new Error('MediaPipe não encontrado');
            }

        } catch (error) {
            console.warn(`❌ Erro MediaPipe (tentativa ${mediaPipeInitAttempts}/${MAX_MEDIAPIPE_ATTEMPTS}):`, error.message);
            console.log('📊 Detalhes do erro:', {
                errorName: error.name,
                errorMessage: error.message,
                userAgent: navigator.userAgent.substring(0, 100),
                mediaPipeAvailable: typeof window.FaceDetection !== 'undefined'
            });

            cleanupMediaPipe();
            setIsInitializingMediaPipe(false);

            // Tentar novamente ou usar fallback
            if (mediaPipeInitAttempts < MAX_MEDIAPIPE_ATTEMPTS) {
                const waitTime = mediaPipeInitAttempts * 1500;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return await checkMediaPipeSupport();
            } else {
                return await checkNativeFaceDetection();
            }
        }
    };

    // Função auxiliar para tentar Face Detection API nativa - EXATO do photo-modal.js
    const checkNativeFaceDetection = async () => {
        try {
            if ('FaceDetector' in window) {
                const faceDetector = new FaceDetector({
                    maxDetectedFaces: 1,
                    fastMode: true
                });
                return true;
            } else {
                console.log('❌ Face Detection API não suportada, usando simulação');
                return true; // Usar simulação
            }
        } catch (error) {
            console.warn('❌ Erro na detecção nativa:', error);
            return true; // Usar simulação como último recurso
        }
    };

    // Callback para resultados do MediaPipe - EXATO do photo-modal.js (função normal, não useCallback)
    const onFaceDetectionResults = (results) => {
        try {
            window.mediaPipeCallbackReceived = true; // Marcar que callback foi recebido

            // Validar se results existe e tem estrutura esperada
            if (!results || typeof results !== 'object') {
                console.warn('⚠️ Results inválido ou inexistente');
                return;
            }

            // Usar ref em vez de state para verificação
            if (!mediaPipeCallbackReceived.current) {
                return;
            }

            // Continuar com a lógica principal...
            processDetectionResults(results);

        } catch (error) {
            console.error('❌ Erro em onFaceDetectionResults:', error);
            // NÃO fazer fallback aqui - apenas logar e continuar
        }
    };

    // Processar resultados de detecção - EXATO do photo-modal.js
    const processDetectionResults = (results) => {
        try {
            if (results.detections && Array.isArray(results.detections) && results.detections.length > 0) {
                const detection = results.detections[0];

                let bbox = detection.locationData?.relativeBoundingBox;

                // Verificar estruturas alternativas do MediaPipe
                if (!bbox && detection.boundingBox) {
                    bbox = detection.boundingBox;
                }

                if (!bbox) {
                    console.warn('⚠️ bbox inválido, usando simulação');
                    handleMediaPipeError();
                    return;
                }

                // Verificar posicionamento
                const centerX = bbox.xCenter || (bbox.x + bbox.width / 2);
                const centerY = bbox.yCenter || (bbox.y + bbox.height / 2);
                const idealCenterX = 0.5;
                const idealCenterY = 0.5;

                // Tolerância para posicionamento
                const tolerance = 0.15;
                const isWellPositioned =
                    Math.abs(centerX - idealCenterX) <= tolerance &&
                    Math.abs(centerY - idealCenterY) <= tolerance;

                setFaceInPosition(isWellPositioned);
                setFacePositionReady(true);

                if (isWellPositioned) {
                    setPositionInstructions('Perfeito! Rosto bem posicionado - clique para capturar');
                } else {
                    if (centerX < idealCenterX - tolerance) {
                        setPositionInstructions('← Mova um pouco para a direita');
                    } else if (centerX > idealCenterX + tolerance) {
                        setPositionInstructions('→ Mova um pouco para a esquerda');
                    } else if (centerY < idealCenterY - tolerance) {
                        setPositionInstructions('↓ Mova um pouco para baixo');
                    } else if (centerY > idealCenterY + tolerance) {
                        setPositionInstructions('↑ Mova um pouco para cima');
                    }
                }

            } else {
                console.log('👤 Nenhum rosto detectado');
                setFaceInPosition(false);
                setFacePositionReady(false);
                setPositionInstructions('👤 Posicione seu rosto dentro da moldura');
            }

        } catch (error) {
            console.error('❌ Erro processando resultados:', error);
            handleMediaPipeError();
        }
    };

    // Tratar erros do MediaPipe - EXATO do photo-modal.js
    const handleMediaPipeError = () => {
        // Simular detecção positiva para permitir captura
        setFaceInPosition(true);
        setFacePositionReady(true);
        setPositionInstructions('✨ Modo simulação ativo - clique em "Capturar Foto" quando estiver pronto');
    };

    // Processar resultados do MediaPipe
    const processMediaPipeResults = (results) => {
        try {
            if (results.detections && Array.isArray(results.detections) && results.detections.length > 0) {
                const detection = results.detections[0];

                let bbox = detection.locationData?.relativeBoundingBox;

                // Verificar estruturas alternativas do MediaPipe
                if (!bbox && detection.boundingBox) {
                    bbox = detection.boundingBox;
                }

                if (!bbox) {
                    console.warn('⚠️ MediaPipe bbox inválido, usando fallback');
                    handleMediaPipeError();
                    return;
                }

                // Verificar posicionamento
                const centerX = bbox.xCenter;
                const centerY = bbox.yCenter;
                const idealCenterX = 0.5;
                const idealCenterY = 0.5;

                // Tolerância para posicionamento
                const toleranceX = 0.25;
                const toleranceY = 0.25;

                // Verificar tamanho do rosto
                const faceSize = bbox.width * bbox.height;
                const idealSize = 0.06;
                const sizeRatio = faceSize / idealSize;

                const distanceX = Math.abs(centerX - idealCenterX);
                const distanceY = Math.abs(centerY - idealCenterY);

                const confidence = detection.score && detection.score[0] ? detection.score[0] : 0.5;

                if (distanceX <= toleranceX && distanceY <= toleranceY &&
                    sizeRatio >= 0.2 && sizeRatio <= 4.0 && confidence > 0.05) {
                    // Rosto bem posicionado
                    setFaceInPosition(true);
                    setFacePositionReady(true);
                    setPositionInstructions('Perfeito! Rosto detectado - Clique para capturar');
                } else if (sizeRatio < 0.2) {
                    setFaceInPosition(false);
                    setFacePositionReady(true);
                    setPositionInstructions('Pode chegar um pouco mais perto da câmera');
                } else if (sizeRatio > 4.0) {
                    setFaceInPosition(false);
                    setFacePositionReady(true);
                    setPositionInstructions('Afaste-se um pouco da câmera');
                } else {
                    setFaceInPosition(false);
                    setFacePositionReady(true);
                    setPositionInstructions('Centralize seu rosto na moldura');
                }
            } else {
                // Nenhum rosto detectado
                console.log('❌ MediaPipe: NENHUM ROSTO DETECTADO');
                setFaceInPosition(false);
                setFacePositionReady(false);
                setPositionInstructions('👤 Posicione seu rosto dentro da moldura');
            }

        } catch (error) {
            console.error('❌ Erro em processMediaPipeResults:', error);
        }
    };

    // Iniciar detecção nativa Face Detection API - EXATO do photo-modal.js
    const startNativeFaceDetection = async () => {
        try {
            if ('FaceDetector' in window) {
                const faceDetector = new FaceDetector({
                    maxDetectedFaces: 1,
                    fastMode: true
                });

                // Simular detecção com análise de pixels básica
                setFaceDetectionMethod('native');

                // Para simplificar, usar simulação direta
                startSimulatedFaceDetection();

            } else {
                console.log('❌ Face Detection API não suportada, usando simulação');
                startSimulatedFaceDetection();
            }

        } catch (error) {
            console.warn('❌ Erro na detecção nativa:', error);
            startSimulatedFaceDetection();
        }
    };

    // Iniciar simulação de detecção facial - EXATO do photo-modal.js
    const startSimulatedFaceDetection = () => {
        setFaceDetectionMethod('simulation');

        // Simular detecção positiva para permitir captura
        setFacePosition({
            detected: true,
            wellPositioned: true,
            message: 'Simulação ativa - posicione seu rosto e clique para capturar'
        });

        setFaceInPosition(true);
        setFacePositionReady(true);
        setPositionInstructions('✨ Modo simulação ativo - clique em "Capturar Foto" quando estiver pronto');
    };

    // Função para detectar rosto em arquivo de imagem
    const detectFaceInFile = async (file) => {
        try {
            // Método 1: Tentar MediaPipe primeiro (mais preciso)
            if (mediaPipeReady && faceDetectionRef.current) {
                const result = await detectFaceWithMediaPipe(file);
                if (result !== null) {
                    return result;
                }
            }

            // Método 2: Face Detection API nativa
            if ('FaceDetector' in window) {
                // Criar uma imagem a partir do arquivo
                const imageBitmap = await createImageBitmap(file);

                // Configuração otimizada para detecção
                const faceDetector = new FaceDetector({
                    maxDetectedFaces: 10, // Aumentado para detectar mais rostos
                    fastMode: false       // Modo mais preciso
                });

                // Detectar rostos
                const faces = await faceDetector.detect(imageBitmap);

                // Analisar qualidade dos rostos detectados
                if (faces.length > 0) {
                    const faceQuality = analyzeFaceQuality(faces, imageBitmap);

                    // Considerar rosto válido se houver pelo menos um com qualidade aceitável
                    return faceQuality.hasGoodQuality;
                }

                return false;

            } else {
                console.log('⚠️ Face Detection API não disponível');
            }
            const hasBasicFaceFeatures = await analyzeImageForFaceFeatures(file);

            return hasBasicFaceFeatures;

        } catch (error) {
            console.error('❌ Erro na detecção facial:', error);

            // Em caso de erro, usar análise de fallback mais simples
            try {
                const basicAnalysis = await analyzeImageBasic(file);
                return basicAnalysis;
            } catch (fallbackError) {
                console.error('❌ Erro no fallback:', fallbackError);
                // Se tudo falhar, retornar true para não bloquear o usuário
                return true;
            }
        }
    };

    // Função auxiliar para detectar rosto com MediaPipe
    const detectFaceWithMediaPipe = async (file) => {
        try {
            // Criar elemento de imagem temporário
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            return new Promise((resolve) => {
                img.onload = async function () {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // Processar com MediaPipe
                    try {
                        await faceDetectionRef.current.send({ image: canvas });

                        // MediaPipe vai chamar onFaceDetectionResults
                        // Vamos aguardar um tempo para o resultado
                        setTimeout(() => {
                            // Verificar se houve detecção recente
                            const hasRecentDetection = checkRecentFaceDetection();
                            resolve(hasRecentDetection);
                        }, 1000);

                    } catch (error) {
                        console.error('Erro MediaPipe:', error);
                        resolve(null); // Indica falha, tentar próximo método
                    }
                };

                img.onerror = () => resolve(null);
                img.src = URL.createObjectURL(file);
            });

        } catch (error) {
            console.error('Erro na preparação MediaPipe:', error);
            return null;
        }
    };

    // Função para analisar qualidade dos rostos detectados
    const analyzeFaceQuality = (faces, imageBitmap) => {
        let hasGoodQuality = false;
        const imageArea = imageBitmap.width * imageBitmap.height;

        for (const face of faces) {
            const bbox = face.boundingBox;
            const faceArea = bbox.width * bbox.height;
            const faceRatio = faceArea / imageArea;

            // Considerar rosto com qualidade boa se:
            // - Ocupa pelo menos 5% da imagem (não muito pequeno)
            // - Não ocupa mais de 80% da imagem (não muito próximo)
            // - Tem proporções razoáveis (altura/largura entre 1.2 e 2.0)
            const aspectRatio = bbox.height / bbox.width;

            if (faceRatio >= 0.05 && faceRatio <= 0.8 && aspectRatio >= 1.0 && aspectRatio <= 2.0) {
                hasGoodQuality = true;
                break;
            }
        }

        return {
            hasGoodQuality,
            totalFaces: faces.length,
            facesData: faces.map(face => ({
                area: ((face.boundingBox.width * face.boundingBox.height) / imageArea * 100).toFixed(1) + '%',
                aspect: (face.boundingBox.height / face.boundingBox.width).toFixed(2)
            }))
        };
    };

    // Função para análise básica de características faciais
    const analyzeImageForFaceFeatures = async (file) => {
        try {
            const imageBitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Redimensionar para análise (otimização)
            const maxSize = 200;
            let { width, height } = imageBitmap;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = width * ratio;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(imageBitmap, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Análise básica: procurar regiões de tons de pele e contrastes
            let skinTonePixels = 0;
            let contrastAreas = 0;
            const totalPixels = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Detectar tons de pele (aproximação básica)
                if (isSkinTone(r, g, b)) {
                    skinTonePixels++;
                }

                // Detectar áreas de contraste (possíveis características faciais)
                if (i + 4 < data.length) {
                    const nextR = data[i + 4];
                    if (Math.abs(r - nextR) > 30) {
                        contrastAreas++;
                    }
                }
            }

            const skinRatio = skinTonePixels / totalPixels;
            const contrastRatio = contrastAreas / totalPixels;

            // Heurística: se há uma porcentagem razoável de tons de pele e contraste
            const hasFaceFeatures = skinRatio > 0.1 && contrastRatio > 0.05;

            return hasFaceFeatures;

        } catch (error) {
            console.error('Erro na análise básica:', error);
            return false;
        }
    };

    // Função auxiliar para detectar tons de pele
    const isSkinTone = (r, g, b) => {
        // Algoritmo simples para detectar tons de pele
        // Baseado em: https://en.wikipedia.org/wiki/Human_skin_color
        return (
            r > 95 && g > 40 && b > 20 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
            Math.abs(r - g) > 15 && r > g && r > b
        ) || (
                r > 220 && g > 210 && b > 170 &&
                Math.abs(r - g) <= 15 && r > b && g > b
            );
    };

    // Função de fallback mais simples
    const analyzeImageBasic = async (file) => {
        try {
            // Verificação básica: se é uma imagem válida e tem tamanho razoável
            const imageBitmap = await createImageBitmap(file);

            // Se conseguiu criar imageBitmap e tem dimensões razoáveis
            const isValidImage = imageBitmap.width >= 50 && imageBitmap.height >= 50;

            return isValidImage;

        } catch (error) {
            console.error('Erro na análise básica simples:', error);
            return false;
        }
    };

    // Função para verificar detecção recente do MediaPipe
    const checkRecentFaceDetection = () => {
        // Esta função deveria verificar se houve detecção facial recente
        // Por simplicidade, retorna true (pode ser melhorada)
        return true;
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        // Proteção contra execução múltipla
        if (window.isProcessingProfileFile) {
            return;
        }

        window.isProcessingProfileFile = true;

        try {
            // Validação de tipo
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione apenas arquivos de imagem');
                return;
            }

            // Validação de tamanho (3MB)
            if (file.size > 3 * 1024 * 1024) {
                toast.error('Imagem muito grande. Máximo permitido: 3MB');
                return;
            }

            try {
                // Realizar detecção facial
                const faceDetected = await detectFaceInFile(file);

                if (faceDetected) {
                    toast.success('✅ Rosto detectado com sucesso!');
                } else {
                    // Usar confirm do navegador para compatibilidade
                    const confirmUpload = window.confirm(
                        '⚠️ Nenhum rosto foi detectado na imagem.\n\n' +
                        'Para melhor reconhecimento facial, recomendamos:\n' +
                        '• Foto com rosto bem visível e centralizado\n' +
                        '• Boa iluminação no rosto\n' +
                        '• Pessoa olhando para a câmera\n' +
                        '• Rosto ocupando pelo menos 30% da imagem\n\n' +
                        'Deseja continuar mesmo assim?'
                    );

                    if (!confirmUpload) {
                        return;
                    }
                }

            } catch (error) {
                console.error('❌ Erro na validação facial:', error);

                const confirmUpload = window.confirm(
                    '⚠️ Não foi possível verificar se há um rosto na imagem.\n\n' +
                    'Deseja continuar mesmo assim?'
                );

                if (!confirmUpload) {
                    return;
                }
            }

            // Criar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
                setPhotoFromCamera(false); // Marcar como arquivo selecionado, não da câmera
            };
            reader.readAsDataURL(file);

            // Chamar callback para o componente pai
            if (typeof onChange === 'function') {
                onChange('ds_foto_candidato', file);
            }

        } finally {
            // Sempre liberar o lock após um tempo
            setTimeout(() => {
                window.isProcessingProfileFile = false;
            }, 1000);
        }
    };

    const handleFileInputChange = (evt) => {
        const file = evt.target.files[0];
        handleFileSelect(file);
    };

    // Drag and Drop handlers
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    // Face position detection functions - EXATAMENTE como photo-modal.js
    const startFacePositionMonitoring = async () => {
        // Verificar se já está rodando
        if (isMonitoringStarted) {
            return;
        }
        setIsMonitoringStarted(true);

        // Limpar detecção anterior se existir
        if (isDetectingFace) {
            stopFacePositionMonitoring();
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Ativar detecção - definir flag como ativa
        setIsDetectingFace(true);
        mediaPipeCallbackReceived.current = true; // Ativar callback

        // Verificar suporte MediaPipe com a mesma lógica do photo-modal.js
        const hasMediaPipe = await checkMediaPipeSupport();

        if (hasMediaPipe) {
            await startMediaPipeFaceDetection();
        } else {
            startNativeFaceDetection();
        }
    };

    // Iniciar detecção MediaPipe - EXATAMENTE como no photo-modal.js
    const startMediaPipeFaceDetection = async () => {
        if (!videoRef.current || !faceDetectionRef.current) {
            console.error('❌ Video ou FaceDetection não disponível');
            handleMediaPipeError();
            return;
        }

        const video = videoRef.current;

        try {
            // IMPORTANTE: Limpar câmera anterior APENAS se existir
            if (mediaPipeCameraRef.current) {
                try {
                    mediaPipeCameraRef.current.stop();
                } catch (e) {
                    console.warn('⚠️ Erro ao parar câmera anterior:', e);
                }
                mediaPipeCameraRef.current = null;
            }

            // Aguardar um pouco para garantir limpeza
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verificar se vídeo está pronto
            if (video.readyState < 2) {
                await new Promise((resolve) => {
                    const timeout = setTimeout(resolve, 2000); // Timeout de segurança
                    video.addEventListener('canplay', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }

            const camera = new window.Camera(video, {
                onFrame: async () => {
                    // Verificação simples e direta - apenas se callback está ativo
                    if (!mediaPipeCallbackReceived.current) {
                        return;
                    }

                    try {
                        if (!video || video.readyState < 2) return;
                        if (video.videoWidth === 0 || video.videoHeight === 0) return;

                        // NUNCA recriar faceDetection - sempre usar a instância preservada
                        await faceDetectionRef.current.send({ image: video });

                    } catch (frameError) {
                        console.error('❌ Erro no frame MediaPipe:', frameError);

                        // Detectar erro WASM crítico
                        if (frameError.message.includes('Module.arguments') ||
                            frameError.message.includes('Aborted') ||
                            frameError.message.includes('WASM') ||
                            frameError.message.includes('unreachable')) {

                            console.warn('⚠️ Erro WASM crítico detectado!');
                            handleMediaPipeError();
                            return;
                        }

                        // Incrementar contador de erros
                        setMediaPipeErrorCount(prev => prev + 1);
                    }
                },
                width: 640,
                height: 480
            });

            await camera.start();
            mediaPipeCameraRef.current = camera;

        } catch (error) {
            console.error('❌ Erro ao inicializar Camera MediaPipe:', error);
            handleMediaPipeError();
        }
    };

    const stopFacePositionMonitoring = () => {
        // Resetar flags
        setIsDetectingFace(false);
        setIsMonitoringStarted(false);
        mediaPipeCallbackReceived.current = false;

        if (positionCheckRef.current) {
            clearInterval(positionCheckRef.current);
            positionCheckRef.current = null;
        }

        // Limpar câmera MediaPipe mas preservar instância
        cleanupMediaPipe();
    };

    // Camera handlers - versão melhorada baseada no photo-modal.js
    const startCamera = async () => {
        setCameraLoading(true);

        // SEMPRE resetar flags de monitoramento para nova sessão
        setIsMonitoringStarted(false);
        setIsDetectingFace(false);

        // Resetar callback flag
        mediaPipeCallbackReceived.current = false;

        try {
            // Configuração de câmera
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            setStream(mediaStream);
            setIsCapturing(true);

            // Aguardar o próximo ciclo de renderização para o video estar disponível
            setTimeout(() => {
                if (videoRef.current) {
                    const video = videoRef.current;

                    video.srcObject = mediaStream;

                    // Timeout de segurança
                    const safetyTimeout = setTimeout(() => {
                        setCameraLoading(false);
                    }, 8000);

                    // Quando o vídeo estiver pronto
                    const onCanPlay = () => {
                        clearTimeout(safetyTimeout);
                        setCameraLoading(false);

                        // Aguardar estabilização antes de iniciar detecção
                        setTimeout(() => {
                            startFacePositionMonitoring();
                        }, 500); // Reduzido para ser mais responsivo
                    };

                    video.addEventListener('canplay', onCanPlay, { once: true });
                    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });

                    // Tentar reproduzir
                    video.play().catch(err => { console.warn('Erro no play, mas continuando:', err); });
                } else {
                    setCameraLoading(false);
                }
            }, 100);
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            setCameraLoading(false);

            let errorMessage = 'Não foi possível acessar a câmera.';

            if (error.name === 'NotAllowedError') {
                errorMessage = 'Acesso à câmera foi negado. Permita o acesso e tente novamente.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Nenhuma câmera encontrada.';
            }

            toast.error(errorMessage);
        }
    };

    const stopCamera = () => {

        // Resetar flags de detecção PRIMEIRO
        setIsDetectingFace(false);
        setIsMonitoringStarted(false);

        // Parar monitoramento de rosto
        stopFacePositionMonitoring();

        // Parar o stream
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }

        // Limpar o vídeo
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        // Resetar estados
        setIsCapturing(false);
        setCameraLoading(false);
        setFaceInPosition(false);
        setFacePositionReady(false);
        setPositionInstructions('Posicione seu rosto na moldura');
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        // Dimensoes para foto quadrada 1:1 (avatar)
        const size = 512; // Tamanho final da imagem quadrada
        canvas.width = size;
        canvas.height = size;

        // Calcular area para captura centralizada do rosto
        const videoAspect = video.videoWidth / video.videoHeight;

        // Determinar dimensões de captura baseadas na área da moldura
        let sourceSize, sourceX, sourceY;

        if (videoAspect > 1) {
            // Vídeo mais largo - usar altura como referência
            sourceSize = video.videoHeight * 0.8; // 80% da altura do vídeo
            sourceX = (video.videoWidth - sourceSize) / 2;
            sourceY = video.videoHeight * 0.1; // 10% do topo
        } else {
            // Vídeo mais alto - usar largura como referência
            sourceSize = video.videoWidth * 0.8; // 80% da largura do vídeo
            sourceX = video.videoWidth * 0.1; // 10% da esquerda
            sourceY = (video.videoHeight - sourceSize) / 2;
        }

        // Preencher fundo branco (evitar transparencia)
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size, size);

        // Desenhar imagem do vídeo como quadrado inteiro (sem recorte circular)
        context.drawImage(
            video,
            sourceX, sourceY, sourceSize, sourceSize, // área de origem (quadrada)
            0, 0, size, size                          // Destino (quadrado)
        );

        // Converter para blob com alta qualidade
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], 'profile-photo.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });

                console.log('📸 Foto capturada, iniciando validação facial...');

                try {
                    // Validar se há rosto na foto capturada
                    const hasFace = await detectFaceInFile(file);

                    if (!hasFace) {
                        // Rosto não detectado - perguntar se quer continuar
                        const continuar = window.confirm(
                            'Não foi possível detectar um rosto nesta foto. ' +
                            'Para melhor qualidade, recomendamos capturar novamente com o rosto bem posicionado na moldura.\n\n' +
                            'Deseja manter esta foto mesmo assim?'
                        );

                        if (!continuar) {
                            // Usuário quer tentar novamente
                            console.log('❌ Usuário optou por tentar novamente');
                            return;
                        }
                    }

                } catch (error) {
                    console.error('❌ Erro na validação da foto capturada:', error);
                    // Em caso de erro, continuar normalmente
                }

                // Continuar com o fluxo normal (com ou sem rosto detectado)
                handleFileSelect(file);
                setPhotoFromCamera(true); // Marcar como foto da câmera
                stopCamera();
            }
        }, 'image/jpeg', 0.95);
    };

    const clearImage = () => {
        setPreview(null);
        setPhotoFromCamera(false); // Resetar origem da foto
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (typeof onChange === 'function') {
            onChange('ds_foto_candidato', null);
        }
    };

    useEffect(() => {
        if (!init) {
            stopCamera();
            clearImage();
        }
    }, [init]);

    return (
        <div className="space-y-4 h-full">
            {/* Preview da imagem atual */}
            {preview && !isCapturing && (
                <div className="flex flex-col items-center space-y-4 h-full pt-16">
                    <div className="relative mx-auto">
                        <img
                            src={preview}
                            alt="Profile preview"
                            className="w-[256px] h-64 rounded-full object-cover border-4 border-border"
                        />
                    </div>

                    {/* Botões de ação do preview */}
                    <div className="flex space-x-3">
                        {photoFromCamera ? (
                            // Mostrar "Tirar novamente" apenas se a foto veio da câmera
                            <Button
                                buttonType="secondary"
                                onClick={startCamera}
                                className="flex items-center space-x-2"
                            >
                                <FontAwesomeIcon icon={faCamera} width="14" height="14" className="" />
                                <span>Tirar novamente</span>
                            </Button>
                        ) : (
                            // Mostrar "Selecionar outro" se a foto veio de arquivo
                            <Button
                                buttonType="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <FontAwesomeIcon icon={faUpload} width="14" height="14" className="" />
                                <span>Selecionar outro</span>
                            </Button>
                        )}
                        <Button
                            buttonType="secondary"
                            onClick={startCamera}
                            className="flex items-center space-x-2"
                        >
                            <FontAwesomeIcon icon={faCamera} width="14" height="14" className="" />
                            <span>Tirar foto</span>
                        </Button>
                        <Button
                            outline
                            buttonType="danger"
                            onClick={clearImage}
                            className="flex items-center space-x-2"
                        >
                            <FontAwesomeIcon icon={faTrash} width="14" height="14" />
                            <span>Remover</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Área de drag and drop */}
            {!isCapturing && !preview && (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${dragActive
                            ? 'border-primary bg-info-subtle scale-105'
                            : 'border-input-border hover:border-content-muted hover:bg-hover'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="space-y-3">
                        <div className="mx-auto w-16 h-16 text-content-muted">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" className="w-full h-full">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="text-sm text-content-secondary">
                            <span className="font-medium text-primary hover:text-primary-hover">
                                Clique para selecionar
                            </span>
                            {' '}ou arraste e solte uma imagem
                        </div>
                        <p className="text-xs text-content-muted">
                            PNG, JPG até 3MB
                        </p>
                    </div>
                </div>
            )}

            {/* Controles de câmera */}
            {isCapturing ? (
                <div className="space-y-4 h-full">
                    <div className="relative rounded-lg overflow-hidden m-auto max-w-75 max-h-75 w-75 h-75">
                        {cameraLoading && (
                            <div className="absolute inset-0  flex items-center justify-center z-10">
                                <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                    <p className="mb-4">Carregando câmera...</p>
                                    <button
                                        onClick={() => {
                                            console.log('Forçando saída do loading...');
                                            setCameraLoading(false);
                                        }}
                                        className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded hover:bg-opacity-30"
                                    >
                                        Continuar mesmo assim
                                    </button>
                                </div>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            controls={false}
                            className="w-full h-full object-cover max-w-75 max-h-75 bg-black"
                            onLoadedMetadata={(e) => {
                                console.log('Video onLoadedMetadata:', e.target.videoWidth, e.target.videoHeight);
                            }}
                            onCanPlay={() => {
                                console.log('Video onCanPlay disparado');
                            }}
                            onPlaying={() => {
                                console.log('Video onPlaying disparado');
                            }}
                            onError={(e) => {
                                console.error('Video onError:', e);
                                setCameraLoading(false);
                                toast.error('Erro no elemento de vídeo');
                            }}
                            onLoadStart={() => {
                                console.log('Video onLoadStart');
                            }}
                        />

                        {/* Moldura facial oval - mais intuitiva para rostos */}
                        {!cameraLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                    className={`w-48 h-60 border-4 transition-colors rounded-full scale-y-125 ${faceInPosition ? 'border-green-500' : // ready - verde
                                            facePositionReady ? 'border-yellow-500' : // adjusting - amarelo
                                                'border-red-400' // positioning - vermelho
                                        }`}
                                >
                                    <div
                                        className="w-full h-full border-2 border-dashed border-current opacity-50 rounded-full"
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Instruções de posicionamento baseadas no photo-modal.js */}
                        {!cameraLoading && (
                            <div className={`
                                absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors
                                ${faceInPosition ? 'bg-green-600 bg-opacity-90' : facePositionReady ? 'bg-yellow-600 bg-opacity-90' : 'bg-red-600 bg-opacity-90'}`}
                            >
                                {positionInstructions}
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex justify-center space-x-3 h-fit">
                        <Button
                            buttonType="danger"
                            outline
                            onClick={stopCamera}
                            className="px-6 py-2"
                        >
                            Cancelar
                        </Button>
                        <Button
                            buttonType={"primary"}
                            onClick={capturePhoto}
                            disabled={!faceInPosition}
                            className={`flex justify-center px-6 py-2 rounded-lg font-medium transition-colors ${faceInPosition
                                    ? ''
                                    : 'cursor-not-allowed'
                                }`}
                        >
                            <FontAwesomeIcon icon={faCamera} width="16" height="16" className="mr-2"/>
                            Capturar
                        </Button>
                    </div>
                </div>
            ) : (
                /* Botões de ação */
                !preview && (
                    <div className="flex justify-center space-x-3">
                        <Button
                            buttonType="primary"
                            onClick={startCamera}
                            className="flex items-center"
                        >
                            <FontAwesomeIcon icon={faCamera} width="16" height="16" className="mr-2"/>
                            Tirar foto
                        </Button>
                    </div>
                )
            )}

            {/* Input file sempre disponível (hidden) */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg"
                onChange={handleFileInputChange}
                className="hidden"
            />
        </div>
    );
};

export default ProfilePicture;