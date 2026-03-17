import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Folder, PlusCircle, Briefcase, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import './App.css';

const ResumeTracker = () => {
  // We use a specific versioned key to avoid conflicts with previous versions
  const STORAGE_KEY = 'job_tracker_final_v1';
  
  const [applications, setApplications] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [form, setForm] = useState({ name: '', link: '', status: 'Applied', file: null });

  // 1. Load Data ONLY ONCE on initial mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setApplications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // 2. Save data whenever the applications list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const connectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
    } catch (e) { 
      console.log("User cancelled folder selection"); 
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!dirHandle) {
      return alert("⚠️ Action Required: Please click 'Connect Save Folder' at the top right before adding a new application!");
    }
    
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Rename the file: Company_Date_Resume.pdf
    const fileExtension = form.file.name.split('.').pop();
    const cleanCompanyName = form.name.replace(/[^a-z0-9]/gi, '_');
    const newFileName = `${cleanCompanyName}_${today.replace(/ /g, '_')}_Resume.${fileExtension}`;

    try {
      const fileHandle = await dirHandle.getFileHandle(newFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(form.file);
      await writable.close();

      const newApp = { 
        id: Date.now(), 
        name: form.name,
        link: form.link,
        status: form.status,
        resumeName: newFileName,
        dateAdded: today 
      };

      setApplications(prev => [newApp, ...prev]);
      setForm({ name: '', link: '', status: 'Applied', file: null });
      e.target.reset(); 
      
    } catch (err) {
      alert("Error: Access was denied. Please re-connect the folder.");
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <Briefcase size={28} color="#2563eb" />
          <h1 style={{margin: 0}}>Job Application Tracker</h1>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          {/* Status Indicator */}
          <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: dirHandle ? '#10b981' : '#f59e0b'}}>
            {dirHandle ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
            {dirHandle ? "Folder Active" : "Folder Disconnected"}
          </div>
          
          <button onClick={connectFolder} className="btn-connect" style={{border: dirHandle ? '2px solid #10b981' : '1px solid #fde68a'}}>
            <Folder size={18} /> 
            {dirHandle ? `Storage: ${dirHandle.name}` : "Connect Save Folder"}
          </button>
        </div>
      </header>

      <section className="entry-panel">
        <h2>Enter New Application</h2>
        <form onSubmit={handleAdd}>
          <div className="grid-fields">
            <div className="form-group">
              <label>Company Name</label>
              <input required placeholder="e.g. Dotnix" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Application Link</label>
              <input type="url" placeholder="https://..." value={form.link} onChange={e => setForm({...form, link: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Current Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option>Applied</option>
                <option>Interviewing</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label>Resume Selection</label>
              <input type="file" required onChange={e => setForm({...form, file: e.target.files[0]})} />
            </div>
          </div>

          <div className="action-row">
            <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>
              {dirHandle ? "✅ Ready to save to local folder." : "⚠️ Please connect folder before clicking Add."}
            </p>
            <button type="submit" className="btn-submit" disabled={!dirHandle}>
              <PlusCircle size={18} /> Add to Tracker
            </button>
          </div>
        </form>
      </section>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date Added</th>
              <th>Company</th>
              <th>Link</th>
              <th>Status</th>
              <th>Resume File</th>
              <th style={{textAlign: 'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td style={{fontSize: '0.85rem', color: '#64748b'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Calendar size={14} /> {app.dateAdded}
                  </div>
                </td>
                <td style={{fontWeight: '600'}}>{app.name}</td>
                <td>
                  <a href={app.link} target="_blank" rel="noreferrer" style={{color: '#2563eb', textDecoration: 'none'}}>
                    Open <ExternalLink size={12} />
                  </a>
                </td>
                <td>
                  <span className={`badge status-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
                <td style={{color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic'}}>{app.resumeName}</td>
                <td style={{textAlign: 'center'}}>
                  <button className="delete-btn" onClick={() => setApplications(prev => prev.filter(a => a.id !== app.id))}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>No records found in LocalStorage.</div>}
      </div>
    </div>
  );
};

export default ResumeTracker;