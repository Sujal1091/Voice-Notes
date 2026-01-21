    import React, { useState } from 'react';
    import { User, Mail, Lock, Briefcase, ArrowRight, Mic, Users, AlertCircle } from 'lucide-react';
    import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Import Firebase methods
    import { auth,googleProvider } from '../config/firebase'; // Import auth instance

    const Signup = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        email: '',
        password: '',
        workStatus: ''
    });
    const [error, setError] = useState(''); // State for errors
    const [loading, setLoading] = useState(false); // State for loading

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
        // 1. Create User in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // 2. Update their profile with the Name (optional but recommended)
        await updateProfile(userCredential.user, {
            displayName: formData.name
        });

        // Note: Work Status & Gender would typically go into a database (Firestore), 
        // but for now we just create the Auth account.
        
        } catch (err) {
        // Handle Firebase errors (e.g., email already in use, weak password)
        setError(err.message.replace('Firebase: ', ''));
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            
            <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            </div>

            {/* Error Message Display */}
            {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
            )}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {/* ... (Keep your Name, Gender, Work Status inputs EXACTLY as they were) ... */}
            
            {/* Name Field */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                name="name" type="text" required placeholder="Full Name" onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            {/* Gender Field */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select name="gender" required defaultValue="" onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                </select>
            </div>

            {/* Work Status Field */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select name="workStatus" required defaultValue="" onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                <option value="" disabled>Work Status</option>
                <option value="employed">Employed</option>
                <option value="student">Student</option>
                <option value="job_seeker">Looking for work</option>
                </select>
            </div>

            {/* Email Field */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                name="email" type="email" required placeholder="Email address" onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            {/* Password Field */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                name="password" type="password" required placeholder="Password" onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mt-6 disabled:opacity-70"
            >
                {loading ? 'Creating Account...' : 'Sign Up'}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            </form>

            <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Sign in
                </button>
            </p>
            </div>
        </div>
        </div>
    );
    };

    export default Signup;