## App React + Express com Google Directions (Tráfego)

### Requisitos
- Node.js 18+
- Uma Google Maps Platform API Key com Directions API ativa

### Estrutura
- `server/`: Backend Express. Proxy seguro para Google Directions (usa `.env`).
- `client/`: Frontend React + Vite + Leaflet para mostrar mapa e rota.

### Configuração do Backend
1. Copiar `.env.example` para `.env` dentro de `server/` e preencher a sua key:
```
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
PORT=4000
```
2. Instalar dependências e arrancar:
```
cd server
npm install
npm run dev
```

### Configuração do Frontend
1. Noutro terminal:
```
cd client
npm install
npm run dev
```
2. Abrir `http://localhost:5173`.

### Utilização
- A app pede a localização do utilizador e centra o mapa.
- Introduza origem e destino (pode ser `lat,lng` ou endereço). Ex.: `38.7369,-9.1427` para Lisboa.
- Ao submeter, a rota é calculada via backend usando `traffic_model=best_guess` e `departure_time=now`.
- A rota é atualizada automaticamente a cada 30s.

### Notas
- A API key nunca é exposta no frontend; fica no servidor.
- O frontend usa OpenStreetMap via Leaflet para o mapa base.
- O proxy do Vite redireciona `/api/*` para `http://localhost:4000`.

