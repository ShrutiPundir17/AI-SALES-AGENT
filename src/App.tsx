import { useState } from 'react';
import LeadForm from './components/LeadForm';
import ChatInterface from './components/ChatInterface';
import { LeadInfo } from './types';

function App() {
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
  const [leadId, setLeadId] = useState<string>('');

  const handleLeadSubmit = (info: LeadInfo) => {
    setLeadInfo(info);
    setLeadId(crypto.randomUUID());
  };

  const handleLogout = () => {
    setLeadInfo(null);
    setLeadId('');
  };

  if (!leadInfo || !leadId) {
    return <LeadForm onSubmit={handleLeadSubmit} />;
  }

  return (
    <ChatInterface
      leadInfo={leadInfo}
      leadId={leadId}
      onLogout={handleLogout}
    />
  );
}

export default App;
