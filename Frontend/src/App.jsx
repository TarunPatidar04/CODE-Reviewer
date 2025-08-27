import React, { useState, useEffect, useRef } from "react";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";
import "./App.css";

const XP_PER_CHAR = 0.2; // XP gained per character typed
const LEVELS = [
  { lvl: 1, name: "Code Rookie", xpNeeded: 0 },
  { lvl: 2, name: "Script Samurai", xpNeeded: 50 },
  { lvl: 3, name: "Bug Basher", xpNeeded: 200 },
  { lvl: 4, name: "Code Ninja 🥷", xpNeeded: 600 },
  { lvl: 5, name: "Code Sensei 🔥", xpNeeded: 1500 },
];

function getLevelFromXP(xp) {
  let level = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpNeeded) {
      level = LEVELS[i];
      break;
    }
  }
  return level;
}

function App() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fires, setFires] = useState([]);
  const [xp, setXp] = useState(0);
  const [notif, setNotif] = useState("");
  const typingTimer = useRef(null);

  useEffect(() => {
    prism.highlightAll();
  }, []);

  // load xp from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("codesensei_xp");
    if (saved) {
      setXp(Number(saved));
    }
  }, []);

  // save xp to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("codesensei_xp", String(xp));
  }, [xp]);

  // spawn fire emoji on typing
  function spawnFire() {
    const id = Date.now() + Math.random();
    const left = Math.random() * 80 + 5; // 5% to 85%
    setFires((f) => [...f, { id, left }]);
    setTimeout(() => {
      setFires((f) => f.filter((x) => x.id !== id));
    }, 1000);
  }

  // handle typing: update code, spawn fire, add XP
  function handleTyping(newCode) {
    // compute difference in char count -> grant XP accordingly
    const prevLen = code.length;
    const newLen = newCode.length;
    const delta = Math.max(0, newLen - prevLen);

    // accumulate xp from added characters only
    if (delta > 0) {
      const gain = delta * XP_PER_CHAR;
      setXp((prev) => Math.round((prev + gain) * 100) / 100);
      setNotif(`+${Math.round(gain * 100) / 100} XP`);
      // hide notif after 1s
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setNotif(""), 1000);
    }

    setCode(newCode);
    spawnFire();
    prism.highlightAll();
  }

  // review code with robust error handling
  async function reviewCode() {
    if (!code.trim()) {
      setReview("⚠️ Please enter some code before requesting a review.");
      return;
    }

    setLoading(true);
    setReview("");
    try {
      const response = await axios.post("http://localhost:3000/ai/get-review", {
        code,
      }, { timeout: 20000 });

      if (!response || !response.data) {
        setReview("⚠️ No response received from server.");
        return;
      }

      // If backend returns review text as string
      if (typeof response.data === "string") {
        setReview(response.data);
      } else if (response.data.review) {
        setReview(response.data.review);
      } else if (response.data.result) {
        setReview(response.data.result);
      } else {
        // fallback: stringify useful parts
        setReview(
          "⚠️ Unexpected response format from server.\n\n" +
            "Response preview:\n\n" +
            "```json\n" +
            JSON.stringify(response.data, null, 2) +
            "\n```"
        );
      }
    } catch (err) {
      console.error("Error fetching review:", err);
      if (err.response) {
        setReview(`❌ Server error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.code === "ECONNABORTED") {
        setReview("❌ Request timed out. Try again.");
      } else if (err.request) {
        setReview("❌ No response from server. Please check your connection or backend.");
      } else {
        setReview(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // XP/level helpers
  const levelObj = getLevelFromXP(xp);
  const currentLevelIndex = LEVELS.findIndex((l) => l.lvl === levelObj.lvl);
  const nextLevel = LEVELS[currentLevelIndex + 1] || null;
  const xpIntoLevel = xp - levelObj.xpNeeded;
  const xpNeededForNext = nextLevel ? nextLevel.xpNeeded - levelObj.xpNeeded : 0;
  const progressPercent = nextLevel ? Math.min(100, (xpIntoLevel / xpNeededForNext) * 100) : 100;

  return (
    <div className="app-root">
      <header className="header">
        <div className="brand">
          <span className="logo">🔥</span>
          <span className="title">CodeSensei</span>
        </div>
        <div className="subtitle">AI Code Reviewer — Type. Learn. Level up.</div>
      </header>

      <main>
        {/* Left: Editor + Controls */}
        <aside className="left">
          <div className="left-top">
            <div className="profile">
              <div className="avatar">🥷</div>
              <div className="profile-info">
                <div className="name">You</div>
                <div className="level">{levelObj.name} • Lv {levelObj.lvl}</div>
              </div>
            </div>

            <div className="xp-block">
              <div className="xp-row">
                <div className="xp-value">{xp} XP</div>
                <div className="next">
                  {nextLevel ? `Next: ${nextLevel.name} (${nextLevel.xpNeeded} XP)` : "Max level"}
                </div>
              </div>

              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="code-area">
            <div className="editor-wrap">
              <Editor
                value={code}
                onValueChange={handleTyping}
                highlight={(c) => prism.highlight(c, prism.languages.javascript, "javascript")}
                padding={12}
                className="editor"
                style={{
                  fontFamily: '"Fira Code", monospace',
                }}
              />
              <div className="fire-container">
                {fires.map((f) => (
                  <div
                    key={f.id}
                    className="fire"
                    style={{ left: `${f.left}%` }}
                  >
                    🔥
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="left-actions">
            <button
              className={`review-btn ${!code.trim() || loading ? "disabled" : ""}`}
              onClick={reviewCode}
              disabled={!code.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" /> Reviewing...
                </>
              ) : (
                "Review"
              )}
            </button>

            <button
              className="reset-xp"
              onClick={() => {
                if (confirm("Reset XP and level progress?")) {
                  setXp(0);
                  setNotif("XP reset");
                  setTimeout(() => setNotif(""), 1500);
                }
              }}
            >
              Reset XP
            </button>
          </div>
        </aside>

        {/* Right: Review Output */}
        <section className="right">
          <div className="right-header">
            <h2>Review Output</h2>
            <div className="small-hint">AI suggestions & diagnostics</div>
          </div>

          <div className="right-body">
            {loading ? (
              <div className="spinner-large" />
            ) : review ? (
              <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
            ) : (
              <div className="empty-state">
                <p>Write code on the left and press <strong>Review</strong> to get AI feedback.</p>
                <p className="muted">Each keystroke gives you XP — reach <strong>{nextLevel ? nextLevel.name : "the top"}</strong>!</p>
              </div>
            )}
          </div>

          <div className="right-footer">
            <small>Tip: Write small functions and request reviews frequently — you'll level up faster!</small>
          </div>
        </section>
      </main>

      {/* floating notification */}
      {notif && <div className="notif">{notif}</div>}
    </div>
  );
}

export default App;
