// LiveLink/client/src/pages/Receptor.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const Receptor: React.FC = () => {
  const socket = useSocket();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Aguardando oferta do celular...'); 
  const [estaConectado, setEstaConectado] = useState<boolean>(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const remoteStreamRef = useRef<MediaStream | null>(null);

  const fecharConexao = useCallback(() => {
    setStatus('Emissor desconectou.');
    if (videoRef.current) videoRef.current.srcObject = null;

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setEstaConectado(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

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

    const criarConexao = () => {
      const pc: RTCPeerConnection = new RTCPeerConnection(servers);

      pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate);
        }
      };

      pc.ontrack = (event: RTCTrackEvent) => {
        setStatus('Stream recebido!');
        setEstaConectado(true);

        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }

        remoteStreamRef.current.addTrack(event.track);

        if (videoRef.current) {
          videoRef.current.srcObject = remoteStreamRef.current;
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc?.connectionState;
        if (state === 'disconnected' || state === 'closed' || state === 'failed') {
          fecharConexao();
        }
      };
      
      return pc;
    };

    const onOfferReceived = async (offer: RTCSessionDescriptionInit) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = criarConexao();
      
      setStatus('Oferta recebida. Criando resposta...');
      
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer: RTCSessionDescriptionInit = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);

      setStatus('Resposta enviada. Aguardando conexão...');
      socket.emit('answer', answer);
    };

    const onIceCandidateReceived = (candidate: RTCIceCandidateInit) => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Erro ao adicionar ICE candidate:", err);
        }
      }
    };
    
    const onUserDisconnected = () => {
        fecharConexao();
    };

    socket.on('offer-received', onOfferReceived);
    socket.on('ice-candidate-received', onIceCandidateReceived);
    socket.on('user-disconnected', onUserDisconnected);

    return () => {
      socket.off('offer-received', onOfferReceived);
      socket.off('ice-candidate-received', onIceCandidateReceived);
      socket.off('user-disconnected', onUserDisconnected);
      
      fecharConexao();
    };
  }, [socket, fecharConexao]);

  const handleTrocarCameraRemoto = () => {
      if (estaConectado) {
          console.log('Receptor: Enviando comando para trocar câmera no Emissor...');
          socket.emit('trocar-camera-remoto');
          setStatus('Comando de troca de câmera enviado...');
      }
  };

  return (
    <div className="container video-only-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline 
        className="video-player receptor-video"
      >
      </video>
      <button 
        onClick={handleTrocarCameraRemoto} 
        className={`action-button receptor-swap-button ${!estaConectado ? 'hidden' : ''}`}
        title="Trocar Câmera do Dispositivo Emissor"
      >
        <span className="material-icons">switch_camera</span>
      </button>
      
      {!estaConectado && (
          <p className="status-text" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
              {status}
          </p>
      )}
    </div>
  );
}

export default Receptor;