import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ArrowUp, ArrowDown, Trash2, Wallet, Plus, Minus, ChevronDown, ChevronUp, Calendar, Edit2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatoDinero = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(monto);

const obtenerNombreMes = (fechaStr) => {
  const [year, month, day] = fechaStr.split('-');
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
};

// --- LOGIN EXCLUSIVO (SOLO ENTRADA) ---
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if(!username) return;
    setError('');
    setLoading(true);

    try {
      // Solo intentamos hacer LOGIN
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: username })
      });
      const data = await res.json();

      if (res.ok) {
        onLogin({ name: data.nombre, role: data.rol });
      } else {
        setError('Usuario no autorizado o no existe.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Wallet color="var(--accent)" size={60} style={{ display: 'block', margin: '0 auto 30px auto' }} />
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '10px' }}>Finanzas<br/>Privadas</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '40px' }}>Acceso restringido</p>
        
        <form onSubmit={handleLogin}>
          <input 
            className="input-dark" 
            placeholder="Usuario asignado" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            autoFocus
          />
          {error && <p style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}
          
          <button type="submit" className="btn btn-gasto" style={{ width: '100%', background: 'var(--accent)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando...' : 'INGRESAR'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- GRUPO MENSUAL (Sin cambios) ---
const GrupoMensual = ({ titulo, movimientos, user, onBorrar, onEditar }) => {
  const [isOpen, setIsOpen] = useState(true);
  const subtotal = movimientos.reduce((acc, curr) => curr.tipo === 'ingreso' ? acc + Number(curr.monto) : acc - Number(curr.monto), 0);

  return (
    <div style={{ marginBottom: '20px' }}>
      <motion.div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 5px', cursor: 'pointer', borderBottom: '1px solid #333', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1rem' }}>{titulo}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', color: subtotal >= 0 ? 'var(--success)' : 'var(--text-muted)' }}>{subtotal > 0 ? '+' : ''}{formatoDinero(subtotal)}</span>
          {isOpen ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
        </div>
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {movimientos.map((mov) => (
                <div key={mov.id} style={{ background: 'var(--card-dark)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: mov.tipo === 'ingreso' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                      {mov.tipo === 'ingreso' ? <ArrowUp size={20} color="var(--success)" /> : <ArrowDown size={20} color="white" />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600' }}>{mov.concepto}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mov.fecha}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <p style={{ margin: 0, fontWeight: 'bold', color: mov.tipo === 'ingreso' ? 'var(--success)' : 'white' }}>{mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto}</p>
                     {user.role === 'admin' && (
                       <div style={{ marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button onClick={(e) => { e.stopPropagation(); onEditar(mov); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0 }}><Edit2 size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); onBorrar(mov.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 0 }}><Trash2 size={16}/></button>
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- DASHBOARD (Sin cambios) ---
const Dashboard = ({ user, onLogout }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [formulario, setFormulario] = useState({ concepto: '', monto: '', fecha: '', tipo: 'gasto' });

  const cargarDatos = () => {
    fetch(API_URL + '/api/movimientos')
      .then(res => res.json())
      .then(data => {
        const ordenados = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setMovimientos(ordenados);
      });
  };

  useEffect(() => { cargarDatos(); }, []);
  const balance = movimientos.reduce((acc, curr) => curr.tipo === 'ingreso' ? acc + Number(curr.monto) : acc - Number(curr.monto), 0);

  const abrirNuevo = (tipo) => {
    setEditingId(null);
    setFormulario({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], tipo });
    setModalOpen(true);
  };
  const abrirEditar = (mov) => {
    setEditingId(mov.id);
    setFormulario({ concepto: mov.concepto, monto: mov.monto, fecha: mov.fecha, tipo: mov.tipo });
    setModalOpen(true);
  };
  const cerrarModal = () => { setModalOpen(false); setEditingId(null); };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const url = API_URL + '/api/movimientos';
    if (editingId) await fetch(`${url}/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
    else await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
    cerrarModal(); cargarDatos();
  };

  const handleBorrar = async (id) => {
    if (user.role !== 'admin') return;
    if(!confirm('¿Borrar este movimiento?')) return;
    await fetch(API_URL + `/api/movimientos/${id}`, { method: 'DELETE' });
    cargarDatos();
  };

  const movimientosAgrupados = movimientos.reduce((grupos, mov) => {
    const key = mov.fecha.substring(0, 7); 
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(mov);
    return grupos;
  }, {});
  const listaGrupos = Object.entries(movimientosAgrupados).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '10px' }}>
        <div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bienvenido,</p><h2 style={{ margin: 0 }}>{user.name}</h2></div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><LogOut size={20}/></button>
      </header>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'linear-gradient(135deg, #222, #111)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <p style={{ color: 'var(--accent)', margin: 0, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Balance Total</p>
        <h1 style={{ fontSize: '2.8rem', margin: '10px 0', fontWeight: '800' }}>{formatoDinero(balance)}</h1>
      </motion.div>
      {user.role === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <button className="btn btn-ingreso" onClick={() => abrirNuevo('ingreso')}><Plus size={20} /> INGRESO</button>
          <button className="btn btn-gasto" onClick={() => abrirNuevo('gasto')}><Minus size={20} /> GASTO</button>
        </div>
      )}
      <h3 style={{ marginBottom: '15px', color: 'var(--text-muted)' }}>Historial</h3>
      {listaGrupos.length === 0 && <p style={{textAlign:'center', color: '#444'}}>No hay movimientos aún</p>}
      {listaGrupos.map(([key, movimientosDelMes]) => (
        <GrupoMensual key={key} titulo={obtenerNombreMes(key + '-01')} movimientos={movimientosDelMes} user={user} onBorrar={handleBorrar} onEditar={abrirEditar} />
      ))}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#1a1a1a', width: '100%', padding: '30px 20px', borderRadius: '25px 25px 0 0', borderTop: '1px solid var(--border)' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h2 style={{ margin: 0 }}>{editingId ? 'Editar' : 'Nuevo'} {formulario.tipo === 'ingreso' ? 'Ingreso 💰' : 'Gasto 💸'}</h2>
                {editingId && (<button type="button" className="btn" style={{ padding:'5px 10px', fontSize:'0.8rem', background: '#333', color:'white'}} onClick={() => setFormulario({...formulario, tipo: formulario.tipo === 'ingreso' ? 'gasto' : 'ingreso'})}>Cambiar Tipo</button>)}
              </div>
              <form onSubmit={handleGuardar}>
                <input required className="input-dark" placeholder="Concepto" value={formulario.concepto} onChange={e => setFormulario({...formulario, concepto: e.target.value})} autoFocus />
                <input required type="number" className="input-dark" placeholder="Monto" value={formulario.monto} onChange={e => setFormulario({...formulario, monto: Number(e.target.value)})} />
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                  <Calendar size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input required type="date" className="input-dark" style={{ paddingLeft: '45px', cursor: 'pointer', marginBottom: 0 }} value={formulario.fecha} onChange={e => setFormulario({...formulario, fecha: e.target.value})} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn" style={{ background: '#333', color: 'white', flex: 1 }} onClick={cerrarModal}>Cancelar</button>
                  <button type="submit" className="btn" style={{ background: formulario.tipo === 'ingreso' ? 'var(--success)' : 'white', color: 'black', flex: 1 }}>{editingId ? 'Actualizar' : 'Guardar'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;