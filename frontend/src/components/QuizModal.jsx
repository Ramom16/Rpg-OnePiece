import React, { useState } from "react";

export default function QuizModal({ quest, onPass, onFail, onClose }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSubmit = () => {
    if (selectedOption === quest.quiz.correctIndex) {
      onPass();
    } else {
      onFail("Resposta incorreta! O espírito da espada rejeitou você.");
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ backgroundColor: "#fff", color: "#000", padding: "25px", borderRadius: "10px", maxWidth: "500px", width: "90%" }}>
        <h3>📜 Teste da Espada Lendária: {quest.title}</h3>
        <p><strong>Pergunta:</strong> {quest.quiz.question}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "20px 0" }}>
          {quest.quiz.options.map((option, idx) => (
            <label key={idx} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", background: selectedOption === idx ? "#e2e8f0" : "#fff" }}>
              <input 
                type="radio" 
                name="quiz" 
                onChange={() => setSelectedOption(idx)} 
                checked={selectedOption === idx}
              /> {option}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onClose} style={{ padding: "8px 15px" }}>Desistir</button>
          <button onClick={handleSubmit} disabled={selectedOption === null} style={{ padding: "8px 15px", backgroundColor: "#2563eb", color: "#fff", border: "none" }}>
            Confirmar Resposta
          </button>
        </div>
      </div>
    </div>
  );
}