import React, { useEffect, useState } from 'react';
import { GraduationCap, Target, Users, Lightbulb, Award, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const steps = [
	{ title: 'Our Aim', desc: 'Our aim through NEEV is to build a strong foundation from Class 8 onwards, bridging the gap between school studies and competitive exams like JEE and NEET.', icon: Target },
	{ title: 'Expert Faculties', desc: 'Experienced faculty including IITians and NEET-qualified teachers provide concept clarity and exam guidance.', icon: Users },
	{ title: 'Holistic Development', desc: 'Weekly extracurricular activities help holistic development.', icon: Lightbulb },
	{ title: 'Modern Facilities', desc: 'Smart classrooms and comfortable environment for learning.', icon: GraduationCap },
	{ title: 'Excellence', desc: 'We aim to help students reach their highest potential.', icon: Award },
];

const themeYellow = '#fcd116';
const themeBlue = '#2563eb';

const Neev: React.FC = () => {
	const navigate = useNavigate();
	const [showForm, setShowForm] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [progress, setProgress] = useState<boolean[]>([false, false, false, false]);
	const [currentRole, setCurrentRole] = useState<string | null>(null);

	const [name, setName] = useState('');
	const [fatherName, setFatherName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [dob, setDob] = useState('');
	const [aim, setAim] = useState('');
	const [exams, setExams] = useState('');

	useEffect(() => {
		try {
			const raw = localStorage.getItem('loggedUser');
			if (!raw) return;
			const user = JSON.parse(raw);
			const key = `neevApplication_${user.admissionId || 'guest'}`;
			const app = localStorage.getItem(key);
			if (app) setSubmitted(true);
			setCurrentRole(user.loggedAs || null);
			const progKey = `neevProgress_${user.admissionId || 'guest'}`;
			const prog = localStorage.getItem(progKey);
			if (prog) {
				try {
					const arr = JSON.parse(prog);
					if (Array.isArray(arr) && arr.length === 4) setProgress(arr);
				} catch (e) {}
			}
		} catch (e) {}
	}, []);

	const parseGrade = (className: any): number | null => {
		if (!className) return null;
		const s = String(className).trim();
		const n = Number(s);
		if (!Number.isNaN(n)) return n;
		const map: Record<string, number> = {
			I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
			VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
		};
		const up = s.toUpperCase();
		if (map[up]) return map[up];
		const m = s.match(/(\d+)/);
		if (m) return Number(m[1]);
		return null;
	};

	const handleApplyClick = async () => {
		setMessage(null);
		try {
			const raw = localStorage.getItem('loggedUser');
			if (!raw) {
				setMessage('Please sign in to apply for NEEV.');
				return;
			}
			const user = JSON.parse(raw);
			if (user.loggedAs && user.loggedAs !== 'student') {
				setMessage('Please login as a student to apply for NEEV.');
				return;
			}

			// Check student class from database
			const { data: studentData, error: studentError } = await supabase
				.from('students')
				.select('class_section, class_name, section')
				.eq('admission_id', user.admission_id || user.admissionId)
				.maybeSingle();

			if (studentError) {
				console.error('Error fetching student:', studentError);
				setMessage('Error verifying student information. Please try again.');
				return;
			}

			if (!studentData) {
				setMessage('Student record not found. Please contact administration.');
				return;
			}

			// Parse class number from class_name or class_section
			const classNum = parseInt(studentData.class_name || studentData.class_section?.split('-')[0] || '0');
			if (isNaN(classNum) || classNum < 8) {
				setMessage('Only students of Class 8 or above can apply for NEEV.');
				return;
			}

			// Check if already in NEEV section
			const section = (studentData.section || studentData.class_section?.split('-')[1] || '').toString().trim().toLowerCase();
			if (section === 'neev' || section === 'n') {
				setMessage('You are already enrolled in NEEV.');
				return;
			}

			// Check if already applied
			const { data: existingApp } = await supabase
				.from('neev_applications')
				.select('*')
				.eq('student_id', user.admission_id || user.admissionId)
				.maybeSingle();

			if (existingApp) {
				setName(existingApp.student_name || user.name || '');
				setFatherName(existingApp.father_name || '');
				setPhone(existingApp.phone || user.phone || '');
				setEmail(existingApp.email || user.email || '');
				setDob(existingApp.dob || user.dob || '');
				setAim(existingApp.aim || '');
				setExams(existingApp.target_exams || '');
				setSubmitted(existingApp.status !== 'draft');
			} else {
				setName(user.name || '');
				setEmail(user.email || '');
				setPhone(user.phone || '');
				setDob(user.dob || '');
			}

			setShowForm(true);
		} catch (e) {
			console.error('Error in handleApplyClick:', e);
			setMessage('Unable to verify login status. Please try again.');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const raw = localStorage.getItem('loggedUser');
			if (!raw) {
				setMessage('Please sign in first.');
				return;
			}
			const user = JSON.parse(raw);
			const studentId = user.admission_id || user.admissionId;

			// Check if application exists
			const { data: existingApp } = await supabase
				.from('neev_applications')
				.select('id')
				.eq('student_id', studentId)
				.maybeSingle();

			const payload = {
				student_id: studentId,
				student_name: name,
				father_name: fatherName,
				phone,
				email,
				dob,
				aim,
				target_exams: exams,
				status: 'pending',
				class_section: user.class_section || ''
			};

			let error;
			if (existingApp) {
				// Update existing application
				const result = await supabase
					.from('neev_applications')
					.update(payload)
					.eq('id', existingApp.id);
				error = result.error;
			} else {
				// Insert new application
				const result = await supabase
					.from('neev_applications')
					.insert(payload);
				error = result.error;
			}

			if (error) {
				console.error('Error saving application:', error);
				toast.error('Failed to submit application: ' + error.message);
				return;
			}

			setSubmitted(true);
			setShowForm(false);
			setMessage('Application submitted successfully! We will contact you soon.');
			toast.success('Application submitted successfully!');

			const progKey = `neevProgress_${studentId}`;
			const init = [true, false, false, false];
			localStorage.setItem(progKey, JSON.stringify(init));
			setProgress(init);
		} catch (e: any) {
			console.error('Error submitting application:', e);
			setMessage('Could not save application: ' + e.message);
			toast.error('Failed to submit application');
		}
	};

	const advanceStep = (idx: number) => {
		try {
			const raw = localStorage.getItem('loggedUser');
			if (!raw) return;
			const user = JSON.parse(raw);
			const progKey = `neevProgress_${user.admissionId || 'guest'}`;
			const next = [...progress];
			if (idx >= 0 && idx < next.length) next[idx] = true;
			localStorage.setItem(progKey, JSON.stringify(next));
			setProgress(next);
		} catch (e) {}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-28 pb-20 px-4">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<div className="flex items-center justify-center mb-6">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.5, type: 'spring' }}
							className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl"
						>
							<GraduationCap className="w-12 h-12 text-white" />
						</motion.div>
					</div>
					<h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
						NEEV Program
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						School Integrated Foundation Program for motivated students starting from Class 8
					</p>
				</motion.div>

				<div className="grid md:grid-cols-2 gap-6 mb-12">
					{steps.map((step, idx) => (
						<motion.div
							key={step.title}
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: idx * 0.1 }}
							whileHover={{ scale: 1.03, y: -5 }}
							className="relative group"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl" />
							<div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
								<div className="flex items-start gap-4">
									<div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
										idx % 2 === 0
											? 'bg-gradient-to-r from-blue-500 to-blue-600'
											: 'bg-gradient-to-r from-yellow-400 to-orange-500'
									}`}>
										<step.icon className="w-7 h-7 text-white" />
									</div>
									<div>
										<h3 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
										<p className="text-gray-600 leading-relaxed">{step.desc}</p>
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.5 }}
					className="text-center mb-12"
				>
					<motion.button
						onClick={handleApplyClick}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
					>
						{submitted ? 'View / Edit Application' : 'Apply for NEEV'}
					</motion.button>
				</motion.div>

				{message && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="mb-8 max-w-2xl mx-auto"
					>
						<div className={`p-6 rounded-2xl border-2 ${
							message.includes('submitted') ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
						}`}>
							<p className={`text-center font-medium ${
								message.includes('submitted') ? 'text-green-800' : 'text-yellow-900'
							}`}>
								{message}
							</p>
							{!localStorage.getItem('loggedUser') && (
								<div className="mt-4 text-center">
									<button onClick={() => navigate('/')} className="text-blue-600 font-semibold hover:underline">
										Go to login
									</button>
								</div>
							)}
						</div>

						{submitted && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="mt-8 bg-white border-2 border-blue-100 rounded-2xl p-8 shadow-xl"
							>
								<h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Application Progress</h3>
								<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
									{['Fill form', 'Visit NEEV', 'Interview & Test', 'Done'].map((label, i) => (
										<div key={label} className="flex flex-col items-center">
											<div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
												progress[i]
													? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-110'
													: 'bg-gray-100 text-gray-400'
											}`}>
												{progress[i] ? (
													<CheckCircle2 className="w-8 h-8" />
												) : (
													<Clock className="w-8 h-8" />
												)}
											</div>
											<p className="mt-3 text-sm font-semibold text-center text-gray-700">{label}</p>
											{!progress[i] && currentRole !== 'student' && (
												<button
													onClick={() => advanceStep(i)}
													className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
												>
													Mark done
												</button>
											)}
										</div>
									))}
								</div>
							</motion.div>
						)}
					</motion.div>
				)}

				{showForm && (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl"
					>
						<div className="flex items-center gap-3 mb-8">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
								<GraduationCap className="w-6 h-6 text-white" />
							</div>
							<h3 className="text-3xl font-bold text-gray-900">NEEV Application Form</h3>
						</div>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
									<input
										value={name}
										onChange={e => setName(e.target.value)}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Father's name</label>
									<input
										value={fatherName}
										onChange={e => setFatherName(e.target.value)}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
									<input
										value={phone}
										onChange={e => setPhone(e.target.value)}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
									<input
										type="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Date of birth</label>
									<input
										type="date"
										value={dob}
										onChange={e => setDob(e.target.value)}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Your Aim</label>
								<input
									value={aim}
									onChange={e => setAim(e.target.value)}
									placeholder="e.g., Become an engineer"
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Target Exams</label>
								<input
									value={exams}
									onChange={e => setExams(e.target.value)}
									placeholder="e.g., JEE, NEET, NTSE"
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
								/>
							</div>

							<div className="flex items-center gap-4 pt-4">
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									type="submit"
									className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
								>
									Submit Application
								</motion.button>
								<button
									type="button"
									onClick={() => setShowForm(false)}
									className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
								>
									Cancel
								</button>
							</div>
						</form>
					</motion.div>
				)}
			</div>
		</div>
	);
};

export default Neev;
