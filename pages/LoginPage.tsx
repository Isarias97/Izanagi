import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { DataContext } from '../context';
import { Worker, Role } from '../types';
import { Button, Icon, Input, InputGroup } from '../components/ui';

type LoginView = 'initial' | 'admin' | 'worker';

const getRoleStyle = (role: Role) => {
    switch (role) {
        case 'Admin': return 'border-danger text-danger';
        case 'Gerente': return 'border-accent text-accent';
        case 'Vendedor': return 'border-success text-success';
        default: return 'border-slate-500 text-slate-400';
    }
};

const PinInputDisplay: React.FC<{ pinLength: number }> = ({ pinLength }) => (
    <div className="flex justify-center items-center gap-4 my-6">
        {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`w-10 h-10 rounded-full border-2 transition-colors duration-200 ${index < pinLength ? 'bg-accent border-accent' : 'border-slate-600'}`}></div>
        ))}
    </div>
);

const Numpad: React.FC<{ onInput: (value: string) => void, onBackspace: () => void, onClear: () => void }> = ({ onInput, onBackspace, onClear }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return (
        <div className="grid grid-cols-3 gap-3">
            {keys.map(key => (
                <Button key={key} onClick={() => onInput(key)} className="py-5 text-2xl font-bold bg-slate-800/80 hover:bg-slate-700">{key}</Button>
            ))}
            <Button onClick={onClear} className="py-5 text-lg bg-slate-700/80 hover:bg-slate-600">Limpiar</Button>
            <Button onClick={() => onInput('0')} className="py-5 text-2xl font-bold bg-slate-800/80 hover:bg-slate-700">0</Button>
            <Button onClick={onBackspace} className="py-5 text-lg bg-slate-700/80 hover:bg-slate-600"><Icon name="fa-backspace" /></Button>
        </div>
    );
};

const LoginPage: React.FC<{ onLoginSuccess: (worker: Worker) => void }> = ({ onLoginSuccess }) => {
    const { state, showNotification } = useContext(DataContext);
    const [view, setView] = useState<LoginView>('initial');
    const [containerHeight, setContainerHeight] = useState<string | number>('auto');

    // --- REFS ---
    const adminRef = useRef<HTMLDivElement>(null!);
    const workerRef = useRef<HTMLDivElement>(null!);
    const initialRef = useRef<HTMLDivElement>(null!);
    const usernameInputRef = useRef<HTMLInputElement>(null);

    // --- STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [pin, setPin] = useState('');

    // --- LOGIC ---
    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'isarias' && password === 'isvanis971226*') {
            onLoginSuccess({ id: 0, name: 'Administrador', role: 'Admin', pin: '0000' });
        } else {
            showNotification('Acceso Denegado', 'Credenciales de administrador incorrectas.', true);
            setPassword('');
        }
    };

    const verifyPin = useCallback((finalPin: string) => {
        if (selectedWorker && finalPin === selectedWorker.pin) {
            onLoginSuccess(selectedWorker);
        } else {
            showNotification('Error de Acceso', 'El PIN es incorrecto.', true);
            setPin('');
        }
    }, [selectedWorker, onLoginSuccess, showNotification]);
    
    const handlePinInput = (value: string) => {
        if (pin.length < 4) {
            const newPin = pin + value;
            setPin(newPin);
            if (newPin.length === 4) {
                 setTimeout(() => verifyPin(newPin), 100);
            }
        }
    };

    const handleBackspace = () => setPin(p => p.slice(0, -1));
    const handleClear = () => setPin('');
    
    const goToView = (newView: LoginView) => {
      if (view === 'admin') { setUsername(''); setPassword(''); }
      if (view === 'worker') { setSelectedWorker(null); setPin(''); }
      setView(newView);
    };
    
    const handleGoBackToWorkerSelect = () => {
        setSelectedWorker(null);
        setPin('');
    };

    // --- EFFECTS ---
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (view !== 'worker' || !selectedWorker) return;
            if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
            else if (e.key === 'Backspace') handleBackspace();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [view, selectedWorker, pin, verifyPin, handlePinInput, handleBackspace]);

    useEffect(() => {
        const calculateHeight = () => {
            let targetRef: React.RefObject<HTMLDivElement> | null = null;
            if (view === 'initial') targetRef = initialRef;
            else if (view === 'admin') targetRef = adminRef;
            else if (view === 'worker') targetRef = workerRef;
            if (targetRef?.current) setContainerHeight(targetRef.current.scrollHeight);
        };
        
        requestAnimationFrame(calculateHeight);
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, [view, selectedWorker, state.workers]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (view === 'admin' && usernameInputRef.current) {
                usernameInputRef.current.focus();
            }
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [view]);

    const getTransform = () => {
        if (view === 'admin') return 'translateX(-100%)';
        if (view === 'worker') return 'translateX(-200%)';
        return 'translateX(0%)';
    };

    return (
        <div className="min-h-screen w-full bg-dark-bg flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-4 mb-8">
                <Icon name="fa-cash-register" className="text-accent text-5xl" />
                <h1 className="text-4xl font-semibold text-white">Sistema Izanagi</h1>
            </div>
            
            <div 
                className="w-full max-w-sm sm:max-w-md bg-dark-card backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ease-in-out"
                style={{ height: containerHeight }}
            >
                <div 
                    className="flex transition-transform duration-400 ease-in-out h-full"
                    style={{ transform: getTransform() }}
                >
                    {/* Panel 1: Initial View */}
                    <div ref={initialRef} className="w-full flex-shrink-0 px-4 py-6 sm:p-8">
                        <h2 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-3"><Icon name="fa-sign-in-alt" /> Iniciar Sesión</h2>
                        <div className="flex flex-col gap-4">
                            <Button icon="fa-user-shield" onClick={() => goToView('admin')} className="w-full text-lg py-6 justify-center min-h-[56px] active:scale-95 touch-manipulation no-hover">Entrar como Admin</Button>
                            <Button icon="fa-users" onClick={() => goToView('worker')} className="w-full text-lg py-6 justify-center min-h-[56px] active:scale-95 touch-manipulation no-hover" variant="primary" disabled={state.workers.length === 0}>Entrar como Trabajador</Button>
                            {state.workers.length === 0 && <p className="text-xs text-center text-gray-400">No hay trabajadores registrados. Inicie como Admin.</p>}
                        </div>
                    </div>
                    
                    {/* Panel 2: Admin View */}
                    <div ref={adminRef} className="w-full flex-shrink-0 px-4 py-6 sm:p-8">
                        <div className="flex items-center justify-between w-full mb-6"><h2 className="text-xl font-bold flex items-center gap-3"><Icon name="fa-user-shield" /> Acceso Admin</h2><Button variant="icon" onClick={() => goToView('initial')} title="Volver" className="!w-10 !h-10 active:scale-95 touch-manipulation no-hover"><Icon name="fa-arrow-left" /></Button></div>
                        <form onSubmit={handleAdminLogin} className="space-y-6">
                            <InputGroup label="Usuario"><Input ref={usernameInputRef} type="text" value={username} onChange={e => setUsername(e.target.value)} required /></InputGroup>
                            <InputGroup label="Contraseña"><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></InputGroup>
                            <Button type="submit" className="w-full justify-center min-h-[44px] text-base py-3 active:scale-95 touch-manipulation no-hover" icon="fa-sign-in-alt">Iniciar Sesión</Button>
                        </form>
                    </div>

                    {/* Panel 3: Worker View */}
                    <div ref={workerRef} className="w-full flex-shrink-0 px-4 py-6 sm:p-8">
                        {!selectedWorker ? (
                            <>
                                <div className="flex items-center justify-between w-full mb-6"><h2 className="text-xl font-bold flex items-center gap-3"><Icon name="fa-users" /> Seleccione Usuario</h2><Button variant="icon" onClick={() => goToView('initial')} title="Volver" className="!w-10 !h-10 active:scale-95 touch-manipulation no-hover"><Icon name="fa-arrow-left" /></Button></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {state.workers.map(worker => (
                                        <button key={worker.id} onClick={() => setSelectedWorker(worker)} className="p-4 bg-slate-800/60 rounded-lg text-center transition-colors duration-200 border border-transparent focus:outline-none focus:ring-2 focus:ring-accent min-h-[56px] text-base active:scale-95 touch-manipulation no-hover">
                                            <Icon name="fa-user-circle" className="text-4xl mb-2 text-slate-400" /><p className="font-semibold text-lg text-white">{worker.name}</p><p className={`text-sm font-semibold ${getRoleStyle(worker.role)}`}>{worker.role}</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between w-full mb-4"><h2 className="text-xl font-bold flex items-center gap-3"><Icon name="fa-lock" /> Ingrese su PIN</h2><Button variant="primary" className="!py-1 !px-3 !h-auto min-h-[40px] active:scale-95 touch-manipulation no-hover" onClick={handleGoBackToWorkerSelect}>Volver</Button></div>
                                <div className="text-center">
                                    <p className="text-xl font-semibold mb-2">{selectedWorker.name}</p><p className="text-sm text-gray-400 mb-4">{selectedWorker.role}</p>
                                    <PinInputDisplay pinLength={pin.length} /><Numpad onInput={handlePinInput} onBackspace={handleBackspace} onClear={handleClear} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <footer className="text-center p-4 text-sm text-gray-500 mt-8">
                <p>&copy; {new Date().getFullYear()} Izanagi Sales System. Todos los derechos reservados.</p>
            </footer>
            <style>{`
              .touch-manipulation { touch-action: manipulation; }
              .no-hover:hover { background: none !important; filter: none !important; }
            `}</style>
        </div>
    );
};

export default LoginPage;