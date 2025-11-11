// LiveLink/client/src/pages/Emissor.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const Emissor: React.FC = () => {
  const socket = useSocket(); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Pronto para conectar');
  const [estaConectado, setEstaConectado] = useState<boolean>(false);
  const [usandoCameraFrontal, setUsandoCameraFrontal] = useState<boolean>(true);
  const [videoEstaAtivo, setVideoEstaAtivo] = useState<boolean>(true); 
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const videoSenderRef = useRef<RTCRtpSender | null>(null); 
  
  const videoTrackRef = useRef<MediaStreamTrack | null>(null); 

  const fecharConexao = useCallback((resetStatus: boolean = true) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    videoSenderRef.current = null;
    videoTrackRef.current = null;
    setEstaConectado(false);
    setVideoEstaAtivo(true);
    if (resetStatus) setStatus('Desconectado. Pronto para reconectar.');
  }, []);

  const trocarCamera = useCallback(async (isFrontal: boolean) => {
    if (!peerConnectionRef.current || !videoSenderRef.current || !localStreamRef.current) {
      console.log("Ainda não conectado, não é possível trocar a câmera.");
      return;
    }

    setStatus('Trocando câmera...');
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontal ? 'user' : 'environment',
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      const newVideoTrack: MediaStreamTrack = newStream.getVideoTracks()[0];

      await videoSenderRef.current!.replaceTrack(newVideoTrack);
      
      localStreamRef.current.getVideoTracks().forEach(track => track.stop());
      
      const newLocalStream = new MediaStream([newVideoTrack]);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newLocalStream;
      }
      localStreamRef.current = newLocalStream;
      
      videoTrackRef.current = newVideoTrack;
      videoTrackRef.current.enabled = videoEstaAtivo; 
      
      setStatus(isFrontal ? 'Usando Câmera Frontal' : 'Usando Câmera Traseira');

    } catch (err: any) {
      console.error("Erro ao trocar câmera:", err);
      let mensagemErro = `Erro ao trocar: ${err.message}`;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        mensagemErro = "Erro: Permissão da câmera bloqueada.";
      } else if (err.name === 'NotReadableError') {
        mensagemErro = "Erro: A câmera já está sendo usada por outro app.";
      }
      setStatus(mensagemErro);
    }
  }, [videoEstaAtivo]);

  const iniciarConexao = useCallback(async (isFrontal: boolean) => {
    fecharConexao(false);

    try {
      setStatus('1. Pedindo permissão da câmera...');
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontal ? 'user' : 'environment',
          height: { ideal: 1080 },
          frameRate: { ideal: 30 } 
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream; 
      videoTrackRef.current = stream.getVideoTracks()[0]; 
      
      setStatus('2. Câmera OK. Criando conexão...');

      const servers: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(servers);

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        const sender: RTCRtpSender = peerConnectionRef.current!.addTrack(track, stream);
        if (track.kind === 'video') {
          videoSenderRef.current = sender;
        }
      });

      peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate);
        }
      };
      
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        if (state === 'connected') {
            setStatus('Conectado!');
            setEstaConectado(true);
        } else if (state === 'disconnected' || state === 'closed' || state === 'failed') {
            setStatus('Receptor desconectou.');
            fecharConexao(false);
        }
      };

      const offer: RTCSessionDescriptionInit = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      setStatus('3. Enviando oferta para o PC...');
      socket.emit('offer', offer);

    } catch (err: any) {
      console.error("Erro no Emissor:", err);
      let mensagemErro = `Erro: ${err.message}`;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        mensagemErro = "Erro: Você bloqueou a permissão da câmera.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        mensagemErro = "Erro: Nenhuma câmera foi encontrada.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        mensagemErro = "Erro: A câmera já está sendo usada por outro app.";
      }
      setStatus(mensagemErro);
      fecharConexao(false);
    }
  }, [fecharConexao, socket]);

  useEffect(() => {
    if (!socket) return;
    
    console.log("Configurando ouvintes do socket Emissor...");
    
    const onAnswerReceived = async (answer: RTCSessionDescriptionInit) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'have-local-offer') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Emissor: Resposta aceita!');
        } catch (err) {
          console.error("Falha ao setar RemoteDescription:", err);
        }
      }
    };

    const onIceCandidateReceived = (candidate: RTCIceCandidateInit) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        try {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Erro ao adicionar ICE candidate:", err);
        }
      }
    };
    
    const onUserDisconnected = () => {
        setStatus('Receptor desconectou.');
        fecharConexao();
    };

    const onTrocarCameraRemoto = () => {
        console.log('Comando de trocar câmera recebido do Receptor!');
        setUsandoCameraFrontal(prev => !prev); 
    };

    socket.on('answer-received', onAnswerReceived);
    socket.on('ice-candidate-received', onIceCandidateReceived);
    socket.on('user-disconnected', onUserDisconnected);
    socket.on('trocar-camera-remoto', onTrocarCameraRemoto);

    return () => {
      console.log("Limpando ouvintes...");
      socket.off('answer-received', onAnswerReceived);
      socket.off('ice-candidate-received', onIceCandidateReceived);
      socket.off('user-disconnected', onUserDisconnected);
      socket.off('trocar-camera-remoto', onTrocarCameraRemoto);
      fecharConexao();
    };
  }, [socket, fecharConexao]);

  const handleConectar = () => {
    iniciarConexao(usandoCameraFrontal);
  };

  const handleTrocarCameraLocal = () => {
    const novoEstadoFrontal = !usandoCameraFrontal;
    setUsandoCameraFrontal(novoEstadoFrontal);
    if (estaConectado) {
      trocarCamera(novoEstadoFrontal);
    }
  };

  const handleToggleVideo = () => {
    if (videoTrackRef.current) {
      const novoEstadoAtivo = !videoEstaAtivo;
      videoTrackRef.current.enabled = novoEstadoAtivo;
      setVideoEstaAtivo(novoEstadoAtivo);
      setStatus(novoEstadoAtivo ? (usandoCameraFrontal ? 'Usando Câmera Frontal' : 'Usando Câmera Traseira') : 'Câmera Pausada');
    }
  };

  return (
    <div className="container">
      <h1>LiveLink Emissor</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="video-player"
      />
      <p className="status-text">{status}</p>

      <div className="button-group">
        <button 
          onClick={handleConectar}
          className={`action-button ${estaConectado ? 'hidden' : ''}`}
        >
          <span className="material-icons">cast</span> Conectar
        </button>

        <button
          onClick={handleToggleVideo}
          className={`action-button ${!estaConectado ? 'hidden' : ''}`}
          title={videoEstaAtivo ? 'Pausar Câmera' : 'Retomar Câmera'}
        >
          <span className="material-icons">
            {videoEstaAtivo ? 'videocam' : 'videocam_off'}
          </span>
          {videoEstaAtivo ? 'Pausar' : 'Retomar'}
        </button>

        <button 
          onClick={handleTrocarCameraLocal}
          className={`action-button ${!estaConectado ? 'hidden' : ''}`}
          title="Trocar Câmera (Frontal/Traseira)"
        >
          <span className="material-icons">switch_camera</span> 
          {usandoCameraFrontal ? 'Frontal' : 'Traseira'}
        </button>
      </div>
    </div>
  );
}

export default Emissor;