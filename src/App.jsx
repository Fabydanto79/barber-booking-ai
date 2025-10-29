import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Settings, Bot, User, Scissors, DollarSign, Save, Plus, Trash2 } from 'lucide-react';

const BarberBookingSystem = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [config, setConfig] = useState({
    shopName: 'Il Mio Barbiere',
    apiKey: '',
    workHours: { start: '09:00', end: '19:00' },
    workDays: [1, 2, 3, 4, 5, 6],
    services: [
      { id: 1, name: 'Taglio Classico', duration: 30, price: 25 },
      { id: 2, name: 'Taglio + Barba', duration: 45, price: 35 },
      { id: 3, name: 'Barba', duration: 20, price: 15 },
      { id: 4, name: 'Taglio Bambino', duration: 20, price: 18 }
    ]
  });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const configData = await window.storage.get('barber-config');
      const appointmentsData = await window.storage.get('barber-appointments');
      
      if (configData) {
        setConfig(JSON.parse(configData.value));
      }
      if (appointmentsData) {
        setAppointments(JSON.parse(appointmentsData.value));
      }
    } catch (error) {
      console.log('Primo avvio - nessun dato salvato');
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set('barber-config', JSON.stringify(config));
      await window.storage.set('barber-appointments', JSON.stringify(appointments));
      alert('✅ Configurazione salvata con successo!');
    } catch (error) {
      alert('❌ Errore nel salvataggio');
    }
  };

  const getWeekDays = () => {
    const week = [];
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    if (!config.apiKey || config.apiKey.trim() === '') {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Errore: Chiave API non configurata. Vai in "Configurazione" e inserisci la tua API Key di Groq.' 
      }]);
      return;
    }

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAIProcessing(true);

    try {
      // Chiamata al backend proxy invece che direttamente a Groq
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: config.apiKey,
          messages: [
            {
              role: 'system',
              content: `Sei l'assistente AI di un barbiere. Il negozio si chiama "${config.shopName}".

APPUNTAMENTI ESISTENTI:
${JSON.stringify(appointments, null, 2)}

SERVIZI DISPONIBILI:
${config.services.map(s => `- ${s.name}: ${s.duration}min, €${s.price}`).join('\n')}

ORARI: ${config.workHours.start} - ${config.workHours.end}

Se l'utente vuole prenotare, rispondi SOLO con un oggetto JSON in questo formato:
{
  "action": "book",
  "appointment": {
    "clientName": "nome cliente",
    "service": "nome servizio esatto dalla lista",
    "date": "YYYY-MM-DD",
    "time": "HH:MM"
  }
}

Se vuoi solo rispondere senza prenotare, rispondi SOLO con:
{
  "action": "reply",
  "message": "tua risposta"
}

IMPORTANTE: Rispondi SOLO con JSON valido, niente altro testo prima o dopo.`
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore API');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      
      let cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanResponse);
        
        if (parsed.action === 'book') {
          const service = config.services.find(s => s.name === parsed.appointment.service);
          if (service) {
            const newAppointment = {
              id: Date.now(),
              ...parsed.appointment,
              duration: service.duration,
              price: service.price
            };
            const updatedAppointments = [...appointments, newAppointment];
            setAppointments(updatedAppointments);
            await window.storage.set('barber-appointments', JSON.stringify(updatedAppointments));
            setChatMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `✅ Perfetto! Ho prenotato ${parsed.appointment.service} per ${parsed.appointment.clientName} il ${parsed.appointment.date} alle ${parsed.appointment.time}. Vai nel Calendario per vederlo!` 
            }]);
          } else {
            setChatMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `❌ Errore: Servizio "${parsed.appointment.service}" non trovato. Servizi disponibili: ${config.services.map(s => s.name).join(', ')}` 
            }]);
          }
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: parsed.message }]);
        }
      } catch (e) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanResponse 
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Errore: ${error.message}. Verifica la tua API Key Groq.` 
      }]);
    }
    
    setIsAIProcessing(false);
  };

  const deleteAppointment = async (id) => {
    const updated = appointments.filter(apt => apt.id !== id);
    setAppointments(updated);
    await window.storage.set('barber-appointments', JSON.stringify(updated));
  };

  const addService = () => {
    const newService = {
      id: Date.now(),
      name: 'Nuovo Servizio',
      duration: 30,
      price: 20
    };
    setConfig(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const updateService = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      services: prev.services.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const deleteService = (id) => {
    setConfig(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scissors className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">{config.shopName}</h1>
                <p className="text-amber-100">Sistema di Gestione AI</p>
              </div>
            </div>
            <div className="text-right text-white">
              <p className="text-sm opacity-90">Orario: {config.workHours.start} - {config.workHours.end}</p>
              <p className="text-sm opacity-90">{appointments.length} appuntamenti attivi</p>
              {!config.apiKey && (
                <p className="text-xs text-red-300 mt-1 font-semibold">⚠️ API Key non configurata</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-2 mb-6">
          <div className="flex gap-2">
            {[
              { id: 'calendar', icon: Calendar, label: 'Calendario' },
              { id: 'ai', icon: Bot, label: 'Assistente AI' },
              { id: 'settings', icon: Settings, label: 'Configurazione' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="bg-slate-800 rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Calendario Settimanale</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  ← Settimana Prec.
                </button>
                <button
                  onClick={() => setCurrentWeek(new Date())}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Oggi
                </button>
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Settimana Succ. →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {getWeekDays().map((day, idx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isWorkDay = config.workDays.includes(day.getDay());
                
                return (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 min-h-[300px] ${
                      isToday(day)
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-500'
                        : isWorkDay
                        ? 'bg-slate-700'
                        : 'bg-slate-700/30'
                    }`}
                  >
                    <div className="text-center mb-3">
                      <p className={`font-bold ${isToday(day) ? 'text-amber-400' : 'text-white'}`}>
                        {formatDate(day)}
                      </p>
                      {!isWorkDay && (
                        <span className="text-xs text-slate-400">Chiuso</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {dayAppointments.map(apt => (
                        <div
                          key={apt.id}
                          className="bg-slate-600 rounded-lg p-2 text-sm group relative"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </p>
                              <p className="text-amber-400 text-xs mt-1">{apt.clientName}</p>
                              <p className="text-slate-300 text-xs">{apt.service}</p>
                              <p className="text-emerald-400 text-xs">€{apt.price}</p>
                            </div>
                            <button
                              onClick={() => deleteAppointment(apt.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Assistant */}
        {activeTab === 'ai' && (
          <div className="bg-slate-800 rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Bot className="w-8 h-8 text-amber-500" />
              Assistente AI
            </h2>
            
            <div className="bg-slate-700 rounded-lg p-4 mb-4 h-[500px] overflow-y-auto">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-400 mt-20">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Ciao! Sono l'assistente AI del barbiere.</p>
                  <p className="text-sm mt-2">Chiedi di prenotare un appuntamento o informazioni sui servizi!</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-600 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isAIProcessing && (
                <div className="text-left">
                  <div className="inline-block bg-slate-600 text-white p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                placeholder="Es: 'Vorrei prenotare un taglio domani alle 15:00 per Mario Rossi'"
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isAIProcessing}
              />
              <button
                onClick={handleAIChat}
                disabled={isAIProcessing}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
              >
                Invia
              </button>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-slate-800 rounded-xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Impostazioni Generali</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-2">Nome Negozio</label>
                  <input
                    type="text"
                    value={config.shopName}
                    onChange={(e) => setConfig({...config, shopName: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2 font-semibold">
                    🔑 Chiave API Groq
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (Obbligatoria per l'Assistente AI)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    placeholder="gsk_..."
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                  />
                  <div className="mt-2 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <p className="text-xs text-blue-300 mb-1">
                      <strong>📖 Come ottenere la chiave API:</strong>
                    </p>
                    <ol className="text-xs text-blue-200 space-y-1 ml-4 list-decimal">
                      <li>Vai su <a href="https://console.groq.com" target="_blank" className="underline font-semibold">console.groq.com</a></li>
                      <li>Crea un account (se non ne hai uno)</li>
                      <li>Vai in "API Keys" e clicca "Create API Key"</li>
                      <li>Copia la chiave e incollala qui sopra</li>
                    </ol>
                    <p className="text-xs text-blue-200 mt-2">
                      💰 <strong>Vantaggi Groq:</strong> GRATUITO fino a 14.400 richieste/giorno! 🎉
                    </p>
                    <p className="text-xs text-emerald-300 mt-1">
                      ⚡ Ultra veloce - Risposte quasi istantanee!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2">Orario Apertura</label>
                    <input
                      type="time"
                      value={config.workHours.start}
                      onChange={(e) => setConfig({
                        ...config,
                        workHours: {...config.workHours, start: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2">Orario Chiusura</label>
                    <input
                      type="time"
                      value={config.workHours.end}
                      onChange={(e) => setConfig({
                        ...config,
                        workHours: {...config.workHours, end: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-slate-800 rounded-xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Servizi</h2>
                <button
                  onClick={addService}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  <Plus className="w-5 h-5" />
                  Aggiungi Servizio
                </button>
              </div>

              <div className="space-y-3">
                {config.services.map(service => (
                  <div key={service.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-3 items-center">
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                        placeholder="Nome servizio"
                        className="px-3 py-2 bg-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="number"
                        value={service.duration}
                        onChange={(e) => updateService(service.id, 'duration', parseInt(e.target.value))}
                        placeholder="Durata (min)"
                        className="px-3 py-2 bg-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(service.id, 'price', parseFloat(e.target.value))}
                        placeholder="Prezzo (€)"
                        className="px-3 py-2 bg-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => deleteService(service.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveData}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 shadow-xl flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              Salva Configurazione
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberBookingSystem;
