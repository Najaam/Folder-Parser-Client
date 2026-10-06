import {
  ArrowRight, BarChart3, Bot, Braces, CheckCircle2, ChevronRight,
  ClipboardCheck, Code2, FileCheck2, FileText, FolderOpen, Gauge,
  Play, Rocket, ScanSearch, ShieldCheck, Sparkles, Upload
} from "lucide-react";
import "./LandingPage.css";

const features = [
  [ScanSearch, "Smart Analysis", "Upload your feature files and our AI analyzes them to understand scenarios, steps, and validations."],
  [Code2, "Jest Code Generation", "Automatically generate clean, maintainable, and ready-to-run Jest test cases."],
  [ShieldCheck, "Validation & Error Cases", "Get such scenarios along with error handling and edge case validations."],
  [BarChart3, "Detailed Reports", "View comprehensive reports with metrics, coverage, and execution insights."]
];

const steps = [
  [Upload, "Upload Feature File", "Upload your .feature files to get started."],
  [Bot, "AI Analysis", "Our AI engine analyzes and understands your scenarios."],
  [Braces, "Generate Test Cases", "Get structured test cases and Jest code in seconds."],
  [ClipboardCheck, "Review & Use", "Review, customize and run your tests with confidence."]
];

function ActionButton({ children, onClick, secondary = false }) {
  return <button type="button" onClick={onClick} className={`landing-action ${secondary ? "secondary" : ""}`}>{children}</button>;
}

function SocialIcon({ name }) {
  if (name === "github") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.88c-2.78.62-3.36-1.21-3.36-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.37 9.37 0 0 1 12 6.36c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.93.68 1.88v2.78c0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" /></svg>;
  if (name === "linkedin") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 3.4A1.8 1.8 0 1 1 5.2 7a1.8 1.8 0 0 1 0-3.6ZM3.7 8.4h3v12h-3v-12Zm4.9 0h2.9V10h.04c.4-.77 1.39-1.59 2.86-1.59 3.06 0 3.63 2.02 3.63 4.65v7.34h-3v-6.51c0-1.55-.03-3.55-2.16-3.55-2.17 0-2.5 1.69-2.5 3.44v6.62h-3V8.4Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2.8h3.68l-8.03 9.18L24 21.2h-7.4l-5.8-7.57-6.62 7.57H.5l8.59-9.82L0 2.8h7.59l5.24 6.93L18.9 2.8Zm-1.3 16.92h2.04L6.48 4.2H4.29L17.6 19.72Z" /></svg>;
}

function ProductPreview() {
  return <div className="landing-preview" aria-label="DevSure product preview">
    <aside><strong><ShieldCheck size={15} /> DevSure Analyzer</strong><span className="preview-active"><Gauge size={14} /> Dashboard</span><span><ScanSearch size={14} /> Analysis</span><span><ClipboardCheck size={14} /> Test Cases</span><span><FileText size={14} /> Reports</span><span><FileCheck2 size={14} /> Settings</span></aside>
    <section><h4>Analysis Summary</h4><div className="preview-metrics"><b><small>Files Analyzed</small>24<FileText /></b><b><small>Test Cases Generated</small>156<ClipboardCheck /></b><b><small>Success Rate</small>98%<BarChart3 /></b></div><div className="preview-recent"><h4>Recent Analyses</h4>{["auth.feature", "user-management.feature", "payment.feature", "order.feature"].map((file, i) => <p key={file}><span>{file}</span><small>{["2 min ago", "15 min ago", "1 hour ago", "2 hours ago"][i]}</small><em>ANALYZED</em></p>)}<a href="#docs">View all analyses <ArrowRight size={13} /></a></div></section>
  </div>;
}

export default function LandingPage({ onGetStarted }) {
  return <main className="landing-page">
    <header className="landing-nav"><button className="landing-brand" onClick={onGetStarted}><ShieldCheck size={26} /><span><b>DevSure</b> Analyzer</span></button><nav><a href="#features">Features</a><a href="#how-it-works">How it Works</a><a href="#benefits">Benefits</a><a href="#pricing">Pricing</a><a href="#docs">Docs</a></nav><div><button className="login-button" type="button" onClick={onGetStarted}>Log in</button><ActionButton onClick={onGetStarted}>Get Started Free <ArrowRight size={15} /></ActionButton></div></header>

    <section className="landing-hero"><div className="landing-hero-copy"><span className="ai-badge"><Sparkles size={13} /> AI-Powered Test Case Generation</span><h1>Analyze. Generate.<br />Test with <mark>Confidence.</mark></h1><p>DevSure Analyzer analyzes your feature files and automatically generates high-quality test cases, Jest code, and validation scenarios in seconds.</p><div className="hero-actions"><ActionButton onClick={onGetStarted}>Get Started Free</ActionButton><ActionButton onClick={onGetStarted} secondary>View Demo <Play size={15} /></ActionButton></div><div className="hero-proofs"><span><CheckCircle2 /> AI-Powered Analysis</span><span><CheckCircle2 /> Jest Test Generation</span><span><CheckCircle2 /> Save 80% QA Time</span></div></div><ProductPreview /></section>

    <section id="features" className="landing-section"><h2><mark>Powerful features</mark> for modern QA teams</h2><p>Everything you need to deliver quality software, faster.</p><div className="feature-grid">{features.map(([Icon, title, text]) => <article key={title}><span><Icon size={24} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section id="benefits" className="benefit-row">{[[Rocket, "80%", "Time Saved"], [ShieldCheck, "10K+", "Test Cases Generated"], [FolderOpen, "500+", "Feature Files Analyzed"], [Bot, "200+", "Happy QA Teams"]].map(([Icon, value, label]) => <div key={label}><Icon size={25} /><b>{value}</b><small>{label}</small></div>)}</section>

    <section id="how-it-works" className="landing-section how-section"><h2>How <mark>DevSure Analyzer</mark> works</h2><div className="steps">{steps.map(([Icon, title, text], index) => <article key={title}><span className="step-number">{index + 1}</span><i><Icon size={28} /></i><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="landing-cta"><span><Rocket size={45} /></span><div><h2>Ready to boost your QA productivity?</h2><p>Join hundreds of teams who trust DevSure Analyzer for intelligent test automation.</p></div><div className="cta-action"><ActionButton onClick={onGetStarted}>Get Started Free <ArrowRight size={16} /></ActionButton><small>No credit card required</small></div></section>

    <footer><div className="footer-brand"><b><ShieldCheck size={22} /> <mark>DevSure</mark> Analyzer</b><p>AI-powered test case generation that helps QA teams ship quality software, faster.</p></div><div><b>Product</b><a href="#features">Features</a><a href="#how-it-works">How it Works</a><a href="#pricing">Pricing</a></div><div><b>Resources</b><a href="#docs">Documentation</a><a href="#docs">FAQs</a><a href="#docs">Blog</a></div><div><b>Company</b><a href="#docs">About Us</a><a href="#docs">Contact</a><a href="#docs">Privacy Policy</a></div><div><b>Stay Updated</b><p>Subscribe to get the latest updates and feature announcements.</p><label><input placeholder="Enter your email" /><button type="button" aria-label="Subscribe"><ArrowRight size={16} /></button></label></div></footer><div className="footer-bottom"><small className="copyright">© 2024 DevSure Analyzer. All rights reserved.</small><div className="footer-social" aria-label="Social media links"><a href="https://github.com" aria-label="GitHub"><SocialIcon name="github" /></a><a href="https://linkedin.com" aria-label="LinkedIn"><SocialIcon name="linkedin" /></a><a href="https://x.com" aria-label="X"><SocialIcon name="x" /></a></div></div>
  </main>;
}
