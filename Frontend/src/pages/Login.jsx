import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"
import { Eye, EyeOff, LockKeyhole, Mail} from "lucide-react"
import { login } from "../services/authService";

function Login(){
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if(!email || !password){
            setError("Please enter email and password");
            return;
        }

        try{
            setLoading(true);

            const data = await login(email, password);

            loginUser(data.data);
            navigate("/dashboard");
            
        }catch(err){
            console.log(err);

            setError(
                err.response?.data?.error?.message || "Invalid email or password."
            );
        }finally{
            setLoading(false);
        }
    };

    return(
        <div className="login-page">
            <div className="login-card">

                <div className="login-logo">
                    <div className="login-logo-icon">L</div>
                    <h1>LeadFlow</h1>
                </div>

                <div className="login-heading">
                    <h2>Welcome back</h2>
                    <p>Sign in to manage your leads.</p>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email</label>

                        <div className="input-wrapper">
                            <Mail size={18}/>

                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <div className="input-wrapper">
                            <LockKeyhole size={18}/>

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={18}/>
                                ) : (
                                    <Eye size={18}/>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in...." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;