
import React, { useState, useEffect } from 'react';
import { SipalLogo } from '../icons/AppIcons';
import { REMEMBER_ME_KEY } from '../../constants/app-constants';

export const AuthPage = ({ onLogin, onRegister, onRecover }: any) => {
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'recover', 'resetPassword'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const remembered = localStorage.getItem(REMEMBER_ME_KEY);
        if (remembered) {
            const { email: savedEmail } = JSON.parse(remembered);
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (authMode !== 'resetPassword' && !validateEmail(email)) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (authMode === 'recover') {
            setIsSubmitting(false);
            setSuccessMessage(`Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada.`);
            return;
        }

        if (authMode === 'resetPassword') {
            if (newPassword.length < 6) {
                setError('A nova senha deve ter pelo menos 6 caracteres.');
                setIsSubmitting(false);
                return;
            }
            if (newPassword !== confirmNewPassword) {
                setError('As senhas não coincidem.');
                setIsSubmitting(false);
                return;
            }
            setIsSubmitting(false);
            setSuccessMessage('Senha redefinida com sucesso! Você já pode fazer login.');
            setTimeout(() => switchTo('login'), 3000);
            return;
        }
        
        if (authMode === 'login') {
            const success = onLogin(email, password, rememberMe);
            setIsSubmitting(false);
            if (!success) setError('E-mail ou senha inválidos.');
        } else if (authMode === 'register') {
            if (!name.trim()) { setIsSubmitting(false); setError('O campo Nome é obrigatório.'); return; }
            if (password.length < 6) { setIsSubmitting(false); setError('A senha deve ter pelo menos 6 caracteres.'); return; }
            if (password !== confirmPassword) { setIsSubmitting(false); setError('As senhas não coincidem.'); return; }
            const success = onRegister(name, email, password);
            setIsSubmitting(false);
            if (!success) setError('Este e-mail já está cadastrado.');
        }
    };

    const getTitle = () => {
        if (authMode === 'login') return 'Acessar o Painel';
        if (authMode === 'register') return 'Criar Nova Conta';
        if (authMode === 'recover') return 'Recuperar Senha';
        return 'Definir Nova Senha';
    };

    const getSubmitButtonText = () => {
        if (isSubmitting) return 'Processando...';
        if (authMode === 'login') return 'Entrar';
        if (authMode === 'register') return 'Registrar';
        if (authMode === 'recover') return 'Enviar Link';
        return 'Alterar Senha';
    };

    const switchTo = (mode: string) => { 
        setAuthMode(mode); 
        setError(''); 
        setSuccessMessage(''); 
        setNewPassword('');
        setConfirmNewPassword('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo"><SipalLogo width={150} /></div>
                <h2>{getTitle()}</h2>
                
                {error && <p className="auth-error">{error}</p>}
                
                {successMessage && (
                    <div style={{
                        backgroundColor: '#e6fffa', 
                        color: '#234e52', 
                        border: '1px solid #b2f5ea', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        textAlign: 'center', 
                        marginBottom: '1.5rem', 
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                    }}>
                        {successMessage}
                        {authMode === 'recover' && (
                            <button 
                                type="button" 
                                onClick={() => switchTo('resetPassword')}
                                style={{
                                    display: 'block',
                                    margin: '1rem auto 0',
                                    background: 'var(--sipal-teal)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Simular clique no e-mail (Dev Only)
                            </button>
                        )}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleAuth}>
                    {authMode === 'register' && (
                        <div className="form-field">
                            <label htmlFor="name">Nome Completo</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
                        </div>
                    )}

                    {(authMode === 'login' || authMode === 'register' || authMode === 'recover') && (
                        <div className="form-field">
                            <label htmlFor="email">E-mail Corporativo</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                        </div>
                    )}

                    {authMode === 'login' && (
                        <div className="form-field">
                            <label htmlFor="password">Senha</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--sipal-dark-gray)' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe} 
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    /> 
                                    Lembrar-me
                                </label>
                                <button 
                                    type="button" 
                                    className="forgot-password-link" 
                                    onClick={() => switchTo('recover')} 
                                    disabled={isSubmitting}
                                    style={{ fontSize: '0.8rem', opacity: 0.8 }}
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </div>
                    )}

                    {authMode === 'register' && (
                         <div className="form-field">
                            <label htmlFor="confirmPassword">Confirmar Senha</label>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting} />
                        </div>
                    )}

                    {authMode === 'resetPassword' && (
                        <>
                            <div className="form-field">
                                <label htmlFor="newPassword">Nova Senha</label>
                                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isSubmitting} />
                            </div>
                            <div className="form-field">
                                <label htmlFor="confirmNewPassword">Confirmar Nova Senha</label>
                                <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required disabled={isSubmitting} />
                            </div>
                        </>
                    )}

                    <button type="submit" className="submit-btn auth-btn" disabled={isSubmitting}>
                        {getSubmitButtonText()}
                    </button>
                </form>

                <div className="auth-toggle">
                    {authMode === 'login' && (
                        <button onClick={() => switchTo('register')} disabled={isSubmitting}>
                            Não tem uma conta? Registre-se
                        </button>
                    )}
                    {(authMode === 'register' || authMode === 'recover' || authMode === 'resetPassword') && (
                        <button onClick={() => switchTo('login')} disabled={isSubmitting}>
                            Voltar para o Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
