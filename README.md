# 💈 Barber Booking AI

Sistema intelligente di gestione appuntamenti per barbieri con AI **Groq GRATUITA**.

![Demo](https://via.placeholder.com/800x400?text=Barber+Booking+AI)

## ✨ Funzionalità

- 📅 **Calendario Settimanale** - Vista completa con navigazione
- 🤖 **AI Assistant con Groq** - Prenotazioni in linguaggio naturale (GRATIS!)
- ⚙️ **Configurazione Completa** - Servizi, orari, prezzi personalizzabili
- 💾 **Storage Persistente** - I dati rimangono salvati
- 📱 **Responsive Design** - Funziona su mobile, tablet, desktop
- ⚡ **Velocissimo** - Powered by Groq LPU

## 🚀 Demo Live

👉 **[Prova l'app](https://barber-booking-ai.vercel.app)**

## 💰 Costi

- ✅ **Frontend**: Gratuito (Vercel)
- ✅ **Backend**: Gratuito (Vercel Serverless)
- ✅ **AI Groq**: Gratuito fino a 14.400 richieste/giorno
- ✅ **Totale**: **€0/mese** 🎉

## 🛠️ Tecnologie

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **AI**: Groq API (Llama 3.3 70B)
- **Backend**: Vercel Serverless Functions
- **Storage**: Browser Local Storage API
- **Deploy**: Vercel

## 📦 Installazione Locale
```bash
# 1. Clona il repository
git clone https://github.com/TUO-USERNAME/barber-booking-ai.git
cd barber-booking-ai

# 2. Installa dipendenze
npm install

# 3. Avvia in sviluppo
npm run dev

# 4. Apri http://localhost:5173
```

## 🔑 Configurazione API Key

1. Vai su [console.groq.com](https://console.groq.com)
2. Crea un account gratuito
3. Genera una API Key
4. Inseriscila nella sezione "Configurazione" dell'app

## 🚀 Deploy su Vercel

### Deploy Automatico

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TUO-USERNAME/barber-booking-ai)

### Deploy Manuale
```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Deploy in produzione
vercel --prod
```

## 📁 Struttura Progetto
```
barber-booking-ai/
├── api/
│   └── chat.js          # Serverless proxy per Groq
├── src/
│   ├── App.jsx          # Componente principale
│   ├── main.jsx         # Entry point
│   └── index.css        # Stili Tailwind
├── public/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json          # Configurazione Vercel
└── README.md
```

## 🎯 Come Funziona
```
User Input → React Frontend → Vercel Serverless Function → Groq API → Response
```

Il backend proxy risolve i problemi CORS e mantiene l'API key sicura.

## 🔒 Sicurezza

- ✅ API Key mai esposta nel frontend
- ✅ Proxy backend per tutte le chiamate AI
- ✅ CORS configurato correttamente
- ✅ Nessun dato sensibile nel repository

## 📈 Roadmap

- [ ] Multi-barbiere support
- [ ] Notifiche SMS/Email
- [ ] Sistema di pagamento
- [ ] Database clienti
- [ ] App mobile (React Native)
- [ ] Analytics e report
- [ ] Export calendario
- [ ] Integrazione Google Calendar

## 🤝 Contribuire

Contributi benvenuti! 

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Apri una Pull Request

## 📄 Licenza

MIT License - Libero per uso commerciale e personale

## 👨‍💻 Autore

Creato con ❤️ per i barbieri

## 🙏 Crediti

- [Groq](https://groq.com) - AI Infrastructure
- [Vercel](https://vercel.com) - Hosting & Serverless
- [Lucide](https://lucide.dev) - Icons
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

⭐ Se ti piace il progetto, lascia una stella su GitHub!