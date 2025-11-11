# 📱➡️💻 LiveLink

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-D00000?style=for-the-badge&logo=webrtc&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

O **LiveLink** transforma seu smartphone em uma **webcam sem fio de alta qualidade** para o seu PC (compatível com OBS, Teams, Zoom, etc.).  
Use o poder da câmera do seu celular para streaming e videochamadas, sem cabos, através de uma conexão **WebRTC P2P (ponto-a-ponto)** de baixa latência.

![Demonstração do LiveLink](client/src/assets/Primeiro%20Teste.gif)

---

## 📚 Sumário
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura (Como Funciona?)](#arquitetura-como-funciona)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar o Projeto](#como-executar-o-projeto)
- [Próximos Passos (Roadmap)](#próximos-passos-roadmap)
- [Licença](#-licença)
- [Autor e Contribuições](#-autor-e-contribuições)

---

##  Funcionalidades

* **Streaming P2P de Baixa Latência:** Conexão direta entre o celular e o PC usando WebRTC para performance máxima.
* **Troca de Câmera Instantânea:** Alterne entre a câmera frontal e traseira sem renegociar a conexão (usando `replaceTrack`).
* **Pausa de Vídeo:** Pause a transmissão a qualquer momento sem derrubar a chamada.
* **Controle Remoto:** O Receptor (PC) pode enviar um comando para o Emissor (Celular) trocar de câmera.
* **Interface Limpa:** UI moderna, elegante e responsiva, feita com React.
* **Tratamento de Erros:** Feedback claro para o usuário em caso de permissões negadas ou falhas de mídia.

---

##  Tecnologias Utilizadas

* **Cliente (Emissor/Receptor):** React (Vite), React Router
* **Comunicação Real-Time:**
  * **WebRTC (`RTCPeerConnection`):** Para o streaming de mídia P2P.
  * **Socket.io Client:** Para a sinalização (handshake) inicial.
* **Servidor (Sinalização):** Node.js, Express, Socket.io
* **HTTPS:** Certificados SSL locais (`mkcert`) para permitir `getUserMedia` em dispositivos móveis.

---

##  Arquitetura (Como Funciona?)

O projeto utiliza um servidor de sinalização (Socket.io) apenas para o "aperto de mão" inicial. O streaming de vídeo **não passa** pelo servidor.

1. O **Servidor de Sinalização** (Node/Socket.io) atua como um mensageiro para que os dois clientes se encontrem.
2. O **Receptor (PC)** entra na página e informa que está pronto para receber uma oferta.
3. O **Emissor (Celular)** captura a mídia (`getUserMedia`) e cria uma **Oferta** (SDP) de conexão.
4. O servidor repassa a **Oferta** ao Receptor.
5. O Receptor gera uma **Resposta** (SDP) e devolve ao servidor.
6. O servidor entrega a **Resposta** ao Emissor.
7. Ambos trocam **Candidatos ICE** (endereços IP possíveis).
8. Uma conexão **direta (P2P)** é estabelecida e o vídeo flui diretamente.

![Fluxo de Sinalização WebRTC](client/src/assets/webrtc-diagram.png)

---

## 📁 Estrutura do Projeto

```bash
LiveLink/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── assets/
│   └── vite.config.js
├── server/              # Servidor de Sinalização (Node.js + Socket.io)
│   ├── index.js
│   ├── localhost+1.pem
│   └── localhost+1-key.pem
└── README.md
```

---

##  Como Executar o Projeto

### Pré-requisitos

* Node.js (v16 ou superior)
* Dois dispositivos na mesma rede (ex: PC e Celular no mesmo Wi-Fi)

### 1. Clonar o Repositório

```bash
git clone https://github.com/ErosNicolino/LiveLink-WebRTC
cd LiveLink
```

### 2. Configurar o Servidor de Sinalização (`/server`)

```bash
cd server
npm install
npm start
```
O servidor estará rodando em `http://localhost:4000`.

### 3. Configurar o Cliente (`/client`)

```bash
cd client
npm install
```

### 4. ⚠️ Certificados SSL (Obrigatório)

O WebRTC e a API `getUserMedia` exigem HTTPS em dispositivos móveis.

**Gerando certificados locais com mkcert:**

```bash
mkcert -install
mkcert -key-file ../server/localhost+1-key.pem -cert-file ../server/localhost+1.pem "localhost" "127.0.0.1" "::1" "SEU_IP_DA_REDE_LOCAL"
```

Descubra seu IP com `ipconfig` (Windows) ou `ifconfig` (Mac/Linux).

### 5. Iniciar o Cliente

```bash
npm run dev
```

### 6. Acessar o App

Vite mostrará uma URL parecida com `https://192.168.x.x:5173/`.

- **No PC (Receptor):** `https://localhost:5173/receptor`
- **No Celular (Emissor):** `https://192.168.x.x:5173/`

Clique em **"Conectar"** e o streaming começará!

---

##  Próximos Passos (Roadmap)

- [ ] Migrar o projeto para TypeScript
- [ ] Adicionar compartilhamento de tela do celular
- [ ] Permitir múltiplas câmeras (ultrawide, telephoto)
- [ ] Mostrar feedback visual no Receptor (“Aguardando conexão...”)

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

##  Autor e Contribuições

Desenvolvido por **Eros Nicolino** — apaixonado por soluções criativas de vídeo, streaming e tecnologia.

Contribuições são bem-vindas!  
Abra uma *issue* ou envie um *pull request*.
