import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithTokens } = useAuth();
    const hasProcessed = useRef(false); 
    
    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;
        
        const handleCallback = () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');
            const error = searchParams.get('error');
            
            if (error) {
                alert('Login failed: ' + error);
                navigate('/login');
                return;
            }
            
            if (accessToken && refreshToken) {
                const result = loginWithTokens(accessToken, refreshToken);
                
                if (result.success) {
                    console.log('OAuth login successful:', result.user);
                    navigate('/client-dashboard', { replace: true });
                } else {
                    console.error('Token processing failed:', result.error);
                    navigate('/login');
                }
            } else {
                console.log('No tokens found in callback');
                navigate('/login');
            }
        };
        
        handleCallback();
    }, [searchParams, navigate]);
    
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            Signing you in...
        </div>
    );
}

export default AuthCallback;