console.log("test");
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Play, Square, Plus, LogOut, User, Settings, PieChart, Download, Edit2, Trash2, Paperclip, X, Clock, LayoutDashboard, Activity, BarChart2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const API_BASE_URL = 'http://b803gdmhc8yrkopiipv2i43w.51.255.203.170.sslip.io';

const AuthContext = createContext(null);

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ff79c6', '#bd93f9', '#50fa7b'];

// --- AUTH PROVIDER ---
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData); setToken(jwtToken);
    localStorage.setItem('token', jwtToken); localStorage.setItem('user', JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
  };
  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated); localStorage.setItem('user', JSON.stringify(updated));
  };

  if (loading) return <div>Cargando...</div>;
  return <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

// --- LAYOUT (TOPBAR) ---
function AppLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const location = useLocation();

  return (
    <div className="app-layout">
      <div className="main-content" style={{marginLeft: 0, width: '100%', maxWidth: '100vw'}}>
        <header className="topbar" style={{justifyContent: 'space-between'}}>
          <div className="logo" style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <img src="/logo.png" alt="Pyramica Logo" style={{height:'65px', width:'auto', objectFit:'contain', transform:'scale(1.2)', transformOrigin:'left center'}} onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
            <h1 style={{display:'none', margin:0, fontSize:'1.5rem'}}>Pyramica<span> {isAdmin ? 'Master' : 'Mi Mesa'}</span></h1>
            <nav style={{display:'flex', gap:'10px', marginLeft:'30px'}}>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}><LayoutDashboard size={18}/> Tablero</Link>
              <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}><LayoutDashboard size={18}/> Proyectos</Link>
              {isAdmin && <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}><PieChart size={18}/> Reportes</Link>}
              {isAdmin && <Link to="/progress" className={`nav-link ${location.pathname === '/progress' ? 'active' : ''}`}><Activity size={18}/> Progreso Global</Link>}
              <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}><Clock size={18}/> Histórico</Link>
            </nav>
          </div>
          
          <div className="user-menu" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <Link to="/profile" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none', color:'white'}}>
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" style={{width:'35px', height:'35px', borderRadius:'50%', objectFit:'cover', border:'2px solid var(--panel-border)'}}/>
              ) : (
                <div style={{width:'35px', height:'35px', borderRadius:'50%', background:'var(--panel-border)', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={20} /></div>
              )}
              <span>{user.name}</span>
            </Link>
            <button onClick={logout} style={{background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor:'pointer'}} title="Cerrar Sesión"><LogOut size={20} /></button>
          </div>
        </header>
        <div style={{display:'flex', height:'calc(100vh - 70px)'}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function SearchableSelect({ options, value, onChange, placeholder, style }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selected = options.find(o => o.id === value);
    if (selected) setSearch(selected.name);
    else setSearch('');
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{position: 'relative', ...style}}>
      <input
        type="text"
        className="task-input"
        placeholder={placeholder}
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); onChange(''); }}
        onFocus={() => setIsOpen(true)}
        style={{width: '100%', boxSizing: 'border-box'}}
      />
      {isOpen && (
        <div style={{position:'absolute', top:'100%', left:0, right:0, background:'var(--panel-bg)', border:'1px solid var(--panel-border)', zIndex:100, maxHeight:'200px', overflowY:'auto', borderRadius:'4px', marginTop:'5px', boxShadow:'0 5px 15px rgba(0,0,0,0.5)'}}>
          {filtered.map(o => (
            <div key={o.id} style={{padding:'8px 12px', cursor:'pointer', color:'white'}} onClick={() => { onChange(o.id); setSearch(o.name); setIsOpen(false); }} onMouseEnter={e=>e.target.style.background='var(--active-color)'} onMouseLeave={e=>e.target.style.background='transparent'}>
              {o.name}
            </div>
          ))}
          {filtered.length === 0 && <div style={{padding:'8px 12px', color:'var(--text-muted)'}}>No hay resultados</div>}
        </div>
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const { login } = useContext(AuthContext);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const url = `${API_BASE_URL}/api/auth/login`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (res.ok) { login(data.user, data.token); navigate('/'); } 
        else setError(`Error de login: ${data.error}`);
      } catch (err) { 
        setError(`Diagnóstico:\nAPI_BASE_URL: "${API_BASE_URL}"\nURL: ${url}\nStatus: ${res.status}\nBody: ${text.substring(0, 150)}`);
      }
    } catch (err) { 
      setError(`Fetch/CORS Error:\nAPI_BASE_URL: "${API_BASE_URL}"\nURL: ${url}\nDetalle: ${err.message}`); 
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recover-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) { setRecoverMsg(data.message); setError(''); }
      else { setError(data.error); setRecoverMsg(''); }
    } catch (err) { setError('Error de conexión'); }
  };

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column'}}>
      <div className="glass-panel" style={{padding:'2.5rem', width:'380px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <img src="/logo.png" alt="Pyramica Logo" style={{width:'80%', marginBottom:'2rem', objectFit:'contain'}} onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
        <h2 style={{display:'none', textAlign:'center', marginBottom:'1.5rem'}}>Pyramica SaaS</h2>
        
        {error && <div className="alert-red" style={{padding:'10px', marginBottom:'15px', borderRadius:'4px', width:'100%', textAlign:'center', background:'rgba(255,85,85,0.1)', color:'#ff5555', border:'1px solid #ff5555', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{error}</div>}
        {recoverMsg && <div style={{padding:'10px', marginBottom:'15px', borderRadius:'4px', width:'100%', textAlign:'center', background:'rgba(80, 250, 123, 0.1)', color:'#50fa7b', border:'1px solid #50fa7b'}}>{recoverMsg}</div>}
        
        {!isRecovering ? (
          <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'1.2rem', width:'100%'}}>
            <input type="email" placeholder="Email (ej. admin@erp.com)" value={email} onChange={e=>setEmail(e.target.value)} required className="form-group input" style={{padding:'12px', background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--panel-border)', borderRadius:'8px', outline:'none'}}/>
            <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required className="form-group input" style={{padding:'12px', background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--panel-border)', borderRadius:'8px', outline:'none'}}/>
            <button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Iniciar Sesión</button>
            <p style={{textAlign:'center', marginTop:'10px', fontSize:'0.85rem', color:'var(--text-muted)'}}>
              <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => {setIsRecovering(true); setError(''); setRecoverMsg('');}}>¿Has olvidado tu contraseña?</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRecover} style={{display:'flex', flexDirection:'column', gap:'1.2rem', width:'100%'}}>
            <p style={{textAlign:'center', color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'10px'}}>Introduce tu email y te enviaremos instrucciones para recuperar tu contraseña.</p>
            <input type="email" placeholder="Tu Email" value={email} onChange={e=>setEmail(e.target.value)} required className="form-group input" style={{padding:'12px', background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--panel-border)', borderRadius:'8px', outline:'none'}}/>
            <button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Recuperar Contraseña</button>
            <p style={{textAlign:'center', marginTop:'10px', fontSize:'0.85rem', color:'var(--text-muted)'}}>
              <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => {setIsRecovering(false); setError(''); setRecoverMsg('');}}>Volver a Iniciar Sesión</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState({ tasks: {}, columns: { 'todo': { id: 'todo', title: 'Por Hacer', taskIds: [] }, 'inProgress': { id: 'inProgress', title: 'En Progreso', taskIds: [] }, 'done': { id: 'done', title: 'Terminado', taskIds: [] } }, columnOrder: ['todo', 'inProgress', 'done'], timeEntries: [], projectTimes: {}, clients: [] });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);

  const [impersonateUserId, setImpersonateUserId] = useState('');

  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const [newTaskContent, setNewTaskContent] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('maintenance');
  const [newProjectHours, setNewProjectHours] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('Media');

  // Manual Time Input
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  
  const [showArchived, setShowArchived] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0088FE');

  const fetchData = () => {
    fetch(`${API_BASE_URL}/data`)
      .then(res => res.json())
      .then(fetchedData => {
        setUsers(fetchedData.users);
        setProjects(fetchedData.projects);
        
        const newTasks = {};
        const newColumns = { 'todo': { id: 'todo', title: 'Por Hacer', taskIds: [] }, 'inProgress': { id: 'inProgress', title: 'En Progreso', taskIds: [] }, 'done': { id: 'done', title: 'Terminado', taskIds: [] } };

        const parsedTasks = fetchedData.tasks.map(t => ({...t, userIds: JSON.parse(t.userIds || '[]'), attachments: JSON.parse(t.attachments || '[]'), tags: JSON.parse(t.tags || '[]')}));
        
        let visibleTasks = parsedTasks;
        if (isAdmin && impersonateUserId) {
          visibleTasks = parsedTasks.filter(t => t.userIds.includes(impersonateUserId));
        } else if (!isAdmin) {
          visibleTasks = parsedTasks.filter(t => t.userIds.includes(user.id));
        }

        // Final filter for archival
        visibleTasks = visibleTasks.filter(t => showArchived ? t.archived === 1 : (t.archived === 0 || !t.archived));

        visibleTasks.forEach(task => {
          // Calculate total time from entries
          const taskEntries = fetchedData.timeEntries.filter(e => e.taskId === task.id);
          let filteredEntries = taskEntries;
          if (isAdmin && impersonateUserId) {
            filteredEntries = taskEntries.filter(e => e.userId === impersonateUserId);
          }
          const totalTime = filteredEntries.reduce((sum, e) => sum + e.timeAdded, 0);
          task.timeSpent = totalTime;

          newTasks[task.id] = task;
          const status = newColumns[task.status] ? task.status : 'todo';
          newColumns[status].taskIds.push(task.id);
        });

        const projectTimes = {};
        fetchedData.timeEntries.forEach(e => {
          const t = fetchedData.tasks.find(x => x.id === e.taskId);
          if (t && t.projectId) {
            if (!projectTimes[t.projectId]) projectTimes[t.projectId] = 0;
            projectTimes[t.projectId] += e.timeAdded;
          }
        });

        setData({ tasks: newTasks, columns: newColumns, columnOrder: ['todo', 'inProgress', 'done'], timeEntries: fetchedData.timeEntries, projectTimes, clients: fetchedData.clients || [] });
      });
  };

  useEffect(() => { fetchData(); }, [user.id, isAdmin, impersonateUserId, showArchived]);

  useEffect(() => {
    let interval = null;
    if (activeTaskId) interval = setInterval(() => setActiveTimerSeconds(prev => prev + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [activeTaskId]);

  const saveTimeEntry = async (taskId, secondsToAdd) => {
    try { 
      await fetch(`${API_BASE_URL}/tasks/${taskId}/time-entries`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: user.id, timeAdded: secondsToAdd }) 
      }); 
      fetchData(); // Refresh to get the new entry
    } catch(err) {}
  };

  const handlePlayStop = async (taskId) => {
    if (activeTaskId === taskId) {
      if (activeTimerSeconds > 0) await saveTimeEntry(taskId, activeTimerSeconds);
      setActiveTaskId(null); setActiveTimerSeconds(0);
    } else {
      if (activeTaskId && activeTimerSeconds > 0) {
        await saveTimeEntry(activeTaskId, activeTimerSeconds);
      }
      setActiveTaskId(taskId); setActiveTimerSeconds(0);
    }
  };

  const addManualTime = async () => {
    if (!editingTask) return;
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const totalSeconds = (h * 3600) + (m * 60);
    if (totalSeconds > 0) {
      await saveTimeEntry(editingTask.id, totalSeconds);
      setManualHours(''); setManualMinutes('');
    }
  };

  const deleteTimeEntry = async (entryId) => {
    if(!window.confirm("¿Seguro que quieres borrar este registro de tiempo?")) return;
    try {
      await fetch(`${API_BASE_URL}/time-entries/${entryId}`, { method: 'DELETE' });
      fetchData();
    } catch(err) {}
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      setData({ ...data, columns: { ...data.columns, [startColumn.id]: { ...startColumn, taskIds: newTaskIds } } });
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);

    setData({ ...data, columns: { ...data.columns, [startColumn.id]: { ...startColumn, taskIds: startTaskIds }, [finishColumn.id]: { ...finishColumn, taskIds: finishTaskIds } } });
    try { fetch(`${API_BASE_URL}/tasks/${draggableId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: finishColumn.id }) }); } catch(err) {}
  };



  const deleteProject = async (id) => {
    if(!window.confirm("¿Seguro que quieres borrar este proyecto? Se borrarán TODAS sus tareas asociadas.")) return;
    await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const startEditProject = (p) => {
    setEditingProject(p);
    setNewProjectName(p.name); setNewProjectType(p.type); setNewProjectHours(p.assignedHours || '');
    setNewProjectStartDate(p.startDate || ''); setNewProjectEndDate(p.endDate || '');
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !selectedProjectId) return alert("Selecciona un proyecto y escribe una tarea.");
    const finalUserIds = isAdmin ? (selectedUserIds.length > 0 ? selectedUserIds : [user.id]) : [user.id];
    try {
      await fetch(`${API_BASE_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newTaskContent, userIds: finalUserIds, projectId: selectedProjectId, priority: selectedPriority, status: 'todo' }) });
      setNewTaskContent('');
      fetchData();
    } catch (err) {}
  };

  const saveEditedTask = async () => {
    if (!editingTask) return;
    try {
      await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });
      setEditingTask(null);
      fetchData();
    } catch(e) {}
  };

  const uploadFile = async (e) => {
    if (!editingTask || !e.target.files.length) return;
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}/attachments`, { method: 'POST', body: formData });
      if (res.ok) {
        const d = await res.json();
        setEditingTask(prev => ({...prev, attachments: JSON.parse(d.attachments)}));
      }
    } catch(err) {}
  };

  const archiveTask = async (taskId, e) => {
    if(e) e.stopPropagation();
    if(!window.confirm("¿Archivar esta tarea terminada?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}/archive`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({archived: true}) });
      fetchData();
    } catch(err){}
  };

  const archiveProject = async (projectId) => {
    if(!window.confirm("¿Archivar este proyecto?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/projects/${projectId}/archive`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({archived: true}) });
      fetchData();
    } catch(err){}
  };

  const taskTimeEntries = editingTask ? data.timeEntries.filter(e => e.taskId === editingTask.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];

  return (
    <>


      <main className="board-container">
        {isAdmin && (
           <div style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
             <span style={{color:'var(--text-muted)'}}>Filtro de Supervisión:</span>
             <select className="task-input" value={impersonateUserId} onChange={e=>setImpersonateUserId(e.target.value)} style={{width:'200px'}}>
               <option value="">Todos los usuarios</option>
               {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
           </div>
        )}

        <div style={{marginBottom:'20px', background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'8px'}}>
           <form onSubmit={addTask} style={{display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap:'wrap'}}>
             <select className="task-input" style={{width: '150px'}} value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} required>
               <option value="">Proyecto...</option>
               {projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>

             {isAdmin && (
               <div style={{display:'flex', flexDirection:'column'}}>
                 <select className="task-input" style={{width: '150px'}} value={selectedUserIds.length > 0 ? selectedUserIds[0] : ""} onChange={(e) => {
                   if (e.target.value === "") {
                     setSelectedUserIds([]);
                   } else {
                     if (!selectedUserIds.includes(e.target.value)) setSelectedUserIds([...selectedUserIds, e.target.value]);
                   }
                 }}>
                   <option value="">Añadir persona...</option>
                   {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                 </select>
                 <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'5px'}}>
                   {selectedUserIds.map(id => {
                     const u = users.find(x=>x.id===id);
                     if(!u) return null;
                     return (
                       <span key={id} style={{fontSize:'0.7rem', background:'var(--active-color)', color:'#000', padding:'2px 8px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'5px'}}>
                         {u.name} <button type="button" onClick={(e)=>{e.preventDefault(); setSelectedUserIds(selectedUserIds.filter(x=>x!==id))}} style={{background:'none', border:'none', cursor:'pointer', padding:0, color:'#000'}}><X size={10}/></button>
                       </span>
                     )
                   })}
                 </div>
               </div>
             )}

             <select className="task-input" style={{width: '100px'}} value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
               <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
             </select>

             <input type="text" placeholder="Nueva tarea..." className="task-input" style={{flex:1, minWidth:'200px'}} value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} required />
             <button type="submit" className="btn-primary" style={{padding: '10px 20px'}}>Añadir Tarea</button>
          </form>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board" style={{paddingBottom: '60px'}}>
            {data.columnOrder.map(columnId => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

              return (
                <div className="kanban-column" key={column.id}>
                  <h3>{column.title} ({tasks.length})</h3>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
                        {tasks.map((task, index) => {
                          const isActive = task.id === activeTaskId;
                          const totalTime = isActive ? (task.timeSpent || 0) + activeTimerSeconds : (task.timeSpent || 0);
                          const taskProject = projects.find(p => p.id === task.projectId);
                          const pTime = data.projectTimes ? data.projectTimes[task.projectId] : 0;
                          const pHours = pTime / 3600;
                          const isOverBudget = taskProject && taskProject.assignedHours > 0 && pHours >= taskProject.assignedHours;
                          const assignedUsers = task.userIds.map(id => users.find(u=>u.id===id)).filter(Boolean);

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div className="task-card" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  onClick={() => setEditingTask(task)}
                                  style={{ ...provided.draggableProps.style, borderColor: isActive ? 'var(--active-color)' : 'var(--panel-border)', borderLeft: `4px solid ${task.priority === 'Alta' ? '#ff5555' : task.priority === 'Media' ? '#f1fa8c' : '#8be9fd'}` }}>
                                  <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <div style={{flex:1}}>
                                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px'}}>
                                        <p style={{fontWeight: '500', margin:0}}>{task.content}</p>
                                        <span style={{fontSize:'0.65rem', padding:'2px 6px', borderRadius:'10px', background: task.priority === 'Alta' ? 'rgba(255,85,85,0.2)' : task.priority === 'Media' ? 'rgba(241,250,140,0.2)' : 'rgba(139,233,253,0.2)', color: task.priority === 'Alta' ? '#ff5555' : task.priority === 'Media' ? '#f1fa8c' : '#8be9fd', flexShrink:0, textTransform:'uppercase', fontWeight:'bold'}}>{task.priority || 'Media'}</span>
                                        {isOverBudget && <span style={{fontSize:'0.65rem', padding:'2px 6px', borderRadius:'10px', background:'rgba(255,85,85,0.2)', color:'#ff5555', flexShrink:0, fontWeight:'bold'}} title="Proyecto Excedido de Horas">⚠️</span>}
                                      </div>
                                      {task.attachments?.length > 0 && <div style={{fontSize:'0.7rem', color:'var(--active-color)', marginTop:'4px'}}><Paperclip size={12} style={{verticalAlign:'middle'}}/> {task.attachments.length} adjunto(s)</div>}
                                      <div style={{display:'flex', gap:'10px', marginTop:'5px', flexWrap:'wrap'}}>
                                        {taskProject && <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{taskProject.name}</span>}
                                      </div>
                                      <div style={{display:'flex', gap:'5px', marginTop:'10px', flexWrap:'wrap'}}>
                                        {assignedUsers.map(u => (
                                          <div key={u.id} title={u.name} style={{width:'20px',height:'20px',borderRadius:'50%',background:'var(--panel-border)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                            {u.avatar ? <img src={u.avatar} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:'0.6rem'}}>👤</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop:'10px'}}>
                                    {(totalTime > 0 || isActive) && (
                                      <div className="active-timer">{isActive && <span className="dot pulse"></span>}<span style={{fontFamily:'monospace', color:'var(--active-color)'}}>{formatTime(totalTime)}</span></div>
                                    )}
                                    <div style={{marginLeft: 'auto', display: 'flex', gap: '5px'}}>
                                      {task.status === 'done' && (
                                        <button className="task-play-btn" style={{color: 'var(--text-muted)'}} title="Archivar tarea" onClick={(e) => archiveTask(task.id, e)}>
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                      <button className={isActive ? "task-stop-btn" : "task-play-btn"} onClick={(e) => { e.stopPropagation(); handlePlayStop(task.id); }}>
                                        {isActive ? <Square size={16} /> : <Play size={16} />}
                                      </button>
                                    </div>
                                  </div>
                                  {task.tags && task.tags.length > 0 && (
                                    <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'12px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                                      {task.tags.map((tag, i) => (
                                        <span key={i} style={{fontSize:'0.65rem', padding:'3px 8px', borderRadius:'12px', background: tag.color, color:'#fff', fontWeight:'bold', textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>{tag.name}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>

      {/* TASK EDIT MODAL */}
      {editingTask && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div className="glass-panel" style={{width:'600px', maxHeight:'90vh', overflowY:'auto', padding:'25px', position:'relative'}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{setEditingTask(null); fetchData();}} style={{position:'absolute', top:'10px', right:'10px', background:'none', border:'none', color:'white', cursor:'pointer'}}><X size={24}/></button>
            <h2 style={{borderBottom:'1px solid var(--panel-border)', paddingBottom:'10px', marginBottom:'20px'}}>Editar Tarea</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div>
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Título</label>
                <input type="text" className="task-input" value={editingTask.content} onChange={e=>setEditingTask({...editingTask, content: e.target.value})} style={{width:'100%', boxSizing:'border-box'}} />
              </div>
              
              <div style={{display:'flex', gap:'15px'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Proyecto</label>
                  <select className="task-input" value={editingTask.projectId || ''} onChange={e=>setEditingTask({...editingTask, projectId: e.target.value})} style={{width:'100%'}}>
                    <option value="">Selecciona proyecto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Prioridad</label>
                  <select className="task-input" value={editingTask.priority} onChange={e=>setEditingTask({...editingTask, priority: e.target.value})} style={{width:'100%'}}>
                    <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Etiquetas</label>
                <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'5px'}}>
                  {[
                    { name: 'Pendiente de revisión', color: '#ffb86c' },
                    { name: 'Necesita cambios', color: '#ff5555' },
                    { name: 'Pendiente de cliente', color: '#bd93f9' }
                  ].map(predefTag => {
                    const isSelected = editingTask.tags?.some(t => t.name === predefTag.name);
                    return (
                      <button 
                        key={predefTag.name}
                        type="button"
                        onClick={() => {
                          const currentTags = editingTask.tags || [];
                          if (isSelected) {
                            setEditingTask({...editingTask, tags: currentTags.filter(t => t.name !== predefTag.name)});
                          } else {
                            setEditingTask({...editingTask, tags: [...currentTags, predefTag]});
                          }
                        }}
                        style={{
                          fontSize:'0.75rem', padding:'6px 12px', borderRadius:'15px', 
                          background: isSelected ? predefTag.color : 'rgba(255,255,255,0.05)', 
                          color: isSelected ? '#000' : 'var(--text-main)', 
                          border: `1px solid ${isSelected ? predefTag.color : 'var(--panel-border)'}`,
                          cursor: 'pointer', fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {predefTag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INDIVIDUAL TIME ENTRIES WIDGET */}
              <div style={{background:'rgba(0,0,0,0.3)', padding:'15px', borderRadius:'8px', border:'1px solid var(--panel-border)'}}>
                <label style={{fontSize:'0.9rem', fontWeight:'600', color:'var(--active-color)', display:'flex', alignItems:'center', gap:'5px', marginBottom:'10px'}}><Clock size={16}/> Registro de Tiempos</label>
                <div style={{display:'flex', gap:'10px', alignItems:'flex-end'}}>
                  <div>
                    <label style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Horas</label>
                    <input type="number" min="0" className="task-input" value={manualHours} onChange={e=>setManualHours(e.target.value)} style={{width:'80px', padding:'8px'}} placeholder="0"/>
                  </div>
                  <div>
                    <label style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Minutos</label>
                    <input type="number" min="0" max="59" className="task-input" value={manualMinutes} onChange={e=>setManualMinutes(e.target.value)} style={{width:'80px', padding:'8px'}} placeholder="0"/>
                  </div>
                  <button type="button" onClick={addManualTime} className="btn-primary" style={{padding:'8px 15px', marginTop:0, width:'auto', flex:1}}>+ Añadir Tiempo a mi nombre</button>
                </div>

                {taskTimeEntries.length > 0 && (
                  <div style={{marginTop:'15px', maxHeight:'150px', overflowY:'auto'}}>
                    <table style={{width:'100%', fontSize:'0.85rem', textAlign:'left'}}>
                      <tbody>
                        {taskTimeEntries.map(e => {
                          const u = users.find(x=>x.id === e.userId);
                          return (
                            <tr key={e.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                              <td style={{padding:'8px 0', color:'var(--text-muted)'}}>{new Date(e.createdAt).toLocaleDateString()}</td>
                              <td style={{padding:'8px 0'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                  {u?.avatar ? <img src={u.avatar} style={{width:'16px', height:'16px', borderRadius:'50%'}}/> : '👤'}
                                  {u?.name || 'Usuario borrado'}
                                </div>
                              </td>
                              <td style={{padding:'8px 0', textAlign:'right', fontFamily:'monospace', color:'var(--active-color)'}}>+{formatTime(e.timeAdded)}</td>
                              <td style={{padding:'8px 0', textAlign:'right', width:'30px'}}>
                                {(isAdmin || user.id === e.userId) && (
                                  <button type="button" onClick={() => deleteTimeEntry(e.id)} style={{background:'none', border:'none', color:'#ff4444', cursor:'pointer', padding:0}}>
                                    <Trash2 size={14}/>
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div>
                  <label style={{fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'5px', display:'block'}}>Usuarios Asignados (Haz clic para asignar/quitar)</label>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'10px', background:'rgba(0,0,0,0.2)', padding:'15px', borderRadius:'8px', border:'1px solid var(--panel-border)'}}>
                    {users.map(u => {
                      const isAssigned = editingTask.userIds.includes(u.id);
                      return (
                        <label key={u.id} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'6px 12px', background: isAssigned ? 'var(--active-color)' : 'rgba(255,255,255,0.05)', color: isAssigned ? '#000' : 'var(--text-main)', borderRadius:'20px', border:`1px solid ${isAssigned ? 'var(--active-color)' : 'var(--panel-border)'}`, transition:'all 0.2s'}}>
                          <input 
                            type="checkbox" 
                            checked={isAssigned} 
                            onChange={(e) => {
                              const newIds = e.target.checked ? [...editingTask.userIds, u.id] : editingTask.userIds.filter(id => id !== u.id);
                              setEditingTask({...editingTask, userIds: newIds});
                            }} 
                            style={{display:'none'}}
                          />
                          {u.avatar ? <img src={u.avatar} style={{width:'18px', height:'18px', borderRadius:'50%', objectFit:'cover'}}/> : <span style={{fontSize:'0.7rem'}}>👤</span>}
                          <span style={{fontSize:'0.85rem', fontWeight:isAssigned?'600':'400'}}>{u.name}</span>
                          {isAssigned && <X size={14} style={{marginLeft:'5px', opacity:0.6}} />}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Descripción / Email adjunto</label>
                <textarea className="task-input" rows={4} value={editingTask.description || ''} onChange={e=>setEditingTask({...editingTask, description: e.target.value})} style={{width:'100%', boxSizing:'border-box', resize:'vertical'}}></textarea>
              </div>
              
              <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'8px'}}>
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)'}}><Paperclip size={14}/> Archivos Adjuntos (PDFs, Imágenes...)</label>
                <div style={{marginTop:'10px', marginBottom:'15px'}}>
                  {editingTask.attachments && editingTask.attachments.length > 0 ? (
                    <ul style={{paddingLeft:'20px', margin:0}}>
                      {editingTask.attachments.map((p, i) => <li key={i} style={{marginBottom:'5px'}}><a href={`${API_BASE_URL}${p}`} target="_blank" rel="noreferrer" style={{color:'var(--active-color)'}}>Ver archivo adjunto {i+1}</a></li>)}
                    </ul>
                  ) : <span style={{fontSize:'0.8rem', color:'#888'}}>Sin adjuntos</span>}
                </div>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      uploadFile({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  onClick={() => document.getElementById('hidden-file-input').click()}
                  style={{
                    border: isDraggingFile ? '2px dashed var(--active-color)' : '2px dashed var(--panel-border)',
                    background: isDraggingFile ? 'rgba(123, 44, 191, 0.1)' : 'rgba(0,0,0,0.2)',
                    padding: '30px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input type="file" id="hidden-file-input" multiple onChange={uploadFile} style={{display:'none'}} />
                  <Paperclip size={24} style={{marginBottom:'10px', color: isDraggingFile ? 'var(--active-color)' : 'var(--text-muted)'}} />
                  <p style={{margin:0, color:'var(--text-main)', fontSize:'0.9rem'}}>Arrastra tus archivos aquí o haz clic para subir</p>
                </div>
              </div>

              <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                <button type="button" onClick={saveEditedTask} className="btn-primary" style={{flex:1}}>Guardar Cambios</button>
                <button type="button" onClick={()=>{setEditingTask(null); fetchData();}} className="btn-primary" style={{flex:1, background:'#444'}}>Cancelar</button>
              </div>

            </div>
          </div>
        </div>
      )}


    </>
  );
}

// --- PROJECTS PAGE ---
function ProjectsPage() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectPage, setProjectPage] = useState(1);
  const [editingProject, setEditingProject] = useState(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('maintenance');
  const [newProjectHours, setNewProjectHours] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');

  const fetchData = () => {
    fetch(`${API_BASE_URL}/data`).then(r=>r.json()).then(d => {
      setProjects(d.projects);
    });
  };
  useEffect(() => { fetchData(); }, []);

  const archiveProject = async (projectId) => {
    if(!window.confirm("¿Archivar este proyecto?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/projects/${projectId}/archive`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({archived: true}) });
      fetchData();
    } catch(err){}
  };

  const deleteProject = async (projectId) => {
    if(!window.confirm("¿Borrar este proyecto definitivamente?")) return;
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: 'DELETE' });
      fetchData();
    } catch(err){}
  };

  const startEditProject = (p) => {
    setEditingProject(p);
    setNewProjectName(p.name);
    setNewProjectType(p.type);
    setNewProjectHours(p.assignedHours);
    setNewProjectStartDate(p.startDate || '');
    setNewProjectEndDate(p.endDate || '');
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      const isEditing = !!editingProject;
      const url = isEditing ? `${API_BASE_URL}/projects/${editingProject.id}` : `${API_BASE_URL}/projects`;
      const method = isEditing ? 'PUT' : 'POST';
      await fetch(url, {
        method, headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: newProjectName, type: newProjectType, assignedHours: parseFloat(newProjectHours), startDate: newProjectStartDate, endDate: newProjectEndDate })
      });
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectType('maintenance');
      setNewProjectHours('');
      setNewProjectStartDate('');
      setNewProjectEndDate('');
      fetchData();
    } catch(err){}
  };

  return (
    <div style={{padding:'20px', width:'100%', display:'flex', gap:'20px'}}>
      <div className="glass-panel" style={{flex: 1, padding:'25px', display:'flex', flexDirection:'column'}}>
        <h2 style={{borderBottom:'1px solid var(--panel-border)', paddingBottom:'10px', marginBottom:'20px'}}><LayoutDashboard size={24} style={{verticalAlign:'middle', marginRight:'10px'}}/> Gestión de Proyectos</h2>
        
        <div style={{marginBottom: '15px'}}>
          <input type="text" className="task-input" placeholder="Buscar por nombre de proyecto..." style={{width: '100%'}} value={projectSearch} onChange={e => {setProjectSearch(e.target.value); setProjectPage(1);}} />
        </div>

        <div style={{flex: 1, overflowY: 'auto'}}>
          <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--panel-border)', color:'var(--text-muted)'}}>
                <th style={{padding:'10px'}}>Nombre</th><th style={{padding:'10px'}}>Tipo</th><th style={{padding:'10px'}}>Horas Asignadas</th><th style={{padding:'10px', textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.filter(p => !p.archived && p.name.toLowerCase().includes(projectSearch.toLowerCase())).slice((projectPage-1)*10, projectPage*10).map(p => (
                <tr key={p.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td style={{padding:'10px'}}>{p.name}</td>
                  <td style={{padding:'10px'}}><span style={{fontSize:'0.75rem', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px'}}>{p.type === 'maintenance' ? 'Mantenimiento' : 'Desarrollo'}</span></td>
                  <td style={{padding:'10px'}}>{p.assignedHours}h</td>
                  <td style={{padding:'10px', textAlign:'right'}}>
                    <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                      <button onClick={()=>startEditProject(p)} style={{background:'none', border:'none', color:'var(--text-main)', cursor:'pointer'}} title="Editar"><Edit2 size={16}/></button>
                      <button onClick={()=>archiveProject(p.id)} style={{background:'none', border:'none', color:'var(--active-color)', cursor:'pointer'}} title="Archivar (marcar como completado)"><Clock size={16}/></button>
                      <button onClick={()=>deleteProject(p.id)} style={{background:'none', border:'none', color:'#ff4444', cursor:'pointer'}} title="Borrar definitivamente"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', paddingTop:'15px', borderTop:'1px solid var(--panel-border)'}}>
          <button onClick={() => setProjectPage(Math.max(1, projectPage-1))} disabled={projectPage===1} className="btn-primary" style={{width:'auto', padding:'5px 15px', marginTop:0}}>Anterior</button>
          <span>Página {projectPage}</span>
          <button onClick={() => setProjectPage(projectPage+1)} disabled={projectPage * 10 >= projects.filter(p => !p.archived && p.name.toLowerCase().includes(projectSearch.toLowerCase())).length} className="btn-primary" style={{width:'auto', padding:'5px 15px', marginTop:0}}>Siguiente</button>
        </div>
      </div>

      <div className="glass-panel" style={{width:'320px', padding:'25px'}}>
        <h2 style={{borderBottom:'1px solid var(--panel-border)', paddingBottom:'10px', marginBottom:'20px'}}>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
        <form onSubmit={saveProject}>
          <div className="form-group"><input type="text" className="task-input" placeholder="Nombre" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required style={{width:'100%', boxSizing:'border-box'}}/></div>
          <div className="form-group">
            <select className="task-input" value={newProjectType} onChange={e => setNewProjectType(e.target.value)} style={{width:'100%', boxSizing:'border-box'}}>
              <option value="maintenance">Mantenimiento (Recurrente)</option><option value="development">Desarrollo (Fechas)</option>
            </select>
          </div>
          <div className="form-group">
            <input type="number" className="task-input" placeholder="Bolsa de Horas Asignadas" value={newProjectHours} onChange={e => setNewProjectHours(e.target.value)} min="0.5" step="0.5" required style={{width:'100%', boxSizing:'border-box'}}/>
          </div>
          {newProjectType === 'development' && (
            <>
              <div className="form-group">
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)', display:'block', marginBottom:'5px'}}>Fecha de inicio</label>
                <input type="date" className="task-input" value={newProjectStartDate} onChange={e => setNewProjectStartDate(e.target.value)} style={{width:'100%', boxSizing:'border-box', colorScheme:'dark'}}/>
              </div>
              <div className="form-group">
                <label style={{fontSize:'0.8rem', color:'var(--text-muted)', display:'block', marginBottom:'5px'}}>Fecha de fin</label>
                <input type="date" className="task-input" value={newProjectEndDate} onChange={e => setNewProjectEndDate(e.target.value)} style={{width:'100%', boxSizing:'border-box', colorScheme:'dark'}}/>
              </div>
            </>
          )}
          <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
            <button type="submit" className="btn-primary" style={{flex:1}}>{editingProject ? 'Guardar' : 'Crear'}</button>
            {editingProject && <button type="button" onClick={()=>{
              setEditingProject(null); setNewProjectName(''); setNewProjectType('maintenance'); setNewProjectHours(''); setNewProjectStartDate(''); setNewProjectEndDate('');
            }} className="btn-primary" style={{background:'#444', flex:1}}>Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

// --- HISTORY PAGE ---
function HistoryPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ projects:[], tasks:{}, timeEntries:[], users:[], projectTimes:{} });
  const [historyWorkerFilter, setHistoryWorkerFilter] = useState('');
  const [historyProjectFilter, setHistoryProjectFilter] = useState('');
  const [historyTaskSearch, setHistoryTaskSearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const fetchData = () => {
    fetch(`${API_BASE_URL}/data`).then(r=>r.json()).then(fetchedData => {
      const newTasks = {};
      const parsedTasks = fetchedData.tasks.map(t => ({...t, userIds: JSON.parse(t.userIds || '[]'), attachments: JSON.parse(t.attachments || '[]')}));
      
      const projectTimes = {};
      parsedTasks.forEach(task => {
        const taskEntries = fetchedData.timeEntries.filter(e => e.taskId === task.id);
        const totalTime = taskEntries.reduce((sum, e) => sum + e.timeAdded, 0);
        task.timeSpent = totalTime;
        newTasks[task.id] = task;
      });

      fetchedData.timeEntries.forEach(e => {
        const t = fetchedData.tasks.find(x => x.id === e.taskId);
        if (t && t.projectId) {
          if (!projectTimes[t.projectId]) projectTimes[t.projectId] = 0;
          projectTimes[t.projectId] += e.timeAdded;
        }
      });

      setData({ tasks: newTasks, timeEntries: fetchedData.timeEntries, projectTimes, projects: fetchedData.projects, users: fetchedData.users });
    });
  };
  useEffect(() => { fetchData(); }, []);

  const deleteProject = async (projectId) => {
    if(!window.confirm("¿Borrar este proyecto definitivamente? Se borrarán TODAS sus tareas.")) return;
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: 'DELETE' });
      fetchData();
    } catch(err){}
  };

  return (
    <div style={{padding:'20px', width:'100%'}}>
      <div className="glass-panel" style={{width:'100%', padding:'25px', display:'flex', flexDirection:'column'}}>
        <h2 style={{borderBottom:'1px solid var(--panel-border)', paddingBottom:'10px', marginBottom:'20px'}}><Clock size={24} style={{verticalAlign:'middle', marginRight:'10px'}}/> Histórico (Tareas y Proyectos Archivados)</h2>
        
        <div style={{display:'flex', gap:'10px', marginBottom:'25px', flexWrap:'wrap'}}>
          <select className="task-input" value={historyWorkerFilter} onChange={e=>{setHistoryWorkerFilter(e.target.value); setHistoryPage(1);}} style={{flex:1}}>
            <option value="">Cualquier Trabajador</option>
            {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="task-input" value={historyProjectFilter} onChange={e=>{setHistoryProjectFilter(e.target.value); setHistoryPage(1);}} style={{flex:1}}>
            <option value="">Cualquier Proyecto</option>
            {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="text" className="task-input" placeholder="Buscar tarea..." value={historyTaskSearch} onChange={e=>{setHistoryTaskSearch(e.target.value); setHistoryPage(1);}} style={{flex:2}} />
        </div>

        <div style={{flex: 1}}>
          <h3 style={{fontSize:'1.1rem', color:'var(--text-main)', marginBottom:'15px', paddingBottom:'5px', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>Tareas Archivadas</h3>
          <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse', marginBottom:'40px'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--panel-border)', color:'var(--text-muted)'}}>
                <th style={{padding:'10px'}}>Tarea</th><th style={{padding:'10px'}}>Proyecto</th><th style={{padding:'10px'}}>Asignados</th><th style={{padding:'10px', textAlign:'right'}}>T. Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(data.tasks).filter(t => t.archived === 1 && t.content.toLowerCase().includes(historyTaskSearch.toLowerCase()) && (!historyProjectFilter || t.projectId === historyProjectFilter) && (!historyWorkerFilter || t.userIds.includes(historyWorkerFilter))).slice((historyPage-1)*10, historyPage*10).map(t => {
                const tProject = data.projects.find(p => p.id === t.projectId);
                const tUsers = t.userIds.map(id => data.users.find(u=>u.id===id)).filter(Boolean);
                return (
                  <tr key={t.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding:'10px'}}>{t.content}</td>
                    <td style={{padding:'10px', fontSize:'0.85rem'}}>{tProject ? tProject.name : 'N/A'}</td>
                    <td style={{padding:'10px'}}>
                      <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                        {tUsers.map(u => <span key={u.id} title={u.name} style={{fontSize:'0.8rem', background:'rgba(255,255,255,0.1)', padding:'2px 6px', borderRadius:'4px'}}>{u.name.split(' ')[0]}</span>)}
                      </div>
                    </td>
                    <td style={{padding:'10px', textAlign:'right', fontFamily:'monospace', color:'var(--active-color)'}}>{formatTime(t.timeSpent || 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <h3 style={{fontSize:'1.1rem', color:'var(--text-main)', marginBottom:'15px', paddingBottom:'5px', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>Proyectos Archivados</h3>
          <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--panel-border)', color:'var(--text-muted)'}}>
                <th style={{padding:'10px'}}>Proyecto</th><th style={{padding:'10px'}}>Tipo</th><th style={{padding:'10px', textAlign:'right'}}>Horas Invertidas / Asignadas</th><th style={{padding:'10px', textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.filter(p => p.archived === 1 && p.name.toLowerCase().includes(historyTaskSearch.toLowerCase()) && (!historyProjectFilter || p.id === historyProjectFilter)).map(p => {
                const pTime = data.projectTimes ? data.projectTimes[p.id] || 0 : 0;
                return (
                  <tr key={p.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding:'10px'}}>{p.name}</td>
                    <td style={{padding:'10px'}}><span style={{fontSize:'0.75rem', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px'}}>{p.type === 'maintenance' ? 'Mantenimiento' : 'Desarrollo'}</span></td>
                    <td style={{padding:'10px', textAlign:'right', fontFamily:'monospace'}}>
                      <span style={{color: pTime/3600 > p.assignedHours ? '#ff5555' : 'var(--text-main)'}}>{(pTime/3600).toFixed(2)}h</span> / <span style={{color:'var(--text-muted)'}}>{p.assignedHours}h</span>
                    </td>
                    <td style={{padding:'10px', textAlign:'right'}}>
                      <button onClick={()=>deleteProject(p.id)} style={{background:'none', border:'none', color:'#ff4444', cursor:'pointer'}} title="Borrar definitivamente"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', paddingTop:'15px', borderTop:'1px solid var(--panel-border)'}}>
          <button onClick={() => setHistoryPage(Math.max(1, historyPage-1))} disabled={historyPage===1} className="btn-primary" style={{width:'auto', padding:'5px 15px', marginTop:0}}>Anterior</button>
          <span>Página {historyPage}</span>
          <button onClick={() => setHistoryPage(historyPage+1)} disabled={historyPage * 10 >= Object.values(data.tasks).filter(t => t.archived === 1 && t.content.toLowerCase().includes(historyTaskSearch.toLowerCase()) && (!historyProjectFilter || t.projectId === historyProjectFilter) && (!historyWorkerFilter || t.userIds.includes(historyWorkerFilter))).length} className="btn-primary" style={{width:'auto', padding:'5px 15px', marginTop:0}}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}

// --- PROJECT PROGRESS ---
function ProjectProgress() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState({ projects:[], tasks:[], timeEntries:[] });
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE_URL}/data`).then(r=>r.json()).then(d => setData(d));
  }, []);

  if (!isAdmin) return <Navigate to="/" />;

  const filteredProjects = data.projects.filter(p => !p.archived && (filterType === 'all' || p.type === filterType));

  return (
    <div style={{padding:'40px', width:'100%', overflowY:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h2>📊 Progreso Global de Proyectos</h2>
        <select className="task-input" value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="all">Todos los Proyectos</option>
          <option value="maintenance">Solo Mantenimientos</option>
          <option value="development">Solo Desarrollo</option>
        </select>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
        {filteredProjects.map(p => {
          const projectTasks = data.tasks.filter(t => t.projectId === p.id);
          const projectEntries = data.timeEntries.filter(e => projectTasks.some(t => t.id === e.taskId));
          const totalSeconds = projectEntries.reduce((acc, e) => acc + e.timeAdded, 0);
          const totalHoursSpent = totalSeconds / 3600;
          
          let secondsForProgress = totalSeconds;
          if (p.type === 'maintenance') {
            const now = new Date();
            const currentMonthEntries = projectEntries.filter(e => {
              const d = new Date(e.createdAt);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            secondsForProgress = currentMonthEntries.reduce((acc, e) => acc + e.timeAdded, 0);
          }
          const hoursForProgress = secondsForProgress / 3600;
          const assignedHours = p.assignedHours || 0;
          
          let percentage = assignedHours > 0 ? (hoursForProgress / assignedHours) * 100 : 0;
          let displayPercentage = percentage;
          if (percentage > 100) percentage = 100; // Cap visual bar at 100%

          let barColorClass = 'progress-green';
          let alertClass = '';
          if (percentage >= 70 && percentage < 90) barColorClass = 'progress-orange';
          if (percentage >= 90) {
             barColorClass = 'progress-red';
             alertClass = 'alert-limit';
          }

          return (
            <div key={p.id} className={`glass-panel ${alertClass}`} style={{padding:'25px', display:'flex', flexDirection:'column', gap:'15px', position:'relative'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{fontSize:'1.2rem', marginBottom:'5px'}}>{p.name}</h3>
                  <span style={{fontSize:'0.8rem', color:'var(--text-muted)', background:'rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:'12px'}}>{p.type === 'maintenance' ? 'Mantenimiento' : 'Desarrollo'}</span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'1.3rem', fontFamily:'monospace', fontWeight:'bold', color: percentage >= 90 ? '#ff5555' : 'var(--text-main)'}}>
                    {hoursForProgress.toFixed(2)}h / {assignedHours}h
                  </div>
                  <div style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{displayPercentage.toFixed(1)}% consumido {p.type === 'maintenance' && '(este mes)'}</div>
                  {p.type === 'maintenance' && (
                    <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'4px'}}>Total histórico: {totalHoursSpent.toFixed(2)}h</div>
                  )}
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div className={`progress-bar-fill ${barColorClass}`} style={{width: `${percentage}%`}}></div>
              </div>

              {percentage >= 90 && (
                <div style={{color:'#ff5555', fontSize:'0.9rem', fontWeight:'600', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px'}}>
                  ⚠️ ¡Atención! El tiempo asignado a este proyecto {p.type === 'maintenance' && '(este mes)'} está próximo a agotarse o se ha superado.
                </div>
              )}
            </div>
          )
        })}
        {filteredProjects.length === 0 && <p style={{color:'var(--text-muted)'}}>No hay proyectos que coincidan con el filtro.</p>}
      </div>
    </div>
  );
}

// --- PROFILE / SETTINGS ---
function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  useEffect(() => { if (isAdmin) fetch(`${API_BASE_URL}/data`).then(r=>r.json()).then(d=>setUsers(d.users)); }, [isAdmin]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: user.name, email: user.email, password: password || undefined, avatar }) });
      if (res.ok) { updateUser({ avatar }); setMsg('Perfil actualizado correctamente'); }
    } catch(err) { setMsg('Error al guardar'); }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }) });
      if (res.ok) {
        const u = await res.json();
        setUsers([...users, u]); setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('user');
      }
    } catch(err) {}
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch(err) {}
  };

  return (
    <div style={{padding:'40px', width:'100%', overflowY:'auto'}}>
      <h2 style={{marginBottom:'30px'}}><Settings style={{marginRight:'10px', verticalAlign:'middle'}}/> Configuración y Perfil</h2>
      <div style={{display:'flex', gap:'40px', flexWrap:'wrap'}}>
        <div className="glass-panel" style={{padding:'20px', flex:'1', minWidth:'300px'}}>
          <h3>Mi Perfil</h3>
          {msg && <div style={{color:'#50fa7b', margin:'10px 0'}}>{msg}</div>}
          <form onSubmit={saveProfile} style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              {avatar ? <img src={avatar} style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover'}}/> : <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#333',display:'flex',alignItems:'center',justifyContent:'center'}}><User size={40}/></div>}
              <input type="file" accept="image/*" onChange={handleFile} />
            </div>
            <input type="password" placeholder="Nueva Contraseña (opcional)" value={password} onChange={e=>setPassword(e.target.value)} className="form-group input" style={{padding:'10px', background:'rgba(0,0,0,0.2)', color:'white', border:'1px solid var(--panel-border)'}}/>
            <button type="submit" className="btn-primary">Guardar Perfil</button>
          </form>
        </div>
        {isAdmin && (
          <div className="glass-panel" style={{padding:'20px', flex:'2', minWidth:'400px'}}>
            <h3>Gestión de Usuarios (Admin)</h3>
            <form onSubmit={addUser} style={{display:'flex', gap:'10px', marginTop:'20px', flexWrap:'wrap'}}>
              <input type="text" placeholder="Nombre" value={newUserName} onChange={e=>setNewUserName(e.target.value)} required className="form-group input" style={{padding:'10px', background:'rgba(0,0,0,0.2)', color:'white', width:'120px'}}/>
              <input type="email" placeholder="Email" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} required className="form-group input" style={{padding:'10px', background:'rgba(0,0,0,0.2)', color:'white', width:'150px'}}/>
              <input type="password" placeholder="Contraseña" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} required className="form-group input" style={{padding:'10px', background:'rgba(0,0,0,0.2)', color:'white', width:'120px'}}/>
              <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className="form-group input" style={{padding:'10px', background:'rgba(0,0,0,0.2)', color:'white', width:'120px'}}>
                <option value="user">Worker</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn-primary">Crear</button>
            </form>
            <table style={{width:'100%', marginTop:'20px', textAlign:'left', borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'1px solid var(--panel-border)'}}><th>Avatar</th><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                    <td style={{padding:'10px'}}>{u.avatar ? <img src={u.avatar} style={{width:'30px',height:'30px',borderRadius:'50%'}}/> : '👤'}</td>
                    <td style={{padding:'10px'}}>{u.name}</td><td style={{padding:'10px'}}>{u.email}</td>
                    <td style={{padding:'10px'}}>
                      <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <select value={u.role} onChange={e => changeUserRole(u.id, e.target.value)} style={{background:'rgba(0,0,0,0.2)', color:'white', border:'1px solid var(--panel-border)', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => {
                          const newPass = prompt("Introduce la nueva contraseña:");
                          if (newPass) {
                            fetch(`${API_BASE_URL}/api/users/${u.id}/password`, {
                              method: 'PUT', headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({ password: newPass })
                            }).then(r=>r.json()).then(res => {
                              if (res.error) alert(res.error);
                              else alert("Contraseña cambiada con éxito");
                            });
                          }
                        }} style={{background:'var(--active-color)', color:'black', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold'}}>
                          Cambiar Clave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- REPORTS ---
function Reports() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ users:[], projects:[], tasks:[], timeEntries:[] });
  
  const [reportMode, setReportMode] = useState('project'); // 'project' or 'worker'
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'year', 'all'

  const reportRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/data`).then(r=>r.json()).then(d => {
      setData({ ...d, tasks: d.tasks.map(t => ({...t, userIds: JSON.parse(t.userIds || '[]')})) });
    });
  }, []);

  const isDateInRange = (dateStr, filter) => {
    if (filter === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (filter === 'year') {
      return date.getFullYear() === now.getFullYear();
    }
    if (filter === 'month') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (filter === 'week') {
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      if (day !== 1) monday.setHours(-24 * (day - 1));
      monday.setHours(0,0,0,0);
      return date >= monday;
    }
    return true;
  };

  // -- PROJECT MODE LOGIC --
  const projectTasks = data.tasks.filter(t => t.projectId === selectedProjectId && (!selectedWorkerId || t.userIds.includes(selectedWorkerId)));
  const project = data.projects.find(p => p.id === selectedProjectId);
  const userTimes = {};
  const projectTimeEntries = data.timeEntries.filter(e => projectTasks.some(t => t.id === e.taskId) && (!selectedWorkerId || e.userId === selectedWorkerId));
  
  projectTimeEntries.forEach(entry => {
    if (!userTimes[entry.userId]) userTimes[entry.userId] = 0;
    userTimes[entry.userId] += entry.timeAdded;
  });

  const pieDataProject = Object.keys(userTimes).map(uid => ({ name: data.users.find(x => x.id === uid)?.name || 'Unknown', value: userTimes[uid] / 3600 }));
  const totalTimeProjectSeconds = projectTimeEntries.reduce((acc, e) => acc + e.timeAdded, 0);

  // -- WORKER MODE LOGIC --
  const workerTimeEntries = data.timeEntries.filter(e => e.userId === selectedWorkerId && isDateInRange(e.createdAt, timeFilter));
  
  // Filter by project if selected in worker mode
  const filteredWorkerEntries = selectedProjectId ? workerTimeEntries.filter(e => {
    const task = data.tasks.find(t => t.id === e.taskId);
    return task && task.projectId === selectedProjectId;
  }) : workerTimeEntries;

  const workerProjectTimes = {};
  
  filteredWorkerEntries.forEach(entry => {
    const task = data.tasks.find(t => t.id === entry.taskId);
    if (task) {
      if (!workerProjectTimes[task.projectId]) workerProjectTimes[task.projectId] = 0;
      workerProjectTimes[task.projectId] += entry.timeAdded;
    }
  });

  const pieDataWorker = Object.keys(workerProjectTimes).map(pid => {
    const proj = data.projects.find(p => p.id === pid);
    return { name: proj?.name || 'Desconocido', value: workerProjectTimes[pid] / 3600 };
  });
  const totalWorkerTimeSeconds = filteredWorkerEntries.reduce((acc, e) => acc + e.timeAdded, 0);
  const selectedWorker = data.users.find(u => u.id === selectedWorkerId);

  // -- EXPORT --
  const exportPDF = () => {
    if (!reportRef.current) return;
    html2canvas(reportRef.current, { scale: 2, backgroundColor: '#1e1e2f' }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
      pdf.save(`Reporte_${reportMode === 'project' ? (project?.name || 'Proyecto') : (selectedWorker?.name || 'Trabajador')}.pdf`);
    });
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div style={{padding:'40px', width:'100%', overflowY:'auto'}}>
      <h2 style={{marginBottom:'20px'}}><PieChart style={{marginRight:'10px', verticalAlign:'middle'}}/> Reportes Generales</h2>
      
      <div className="report-tabs">
        <div className={`report-tab ${reportMode === 'project' ? 'active' : ''}`} onClick={() => setReportMode('project')}>Por Proyecto</div>
        <div className={`report-tab ${reportMode === 'worker' ? 'active' : ''}`} onClick={() => setReportMode('worker')}>Por Trabajador</div>
      </div>

      <div style={{display:'flex', gap:'20px', marginBottom:'30px', alignItems:'center', flexWrap:'wrap', background:'rgba(255,255,255,0.02)', padding:'15px', borderRadius:'12px', border:'1px solid var(--panel-border)'}}>
        {reportMode === 'project' ? (
          <>
            <span style={{color:'var(--text-muted)'}}>Filtrar Proyecto:</span>
            <SearchableSelect style={{width:'250px'}} options={data.projects} value={selectedProjectId} onChange={setSelectedProjectId} placeholder="Buscar Proyecto..." />
          </>
        ) : (
          <>
            <span style={{color:'var(--text-muted)'}}>Trabajador:</span>
            <select className="task-input" value={selectedWorkerId} onChange={e=>setSelectedWorkerId(e.target.value)}>
              <option value="">Selecciona Trabajador...</option>
              {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <select className="task-input" value={timeFilter} onChange={e=>setTimeFilter(e.target.value)}>
              <option value="week">Semana Actual</option>
              <option value="month">Mes Actual</option>
              <option value="year">Año Actual</option>
              <option value="all">Todo el Histórico</option>
            </select>

            <span style={{color:'var(--text-muted)', marginLeft:'20px'}}>Filtrar por Proyecto:</span>
            <select className="task-input" value={selectedProjectId} onChange={e=>setSelectedProjectId(e.target.value)}>
              <option value="">Todos los Proyectos</option>
              {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </>
        )}
        
        {reportMode === 'project' && (
          <>
            <span style={{color:'var(--text-muted)', marginLeft:'20px'}}>Filtrar por Trabajador:</span>
            <select className="task-input" value={selectedWorkerId} onChange={e=>setSelectedWorkerId(e.target.value)}>
              <option value="">Todos los Trabajadores</option>
              {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </>
        )}
      </div>

      {/* PROJECT REPORT */}
      {reportMode === 'project' && selectedProjectId && project && (
        <>
          <button onClick={exportPDF} className="btn-primary" style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px', width:'200px'}}><Download size={18} /> Exportar a PDF</button>
          <div ref={reportRef} className="glass-panel" style={{padding:'40px', background:'var(--panel-bg)'}}>
            <div style={{textAlign:'center', marginBottom:'40px'}}>
              <h1 style={{fontSize:'2rem', color:'#fff'}}>Pyramica SaaS</h1>
              <h2 style={{color:'var(--active-color)', marginTop:'10px'}}>Reporte de Proyecto: {project.name}</h2>
              <p style={{color:'var(--text-muted)'}}>Generado el: {new Date().toLocaleDateString()}</p>
            </div>
            <div style={{display:'flex', gap:'40px', flexWrap:'wrap', alignItems:'center'}}>
              <div style={{flex:1, minWidth:'300px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                <h3>Distribución Real de Tiempo (Horas)</h3>
                {pieDataProject.length > 0 ? (
                  <RePieChart width={350} height={350}>
                    <Pie data={pieDataProject} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name} (${value.toFixed(2)}h)`} outerRadius={120} fill="#8884d8" dataKey="value">
                      {pieDataProject.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => val.toFixed(2) + 'h'} />
                    <Legend />
                  </RePieChart>
                ) : <p style={{marginTop:'50px', color:'var(--text-muted)'}}>No hay tiempos registrados</p>}
              </div>
              <div style={{flex:2, minWidth:'400px'}}>
                <h3>Desglose de Tareas Realizadas</h3>
                <table style={{width:'100%', marginTop:'20px', textAlign:'left', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid var(--panel-border)', color:'var(--active-color)'}}>
                      <th style={{padding:'10px'}}>Tarea</th><th style={{padding:'10px'}}>Asignados</th><th style={{padding:'10px'}}>Estado</th><th style={{padding:'10px', textAlign:'right'}}>Tiempo Invertido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTasks.map(t => {
                      const tEntries = projectTimeEntries.filter(e => e.taskId === t.id);
                      const tTime = tEntries.reduce((sum, e) => sum + e.timeAdded, 0);
                      return (
                        <tr key={t.id} style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                          <td style={{padding:'10px'}}>{t.content}</td>
                          <td style={{padding:'10px'}}>{t.userIds.map(uid => <div key={uid}>{data.users.find(x=>x.id===uid)?.name}</div>)}</td>
                          <td style={{padding:'10px'}}>{t.status === 'done' ? 'Terminada' : t.status === 'inProgress' ? 'En Progreso' : 'Por Hacer'}</td>
                          <td style={{padding:'10px', textAlign:'right', fontFamily:'monospace', fontSize:'1.1rem', color: tTime > 0 ? 'var(--text-main)' : 'var(--text-muted)'}}>{formatTime(tTime)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:'2px solid var(--active-color)', fontWeight:'bold'}}>
                      <td colSpan="3" style={{padding:'15px 10px', textAlign:'right'}}>TOTAL HORAS REALES:</td>
                      <td style={{padding:'15px 10px', textAlign:'right', color:'var(--active-color)', fontSize:'1.2rem'}}>{formatTime(totalTimeProjectSeconds)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* WORKER REPORT */}
      {reportMode === 'worker' && selectedWorkerId && selectedWorker && (
        <>
          <button onClick={exportPDF} className="btn-primary" style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px', width:'200px'}}><Download size={18} /> Exportar a PDF</button>
          <div ref={reportRef} className="glass-panel" style={{padding:'40px', background:'var(--panel-bg)'}}>
            <div style={{textAlign:'center', marginBottom:'40px'}}>
              <h1 style={{fontSize:'2rem', color:'#fff'}}>Pyramica SaaS</h1>
              <h2 style={{color:'var(--accent-cyan)', marginTop:'10px'}}>Reporte de Trabajador: {selectedWorker.name}</h2>
              <p style={{color:'var(--text-muted)'}}>
                Filtro Temporal: {timeFilter === 'week' ? 'Semana Actual' : timeFilter === 'month' ? 'Mes Actual' : timeFilter === 'year' ? 'Año Actual' : 'Histórico Completo'} <br/>
                Generado el: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div style={{display:'flex', gap:'40px', flexWrap:'wrap', alignItems:'center'}}>
              <div style={{flex:1, minWidth:'300px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                <h3>Dedicación por Proyectos</h3>
                {pieDataWorker.length > 0 ? (
                  <RePieChart width={350} height={350}>
                    <Pie data={pieDataWorker} cx="50%" cy="50%" labelLine={false} label={({name, value}) => `${name} (${value.toFixed(2)}h)`} outerRadius={120} fill="#8884d8" dataKey="value">
                      {pieDataWorker.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => val.toFixed(2) + 'h'} />
                    <Legend />
                  </RePieChart>
                ) : <p style={{marginTop:'50px', color:'var(--text-muted)'}}>No hay tiempos en este periodo</p>}
              </div>
              <div style={{flex:2, minWidth:'400px'}}>
                <h3>Desglose de Proyectos y Tiempo</h3>
                <table style={{width:'100%', marginTop:'20px', textAlign:'left', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid var(--panel-border)', color:'var(--accent-cyan)'}}>
                      <th style={{padding:'10px'}}>Proyecto</th>
                      <th style={{padding:'10px', textAlign:'right'}}>Tiempo Dedicado (Periodo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(workerProjectTimes).map(pid => {
                      const proj = data.projects.find(p => p.id === pid);
                      return (
                        <tr key={pid} style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                          <td style={{padding:'10px', fontWeight:'500'}}>{proj?.name || 'Desconocido'}</td>
                          <td style={{padding:'10px', textAlign:'right', fontFamily:'monospace', fontSize:'1.1rem', color:'var(--text-main)'}}>{formatTime(workerProjectTimes[pid])}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:'2px solid var(--accent-cyan)', fontWeight:'bold'}}>
                      <td style={{padding:'15px 10px', textAlign:'right'}}>TOTAL HORAS DEL TRABAJADOR:</td>
                      <td style={{padding:'15px 10px', textAlign:'right', color:'var(--accent-cyan)', fontSize:'1.2rem'}}>{formatTime(totalWorkerTimeSeconds)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- APP WRAPPER ---
function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><ProjectProgress /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
