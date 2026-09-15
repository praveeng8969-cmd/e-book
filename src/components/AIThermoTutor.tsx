import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Lightbulb, BookOpen, Atom, HelpCircle, Loader2 } from 'lucide-react';
import { MathView } from './MathView';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  latex?: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  'Explain why adiabatic process line is steeper than isothermal on P-V diagram.',
  'Why does temperature of an ideal gas increase when charging an evacuated tank to line pressure?',
  'Derive Maxwell relations from thermodynamic potentials.',
  'What is the physical meaning of Gouy-Stodola theorem and exergy destruction?',
  'Explain why latent heat of vaporization is zero at the critical point of water.',
];

export const AIThermoTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your AI Thermodynamics Professor. You can ask me to explain any concept from the 150-page notes, derive equations step-by-step, explain physical principles behind the interactive simulations, or guide you through numerical problem solving!',
      latex: 'T \\, ds = du + P \\, dv \\quad \\Longleftrightarrow \\quad T \\, ds = dh - v \\, dP',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setIsLoading(true);

    try {
      // Simulate intelligent contextual tutoring engine or call API
      setTimeout(() => {
        const reply = generateThermoResponse(textToSend);
        const aiMsg: Message = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: reply.text,
          latex: reply.latex,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
      }, 750);
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
      {/* Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Thermodynamics Professor</h3>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span> Online
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Grounded in 150 pages of handwritten classical thermodynamics notes</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="hidden sm:inline">Interactive Derivations & Socratic Help</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                msg.sender === 'user' ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold' : 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {msg.latex && (
                <div className="bg-slate-50 dark:bg-slate-950/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center overflow-x-auto my-2 text-cyan-800 dark:text-cyan-300">
                  <MathView math={msg.latex} block />
                </div>
              )}

              <div className={`text-[10px] text-right ${msg.sender === 'user' ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
              <Loader2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <span>Analyzing thermodynamic laws and formulating mathematical derivation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto flex gap-2">
        {PRESET_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Lightbulb className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>{prompt.slice(0, 42)}...</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question about any chapter, formula, or derivation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 disabled:opacity-50 text-white dark:text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </div>
    </div>
  );
};

function generateThermoResponse(query: string): { text: string; latex?: string } {
  const q = query.toLowerCase();

  if (q.includes('adiabatic') && (q.includes('isothermal') || q.includes('slope') || q.includes('steeper'))) {
    return {
      text: `Great question! On the Pressure-Volume (P-V) plane:\n\n1. For an Isothermal Process ($PV = C$):\nTaking differential: $P dV + V dP = 0 \\implies \\left(\\frac{dP}{dV}\\right)_{T} = -\\frac{P}{V}$\n\n2. For a Reversible Adiabatic Process ($PV^\\gamma = C$):\nTaking differential: $P \\cdot \\gamma V^{\\gamma-1} dV + V^\\gamma dP = 0 \\implies \\left(\\frac{dP}{dV}\\right)_{\\text{adia}} = -\\gamma \\frac{P}{V} = \\gamma \\times \\left(\\frac{dP}{dP}\\right)_{T}$\n\nSince $\\gamma > 1$ for all real gases (e.g. $\\gamma = 1.4$ for air), the adiabatic curve has a slope that is strictly $\\gamma$ times steeper than the isothermal curve.`,
      latex: '\\left(\\frac{dP}{dV}\\right)_{\\text{adiabatic}} = \\gamma \\left(\\frac{dP}{dV}\\right)_{\\text{isothermal}} \\quad (\\text{where } \\gamma > 1)',
    };
  }

  if (q.includes('charging') || q.includes('evacuated tank') || q.includes('gamma ti')) {
    return {
      text: `When charging an evacuated, insulated tank from a pipeline with supply temperature $T_i$:\n\n1. Applying the Unsteady Flow Energy Equation (with $Q = 0, W = 0, m_1 = 0$):\n$$(dU/dt)_{cv} = h_i \\dot{m}_i \\implies m_2 u_2 = m_2 h_i \\implies u_2 = h_i$$\n\n2. For an ideal gas where $u_2 = C_v T_2$ and $h_i = C_p T_i$:\n$$C_v T_2 = C_p T_i \\implies T_2 = \\left(\\frac{C_p}{C_v}\\right) T_i = \\gamma T_i$$\n\n**Physical Reason**: As gas flows in, the incoming gas is pushed by the pipeline behind it. This flow work ($P_i v_i$) is converted directly into internal thermal energy, raising the final temperature above the line temperature!`,
      latex: 'T_2 = \\gamma T_i \\quad (T_2 = 1.4 T_i \\text{ for air})',
    };
  }

  if (q.includes('maxwell')) {
    return {
      text: `Maxwell's four thermodynamic relations are derived from the exact differential property of four fundamental thermodynamic potentials ($u, h, g, f$):\n\n1. From $du = T ds - P dv$: $$\\left(\\frac{\\partial T}{\\partial v}\\right)_s = -\\left(\\frac{\\partial P}{\\partial s}\\right)_v$$\n2. From $dh = T ds + v dP$: $$\\left(\\frac{\\partial T}{\\partial P}\\right)_s = \\left(\\frac{\\partial v}{\\partial s}\\right)_P$$\n3. From $dg = v dP - s dT$: $$\\left(\\frac{\\partial v}{\\partial T}\\right)_P = -\\left(\\frac{\\partial s}{\\partial P}\\right)_T$$\n4. From $df = -P dv - s dT$: $$\\left(\\frac{\\partial P}{\\partial T}\\right)_v = \\left(\\frac{\\partial s}{\\partial v}\\right)_T$$`,
      latex: '\\left(\\frac{\\partial v}{\\partial T}\\right)_P = -\\left(\\frac{\\partial s}{\\partial P}\\right)_T \\quad \\text{and} \\quad \\left(\\frac{\\partial P}{\\partial T}\\right)_v = \\left(\\frac{\\partial s}{\\partial v}\\right)_T',
    };
  }

  if (q.includes('gouy') || q.includes('exergy') || q.includes('irreversibility')) {
    return {
      text: `The **Gouy-Stodola Theorem** bridges the gap between the Second Law and lost mechanical work:\n\nIt states that the rate of Exergy Destruction (Irreversibility, $I$) is directly proportional to the total entropy generated in the universe $(\\Delta S)_{\\text{univ}}$:\n\n$$I = W_{\\text{rev}} - W_{\\text{act}} = T_0 S_{\\text{gen}} = T_0 (\\Delta S)_{\\text{univ}}$$\n\nWhere $T_0$ is the ambient sink temperature (Dead State). Whenever friction, throttling, or heat transfer across finite temperature differences occurs, entropy is generated and available work is irrevocably destroyed.`,
      latex: 'I = T_0 \\cdot S_{\\text{gen}} = T_0 \\left(\\Delta S_{\\text{system}} + \\Delta S_{\\text{surroundings}}\\right)',
    };
  }

  if (q.includes('critical point') || q.includes('latent heat') || q.includes('hfg')) {
    return {
      text: `At the **Critical Point of Water** ($T_c = 374.14^\\circ\\text{C}, P_c = 221.2\\text{ bar}$):\n\n- The saturated liquid line ($f$) and saturated vapor line ($g$) converge into a single inflection point.\n- Therefore, $v_g = v_f$ and $h_g = h_f$.\n- Latent heat of vaporization is defined as $h_{fg} = h_g - h_f = 0$.\n- At and above this point, liquid water transitions smoothly and continuously into supercritical steam without forming vapor bubbles or an observable liquid-vapor meniscus!`,
      latex: 'h_{fg} = h_g - h_f = 0 \\quad \\text{at } P_c = 221.2 \\text{ bar}, T_c = 374.14^\\circ\\text{C}',
    };
  }

  // Default response
  return {
    text: `Analyzing your inquiry based on our 150-page lecture repository:\n\nIn thermodynamics, all system behaviors are governed by state functions ($P, v, T, u, h, s$) and boundary path interactions (Heat $Q$ and Work $W$).\n\nWould you like me to show a step-by-step mathematical proof, verify a solved numerical problem with custom parameters, or link to one of the interactive simulation canvas diagrams?`,
    latex: '\\delta Q = dU + P \\, dV \\quad \\Longleftrightarrow \\quad dS \\ge \\frac{\\delta Q}{T}',
  };
}
