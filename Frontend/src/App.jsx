import { useState, useEffect } from "react";
import "prismjs/themes/prism-tomorrow.css";

import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";
import "./App.css";

function App() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    prism.highlightAll();
  }, []);

  async function reviewCode() {
    if (!code.trim()) {
      setReview("⚠️ Please enter some code before requesting a review.");
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/ai/get-review`, {
        code,
      });
      setReview(response.data);
    } catch (err) {
      setReview("❌ Error fetching review", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header style={{ textAlign: "center", padding: "10px 0" }}>
        <h1 style={{ color: "#fff" }}>💻 Code Reviewer</h1>
      </header>

      <main>
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(code) =>
                prism.highlight(code, prism.languages.javascript, "javascript")
              }
              placeholder="Type or paste your code here..."
              padding={10}
              className="editor"
              style={{
                fontFamily: '"Fira Code", monospace',
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: "5px",
                height: "100%",
                width: "100%",
                backgroundColor: "#1e1e1e",
                color: "#ffffff",
              }}
            />
          </div>

          <div
            onClick={reviewCode}
            className={`review ${!code.trim() || loading ? "disabled" : ""}`}
          >
            {loading ? "⏳ Reviewing..." : "Review"}
          </div>
        </div>

        <div className="right">
          <h2 style={{ color: "#fff", marginBottom: "10px" }}>
            📋 Output Review
          </h2>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
          )}
        </div>
      </main>
    </>
  );
}

export default App;

// console.log("first", apiUrl);
