// client/src/App.js

import React, { useState, useRef } from 'react';
import axios from 'axios';
// Importing icons for a better UI
import { FaPaperPlane, FaSpinner, FaCheckCircle, FaTimesCircle, FaFileUpload } from 'react-icons/fa';
import './App.css';

function App() {
    // State variables
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('No file chosen');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    // A single state object for status messages (message and type: 'success' or 'error')
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    // A ref to access the file input element directly to reset it
    const fileInputRef = useRef(null);

    // --- Event Handlers ---

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    // Function to reset the form fields to their initial state
    const resetForm = () => {
        setFile(null);
        setFileName('No file chosen');
        setSubject('');
        setBody('');
        // This is the key to resetting the file input visually
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !subject || !body) {
            setStatus({ message: 'Please fill in all fields and select a file.', type: 'error' });
            return;
        }

        setIsLoading(true);
        setStatus({ message: 'Processing... Please wait.', type: 'loading' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subject', subject);
        formData.append('body', body);

        try {
            await axios.post('https://inforag-backend.onrender.com/api/send-emails', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Show a success alert to the user
            alert('Emails sent successfully!');
            setStatus({ message: 'Emails sent successfully!', type: 'success' });
            // Reset the form on success
            resetForm();
        } catch (error) {
            setStatus({
                message: error.response?.data?.message || 'An unexpected error occurred.',
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="form-wrapper">
                <header className="form-header">
                    <h1>Bulk Email Sender</h1>
                    <p>Upload your list, compose your message, and send with one click.</p>
                </header>

                <form onSubmit={handleSubmit}>
                    {/* File Input */}
                    <div className="form-group">
                        <label htmlFor="file-upload" className="file-input-label">
                            <FaFileUpload />
                            <span>Choose File</span>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .csv"
                            onChange={handleFileChange}
                            ref={fileInputRef} // Attach the ref
                            required
                        />
                        <span className="file-name">{fileName}</span>
                    </div>

                    {/* Subject Input */}
                    <div className="form-group">
                        <input
                            className="form-control"
                            id="subject"
                            type="text"
                            placeholder="Email Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    {/* Body Textarea */}
                    <div className="form-group">
                        <textarea
                            className="form-control"
                            id="body"
                            placeholder="Write your email body here. Use {Name} as a placeholder."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <FaSpinner className="spinner" /> Sending...
                            </>
                        ) : (
                            <>
                                <FaPaperPlane /> Send Emails
                            </>
                        )}
                    </button>
                </form>

                {/* Status Message Display */}
                {status.message && (
                    <div className={`status-message ${status.type}`}>
                        {status.type === 'success' && <FaCheckCircle />}
                        {status.type === 'error' && <FaTimesCircle />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
