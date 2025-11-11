// LiveLink/client/src/pages/Receptor.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext'; 

function Receptor() {
  const socket = useSocket(); 
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Aguardando oferta do celular...'); 
  const [estaConectado, setEstaConectado] = useState(false);
  const peerConnectionRef = useRef(null);

  const fecharConexao = useCallback(() => {
    setStatus('Emissor desconectou.');
    if (videoRef.current) videoRef.current.srcObject = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setEstaConectado(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const servers = {
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
      const pc = new RTCPeerConnection(servers);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        setStatus('Stream recebido!');
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
        setEstaConectado(true);
      };
      
      pc.onconnectionstatechange = () => {
        const state = pc?.connectionState;
        if (state === 'disconnected' || state === 'closed' || state === 'failed') {
          fecharConexao();
        }
      };
      
      return pc;
    };

    const onOfferReceived = async (offer) => {
      if (peerConnectionRef.current) {
         peerConnectionRef.current.close();
      }
      peerConnectionRef.current = criarConexao();
      
      setStatus('Oferta recebida. Criando resposta...');
      
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      setStatus('Resposta enviada. Aguardando conexão...');
      socket.emit('answer', answer);
    };

    const onIceCandidateReceived = (candidate) => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Erro ao adicionar ICE candidate:", err);
        }
      }
    };
    
    socket.on('offer-received', onOfferReceived);
    socket.on('ice-candidate-received', onIceCandidateReceived);
    socket.on('user-disconnected', fecharConexao); 

    return () => {
      socket.off('offer-received', onOfferReceived);
      socket.off('ice-candidate-received', onIceCandidateReceived);
      socket.off('user-disconnected', fecharConexao);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
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
    </div>
  );
}

export default Receptor;