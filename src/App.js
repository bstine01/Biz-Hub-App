import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    setDoc
} from 'firebase/firestore';
import { ArrowRight, Calendar, CheckCircle, ChevronDown, ChevronRight, DollarSign, Edit, Eye, FileText, PlusCircle, Search, Trash2, Users, X, Zap, BarChart2, Briefcase, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- Firebase Configuration ---
// These global variables are provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "DEMO_KEY", authDomain: "DEMO.firebaseapp.com", projectId: "DEMO_PROJECT" };
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700">
                <div className="flex justify-between items-center p-5 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 text-slate-300">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Core App Components ---

const Dashboard = ({ setActivePage, tasks, contacts, transactions }) => {
    const upcomingTasks = useMemo(() => tasks.filter(t => t.status !== 'Done').slice(0, 5), [tasks]);
    const recentContacts = useMemo(() => contacts.slice(0, 5), [contacts]);
    
    const financialSummary = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        return { income, expenses, net: income - expenses };
    }, [transactions]);

    const chartData = [
        { name: 'Financials', income: financialSummary.income, expenses: financialSummary.expenses },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-white">Dashboard</h2>
                <button onClick={() => setActivePage('Projects')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2">
                    <PlusCircle size={20} /> New Task
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-300">Total Tasks</h3>
                        <Briefcase className="text-indigo-400" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-white mt-2">{tasks.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-300">Contacts</h3>
                        <Users className="text-sky-400" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-white mt-2">{contacts.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-300">Net Profit</h3>
                        <DollarSign className="text-emerald-400" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-emerald-400 mt-2">${financialSummary.net.toFixed(2)}</p>
                </div>
                 <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-300">Tasks Due</h3>
                         <CheckCircle className="text-rose-400" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-white mt-2">{tasks.filter(t => t.status !== 'Done').length}</p>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Tasks */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">Upcoming Tasks</h3>
                    <div className="space-y-3">
                        {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                <span className="text-slate-200">{task.title}</span>
                                <span className="text-xs font-medium text-slate-400">{task.dueDate}</span>
                            </div>
                        )) : <p className="text-slate-400">No upcoming tasks. Great job!</p>}
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">This Month's Financials</h3>
                     <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                <Legend />
                                <Bar dataKey="income" fill="#34d399" name="Income" />
                                <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Contacts */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 lg:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Contacts</h3>
                    <div className="space-y-3">
                        {recentContacts.length > 0 ? recentContacts.map(contact => (
                           <div key={contact.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                <div>
                                    <p className="font-semibold text-slate-200">{contact.name}</p>
                                    <p className="text-sm text-slate-400">{contact.email}</p>
                                </div>
                                <span className="text-xs font-medium bg-sky-500/20 text-sky-300 px-2 py-1 rounded-full">{contact.source}</span>
                            </div>
                        )) : <p className="text-slate-400">No contacts added yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectManagement = ({ db, userId }) => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [currentTask, setCurrentTask] = useState({ title: '', description: '', status: 'To Do', dueDate: '', estimatedTime: '', deliverableLink: '' });

    const projectsCollection = useMemo(() => collection(db, `artifacts/${appId}/users/${userId}/projects`), [db, userId]);
    const tasksCollection = useMemo(() => collection(db, `artifacts/${appId}/users/${userId}/tasks`), [db, userId]);

    // Fetch Projects
    useEffect(() => {
        if (!db || !userId) return;
        const unsubscribe = onSnapshot(projectsCollection, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
            if (!selectedProject && projectsData.length > 0) {
                setSelectedProject(projectsData[0]);
            }
        });
        return () => unsubscribe();
    }, [db, userId]);

    // Fetch Tasks for Selected Project
    useEffect(() => {
        if (!db || !userId || !selectedProject) {
            setTasks([]);
            return;
        };
        const q = query(tasksCollection, where("projectId", "==", selectedProject.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksData);
        });
        return () => unsubscribe();
    }, [db, userId, selectedProject]);

    const handleAddProject = async () => {
        if (newProjectName.trim() === '') return;
        try {
            const newProj = await addDoc(projectsCollection, { name: newProjectName });
            setNewProjectName('');
            setIsProjectModalOpen(false);
            setSelectedProject({ id: newProj.id, name: newProjectName }); // Select the new project
        } catch (error) {
            console.error("Error adding project: ", error);
        }
    };
    
    const handleTaskSubmit = async () => {
        if (currentTask.title.trim() === '' || !selectedProject) return;
        try {
            if (editingTask) {
                const taskDoc = doc(db, `artifacts/${appId}/users/${userId}/tasks`, editingTask.id);
                await updateDoc(taskDoc, { ...currentTask, projectId: selectedProject.id });
            } else {
                await addDoc(tasksCollection, { ...currentTask, projectId: selectedProject.id });
            }
            closeTaskModal();
        } catch (error) {
            console.error("Error saving task: ", error);
        }
    };
    
    const handleStatusChange = async (task, newStatus) => {
        const taskDoc = doc(db, `artifacts/${appId}/users/${userId}/tasks`, task.id);
        await updateDoc(taskDoc, { status: newStatus });
    };

    const handleDeleteTask = async (taskId) => {
        if(window.confirm("Are you sure you want to delete this task?")){
            const taskDoc = doc(db, `artifacts/${appId}/users/${userId}/tasks`, taskId);
            await deleteDoc(taskDoc);
        }
    };

    const openTaskModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setCurrentTask(task);
        } else {
            setEditingTask(null);
            setCurrentTask({ title: '', description: '', status: 'To Do', dueDate: '', estimatedTime: '', deliverableLink: '' });
        }
        setIsTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    const taskColumns = {
        'To Do': tasks.filter(t => t.status === 'To Do'),
        'In Progress': tasks.filter(t => t.status === 'In Progress'),
        'Done': tasks.filter(t => t.status === 'Done'),
    };
    
    return (
        <div className="flex h-full">
            {/* Project Sidebar */}
            <aside className="w-1/4 bg-slate-800 p-6 rounded-l-2xl border-r border-slate-700 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-6">Projects</h3>
                <div className="flex-grow space-y-2">
                    {projects.map(project => (
                        <button 
                            key={project.id} 
                            onClick={() => setSelectedProject(project)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedProject?.id === project.id ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                            {project.name}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsProjectModalOpen(true)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-4">
                    <PlusCircle size={20} /> New Project
                </button>
            </aside>
            
            {/* Task Board */}
            <main className="w-3/4 p-8">
                {selectedProject ? (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-4xl font-bold text-white">{selectedProject.name}</h2>
                            <button onClick={() => openTaskModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2">
                                <PlusCircle size={20} /> Add Task
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(taskColumns).map(([status, tasksInColumn]) => (
                                <div key={status} className="bg-slate-800 rounded-xl p-4">
                                    <h4 className="text-lg font-bold text-white mb-4 text-center">{status} ({tasksInColumn.length})</h4>
                                    <div className="space-y-4">
                                        {tasksInColumn.map(task => (
                                            <div key={task.id} className="bg-slate-700 p-4 rounded-lg shadow-md border border-slate-600">
                                                <h5 className="font-bold text-slate-100">{task.title}</h5>
                                                <p className="text-sm text-slate-400 my-2">{task.description}</p>
                                                <div className="text-xs text-slate-400 space-y-1 mt-3">
                                                    {task.dueDate && <p><strong>Due:</strong> {task.dueDate}</p>}
                                                    {task.estimatedTime && <p><strong>Estimate:</strong> {task.estimatedTime} hours</p>}
                                                    {task.deliverableLink && <a href={task.deliverableLink} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">View Deliverable</a>}
                                                </div>
                                                <div className="flex justify-between items-center mt-4">
                                                     <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)} className="bg-slate-600 text-white text-xs rounded p-1 border-0">
                                                        <option>To Do</option>
                                                        <option>In Progress</option>
                                                        <option>Done</option>
                                                    </select>
                                                    <div>
                                                        <button onClick={() => openTaskModal(task)} className="p-1 text-slate-400 hover:text-white"><Edit size={16}/></button>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText size={64} className="text-slate-600 mb-4" />
                        <h3 className="text-2xl font-bold text-white">No Project Selected</h3>
                        <p className="text-slate-400 mt-2">Create or select a project on the left to view its tasks.</p>
                    </div>
                )}
            </main>

            {/* Project Modal */}
            <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Create New Project">
                <div className="space-y-4">
                    <input 
                        type="text" 
                        value={newProjectName} 
                        onChange={e => setNewProjectName(e.target.value)} 
                        placeholder="e.g., Q3 Marketing Campaign"
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button onClick={handleAddProject} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg w-full">Create Project</button>
                </div>
            </Modal>
            
            {/* Task Modal */}
            <Modal isOpen={isTaskModalOpen} onClose={closeTaskModal} title={editingTask ? "Edit Task" : "Create New Task"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Task Title" value={currentTask.title} onChange={e => setCurrentTask({...currentTask, title: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <textarea placeholder="Description" value={currentTask.description} onChange={e => setCurrentTask({...currentTask, description: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 h-24"></textarea>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" placeholder="Due Date" value={currentTask.dueDate} onChange={e => setCurrentTask({...currentTask, dueDate: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                        <input type="number" placeholder="Time Estimate (hours)" value={currentTask.estimatedTime} onChange={e => setCurrentTask({...currentTask, estimatedTime: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    </div>
                    <input type="text" placeholder="Deliverable Link (e.g., Google Doc)" value={currentTask.deliverableLink} onChange={e => setCurrentTask({...currentTask, deliverableLink: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <select value={currentTask.status} onChange={e => setCurrentTask({...currentTask, status: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3">
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </select>
                    <button onClick={handleTaskSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg w-full">{editingTask ? 'Save Changes' : 'Create Task'}</button>
                </div>
            </Modal>
        </div>
    );
};

const CRM = ({ db, userId }) => {
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [currentContact, setCurrentContact] = useState({ name: '', email: '', source: 'YouTube', notes: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const contactsCollection = useMemo(() => collection(db, `artifacts/${appId}/users/${userId}/contacts`), [db, userId]);
    
    useEffect(() => {
        if (!db || !userId) return;
        const unsubscribe = onSnapshot(contactsCollection, (snapshot) => {
            setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleSaveContact = async () => {
        if (currentContact.name.trim() === '' || currentContact.email.trim() === '') return;
        try {
            if (editingContact) {
                const contactDoc = doc(db, `artifacts/${appId}/users/${userId}/contacts`, editingContact.id);
                await updateDoc(contactDoc, currentContact);
            } else {
                await addDoc(contactsCollection, currentContact);
            }
            closeModal();
        } catch (error) {
            console.error("Error saving contact:", error);
        }
    };
    
    const handleDeleteContact = async (contactId) => {
        if(window.confirm("Are you sure you want to delete this contact?")) {
            const contactDoc = doc(db, `artifacts/${appId}/users/${userId}/contacts`, contactId);
            await deleteDoc(contactDoc);
        }
    };

    const openModal = (contact = null) => {
        if (contact) {
            setEditingContact(contact);
            setCurrentContact(contact);
        } else {
            setEditingContact(null);
            setCurrentContact({ name: '', email: '', source: 'YouTube', notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);
    
    const filteredContacts = useMemo(() => contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [contacts, searchTerm]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-white">Customer Contacts</h2>
                <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2">
                    <UserPlus size={20} /> Add Contact
                </button>
            </div>
            
            <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                    type="text"
                    placeholder="Search contacts by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-12 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-slate-300">Name</th>
                            <th className="p-4 text-sm font-semibold text-slate-300">Email</th>
                            <th className="p-4 text-sm font-semibold text-slate-300">Source</th>
                            <th className="p-4 text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredContacts.map(contact => (
                             <tr key={contact.id}>
                                <td className="p-4 text-slate-200">{contact.name}</td>
                                <td className="p-4 text-slate-400">{contact.email}</td>
                                <td className="p-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${contact.source === 'YouTube' ? 'bg-red-500/20 text-red-300' : 'bg-pink-500/20 text-pink-300'}`}>{contact.source}</span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => openModal(contact)} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-md"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-md"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingContact ? "Edit Contact" : "Add New Contact"}>
                <div className="space-y-4">
                    <input type="text" placeholder="Full Name" value={currentContact.name} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <input type="email" placeholder="Email Address" value={currentContact.email} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <select value={currentContact.source} onChange={e => setCurrentContact({...currentContact, source: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3">
                        <option>YouTube</option>
                        <option>Instagram</option>
                        <option>Website</option>
                        <option>Referral</option>
                        <option>Other</option>
                    </select>
                    <textarea placeholder="Notes" value={currentContact.notes} onChange={e => setCurrentContact({...currentContact, notes: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 h-24"></textarea>
                    <button onClick={handleSaveContact} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg w-full">{editingContact ? 'Save Changes' : 'Add Contact'}</button>
                </div>
            </Modal>
        </div>
    );
};

const FinanceTracker = ({ db, userId, transactions, setTransactions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Product Sale' });

    const transactionsCollection = useMemo(() => collection(db, `artifacts/${appId}/users/${userId}/transactions`), [db, userId]);

    const handleSaveTransaction = async () => {
        if (currentTransaction.description.trim() === '' || isNaN(parseFloat(currentTransaction.amount))) return;
        try {
            await addDoc(transactionsCollection, { ...currentTransaction, amount: parseFloat(currentTransaction.amount) });
            closeModal();
        } catch (error) {
            console.error("Error saving transaction: ", error);
        }
    };
    
    const handleDeleteTransaction = async (id) => {
        if(window.confirm("Are you sure you want to delete this transaction?")){
           const transactionDoc = doc(db, `artifacts/${appId}/users/${userId}/transactions`, id);
            await deleteDoc(transactionDoc);
        }
    };
    
    const openModal = (type) => {
        setCurrentTransaction({ description: '', amount: '', date: new Date().toISOString().split('T')[0], type, category: type === 'income' ? 'Product Sale' : 'Software' });
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const income = useMemo(() => transactions.filter(t => t.type === 'income'), [transactions]);
    const expenses = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions]);
    const totalIncome = useMemo(() => income.reduce((sum, t) => sum + t.amount, 0), [income]);
    const totalExpenses = useMemo(() => expenses.reduce((sum, t) => sum + t.amount, 0), [expenses]);
    const balance = totalIncome - totalExpenses;

    const chartData = [
        { name: 'Total', income: totalIncome, expenses: totalExpenses },
    ];
    
    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">Finance Tracker</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-emerald-500/50">
                    <h3 className="text-lg font-semibold text-slate-300">Total Income</h3>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">${totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-rose-500/50">
                    <h3 className="text-lg font-semibold text-slate-300">Total Expenses</h3>
                    <p className="text-3xl font-bold text-rose-400 mt-2">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-sky-500/50">
                    <h3 className="text-lg font-semibold text-slate-300">Net Balance</h3>
                    <p className="text-3xl font-bold text-sky-400 mt-2">${balance.toFixed(2)}</p>
                </div>
            </div>

            {/* Balance Sheet Chart */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Balance Sheet</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                            <Legend />
                            <Bar dataKey="income" fill="#34d399" name="Income" />
                            <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Transaction Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-white">Income</h3>
                        <button onClick={() => openModal('income')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2">+</button>
                    </div>
                    <div className="bg-slate-800 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                        {income.map(t => <TransactionItem key={t.id} transaction={t} onDelete={handleDeleteTransaction} />)}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-white">Expenses</h3>
                         <button onClick={() => openModal('expense')} className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2">+</button>
                    </div>
                    <div className="bg-slate-800 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                        {expenses.map(t => <TransactionItem key={t.id} transaction={t} onDelete={handleDeleteTransaction}/>)}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Add New ${currentTransaction.type}`}>
                 <div className="space-y-4">
                    <input type="text" placeholder="Description" value={currentTransaction.description} onChange={e => setCurrentTransaction({...currentTransaction, description: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <input type="number" placeholder="Amount" value={currentTransaction.amount} onChange={e => setCurrentTransaction({...currentTransaction, amount: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <input type="date" value={currentTransaction.date} onChange={e => setCurrentTransaction({...currentTransaction, date: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                     <input type="text" placeholder="Category" value={currentTransaction.category} onChange={e => setCurrentTransaction({...currentTransaction, category: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <button onClick={handleSaveTransaction} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg w-full">Add Transaction</button>
                </div>
            </Modal>
        </div>
    );
};

const TransactionItem = ({ transaction, onDelete }) => (
    <div className="flex justify-between items-center p-3 border-b border-slate-700 last:border-b-0">
        <div>
            <p className="font-semibold text-slate-200">{transaction.description}</p>
            <p className="text-xs text-slate-400">{transaction.date} - {transaction.category}</p>
        </div>
        <div className="flex items-center gap-4">
            <span className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${parseFloat(transaction.amount).toFixed(2)}
            </span>
            <button onClick={() => onDelete(transaction.id)} className="text-slate-500 hover:text-rose-500">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

const AppCalendar = ({ tasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (!task.dueDate) return;
            const date = task.dueDate;
            if (!map[date]) {
                map[date] = [];
            }
            map[date].push(task);
        });
        return map;
    }, [tasks]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold text-white">Content & Launch Calendar</h2>
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-700 rounded-md">&lt;</button>
                    <h3 className="text-2xl font-semibold text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => changeMonth(1)} className="p-2 bg-slate-700 rounded-md">&gt;</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                    <div key={dayName} className="text-center font-bold p-3 bg-slate-800 text-slate-300">{dayName}</div>
                ))}
                {days.map(d => {
                    const dateStr = d.toISOString().split('T')[0];
                    const tasksForDay = tasksByDate[dateStr] || [];
                    return (
                        <div key={d.toISOString()} className={`p-2 h-36 bg-slate-800 overflow-y-auto ${d.getMonth() !== currentDate.getMonth() ? 'opacity-40' : ''}`}>
                            <span className="font-bold text-slate-200">{d.getDate()}</span>
                            <div className="mt-1 space-y-1">
                                {tasksForDay.map(task => (
                                    <div key={task.id} className="text-xs p-1 bg-indigo-600/50 rounded text-white truncate">{task.title}</div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Flowcharts = ({ db, userId }) => {
    const [flowcharts, setFlowcharts] = useState([]);
    const [selectedFlowchart, setSelectedFlowchart] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFlowchart, setEditingFlowchart] = useState(null);
    const [currentFlowchart, setCurrentFlowchart] = useState({ name: '', steps: [{ description: '' }] });

    const flowchartsCollection = useMemo(() => collection(db, `artifacts/${appId}/users/${userId}/flowcharts`), [db, userId]);

    useEffect(() => {
        if (!db || !userId) return;
        const unsubscribe = onSnapshot(flowchartsCollection, (snapshot) => {
            const fcData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFlowcharts(fcData);
             if (!selectedFlowchart && fcData.length > 0) {
                setSelectedFlowchart(fcData[0]);
            }
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleSave = async () => {
        if (currentFlowchart.name.trim() === '') return;
        const flowchartToSave = {
            ...currentFlowchart,
            steps: currentFlowchart.steps.filter(s => s.description.trim() !== '')
        };
        try {
            if (editingFlowchart) {
                const docRef = doc(db, `artifacts/${appId}/users/${userId}/flowcharts`, editingFlowchart.id);
                await updateDoc(docRef, flowchartToSave);
            } else {
                await addDoc(flowchartsCollection, flowchartToSave);
            }
            closeModal();
        } catch (error) {
            console.error("Error saving flowchart:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this flowchart?')) {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/flowcharts`, id));
            setSelectedFlowchart(null);
        }
    };

    const openModal = (fc = null) => {
        if (fc) {
            setEditingFlowchart(fc);
            setCurrentFlowchart({ ...fc, steps: fc.steps.length > 0 ? fc.steps : [{ description: '' }] });
        } else {
            setEditingFlowchart(null);
            setCurrentFlowchart({ name: '', steps: [{ description: '' }] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleStepChange = (index, value) => {
        const newSteps = [...currentFlowchart.steps];
        newSteps[index].description = value;
        setCurrentFlowchart({ ...currentFlowchart, steps: newSteps });
    };

    const addStep = () => {
        setCurrentFlowchart({ ...currentFlowchart, steps: [...currentFlowchart.steps, { description: '' }] });
    };

    const removeStep = (index) => {
        const newSteps = currentFlowchart.steps.filter((_, i) => i !== index);
        setCurrentFlowchart({ ...currentFlowchart, steps: newSteps });
    };

    return (
        <div className="flex h-full">
            <aside className="w-1/3 bg-slate-800 p-6 rounded-l-2xl border-r border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Flowcharts</h3>
                    <button onClick={() => openModal()} className="p-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-500"><PlusCircle size={20}/></button>
                </div>
                <div className="flex-grow space-y-2">
                    {flowcharts.map(fc => (
                        <div key={fc.id} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer ${selectedFlowchart?.id === fc.id ? 'bg-indigo-600' : 'hover:bg-slate-700'}`} onClick={() => setSelectedFlowchart(fc)}>
                            <span className="font-semibold text-white">{fc.name}</span>
                            <div>
                                <button onClick={(e) => { e.stopPropagation(); openModal(fc); }} className="p-1 text-slate-400 hover:text-white"><Edit size={16}/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(fc.id); }} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="w-2/3 p-8">
                {selectedFlowchart ? (
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-8">{selectedFlowchart.name}</h2>
                        <div className="space-y-4">
                            {selectedFlowchart.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">{index + 1}</div>
                                    <div className="flex-grow p-4 bg-slate-700 rounded-lg text-slate-200">{step.description}</div>
                                    {index < selectedFlowchart.steps.length - 1 && <div className="text-slate-500 text-2xl">↓</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <Zap size={64} className="text-slate-600 mb-4" />
                        <h3 className="text-2xl font-bold text-white">No Flowchart Selected</h3>
                        <p className="text-slate-400 mt-2">Create or select a flowchart to visualize your process.</p>
                    </div>
                )}
            </main>
             <Modal isOpen={isModalOpen} onClose={closeModal} title={editingFlowchart ? "Edit Flowchart" : "Create Flowchart"}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <input type="text" placeholder="Flowchart Name (e.g., New Product Launch)" value={currentFlowchart.name} onChange={e => setCurrentFlowchart({...currentFlowchart, name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                    <h4 className="text-lg font-semibold text-white pt-4">Steps</h4>
                    {currentFlowchart.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input type="text" placeholder={`Step ${index + 1}`} value={step.description} onChange={(e) => handleStepChange(index, e.target.value)} className="flex-grow bg-slate-700 border border-slate-600 text-white rounded-lg p-3" />
                            <button onClick={() => removeStep(index)} className="p-2 text-rose-500 hover:bg-rose-500/20 rounded-md"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    <button onClick={addStep} className="text-indigo-400 font-semibold text-sm">+ Add Step</button>
                </div>
                 <div className="mt-6 pt-4 border-t border-slate-700">
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg w-full">{editingFlowchart ? "Save Changes" : "Create Flowchart"}</button>
                </div>
            </Modal>
        </div>
    );
};

export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [activePage, setActivePage] = useState('Dashboard');
    
    // Global data stores
    const [tasks, setTasks] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);

            onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    if (initialAuthToken) {
                         await signInWithCustomToken(authInstance, initialAuthToken);
                    } else {
                         await signInAnonymously(authInstance);
                    }
                }
                setIsAuthReady(true);
            });
        } catch (e) {
            console.error("Firebase initialization error", e);
            setIsAuthReady(true); // Allow app to run in a demo state
        }
    }, []);
    
    // --- Global Data Fetchers ---
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;

        const tasksQuery = query(collection(db, `artifacts/${appId}/users/${userId}/tasks`));
        const tasksUnsubscribe = onSnapshot(tasksQuery, snapshot => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, err => console.error("Error fetching tasks:", err));

        const contactsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/contacts`));
        const contactsUnsubscribe = onSnapshot(contactsQuery, snapshot => {
            setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, err => console.error("Error fetching contacts:", err));
        
        const transactionsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/transactions`));
        const transactionsUnsubscribe = onSnapshot(transactionsQuery, snapshot => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, err => console.error("Error fetching transactions:", err));

        return () => {
            tasksUnsubscribe();
            contactsUnsubscribe();
            transactionsUnsubscribe();
        };
    }, [isAuthReady, db, userId]);


    const NavItem = ({ icon: Icon, label, page }) => (
        <button 
            onClick={() => setActivePage(page)} 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors w-full text-left ${activePage === page ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
            <Icon size={22} />
            <span className="font-semibold">{label}</span>
        </button>
    );

    const renderPage = () => {
        if (!isAuthReady) {
            return <div className="flex items-center justify-center h-full text-white">Loading Business Hub...</div>;
        }
        if (!db || !userId) {
             return <div className="flex items-center justify-center h-full text-white">Error connecting to services. Running in demo mode.</div>;
        }

        switch (activePage) {
            case 'Dashboard':
                return <Dashboard setActivePage={setActivePage} tasks={tasks} contacts={contacts} transactions={transactions} />;
            case 'Projects':
                return <ProjectManagement db={db} userId={userId} />;
            case 'CRM':
                return <CRM db={db} userId={userId} />;
            case 'Finances':
                return <FinanceTracker db={db} userId={userId} transactions={transactions} setTransactions={setTransactions} />;
            case 'Calendar':
                return <AppCalendar tasks={tasks} />;
            case 'Flowcharts':
                return <Flowcharts db={db} userId={userId} />;
            default:
                return <Dashboard setActivePage={setActivePage} tasks={tasks} contacts={contacts} transactions={transactions} />;
        }
    };
    
    return (
        <div className="bg-slate-900 text-white font-sans flex min-h-screen">
            <nav className="w-64 bg-slate-800 p-6 flex flex-col gap-2 border-r border-slate-700">
                <div className="flex items-center gap-3 mb-8">
                    <Zap className="text-indigo-400" size={32} />
                    <h1 className="text-2xl font-bold">BizHub</h1>
                </div>
                <NavItem icon={BarChart2} label="Dashboard" page="Dashboard" />
                <NavItem icon={Briefcase} label="Projects & Tasks" page="Projects" />
                <NavItem icon={Users} label="CRM" page="CRM" />
                <NavItem icon={DollarSign} label="Finances" page="Finances" />
                <NavItem icon={Calendar} label="Calendar" page="Calendar" />
                <NavItem icon={ArrowRight} label="Flowcharts" page="Flowcharts" />
                <div className="mt-auto text-center text-xs text-slate-500">
                    <p>User ID:</p>
                    <p className="break-all">{userId || 'Not Authenticated'}</p>
                </div>
            </nav>
            <main className="flex-1 p-8">
                {renderPage()}
            </main>
        </div>
    );
}